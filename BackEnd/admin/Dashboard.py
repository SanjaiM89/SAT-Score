from fastapi import APIRouter, Depends, HTTPException
from motor.motor_asyncio import AsyncIOMotorDatabase
from dependencies import get_db, get_student_db, get_department_db, get_subject_db
from database import StudentDB, DepartmentDB, SubjectDB
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/admin/stats")
async def get_admin_stats(
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db),
    subject_db: SubjectDB = Depends(get_subject_db),
    db: AsyncIOMotorDatabase = Depends(get_db)
):
    """
    Fetch statistics for the admin dashboard, including total teachers, students, subjects, and departments.
    """
    logger.info("Received request for /api/admin/stats")
    try:
        # Count total teachers
        total_teachers = await db["db.teachers"].count_documents({})
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
