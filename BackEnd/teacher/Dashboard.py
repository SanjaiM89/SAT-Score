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

@router.get("/teacher/dashboard")
async def get_teacher_dashboard(
    current_user: dict = Depends(get_current_user),
    teacher_db: Database = Depends(get_teacher_db)
) -> Dict[str, Any]:
    try:
        logger.info(f"Received request for /teacher/dashboard for user: {current_user}")
        if current_user["role"] != "teacher":
            logger.error(f"Unauthorized access by user: {current_user['id']}, role: {current_user['role']}")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        teacher_id = current_user["id"]
        logger.debug(f"Fetching teacher data for teacherId: '{teacher_id}' (type: {type(teacher_id)})")

        # Access db.teachers via teacher_db.collection
        try:
            teacher = await teacher_db.collection.find_one({"teacherId": teacher_id})
        except pymongo.errors.PyMongoError as e:
            logger.error(f"MongoDB error fetching teacher: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error fetching teacher: {str(e)}")

        if not teacher:
            logger.error(f"No teacher found for teacherId: '{teacher_id}'")
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Teacher not found")

        logger.info(f"Found teacher: {teacher.get('fullName', 'Unknown')} ({teacher_id})")

        # Initialize response data
        dashboard_data = {
            "classes": [],
            "stats": [],
            "pending_tasks": []
        }

        # Fetch subjects handled by the teacher
        subjects_handled = teacher.get("subjectsHandled", [])
        logger.debug(f"Subjects handled: {subjects_handled}")
        if not subjects_handled:
            logger.info(f"No subjects handled by teacher: {teacher_id}")
            return dashboard_data

        # Fetch subject details
        try:
            # Validate subject_id values
            subject_ids = []
            for subject in subjects_handled:
                subject_id_str = subject.get("subject_id")
                if not subject_id_str:
                    logger.warning(f"Missing subject_id in subjectsHandled for teacher: {teacher_id}")
                    continue
                try:
                    subject_id = ObjectId(subject_id_str)
                    subject_ids.append(subject_id)
                except Exception as e:
                    logger.warning(f"Invalid subject_id: {subject_id_str} for teacher: {teacher_id}, error: {str(e)}")
                    continue

            if not subject_ids:
                logger.info(f"No valid subject IDs found for teacher: {teacher_id}")
                return dashboard_data

            # Access db.subjects via teacher_db.subjects_collection
            logger.debug(f"Querying db.subjects for IDs: {[str(id) for id in subject_ids]}")
            subjects_cursor = teacher_db.subjects_collection.find({"_id": {"$in": subject_ids}})
            subjects = await subjects_cursor.to_list(length=None)
            logger.debug(f"Found subjects: {[str(subject.get('_id', 'unknown')) for subject in subjects]}")
            subject_map = {str(subject["_id"]): subject for subject in subjects}
        except pymongo.errors.PyMongoError as e:
            logger.error(f"MongoDB error during subjects lookup: {str(e)}")
            raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Failed to fetch subjects: {str(e)}")

        classes = []
        for subject in subjects_handled:
            subject_id = str(subject.get("subject_id"))
            if subject_id not in subject_map:
                logger.warning(f"Subject not found in db.subjects: {subject_id}")
                continue

            subject_data = subject_map[subject_id]
            try:
                class_info = {
                    "id": subject_id,
                    "name": f"{subject_data['name']} - {subject['batch']} {subject['section']}",
                    "subject": subject_data["name"],
                    "subject_id": subject_id,
                    "department": str(subject_data.get("department", "")),
                    "semester": subject_data.get("semester", 0),
                    "students": subject_data.get("students_count", 0),
                    "batch": subject.get("batch", ""),
                    "section": subject.get("section", ""),
                    "schedule": subject_data.get("schedule", [])
                }
                classes.append(class_info)
            except KeyError as e:
                logger.warning(f"Missing field {e} in subject data for subject_id: {subject_id}")
                continue

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
                "value": "0",
                "icon": "ClipboardCheck",
                "color": "bg-orange-500"
            }
        ]

        dashboard_data["pending_tasks"] = []

        logger.info(f"Dashboard data prepared for teacher: {teacher_id}")
        return dashboard_data

    except pymongo.errors.PyMongoError as e:
        logger.error(f"MongoDB error: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Database error: {str(e)}")
    except HTTPException as e:
        logger.error(f"Dashboard error: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in dashboard: {str(e)}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")