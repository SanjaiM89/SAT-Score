from fastapi import Depends, HTTPException, status, Cookie, Request
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from database import Database, TeacherDB, StudentDB, DepartmentDB, SubjectDB, MarkCriteriaDB, MarksDB
import logging
import jwt
from typing import Dict
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

# Validate SECRET_KEY
if not SECRET_KEY:
    raise ValueError("SECRET_KEY not set in environment variables")

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# MongoDB connection settings
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "satscore"

# OAuth2 scheme for JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

async def get_db() -> AsyncIOMotorDatabase:
    client = AsyncIOMotorClient(MONGODB_URL)
    try:
        db = client[DATABASE_NAME]
        logger.info(f"MongoDB connection established to {DATABASE_NAME}")
        yield db
    finally:
        client.close()
        logger.info("MongoDB connection closed")

async def get_student_db(db: AsyncIOMotorDatabase = Depends(get_db)) -> StudentDB:
    return StudentDB(db)

async def get_department_db(db: AsyncIOMotorDatabase = Depends(get_db)) -> DepartmentDB:
    return DepartmentDB(db)

async def get_subject_db(db: AsyncIOMotorDatabase = Depends(get_db)) -> SubjectDB:
    return SubjectDB(db)

async def get_teacher_db(db: AsyncIOMotorDatabase = Depends(get_db)) -> TeacherDB:
    return TeacherDB(db)

async def get_mark_criteria_db(db: AsyncIOMotorDatabase = Depends(get_db)) -> MarkCriteriaDB:
    return MarkCriteriaDB(db)

async def get_marks_db(db: AsyncIOMotorDatabase = Depends(get_db)) -> MarksDB:
    return MarksDB(db)

def get_session_id(request: Request, session_id: str | None = Cookie(None)) -> str:
    """Validate session ID from cookie."""
    logger.debug(f"Raw headers: {request.headers.raw}")
    logger.debug(f"Request headers: {dict(request.headers)}")
    logger.debug(f"Request cookies: {request.cookies}")
    logger.debug(f"Raw session_id from Cookie: {session_id}")
    if not session_id:
        logger.error("No session_id cookie found")
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authenticated")
    logger.debug(f"Session_id extracted: {session_id[:10]}...")
    return session_id

async def get_current_user(token: str = Depends(oauth2_scheme), db: TeacherDB = Depends(get_teacher_db)) -> Dict[str, str]:
    """Authenticate user using JWT token."""
    logger.debug(f"Decoding token: {token[:20]}...")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        logger.debug(f"JWT payload: {payload}")
        role: str = payload.get("role")
        id: str = payload.get("id")
        if role is None or id is None:
            logger.warning(f"Invalid token: missing role or id")
            raise HTTPException(status_code=401, detail="Invalid token: missing role or id")
        if role == "admin":
            return {"role": "admin", "id": "admin", "fullName": "Admin"}
        elif role == "teacher":
            teacher = await db.collection.find_one({"teacherId": id})
            if not teacher:
                logger.warning(f"Teacher not found: teacherId={id}")
                raise HTTPException(status_code=401, detail="Teacher not found")
            return {"role": "teacher", "id": id, "fullName": teacher.get("fullName")}
        elif role == "student":
            student_db = StudentDB(db.collection.database)  # Create StudentDB from the underlying database
            student = await student_db.collection.find_one({"registrationNumber": id})
            if not student:
                logger.warning(f"Student not found: registrationNumber={id}")
                raise HTTPException(status_code=401, detail="Student not found")
            return {"role": "student", "id": id, "fullName": student.get("fullName")}
        else:
            logger.warning(f"Invalid role: {role}")
            raise HTTPException(status_code=401, detail="Invalid role")
    except jwt.ExpiredSignatureError:
        logger.error("JWT token has expired")
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid JWT token: {str(e)}")
        raise HTTPException(status_code=401, detail=f"Invalid token: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")