from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, validator
from typing import List, Dict, Any, Optional
from bson import ObjectId
from database import StudentDB, DepartmentDB, SubjectDB
from dependencies import get_student_db, get_department_db, get_subject_db
import logging
from datetime import date
from pydantic import BaseModel
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class SubjectAssignment(BaseModel):
    subject_id: str  # Subject code (e.g., "CS201")
    batch: str
    section: str

class AddTeacherModel(BaseModel):
    fullName: str = Field(..., min_length=1)
    dateOfBirth: datetime
    gender: str
    phoneNumber: str
    email: str
    address: str
    city: str
    state: str
    postalCode: str
    designation: str
    department: str  # Department code (e.g., "cse")
    subjectsHandled: List[SubjectAssignment] = []
    yearsOfExperience: int = Field(..., ge=0)
    qualification: str
    researchArea: Optional[str] = None
    joiningDate: datetime
    officeRoomNumber: Optional[str] = None
    alternateContact: Optional[str] = None
    remarks: Optional[str] = None

class AssignTeacherModel(BaseModel):
    teacherId: str  # ObjectId as string
    academicYear: str
    department: str  # Department code (e.g., "cse")
    subjects: List[SubjectAssignment]

    @validator('teacherId')
    def validate_teacher_id(cls, v):
        try:
            ObjectId(v)
        except Exception:
            raise ValueError('Invalid teacher ID format')
        return v

def sanitize_teacher_data(teacher: Dict[str, Any], subjects: List[Dict[str, Any]], departments: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Sanitize teacher data for frontend response."""
    sanitized = {}
    for key, value in teacher.items():
        if key == "_id":
            sanitized["id"] = str(value)
        elif key == "department":
            dept = next((d for d in departments if str(d["_id"]) == str(value)), None)
            sanitized[key] = dept.get("shortName", str(value)) if dept else str(value)
        elif key == "subjectsHandled":
            sanitized[key] = [
                {
                    "id": str(assignment["subject_id"]),
                    "batch": assignment["batch"],
                    "section": assignment["section"],
                    "name": next((subj["name"] for subj in subjects if str(subj["_id"]) == str(assignment["subject_id"])), ""),
                    "code": next((subj["code"] for subj in subjects if str(subj["_id"]) == str(assignment["subject_id"])), "")
                }
                for assignment in value
            ]
        elif isinstance(value, date):
            sanitized[key] = value.isoformat()
        else:
            sanitized[key] = value
    return sanitized

@router.post("/teachers", response_model=Dict[str, Any])
async def create_teacher(
    teacher: AddTeacherModel,
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db),
    subject_db: SubjectDB = Depends(get_subject_db)
):
    try:
        # Map department code to ObjectId
        dept = await department_db.collection.find_one({"shortName": teacher.department})
        if not dept:
            raise HTTPException(status_code=400, detail=f"Department with code {teacher.department} not found")
        dept_id = dept["_id"]

        # Map subject codes to ObjectIds
        subject_codes = [assignment.subject_id for assignment in teacher.subjectsHandled]
        subjects = []
        if subject_codes:
            async for subject in subject_db.collection.find({"code": {"$in": subject_codes}}):
                subjects.append(subject)
            if len(subjects) != len(subject_codes):
                missing_codes = set(subject_codes) - set(s["code"] for s in subjects)
                raise HTTPException(status_code=400, detail=f"Subjects not found: {missing_codes}")

        # Generate teacher ID
        current_year = str(date.today().year)
        count = await student_db.collection.database["db.teachers"].count_documents({"teacherId": {"$regex": f"^{current_year}"}})
        teacher_id = f"{current_year}T{(count + 1):04d}"

        teacher_data = teacher.dict()
        teacher_data["teacherId"] = teacher_id
        teacher_data["department"] = dept_id
        teacher_data["subjectsHandled"] = [
            {
                "subject_id": next(s["_id"] for s in subjects if s["code"] == assignment.subject_id),
                "batch": assignment.batch,
                "section": assignment.section
            }
            for assignment in teacher.subjectsHandled
        ]

        result = await student_db.collection.database["db.teachers"].insert_one(teacher_data)
        inserted_teacher = await student_db.collection.database["db.teachers"].find_one({"_id": result.inserted_id})

        # Update department's totalTeachers
        await department_db.collection.update_one(
            {"_id": dept_id},
            {"$inc": {"totalTeachers": 1}}
        )

        # Fetch all subjects and departments for sanitization
        all_subjects = [s async for s in subject_db.collection.find()]
        all_depts = [d async for d in department_db.collection.find()]
        return sanitize_teacher_data(inserted_teacher, all_subjects, all_depts)

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error creating teacher: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/teachers", response_model=List[Dict[str, Any]])
async def get_teachers(
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        teachers = []
        all_subjects = [s async for s in subject_db.collection.find()]
        all_depts = [d async for d in department_db.collection.find()]
        async for teacher in student_db.collection.database["db.teachers"].find():
            teachers.append(sanitize_teacher_data(teacher, all_subjects, all_depts))
        return teachers
    except Exception as e:
        logger.error(f"Error retrieving teachers: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/teachers/{teacher_id}", response_model=Dict[str, Any])
async def get_teacher(
    teacher_id: str,
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        teacher = await student_db.collection.database["db.teachers"].find_one({"_id": ObjectId(teacher_id)})
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        all_subjects = [s async for s in subject_db.collection.find()]
        all_depts = [d async for d in department_db.collection.find()]
        return sanitize_teacher_data(teacher, all_subjects, all_depts)
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error retrieving teacher {teacher_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/teachers/{teacher_id}", response_model=Dict[str, Any])
async def update_teacher(
    teacher_id: str,
    teacher: AddTeacherModel,
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db),
    subject_db: SubjectDB = Depends(get_subject_db)
):
    try:
        # Map department code to ObjectId
        dept = await department_db.collection.find_one({"shortName": teacher.department})
        if not dept:
            raise HTTPException(status_code=400, detail=f"Department with code {teacher.department} not found")
        dept_id = dept["_id"]

        # Map subject codes to ObjectIds
        subject_codes = [assignment.subject_id for assignment in teacher.subjectsHandled]
        subjects = []
        if subject_codes:
            async for subject in subject_db.collection.find({"code": {"$in": subject_codes}}):
                subjects.append(subject)
            if len(subjects) != len(subject_codes):
                missing_codes = set(subject_codes) - set(s["code"] for s in subjects)
                raise HTTPException(status_code=400, detail=f"Subjects not found: {missing_codes}")

        teacher_data = teacher.dict()
        teacher_data["department"] = dept_id
        teacher_data["subjectsHandled"] = [
            {
                "subject_id": next(s["_id"] for s in subjects if s["code"] == assignment.subject_id),
                "batch": assignment.batch,
                "section": assignment.section
            }
            for assignment in teacher.subjectsHandled
        ]

        result = await student_db.collection.database["db.teachers"].update_one(
            {"_id": ObjectId(teacher_id)},
            {"$set": teacher_data}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Teacher not found")

        updated_teacher = await student_db.collection.database["db.teachers"].find_one({"_id": ObjectId(teacher_id)})
        all_subjects = [s async for s in subject_db.collection.find()]
        all_depts = [d async for d in department_db.collection.find()]
        return sanitize_teacher_data(updated_teacher, all_subjects, all_depts)

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error updating teacher {teacher_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/teachers/{teacher_id}", response_model=Dict[str, str])
async def delete_teacher(
    teacher_id: str,
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        teacher = await student_db.collection.database["db.teachers"].find_one({"_id": ObjectId(teacher_id)})
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")

        result = await student_db.collection.database["db.teachers"].delete_one({"_id": ObjectId(teacher_id)})
        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Teacher not found")

        # Update department's totalTeachers
        dept_id = teacher.get("department")
        if dept_id:
            await department_db.collection.update_one(
                {"_id": ObjectId(dept_id)},
                {"$inc": {"totalTeachers": -1}}
            )

        return {"id": teacher_id, "status": "deleted"}
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error deleting teacher {teacher_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/teachers/assign", response_model=Dict[str, Any])
async def assign_teacher(
    assignment: AssignTeacherModel,
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db),
    subject_db: SubjectDB = Depends(get_subject_db)
):
    try:
        # Validate teacher
        teacher = await student_db.collection.database["db.teachers"].find_one({"_id": ObjectId(assignment.teacherId)})
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")

        # Map department code to ObjectId
        dept = await department_db.collection.find_one({"shortName": assignment.department})
        if not dept:
            raise HTTPException(status_code=400, detail=f"Department with code {assignment.department} not found")
        dept_id = dept["_id"]

        # Map subject codes to ObjectIds
        subject_codes = [assignment.subject_id for assignment in assignment.subjects]
        subjects = []
        async for subject in subject_db.collection.find({"code": {"$in": subject_codes}}):
            subjects.append(subject)
        if len(subjects) != len(subject_codes):
            missing_codes = set(subject_codes) - set(s["code"] for s in subjects)
            raise HTTPException(status_code=400, detail=f"Subjects not found: {missing_codes}")

        new_assignments = [
            {
                "subject_id": next(s["_id"] for s in subjects if s["code"] == assignment.subject_id),
                "batch": assignment.batch,
                "section": assignment.section
            }
            for assignment in assignment.subjects
        ]

        result = await student_db.collection.database["db.teachers"].update_one(
            {"_id": ObjectId(assignment.teacherId)},
            {"$addToSet": {"subjectsHandled": {"$each": new_assignments}}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Teacher not found")

        updated_teacher = await student_db.collection.database["db.teachers"].find_one({"_id": ObjectId(assignment.teacherId)})
        all_subjects = [s async for s in subject_db.collection.find()]
        all_depts = [d async for d in department_db.collection.find()]
        return sanitize_teacher_data(updated_teacher, all_subjects, all_depts)

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error assigning teacher {assignment.teacherId}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/teachers/{teacher_id}/subjects/{subject_code}", response_model=Dict[str, Any])
async def unassign_subject(
    teacher_id: str,
    subject_code: str,
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        # Validate teacher
        teacher = await student_db.collection.database["db.teachers"].find_one({"_id": ObjectId(teacher_id)})
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")

        # Validate subject
        subject = await subject_db.collection.find_one({"code": subject_code})
        if not subject:
            raise HTTPException(status_code=404, detail=f"Subject with code {subject_code} not found")

        # Remove the subject assignment
        result = await student_db.collection.database["db.teachers"].update_one(
            {"_id": ObjectId(teacher_id)},
            {"$pull": {"subjectsHandled": {"subject_id": ObjectId(subject["_id"])}}}
        )
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Teacher not found")
        if result.modified_count == 0:
            raise HTTPException(status_code=400, detail=f"Subject {subject_code} not assigned to teacher")

        # Fetch updated teacher
        updated_teacher = await student_db.collection.database["db.teachers"].find_one({"_id": ObjectId(teacher_id)})
        # Fetch all subjects and departments for sanitization
        all_subjects = [s async for s in subject_db.collection.find()]
        all_depts = [d async for d in department_db.collection.find()]
        return sanitize_teacher_data(updated_teacher, all_subjects, all_depts)

    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Error unassigning subject {subject_code} from teacher {teacher_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))