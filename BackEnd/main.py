from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from admin.Student import router as student_router
from admin.DepartmentsAndSubjects import router as department_router
from admin.Teachers import router as teacher_router
from admin.AssignMarks import router as marks_router
from admin.Dashboard import router as admin_dashboard_router
from teacher.Dashboard import router as teacher_dashboard_router
from teacher.InternalMarks import router as internal_marks_router
from teacher.SATMarks import router as sat_marks_router
from auth.login import router as login_router
from database import Database
import logging
import uvicorn
from starlette.middleware.errors import ServerErrorMiddleware

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
        "http://localhost:8080",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["set-cookie"],
)

# Log CORS configuration
logger.info("CORS configured with allow_origins: %s, expose_headers: ['set-cookie']", [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://localhost:8080",
])

# HTTP middleware for logging requests and responses
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Incoming request: {request.method} {request.url}")
    try:
        response = await call_next(request)
        headers = dict(response.headers)
        logger.info(f"Response status: {response.status_code}, headers: {headers}")
        set_cookie = headers.get("set-cookie")
        if set_cookie:
            logger.debug(f"Set-Cookie header sent: {set_cookie}")
        else:
            logger.debug("No Set-Cookie header in response")
        return response
    except Exception as e:
        logger.error(f"Error processing request {request.url}: {str(e)}")
        raise

# Include routers
routers = [
    (student_router, "Student", "/api"),
    (department_router, "Department", "/api"),
    (teacher_router, "Teacher", "/api"),
    (marks_router, "Marks", "/api"),
    (admin_dashboard_router, "Admin Dashboard", "/api"),
    (teacher_dashboard_router, "Teacher Dashboard", "/api"),  # Changed from /api/teacher to /api
    (internal_marks_router, "Internal Marks", "/api"),
    (sat_marks_router, "SAT Marks", "/api"),
    (login_router, "Login", "/api"),
]
for router, name, prefix in routers:
    try:
        app.include_router(router, prefix=prefix)
        logger.info(f"{name} router included successfully at {prefix}")
    except Exception as e:
        logger.error(f"Failed to include {name} router at {prefix}: {str(e)}")
        raise

@app.get("/")
async def root():
    return {"message": "Welcome to the SAT Score API"}

@app.get("/debug/routes")
async def debug_routes():
    routes = [
        {"path": str(route.path), "methods": list(route.methods), "name": route.name}
        for route in app.routes
    ]
    return {"routes": routes}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)