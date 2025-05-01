from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from admin.Student import student_router
from admin.DepartmentsAndSubjects import router as department_router
from database import Database
import logging
import uvicorn

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database initialization
db = Database()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database connection
    try:
        await db.startup()
        logger.info("Database connection established")
        app.db = db  # Set Database instance
        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise
    yield
    # Shutdown: Close database connection
    try:
        await db.shutdown()
        logger.info("Database connection closed")
        logger.info("Application shutdown")
    except Exception as e:
        logger.error(f"Failed to close database connection: {str(e)}")

app = FastAPI(title="SAT Score Backend", lifespan=lifespan)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(student_router, prefix="/api")
app.include_router(department_router, prefix="/api")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)