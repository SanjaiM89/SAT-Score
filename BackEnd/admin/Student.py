from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Body
from pydantic import ValidationError
from typing import Optional, Dict, Any, List
from database import StudentDB, DepartmentDB
from AddStudentModel import AddStudentModel
from dependencies import get_student_db, get_department_db
from bson import ObjectId
import logging
import json

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/students", response_model=Dict[str, Any])
async def create_student(
    student: str = Body(...),
    file: Optional[UploadFile] = File(None),
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        logger.info(f"Raw student JSON: {student}")
        student_data = json.loads(student)
        try:
            student_model = AddStudentModel(**student_data)
        except ValidationError as ve:
            logger.error(f"Validation error for student data: {ve.errors()}")
            raise HTTPException(
                status_code=422,
                detail=[{"loc": e["loc"], "msg": e["msg"], "type": e["type"]} for e in ve.errors()]
            )
        logger.info(f"Received student data: {student_model.dict(by_alias=True)}")

        try:
            dept_id = ObjectId(student_model.department)
        except Exception as e:
            logger.error(f"Invalid department ID format: {student_model.department}, error: {str(e)}")
            raise HTTPException(status_code=400, detail=f"Invalid department ID format: {student_model.department}")
        
        logger.info(f"Querying department with ID: {student_model.department} in database")
        dept = await department_db.collection.find_one({'_id': dept_id})
        if not dept:
            all_depts = []
            async for d in department_db.collection.find():
                all_depts.append({'id': str(d['_id']), 'name': d.get('name')})
            logger.error(f"Department with ID {student_model.department} not found. Available: {all_depts}")
            raise HTTPException(status_code=400, detail=f"Department with ID {student_model.department} not found")

        logger.info(f"Found department: {dept['name']}, shortName: {dept['shortName']}")

        file_content = await file.read() if file else None
        registration_number = await student_db.generate_registration_number(str(student_model.yearOfJoining), student_model.department)
        result = await student_db.create_student(student_model, file_content, registration_number)
        return result

    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in student data: {str(e)}")
        raise HTTPException(status_code=422, detail=f"Invalid JSON in student data: {str(e)}")
    except HTTPException as e:
        logger.error(f"HTTPException in create_student: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in create_student: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/students", response_model=List[Dict[str, Any]])
async def get_students(student_db: StudentDB = Depends(get_student_db)):
    try:
        students = await student_db.get_students()
        logger.info(f"Retrieved {len(students)} students via API")
        return students
    except Exception as e:
        logger.error(f"Error in get_students: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/students/{id}", response_model=Dict[str, Any])
async def get_student(id: str, student_db: StudentDB = Depends(get_student_db)):
    try:
        student = await student_db.get_student(id)
        if not student:
            logger.warning(f"Student not found for ID: {id}")
            raise HTTPException(status_code=404, detail="Student not found")
        logger.info(f"Student retrieved via API: {id}")
        return student
    except HTTPException as e:
        logger.error(f"HTTPException in get_student: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_student: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/students/{id}", response_model=Dict[str, Any])
async def update_student(
    id: str,
    student: AddStudentModel,
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        logger.info(f"Querying department with ID: {student.department}")
        dept = await department_db.collection.find_one({'_id': ObjectId(student.department)})
        if not dept:
            all_depts = []
            async for d in department_db.collection.find():
                all_depts.append({'id': str(d['_id']), 'name': d.get('name')})
            logger.error(f"Department with ID {student.department} not found. Available: {all_depts}")
            raise HTTPException(status_code=400, detail=f"Department with ID {student.department} not found")
        
        result = await student_db.update_student(id, student)
        logger.info(f"Student updated via API: {id}")
        return result
    except HTTPException as e:
        logger.error(f"HTTPException in update_student: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in update_student: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/students/{id}", response_model=Dict[str, Any])
async def delete_student(id: str, student_db: StudentDB = Depends(get_student_db)):
    try:
        result = await student_db.delete_student(id)
        logger.info(f"Student deleted via API: {id}")
        return result
    except ValueError as e:
        logger.error(f"ValueError in delete_student: {str(e)}")
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Unexpected error in delete_student: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/students/{student_id}/courses/{course_id}", response_model=Dict[str, Any])
async def assign_course(
    student_id: str,
    course_id: str,
    student_db: StudentDB = Depends(get_student_db)
):
    try:
        result = await student_db.assign_course(student_id, course_id)
        logger.info(f"Course {course_id} assigned to student {student_id} via API")
        return result
    except HTTPException as e:
        logger.error(f"HTTPException in assign_course: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in assign_course: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/students/{student_id}/courses/{course_id}", response_model=Dict[str, Any])
async def remove_course(
    student_id: str,
    course_id: str,
    student_db: StudentDB = Depends(get_student_db)
):
    try:
        result = await student_db.remove_course(student_id, course_id)
        logger.info(f"Course {course_id} removed from student {student_id} via API")
        return result
    except HTTPException as e:
        logger.error(f"HTTPException in remove_course: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in remove_course: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))