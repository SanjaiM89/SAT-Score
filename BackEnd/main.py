from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from admin.Student import router as student_router
from admin.DepartmentsAndSubjects import router as department_router
from admin.Teachers import router as teacher_router
from admin.AssignMarks import router as marks_router
from database import Database
import logging
import uvicorn
from starlette.middleware.errors import ServerErrorMiddleware

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

# Add error middleware to log all unhandled exceptions
app.add_middleware(
    ServerErrorMiddleware,
    debug=True
)

# CORS middleware to allow frontend requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
try:
    app.include_router(student_router, prefix="/api")
    logger.info("Student router included successfully")
except Exception as e:
    logger.error(f"Failed to include student_router: {str(e)}")
try:
    app.include_router(department_router, prefix="/api")
    logger.info("Department router included successfully")
except Exception as e:
    logger.error(f"Failed to include department_router: {str(e)}")
try:
    app.include_router(teacher_router, prefix="/api")
    logger.info("Teacher router included successfully")
except Exception as e:
    logger.error(f"Failed to include teacher_router: {str(e)}")
try:
    app.include_router(marks_router, prefix="/api")
    logger.info("Marks router included successfully")
except Exception as e:
    logger.error(f"Failed to include marks_router: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Welcome to the SAT Score API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)