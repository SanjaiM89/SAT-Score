from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Union
from bson import ObjectId
from database import StudentDB, SubjectDB
from dependencies import get_student_db, get_subject_db
import logging
from datetime import date

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

class SATMarkEntry(BaseModel):
    student_id: str
    subject_id: str
    marks: Union[float, int] = Field(..., ge=0, le=100)
    academic_year: str

class SATMarksData(BaseModel):
    marks: List[SATMarkEntry]

class SubmitSATMarks(BaseModel):
    subject_id: str
    academic_year: str

def is_valid_object_id(oid: str) -> bool:
    """Check if the string is a valid MongoDB ObjectId."""
    try:
        ObjectId(oid)
        return True
    except Exception:
        return False

def sanitize_value(value: Any) -> Any:
    """Recursively convert ObjectId to string and handle nested structures."""
    if isinstance(value, ObjectId):
        return str(value)
    elif isinstance(value, list):
        return [sanitize_value(item) for item in value]
    elif isinstance(value, dict):
        return {key: sanitize_value(val) for key, val in value.items()}
    elif isinstance(value, (int, float, str, bool)) or value is None:
        return value
    else:
        logger.warning(f"Unexpected type in sanitize_value: {type(value)}")
        return str(value)

@router.post("/sat-marks", response_model=Dict[str, str])
async def save_sat_marks(
    marks_data: SATMarksData,
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db)
):
    logger.debug(f"Received SAT marks payload: {marks_data.dict()}")
    saved_count = 0
    errors = []
    try:
        if not marks_data.marks:
            raise HTTPException(status_code=400, detail="No SAT marks data provided.")

        for index, mark in enumerate(marks_data.marks):
            try:
                # Validate student_id
                if not is_valid_object_id(mark.student_id):
                    errors.append(f"Entry {index}: Invalid student_id format: {mark.student_id}")
                    continue
                student_oid = ObjectId(mark.student_id)

                # Validate subject_id
                if not is_valid_object_id(mark.subject_id):
                    errors.append(f"Entry {index}: Invalid subject_id format: {mark.subject_id}")
                    continue
                subject_oid = ObjectId(mark.subject_id)

                # Validate marks
                if mark.marks is None or not isinstance(mark.marks, (int, float)):
                    errors.append(f"Entry {index}: Invalid marks: {mark.marks}")
                    continue

                # Validate student
                student = await student_db.collection.find_one({"_id": student_oid})
                if not student:
                    errors.append(f"Entry {index}: Student {mark.student_id} not found")
                    continue

                # Validate subject
                subject = await subject_db.collection.find_one({"_id": subject_oid})
                if not subject:
                    errors.append(f"Entry {index}: Subject {mark.subject_id} not found")
                    continue

                # Check if subject is submitted
                sat_marks = student.get("sat_marks", {}).get(mark.subject_id, {})
                if sat_marks.get("isSubmitted", False):
                    errors.append(f"Entry {index}: Marks for subject {mark.subject_id} are already submitted and cannot be edited")
                    continue

                # Validate subject is assigned to student
                courses = student.get("courses", [])
                subject_ids_in_student = set(str(course) if isinstance(course, ObjectId) else course for course in courses)
                if mark.subject_id not in subject_ids_in_student:
                    errors.append(f"Entry {index}: Subject {mark.subject_id} (Code: {subject.get('code', 'N/A')}) not assigned to student {mark.student_id}")
                    continue

                # Update sat_marks in students collection
                update_result = await student_db.collection.update_one(
                    {"_id": student_oid},
                    {
                        "$set": {
                            f"sat_marks.{mark.subject_id}.marks": float(mark.marks),
                            f"sat_marks.{mark.subject_id}.isSubmitted": False,
                            f"sat_marks.{mark.subject_id}.updated_at": date.today().isoformat(),
                            "updated_at": date.today().isoformat()
                        }
                    }
                )

                if update_result.modified_count > 0 or update_result.matched_count > 0:
                    saved_count += 1
                    logger.info(f"Saved SAT mark for Student: {mark.student_id}, Subject: {mark.subject_id}, Marks: {mark.marks}")
                else:
                    errors.append(f"Entry {index}: Failed to save SAT mark for Student: {mark.student_id}, Subject: {mark.subject_id}")

            except Exception as e_inner:
                error_msg = f"Entry {index} (Student: {mark.student_id}, Subject: {mark.subject_id}): Error - {str(e_inner)}"
                logger.error(error_msg)
                errors.append(error_msg)

        if errors:
            error_details = "; ".join(errors)
            if saved_count == 0:
                raise HTTPException(status_code=400, detail=f"SAT marks processing errors: {error_details}. Saved: {saved_count} entries.")
            else:
                logger.warning(f"Partial success: {error_details}. Saved: {saved_count} entries.")
                return {"status": f"SAT marks saved for {saved_count} entries with errors: {error_details}"}
        else:
            return {"status": f"SAT marks saved for {saved_count} entries."}

    except HTTPException as e:
        logger.error(f"HTTP Exception in save_sat_marks: {e.detail}")
        raise e
    except Exception as e_outer:
        logger.error(f"Unexpected error in save_sat_marks: {str(e_outer)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e_outer)}")

@router.post("/sat-marks/submit", response_model=Dict[str, str])
async def submit_sat_marks(
    submit_data: SubmitSATMarks,
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db)
):
    logger.debug(f"Received SAT marks submission: {submit_data.dict()}")
    try:
        # Validate subject_id
        if not is_valid_object_id(submit_data.subject_id):
            raise HTTPException(status_code=400, detail=f"Invalid subject_id format: {submit_data.subject_id}")
        subject_oid = ObjectId(submit_data.subject_id)

        # Validate subject
        subject = await subject_db.collection.find_one({"_id": subject_oid})
        if not subject:
            raise HTTPException(status_code=404, detail=f"Subject {submit_data.subject_id} not found")

        # Update all students with this subject in their courses
        updated_count = 0
        async for student in student_db.collection.find({"courses": subject_oid}):
            student_id = str(student["_id"])
            sat_marks = student.get("sat_marks", {}).get(submit_data.subject_id, {})
            if not sat_marks:
                logger.warning(f"Student {student_id} has no SAT marks for subject {submit_data.subject_id}. Skipping submission.")
                continue

            # Skip if already submitted
            if sat_marks.get("isSubmitted", False):
                logger.info(f"Student {student_id} already has submitted marks for subject {submit_data.subject_id}")
                continue

            # Update submission status
            update_result = await student_db.collection.update_one(
                {"_id": student["_id"], f"sat_marks.{submit_data.subject_id}": {"$exists": True}},
                {
                    "$set": {
                        f"sat_marks.{submit_data.subject_id}.isSubmitted": True,
                        f"sat_marks.{submit_data.subject_id}.updated_at": date.today().isoformat(),
                        "updated_at": date.today().isoformat()
                    }
                }
            )

            if update_result.modified_count > 0:
                updated_count += 1
                logger.info(f"Submitted SAT marks for Student: {student_id}, Subject: {submit_data.subject_id}")

        if updated_count == 0:
            logger.warning(f"No students updated for subject {submit_data.subject_id}. Possibly no marks or already submitted.")
            return {"status": f"No SAT marks submitted for subject {submit_data.subject_id}. Marks may already be submitted or not exist."}

        return {"status": f"SAT marks submitted for {updated_count} students for subject {submit_data.subject_id}."}

    except HTTPException as e:
        logger.error(f"HTTP Exception in submit_sat_marks: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in submit_sat_marks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.get("/sat-marks", response_model=List[Dict[str, Any]])
async def get_sat_marks(
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db)
):
    try:
        students = []
        all_subjects = await subject_db.collection.find().to_list(length=None)
        logger.info(f"Found {len(all_subjects)} subjects: {[s.get('code', 'N/A') for s in all_subjects]}")
        
        async for student in student_db.collection.find({}, {"fileContent": 0, "photo": 0}):
            try:
                student_id = str(student.get("_id", "unknown"))
                sat_marks = student.get("sat_marks", {})
                sanitized_marks = []

                # Sanitize student data
                student = sanitize_value(student)

                for subject_id, marks_data in sat_marks.items():
                    try:
                        subject = next((s for s in all_subjects if str(s["_id"]) == subject_id), None)
                        if not subject:
                            logger.warning(f"Student {student_id} has SAT marks for unknown subject {subject_id}")
                            continue

                        # Sanitize subject data
                        subject = sanitize_value(subject)

                        sanitized_marks.append({
                            "student_id": student_id,
                            "subject_id": subject_id,
                            "subject_code": subject.get("code", "N/A"),
                            "subject_name": subject.get("name", "N/A"),
                            "marks": float(marks_data.get("marks", 0)) if marks_data.get("marks") is not None else 0,
                            "isSubmitted": marks_data.get("isSubmitted", False),
                            "academic_year": student.get("academic_year", "2024-2025")
                        })

                    except Exception as e_mark:
                        logger.error(f"Error processing SAT marks for student {student_id}, subject {subject_id}: {str(e_mark)}")
                        continue

                students.append({
                    "id": student_id,
                    "name": student.get("fullName", "Unknown"),
                    "rollNumber": student.get("registrationNumber", "N/A"),
                    "department": student.get("department", "N/A"),
                    "year": student.get("yearOfStudy", "N/A"),
                    "sat_marks": sanitized_marks
                })

            except Exception as e_sanitize:
                logger.error(f"Error sanitizing student {student_id}: {str(e_sanitize)}")
                students.append({"id": student_id, "error": "Failed to process student data", "name": "Error"})

        logger.info(f"Returning SAT marks for {len(students)} students")
        return students
    except Exception as e:
        logger.error(f"Error retrieving SAT marks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve SAT marks: {str(e)}")