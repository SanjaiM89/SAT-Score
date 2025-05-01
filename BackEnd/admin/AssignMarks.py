from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from bson import ObjectId
from database import StudentDB, DepartmentDB, SubjectDB
from dependencies import get_student_db, get_department_db, get_subject_db
import logging
from datetime import date

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class Subject(BaseModel):
    id: str
    code: str
    name: str

class Student(BaseModel):
    id: str
    fullName: str = Field(..., alias="fullName")
    regNumber: str = Field(..., alias="regNumber")  # Changed to regNumber
    department: str  # Department shortName (e.g., "cse")
    year: int
    subjects: List[Subject]

class MarkEntry(BaseModel):
    student_id: str
    subject_id: str
    final: float = Field(..., ge=0, le=100)
    academic_year: str

class MarksData(BaseModel):
    marks: List[MarkEntry]

class MarkCriteria(BaseModel):
    internal: int = Field(..., ge=0, le=100)
    external: int = Field(..., ge=0, le=100)
    formula: str

def sanitize_student_data(student: Dict[str, Any], subjects: List[Dict[str, Any]], departments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Sanitize student data for frontend response."""
    sanitized = {}
    for key, value in student.items():
        if key == "_id":
            sanitized["id"] = str(value)
        elif key == "department":
            dept = next((d for d in departments if str(d["_id"]) == str(value)), None)
            sanitized[key] = dept.get("shortName", str(value)) if dept else str(value)
        elif key == "courses":  # Map courses to subjects
            subject_ids = value if isinstance(value, list) else []
            sanitized["subjects"] = []
            for subj_id in subject_ids:
                try:
                    subject = next((s for s in subjects if str(s["_id"]) == str(subj_id)), None)
                    if subject:
                        sanitized["subjects"].append({
                            "id": str(subj_id),
                            "code": subject.get("code", ""),
                            "name": subject.get("name", "")
                        })
                    else:
                        logger.warning(f"Subject ID {subj_id} not found for student {student.get('_id')}")
                except Exception as e:
                    logger.error(f"Error processing subject ID {subj_id} for student {student.get('_id')}: {str(e)}")
            if not sanitized["subjects"]:
                logger.info(f"No valid subjects for student {student.get('_id')}: {subject_ids}")
        elif key == "regNumber":
            sanitized["regNumber"] = value
            sanitized["rollNumber"] = value  # Backward compatibility
        else:
            sanitized[key] = value
    if not sanitized.get("fullName"):
        logger.warning(f"Student with id {sanitized['id']} has no fullName: {sanitized}")
    if not sanitized.get("regNumber"):
        logger.warning(f"Student with id {sanitized['id']} has no regNumber: {sanitized}")
    return sanitized

@router.get("/students", response_model=List[Dict[str, Any]])
async def get_students(
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        students = []
        all_subjects = [s async for s in subject_db.collection.find()]
        all_depts = [d async for d in department_db.collection.find()]
        async for student in student_db.collection.find():
            sanitized = sanitize_student_data(student, all_subjects, all_depts)
            students.append(sanitized)
        logger.info(f"Returning {len(students)} students")
        return students
    except Exception as e:
        logger.error(f"Error retrieving students: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/marks", response_model=Dict[str, str])
async def save_marks(
    marks_data: MarksData,
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db)
):
    try:
        for mark in marks_data.marks:
            # Validate student
            student = await student_db.collection.find_one({"_id": ObjectId(mark.student_id)})
            if not student:
                raise HTTPException(status_code=404, detail=f"Student {mark.student_id} not found")

            # Validate subject
            subject = await subject_db.collection.find_one({"code": mark.subject_id})
            if not subject:
                raise HTTPException(status_code=404, detail=f"Subject {mark.subject_id} not found")

            # Check if subject is assigned to student
            if str(subject["_id"]) not in [str(subj_id) for subj_id in student.get("courses", [])]:
                raise HTTPException(status_code=400, detail=f"Subject {mark.subject_id} not assigned to student {mark.student_id}")

            # Upsert mark in marks collection
            await student_db.collection.database["marks"].update_one(
                {
                    "student_id": ObjectId(mark.student_id),
                    "subject_id": ObjectId(subject["_id"]),
                    "academic_year": mark.academic_year
                },
                {
                    "$set": {
                        "final": mark.final,
                        "updated_at": date.today().isoformat()
                    }
                },
                upsert=True
            )

        return {"status": "Marks saved successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error saving marks: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/mark-criteria", response_model=Dict[str, Any])
async def get_mark_criteria(
    student_db: StudentDB = Depends(get_student_db)
):
    try:
        criteria = await student_db.collection.database["mark_criteria"].find_one({})
        if not criteria:
            # Default criteria if none exists
            default_criteria = {
                "internal": 30,
                "external": 70,
                "formula": "(internal * 0.3) + (external * 0.7)"
            }
            await student_db.collection.database["mark_criteria"].insert_one(default_criteria)
            logger.info("Inserted default mark criteria")
            return default_criteria
        logger.info("Returning mark criteria")
        return {
            "internal": criteria.get("internal", 30),
            "external": criteria.get("external", 70),
            "formula": criteria.get("formula", "(internal * 0.3) + (external * 0.7)")
        }
    except Exception as e:
        logger.error(f"Error retrieving mark criteria: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/mark-criteria", response_model=Dict[str, str])
async def save_mark_criteria(
    criteria: MarkCriteria,
    student_db: StudentDB = Depends(get_student_db)
):
    try:
        # Validate total weightage
        if criteria.internal + criteria.external != 100:
            raise HTTPException(status_code=400, detail="Internal and external weightage must sum to 100")

        # Basic formula validation
        if not all(var in criteria.formula for var in ["internal", "external"]):
            raise HTTPException(status_code=400, detail="Formula must include 'internal' and 'external' variables")

        # Upsert criteria
        await student_db.collection.database["mark_criteria"].update_one(
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
        logger.info("Mark criteria saved")
        return {"status": "Mark criteria saved successfully"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error saving mark criteria: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))