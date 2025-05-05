from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from admin.Student import router as student_router
from admin.DepartmentsAndSubjects import router as department_router
from admin.Teachers import router as teacher_router
from admin.AssignMarks import router as marks_router
from admin.Dashboard import router as dashboard_router
from teacher.InternalMarks import router as internal_marks_router
from teacher.SATMarks import router as sat_marks_router
from auth.login import router as login_router
from database import Database
import logging
import uvicorn
from starlette.middleware.errors import ServerErrorMiddleware

# Set up logging
logging.basicConfig(level=logging.INFO)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logger = logging.getLogger(__name__)

# Database initialization
db = Database()

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        await db.startup()
        logger.info("Database connection established")
        app.db = db
        logger.info("Application startup complete")
    except Exception as e:
        logger.error(f"Failed to connect to database: {str(e)}")
        raise
    yield
    try:
        await db.shutdown()
        logger.info("Database connection closed")
        logger.info("Application shutdown")
    except Exception as e:
        logger.error(f"Failed to close database connection: {str(e)}")

app = FastAPI(title="SAT Score Backend", lifespan=lifespan)

app.add_middleware(
    ServerErrorMiddleware,
    debug=True
)

# CORS middleware with explicit origins and debugging
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # Vite default port
        "http://localhost:3000",  # Common React dev port
        "http://localhost:8080",  # Additional port for testing
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# Log CORS configuration on startup
logger.info("CORS configured with allow_origins: %s", [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
])

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
try:
    app.include_router(dashboard_router, prefix="/api")
    logger.info("Dashboard router included successfully")
except Exception as e:
    logger.error(f"Failed to include dashboard_router: {str(e)}")
try:
    app.include_router(internal_marks_router, prefix="/api")
    logger.info("Internal marks router included successfully")
except Exception as e:
    logger.error(f"Failed to include internal_marks_router: {str(e)}")
try:
    app.include_router(sat_marks_router, prefix="/api")
    logger.info("SAT marks router included successfully")
except Exception as e:
    logger.error(f"Failed to include sat_marks_router: {str(e)}")
try:
    app.include_router(login_router, prefix="/api")
    logger.info("Login router included successfully")
except Exception as e:
    logger.error(f"Failed to include login_router: {str(e)}")

@app.get("/")
async def root():
    return {"message": "Welcome to the SAT Score API"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)