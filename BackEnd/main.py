from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from admin.Student import student_router
from AddStudentModel import StudentDB
from database import Database
import dependencies
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database initialization
db = Database()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize database connection and StudentDB
    try:
        await db.startup()
        logger.info("Database connection established")
        app.student_db = StudentDB(db)  # Initialize StudentDB after db.startup
        logger.info("StudentDB initialized")
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise
    yield
    # Shutdown: Close database connection
    try:
        await db.shutdown()
        logger.info("Database connection closed")
    except Exception as e:
        logger.error(f"Failed to close database connection: {str(e)}")

app = FastAPI(lifespan=lifespan)

# Set the app reference in dependencies
dependencies.app = app

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include student routes
app.include_router(student_router, prefix="/api")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)