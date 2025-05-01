from fastapi import Depends
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from typing import AsyncGenerator
import logging
from database import StudentDB, DepartmentDB, SubjectDB

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection settings
MONGODB_URL = "mongodb://localhost:27017"
DATABASE_NAME = "satscore"

async def get_db() -> AsyncGenerator[AsyncIOMotorDatabase, None]:
    client = AsyncIOMotorClient(MONGODB_URL)
    try:
        db = client[DATABASE_NAME]
        logger.info(f"MongoDB connection established to {DATABASE_NAME} database")
        yield db
    finally:
        client.close()
        logger.info("MongoDB connection closed")

async def get_student_db(db: AsyncIOMotorDatabase = Depends(get_db)) -> StudentDB:
    student_db = StudentDB(db)
    logger.info("StudentDB initialized")
    return student_db

async def get_department_db(db: AsyncIOMotorDatabase = Depends(get_db)) -> DepartmentDB:
    department_db = DepartmentDB(db)
    logger.info("DepartmentDB initialized")
    return department_db

async def get_subject_db(db: AsyncIOMotorDatabase = Depends(get_db)) -> SubjectDB:
    subject_db = SubjectDB(db)
    logger.info("SubjectDB initialized")
    return subject_db