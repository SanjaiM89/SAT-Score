from fastapi import APIRouter, Depends, HTTPException, status
from database import Database
from dependencies import get_teacher_db, get_current_user
from typing import Dict, Any, List
from bson import ObjectId
import logging
import pymongo

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

@router.get("/api/teacher/dashboard")
async def get_teacher_dashboard(
    current_user: dict = Depends(get_current_user),
    teacher_db: Database = Depends(get_teacher_db)
) -> Dict[str, Any]:
    try:
        if current_user["role"] != "teacher":
            logger.error(f"Unauthorized access by user: {current_user['id']}, role: {current_user['role']}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        logger.debug(f"Fetching dashboard for teacherId: {current_user['id']}")
        teacher = await teacher_db.teachers.find_one({"teacherId": current_user["id"]})
        if not teacher:
            logger.error(f"No teacher found for teacherId: {current_user['id']}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher not found")

        teacher_id = current_user["id"]
        logger.info(f"Found teacher: {teacher.get('fullName', 'Unknown')} ({teacher_id})")

        # Initialize response data
        dashboard_data = {
            "classes": [],
            "stats": [],
            "pending_tasks": []
        }

        # Fetch subjects handled by the teacher
        subjects_handled = teacher.get("subjectsHandled", [])
        if not subjects_handled:
            logger.info(f"No subjects handled by teacher: {teacher_id}")
            return dashboard_data

        # Fetch subject details
        try:
            subject_ids = [ObjectId(subject["subject_id"]) for subject in subjects_handled]
            subjects_cursor = teacher_db.subjects.find({"_id": {"$in": subject_ids}})
            subjects = await subjects_cursor.to_list(length=None)
            subject_map = {str(subject["_id"]): subject for subject in subjects}
        except pymongo.errors.PyMongoError as e:
            logger.error(f"MongoDB error during subjects lookup: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch subjects")

        classes = []
        for subject in subjects_handled:
            subject_id = str(subject["subject_id"])
            if subject_id not in subject_map:
                logger.warning(f"Subject not found: {subject_id}")
                continue

            subject_data = subject_map[subject_id]
            class_info = {
                "id": subject_id,
                "name": f"{subject_data['name']} - {subject['batch']} {subject['section']}",
                "subject": subject_data["name"],
                "subject_id": subject_id,
                "department": str(subject_data.get("department", "")),
                "semester": subject_data.get("semester", 0),
                "students": subject_data.get("students_count", 0),
                "batch": subject["batch"],
                "section": subject["section"],
                "schedule": subject_data.get("schedule", [])
            }
            classes.append(class_info)

        dashboard_data["classes"] = classes

        # Populate stats
        dashboard_data["stats"] = [
            {
                "title": "Total Classes",
                "value": str(len(classes)),
                "icon": "BookOpen",
                "color": "bg-blue-500"
            },
            {
                "title": "Total Students",
                "value": str(sum(cls["students"] for cls in classes)),
                "icon": "Users",
                "color": "bg-green-500"
            },
            {
                "title": "Subjects Taught",
                "value": str(len(set(cls["subject_id"] for cls in classes))),
                "icon": "GraduationCap",
                "color": "bg-purple-500"
            },
            {
                "title": "Pending Tasks",
                "value": "0",  # Placeholder until pending tasks logic is implemented
                "icon": "ClipboardCheck",
                "color": "bg-orange-500"
            }
        ]

        # Placeholder for pending tasks (to be implemented)
        dashboard_data["pending_tasks"] = [
            # Example structure:
            # {
            #     "task_type": "Mark Entry",
            #     "class_name": "CS101 - 2023 A",
            #     "subject": "Programming",
            #     "due_date": "2025-05-15"
            # }
        ]

        logger.info(f"Dashboard data prepared for teacher: {teacher_id}")
        return dashboard_data

    except HTTPException as e:
        logger.error(f"Dashboard error: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in dashboard: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")