from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorDatabase
from dependencies import get_student_db, get_teacher_db, get_department_db, get_subject_db
from database import StudentDB, TeacherDB, DepartmentDB, SubjectDB
import logging
import jwt as pyjwt
from dotenv import load_dotenv
import os

# Load environment variables
load_dotenv()

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

# OAuth2 scheme for JWT
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

async def get_current_user(
    token: str = Depends(oauth2_scheme),
    student_db: StudentDB = Depends(get_student_db),
    teacher_db: TeacherDB = Depends(get_teacher_db)
):
    try:
        payload = pyjwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        role: str = payload.get("role")
        id: str = payload.get("id")
        if role is None or id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        if role == "admin":
            return {"role": "admin", "id": "admin"}
        elif role == "teacher":
            teacher = await teacher_db.collection.find_one({"teacherId": id})
            if not teacher:
                raise HTTPException(status_code=401, detail="Teacher not found")
            return {"role": "teacher", "id": id}
        elif role == "student":
            student = await student_db.collection.find_one({"registrationNumber": id})
            if not student:
                raise HTTPException(status_code=401, detail="Student not found")
            return {"role": "student", "id": id}
        else:
            raise HTTPException(status_code=401, detail="Invalid role")
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

@router.get("/admin/stats")
async def get_admin_stats(
    current_user: dict = Depends(get_current_user),
    teacher_db: TeacherDB = Depends(get_teacher_db),
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db),
    subject_db: SubjectDB = Depends(get_subject_db)
):
    """
    Fetch statistics for the admin dashboard, including total teachers, students, subjects, and departments.
    Only accessible to admin users.
    """
    logger.info(f"Received request for /api/admin/stats by user: {current_user}")
    
    # Restrict access to admin role only
    if current_user["role"] != "admin":
        logger.warning(f"Unauthorized access attempt by role: {current_user['role']}")
        raise HTTPException(status_code=403, detail="Access restricted to admin users")

    try:
        # Count total teachers
        total_teachers = await teacher_db.collection.count_documents({})
        logger.debug(f"Total teachers: {total_teachers}")

        # Count total students
        total_students = await student_db.collection.count_documents({})
        logger.debug(f"Total students: {total_students}")

        # Count total subjects
        total_subjects = await subject_db.collection.count_documents({})
        logger.debug(f"Total subjects: {total_subjects}")

        # Count total departments
        total_departments = await department_db.collection.count_documents({})
        logger.debug(f"Total departments: {total_departments}")

        # Prepare response
        stats = {
            "totalTeachers": str(total_teachers),
            "totalStudents": str(total_students),
            "subjects": str(total_subjects),
            "departments": str(total_departments)
        }

        logger.info(f"Successfully retrieved admin stats: {stats}")
        return stats

    except Exception as e:
        logger.error(f"Failed to fetch admin stats: {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard stats")