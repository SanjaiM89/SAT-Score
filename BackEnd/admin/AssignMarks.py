from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional, Union
from bson import ObjectId
from database import StudentDB, DepartmentDB, SubjectDB
from dependencies import get_student_db, get_department_db, get_subject_db
import logging
from datetime import date

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

class Subject(BaseModel):
    id: str
    code: str
    name: str

class Student(BaseModel):
    id: str
    fullName: Optional[str] = Field(None, alias="fullName")
    registrationNumber: str = Field(..., alias="registrationNumber")
    department: str
    year: Optional[int] = None
    yearOfStudy: str
    subjects: Optional[List[Subject]] = None
    marks: Optional[Dict[str, float]] = None

class MarkEntry(BaseModel):
    student_id: str
    subject_id: str
    final: Union[float, int] = Field(..., ge=0, le=100)
    academic_year: str

class MarksData(BaseModel):
    marks: List[MarkEntry]

class MarkCriteria(BaseModel):
    internal: int = Field(..., ge=0, le=100)
    external: int = Field(..., ge=0, le=100)
    formula: str

def is_valid_object_id(oid: str) -> bool:
    """Check if the string is a valid MongoDB ObjectId."""
    try:
        ObjectId(oid)
        return True
    except Exception:
        return False

def sanitize_student_data(student: Dict[str, Any], subjects: List[Dict[str, Any]], departments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Sanitize student data for frontend response."""
    sanitized = {}
    student_id = str(student.get("_id", "unknown"))
    logger.debug(f"Processing student {student_id} - Raw data: {student}")

    # Handle ID
    sanitized["id"] = student_id

    # Handle fullName
    full_name = student.get("fullName")
    if isinstance(full_name, str) and full_name.strip():
        sanitized["fullName"] = full_name.strip()
    else:
        sanitized["fullName"] = "Unknown"
        logger.warning(f"Student {student_id}: Assigning 'Unknown' fullName: fullName={full_name!r}, raw={student}")
    logger.debug(f"Student {student_id} fullName processing - Original: {full_name!r}, Sanitized: {sanitized['fullName']}")

    # Handle registrationNumber
    sanitized["registrationNumber"] = student.get("registrationNumber", "UNKNOWN")
    if sanitized["registrationNumber"] == "UNKNOWN":
        logger.warning(f"Student {student_id} missing registrationNumber: {student}")

    # Handle department
    dept_value = student.get("department")
    logger.debug(f"Student {student_id} department value: {type(dept_value)} - {dept_value}")
    sanitized["department"] = "N/A"
    if isinstance(dept_value, ObjectId):
        dept = next((d for d in departments if d["_id"] == dept_value), None)
        if dept:
            sanitized["department"] = dept.get("name", dept.get("shortName", str(dept_value)))
            logger.debug(f"Student {student_id} mapped department {dept_value} to {sanitized['department']}")
        else:
            logger.warning(f"Student {student_id} department ID {str(dept_value)} not found in departments: {[str(d['_id']) + ':' + d.get('name', 'N/A') for d in departments]}")
            sanitized["department"] = str(dept_value)
    elif isinstance(dept_value, str) and len(dept_value) == 24:
        try:
            dept_id = ObjectId(dept_value)
            dept = next((d for d in departments if d["_id"] == dept_id), None)
            if dept:
                sanitized["department"] = dept.get("name", dept.get("shortName", dept_value))
                logger.debug(f"Student {student_id} mapped department {dept_value} to {sanitized['department']}")
            else:
                logger.warning(f"Student {student_id} department ID {dept_value} not found in departments: {[str(d['_id']) + ':' + d.get('name', 'N/A') for d in departments]}")
                sanitized["department"] = dept_value
        except Exception as e:
            logger.error(f"Student {student_id} invalid department ID format: {dept_value}, error: {str(e)}")
            sanitized["department"] = dept_value
    elif isinstance(dept_value, str) and dept_value:
        sanitized["department"] = dept_value
        logger.debug(f"Student {student_id} using department string directly: {dept_value}")
    else:
        logger.warning(f"Student {student_id} invalid department: {dept_value}")
        sanitized["department"] = str(dept_value) if dept_value is not None else "N/A"

    # Handle year
    year_of_study = student.get("yearOfStudy")
    sanitized["year"] = int(year_of_study) if year_of_study and str(year_of_study).isdigit() else None
    sanitized["yearOfStudy"] = str(year_of_study) if year_of_study is not None else "N/A"
    if sanitized["year"] is None and year_of_study is not None and year_of_study != "N/A":
        logger.warning(f"Student {student_id} invalid yearOfStudy: {year_of_study}")

    # Handle courses/subjects
    courses = student.get("courses", [])
    subject_ids = []
    logger.debug(f"Student {student_id} raw courses: {courses}")
    for course in courses:
        if isinstance(course, ObjectId):
            subject_ids.append(str(course))
        elif isinstance(course, str) and len(course) == 24:
            try:
                ObjectId(course)
                subject_ids.append(course)
            except Exception as e:
                logger.warning(f"Student {student_id} invalid course ID: {course}, error: {str(e)}")
        elif isinstance(course, dict) and "id" in course and isinstance(course["id"], str):
            subject_ids.append(course["id"])
        else:
            logger.warning(f"Student {student_id} invalid course format: {course} (Type: {type(course)})")

    sanitized["subjects"] = []
    logger.debug(f"Student {student_id} extracted subject IDs: {subject_ids}")
    logger.debug(f"Available subjects: {[str(s['_id']) + ':' + s.get('code', 'N/A') for s in subjects]}")
    for subj_id_str in subject_ids:
        try:
            subject = next((s for s in subjects if str(s["_id"]) == subj_id_str), None)
            if subject:
                sanitized["subjects"].append({
                    "id": subj_id_str,
                    "code": subject.get("code", ""),
                    "name": subject.get("name", "")
                })
                logger.debug(f"Student {student_id} mapped subject ID {subj_id_str} to Code: {subject.get('code', 'N/A')}")
            else:
                logger.warning(f"Student {student_id} subject ID {subj_id_str} not found in subjects: {[str(s['_id']) + ':' + s.get('code', 'N/A') for s in subjects]}")
        except Exception as e:
            logger.error(f"Student {student_id} error processing subject ID {subj_id_str}: {str(e)}")
    
    if subject_ids and not sanitized["subjects"]:
        logger.warning(f"Student {student_id}: Had subject IDs {subject_ids} but none mapped.")

    # Handle marks
    marks = student.get("marks", {})
    sanitized["marks"] = {str(k): float(v) for k, v in marks.items()} if isinstance(marks, dict) else {}
    logger.debug(f"Student {student_id} marks: {sanitized['marks']}")

    logger.debug(f"Sanitized student {student_id}: {sanitized}")
    return sanitized

@router.get("/students", response_model=List[Dict[str, Any]])
async def get_students(
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        students = []
        all_subjects = await subject_db.collection.find().to_list(length=None)
        all_depts = await department_db.collection.find().to_list(length=None)
        logger.info(f"Found {len(all_depts)} departments: {[str(d['_id']) + ':' + d.get('name', 'N/A') for d in all_depts]}")
        logger.info(f"Found {len(all_subjects)} subjects: {[s.get('code', 'N/A') for s in all_subjects]}")
        
        async for student in student_db.collection.find():
            try:
                sanitized = sanitize_student_data(student, all_subjects, all_depts)
                students.append(sanitized)
            except Exception as e_sanitize:
                student_id_err = str(student.get("_id", "unknown"))
                logger.error(f"Error sanitizing student {student_id_err}: {str(e_sanitize)}")
                students.append({"id": student_id_err, "error": "Failed to process student data", "fullName": "Error"})

        logger.info(f"Returning {len(students)} students")
        return students
    except Exception as e:
        logger.error(f"Error retrieving students: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve students: {str(e)}")

@router.post("/marks", response_model=Dict[str, str])
async def save_marks(
    marks_data: MarksData,
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db)
):
    logger.debug(f"Received marks payload: {marks_data.dict()}")
    saved_count = 0
    errors = []
    try:
        if not marks_data.marks:
            raise HTTPException(status_code=400, detail="No marks data provided.")

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

                # Validate final mark
                if mark.final is None or not isinstance(mark.final, (int, float)):
                    errors.append(f"Entry {index}: Invalid final mark: {mark.final}")
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

                # Update marks in students collection
                update_result = await student_db.collection.update_one(
                    {"_id": student_oid},
                    {
                        "$set": {
                            f"marks.{mark.subject_id}": float(mark.final),
                            "updated_at": date.today().isoformat()
                        }
                    }
                )

                if update_result.modified_count > 0 or update_result.matched_count > 0:
                    saved_count += 1
                    logger.info(f"Saved mark for Student: {mark.student_id}, Subject: {mark.subject_id}, Final: {mark.final}")
                else:
                    errors.append(f"Entry {index}: Failed to save mark for Student: {mark.student_id}, Subject: {mark.subject_id}")

            except Exception as e_inner:
                error_msg = f"Entry {index} (Student: {mark.student_id}, Subject: {mark.subject_id}): Error - {str(e_inner)}"
                logger.error(error_msg)
                errors.append(error_msg)

        if errors:
            error_details = "; ".join(errors)
            if saved_count == 0:
                raise HTTPException(status_code=400, detail=f"Marks processing errors: {error_details}. Saved: {saved_count} entries.")
            else:
                logger.warning(f"Partial success: {error_details}. Saved: {saved_count} entries.")
                return {"status": f"Marks saved for {saved_count} entries with errors: {error_details}"}
        else:
            return {"status": f"Marks saved for {saved_count} entries."}

    except HTTPException as e:
        logger.error(f"HTTP Exception in save_marks: {e.detail}")
        raise e
    except Exception as e_outer:
        logger.error(f"Unexpected error in save_marks: {str(e_outer)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e_outer)}")

@router.get("/mark-criteria", response_model=Dict[str, Any])
async def get_mark_criteria(
    student_db: StudentDB = Depends(get_student_db)
):
    try:
        criteria = await student_db.collection.database["mark_criteria"].find_one({})
        if not criteria:
            await student_db.collection.database["mark_criteria"].insert_one(
                {"internal": 30, "external": 70, "formula": "(internal * 0.3) + (external * 0.7)"}
            )
            logger.info("Inserted default mark criteria.")
            return {"internal": 30, "external": 70, "formula": "(internal * 0.3) + (external * 0.7)"}

        logger.info("Returning mark criteria.")
        return {
            "internal": criteria.get("internal", 30),
            "external": criteria.get("external", 70),
            "formula": criteria.get("formula", "(internal * 0.3) + (external * 0.7)")
        }
    except Exception as e:
        logger.error(f"Error retrieving mark criteria: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve mark criteria: {str(e)}")

@router.post("/mark-criteria", response_model=Dict[str, str])
async def save_mark_criteria(
    criteria: MarkCriteria,
    student_db: StudentDB = Depends(get_student_db)
):
    try:
        if criteria.internal + criteria.external != 100:
            raise HTTPException(status_code=400, detail="Internal and external must sum to 100.")
        if not ("internal" in criteria.formula and "external" in criteria.formula):
            raise HTTPException(status_code=400, detail="Formula must include 'internal' and 'external'.")

        update_result = await student_db.collection.database["mark_criteria"].update_one(
            {},
            {
                "$set": {
                    "internal": criteria.internal,
                    "external": criteria.external,
                    "formula": criteria.formula,
                    "updated_at": date.today().isoformat()
                }
            },
            upsert=True
        )

        if update_result.upserted_id:
            logger.info(f"Mark criteria created with ID: {update_result.upserted_id}")
            status_message = "Mark criteria created."
        elif update_result.modified_count > 0:
            logger.info("Mark criteria updated.")
            status_message = "Mark criteria updated."
        else:
            logger.info("Mark criteria unchanged.")
            status_message = "Mark criteria unchanged."

        return {"status": status_message}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error saving mark criteria: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to save mark criteria: {str(e)}")