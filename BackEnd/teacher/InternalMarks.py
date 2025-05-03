from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from bson import ObjectId
from database import StudentDB, SubjectDB
from dependencies import get_student_db, get_subject_db
import logging
from datetime import date

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

class InternalMarkEntry(BaseModel):
    student_id: str
    subject_id: str
    fat_number: int = Field(..., ge=1, le=3)  # FAT 1, 2, or 3
    fat: Union[float, int] = Field(..., ge=0, le=100)
    assignments: List[Union[float, int]] = Field(..., min_items=1, max_items=5)  # 1-5 assignments
    academic_year: str

class InternalMarksData(BaseModel):
    marks: List[InternalMarkEntry]

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

@router.post("/internal-marks", response_model=Dict[str, str])
async def save_internal_marks(
    marks_data: InternalMarksData,
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db)
):
    logger.debug(f"Received internal marks payload: {marks_data.dict()}")
    saved_count = 0
    errors = []
    try:
        if not marks_data.marks:
            raise HTTPException(status_code=400, detail="No internal marks data provided.")

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

                # Validate fat_number
                if mark.fat_number not in [1, 2, 3]:
                    errors.append(f"Entry {index}: Invalid fat_number: {mark.fat_number}. Must be 1, 2, or 3.")
                    continue

                # Validate fat
                if mark.fat is None or not isinstance(mark.fat, (int, float)):
                    errors.append(f"Entry {index}: Invalid FAT mark: {mark.fat}")
                    continue

                # Validate assignments
                if not mark.assignments or len(mark.assignments) > 5:
                    errors.append(f"Entry {index}: Invalid number of assignments: {len(mark.assignments)}. Must be 1-5.")
                    continue
                for i, assignment_mark in enumerate(mark.assignments):
                    if assignment_mark is None or not isinstance(assignment_mark, (int, float)) or assignment_mark < 0 or assignment_mark > 100:
                        errors.append(f"Entry {index}: Invalid assignment {i+1} mark: {assignment_mark}. Must be 0-100.")
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

                # Validate subject is assigned to student
                courses = student.get("courses", [])
                subject_ids_in_student = set()
                for course in courses:
                    if isinstance(course, ObjectId):
                        subject_ids_in_student.add(str(course))
                    elif isinstance(course, str) and len(course) == 24:
                        try:
                            ObjectId(course)
                            subject_ids_in_student.add(course)
                        except:
                            pass
                    elif isinstance(course, dict) and "id" in course and isinstance(course["id"], str):
                        subject_ids_in_student.add(course["id"])

                if mark.subject_id not in subject_ids_in_student:
                    errors.append(f"Entry {index}: Subject {mark.subject_id} (Code: {subject.get('code', 'N/A')}) not assigned to student {mark.student_id}")
                    continue

                # Update internal_marks in students collection
                update_result = await student_db.collection.update_one(
                    {"_id": student_oid},
                    {
                        "$set": {
                            f"internal_marks.{mark.subject_id}.fat{mark.fat_number}": float(mark.fat),
                            f"internal_marks.{mark.subject_id}.assignments": [float(a) for a in mark.assignments],
                            "updated_at": date.today().isoformat()
                        }
                    }
                )

                if update_result.modified_count > 0 or update_result.matched_count > 0:
                    saved_count += 1
                    logger.info(f"Saved internal mark for Student: {mark.student_id}, Subject: {mark.subject_id}, FAT: {mark.fat_number}, Assignments: {mark.assignments}")
                else:
                    errors.append(f"Entry {index}: Failed to save internal mark for Student: {mark.student_id}, Subject: {mark.subject_id}")

            except Exception as e_inner:
                error_msg = f"Entry {index} (Student: {mark.student_id}, Subject: {mark.subject_id}): Error - {str(e_inner)}"
                logger.error(error_msg)
                errors.append(error_msg)

        if errors:
            error_details = "; ".join(errors)
            if saved_count == 0:
                raise HTTPException(status_code=400, detail=f"Internal marks processing errors: {error_details}. Saved: {saved_count} entries.")
            else:
                logger.warning(f"Partial success: {error_details}. Saved: {saved_count} entries.")
                return {"status": f"Internal marks saved for {saved_count} entries with errors: {error_details}"}
        else:
            return {"status": f"Internal marks saved for {saved_count} entries."}

    except HTTPException as e:
        logger.error(f"HTTP Exception in save_internal_marks: {e.detail}")
        raise e
    except Exception as e_outer:
        logger.error(f"Unexpected error in save_internal_marks: {str(e_outer)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e_outer)}")

@router.get("/internal-marks", response_model=List[Dict[str, Any]])
async def get_internal_marks(
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
                internal_marks = student.get("internal_marks", {})
                sanitized_marks = []

                # Sanitize student data
                student = sanitize_value(student)

                for subject_id, marks_data in internal_marks.items():
                    try:
                        subject = next((s for s in all_subjects if str(s["_id"]) == subject_id), None)
                        if not subject:
                            logger.warning(f"Student {student_id} has internal marks for unknown subject {subject_id}")
                            continue

                        # Sanitize subject data
                        subject = sanitize_value(subject)

                        sanitized_marks.append({
                            "student_id": student_id,
                            "subject_id": subject_id,
                            "subject_code": subject.get("code", "N/A"),
                            "subject_name": subject.get("name", "N/A"),
                            "fat1": float(marks_data.get("fat1", 0)) if marks_data.get("fat1") is not None else 0,
                            "fat2": float(marks_data.get("fat2", 0)) if marks_data.get("fat2") is not None else 0,
                            "fat3": float(marks_data.get("fat3", 0)) if marks_data.get("fat3") is not None else 0,
                            "assignments": [float(a) for a in marks_data.get("assignments", [])],
                            "academic_year": student.get("academic_year", "2024-2025")
                        })

                    except Exception as e_mark:
                        logger.error(f"Error processing marks for student {student_id}, subject {subject_id}: {str(e_mark)}")
                        continue

                students.append({
                    "id": student_id,
                    "fullName": student.get("fullName", "Unknown"),
                    "registrationNumber": student.get("registrationNumber", "N/A"),
                    "department": student.get("department", "N/A"),
                    "yearOfStudy": student.get("yearOfStudy", "N/A"),
                    "internal_marks": sanitized_marks
                })

            except Exception as e_sanitize:
                logger.error(f"Error sanitizing student {student_id}: {str(e_sanitize)}")
                students.append({"id": student_id, "error": "Failed to process student data", "fullName": "Error"})

        logger.info(f"Returning internal marks for {len(students)} students")
        return students
    except Exception as e:
        logger.error(f"Error retrieving internal marks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve internal marks: {str(e)}")