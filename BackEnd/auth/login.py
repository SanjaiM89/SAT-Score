from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from bson import ObjectId
from database import StudentDB, Database
from dependencies import get_student_db, get_db
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

class LoginRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|teacher|student)$")
    email: Optional[str] = None  # For admin
    teacherId: Optional[str] = None  # For teacher
    teacherName: Optional[str] = None  # For teacher
    studentId: Optional[str] = None  # For student
    password: str

class ChangePasswordRequest(BaseModel):
    role: str = Field(..., pattern="^(teacher|student)$")
    id: str  # teacherId or studentId (registrationNumber)
    newPassword: str = Field(..., min_length=6)

class LoginResponse(BaseModel):
    role: str
    id: str
    fullName: Optional[str] = None
    email: Optional[str] = None
    requiresPasswordChange: bool = False

def is_valid_object_id(oid: str) -> bool:
    """Check if the string is a valid MongoDB ObjectId."""
    try:
        ObjectId(oid)
        return True
    except Exception:
        return False

@router.post("/login", response_model=LoginResponse)
async def login(
    login_data: LoginRequest,
    student_db: StudentDB = Depends(get_student_db),
    db: Database = Depends(get_db)
):
    logger.debug(f"Login attempt: role={login_data.role}, data={login_data.dict()}")
    try:
        if login_data.role == "admin":
            if login_data.email != "admin@gmail.com" or login_data.password != "123456":
                logger.warning(f"Invalid admin credentials: email={login_data.email}")
                raise HTTPException(status_code=401, detail="Invalid email or password")
            return LoginResponse(
                role="admin",
                id="admin",
                email=login_data.email,
                requiresPasswordChange=False
            )

        elif login_data.role == "teacher":
            if not login_data.teacherId or not login_data.teacherName:
                raise HTTPException(status_code=400, detail="Teacher ID and name are required")
            
            teacher_collection = db.db["teachers"]
            teacher = await teacher_collection.find_one({
                "teacherId": login_data.teacherId,
                "fullName": login_data.teacherName
            })
            
            if not teacher:
                logger.warning(f"Teacher not found: teacherId={login_data.teacherId}, fullName={login_data.teacherName}")
                raise HTTPException(status_code=401, detail="Invalid teacher ID or name")
            
            teacher_id = str(teacher["_id"])
            stored_password = teacher.get("password", "123456")  # Default password
            requires_password_change = teacher.get("requiresPasswordChange", True)
            
            if login_data.password != stored_password:
                logger.warning(f"Invalid password for teacher: teacherId={login_data.teacherId}")
                raise HTTPException(status_code=401, detail="Invalid password")
            
            return LoginResponse(
                role="teacher",
                id=login_data.teacherId,
                fullName=login_data.teacherName,
                requiresPasswordChange=requires_password_change
            )

        elif login_data.role == "student":
            if not login_data.studentId:
                raise HTTPException(status_code=400, detail="Student ID is required")
            
            student = await student_db.collection.find_one({"registrationNumber": login_data.studentId})
            
            if not student:
                logger.warning(f"Student not found: registrationNumber={login_data.studentId}")
                raise HTTPException(status_code=401, detail="Invalid student ID")
            
            student_id = str(student["_id"])
            stored_password = student.get("password", "123456")  # Default password
            requires_password_change = student.get("requiresPasswordChange", True)
            
            if login_data.password != stored_password:
                logger.warning(f"Invalid password for student: registrationNumber={login_data.studentId}")
                raise HTTPException(status_code=401, detail="Invalid password")
            
            return LoginResponse(
                role="student",
                id=login_data.studentId,
                fullName=student.get("fullName", "Unknown"),
                requiresPasswordChange=requires_password_change
            )

        else:
            raise HTTPException(status_code=400, detail="Invalid role")

    except HTTPException as e:
        logger.error(f"Login error: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/change-password", response_model=Dict[str, str])
async def change_password(
    password_data: ChangePasswordRequest,
    student_db: StudentDB = Depends(get_student_db),
    db: Database = Depends(get_db)
):
    logger.debug(f"Change password request: role={password_data.role}, id={password_data.id}")
    try:
        if password_data.role == "teacher":
            teacher_collection = db.db["teachers"]
            teacher = await teacher_collection.find_one({"teacherId": password_data.id})
            
            if not teacher:
                logger.warning(f"Teacher not found: teacherId={password_data.id}")
                raise HTTPException(status_code=404, detail="Teacher not found")
            
            update_result = await teacher_collection.update_one(
                {"teacherId": password_data.id},
                {
                    "$set": {
                        "password": password_data.newPassword,
                        "requiresPasswordChange": False,
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
            )
            
            if update_result.modified_count == 0 and update_result.matched_count == 0:
                logger.warning(f"Failed to update password for teacher: teacherId={password_data.id}")
                raise HTTPException(status_code=400, detail="Failed to update password")
            
            logger.info(f"Password changed for teacher: teacherId={password_data.id}")
            return {"status": "Password changed successfully"}

        elif password_data.role == "student":
            student = await student_db.collection.find_one({"registrationNumber": password_data.id})
            
            if not student:
                logger.warning(f"Student not found: registrationNumber={password_data.id}")
                raise HTTPException(status_code=404, detail="Student not found")
            
            update_result = await student_db.collection.update_one(
                {"registrationNumber": password_data.id},
                {
                    "$set": {
                        "password": password_data.newPassword,
                        "requiresPasswordChange": False,
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
            )
            
            if update_result.modified_count == 0 and update_result.matched_count == 0:
                logger.warning(f"Failed to update password for student: registrationNumber={password_data.id}")
                raise HTTPException(status_code=400, detail="Failed to update password")
            
            logger.info(f"Password changed for student: registrationNumber={password_data.id}")
            return {"status": "Password changed successfully"}

        else:
            raise HTTPException(status_code=400, detail="Invalid role")

    except HTTPException as e:
        logger.error(f"Change password error: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during password change: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")