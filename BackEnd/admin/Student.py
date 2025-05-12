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
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/students", response_model=Dict[str, Any])
async def create_student(
    student: AddStudentModel,
    file: Optional[UploadFile] = File(None),
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        dept_id = ObjectId(student.department)
        dept = await department_db.collection.find_one({'_id': dept_id})
        if not dept:
            all_depts = [{'id': str(d['_id']), 'name': d.get('name')} async for d in department_db.collection.find()]
            logger.error(f"Department with ID {student.department} not found. Available: {all_depts}")
            raise HTTPException(status_code=400, detail=f"Department with ID {student.department} not found")

        file_content = await file.read() if file else None
        registration_number = await student_db.generate_registration_number(str(student.yearOfJoining), student.department)
        result = await student_db.create_student(student, file_content, registration_number)
        return result

    except HTTPException as e:
        logger.error(f"HTTPException in create_student: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in create_student: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/students", response_model=List[Dict[str, Any]])
async def get_students(
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        students = []
        all_depts = {str(d['_id']): d async for d in department_db.collection.find()}
        logger.info(f"Found {len(all_depts)} departments: {[str(k) + ':' + v.get('name', v.get('shortName', 'N/A')) for k, v in all_depts.items()]}")
        for student in await student_db.get_students():
            dept_id = student.get("department")
            dept = all_depts.get(dept_id)
            if dept:
                student["department"] = dept.get("name", dept.get("shortName", dept_id))
            else:
                logger.warning(f"Student {student['id']} department ID {dept_id} not found in departments")
                student["department"] = dept_id or "N/A"
            students.append(student)
        logger.info(f"Retrieved {len(students)} students via API")
        return students
    except Exception as e:
        logger.error(f"Error in get_students: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/students/{id}", response_model=Dict[str, Any])
async def get_student(id: str, student_db: StudentDB = Depends(get_student_db), department_db: DepartmentDB = Depends(get_department_db)):
    try:
        student = await student_db.get_student(id)
        if not student:
            logger.warning(f"Student not found for ID: {id}")
            raise HTTPException(status_code=404, detail="Student not found")
        dept_id = student.get("department")
        dept = await department_db.collection.find_one({"_id": ObjectId(dept_id)})
        if dept:
            student["department"] = dept.get("name", dept.get("shortName", dept_id))
        else:
            logger.warning(f"Student {id} department ID {dept_id} not found in departments")
            student["department"] = dept_id or "N/A"
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
        logger.debug(f"Querying department with ID: {student.department}")
        dept = await department_db.collection.find_one({'_id': ObjectId(student.department)})
        if not dept:
            all_depts = []
            async for d in department_db.collection.find():
                all_depts.append({'id': str(d['_id']), 'name': d.get('name')})
            logger.error(f"Department with ID {student.department} not found. Available: {all_depts}")
            raise HTTPException(status_code=400, detail=f"Department with ID {student.department} not found")
        
        result = await student_db.update_student(id, student)
        dept_id = result.get("department")
        dept = await department_db.collection.find_one({"_id": ObjectId(dept_id)})
        if dept:
            result["department"] = dept.get("name", dept.get("shortName", dept_id))
        else:
            logger.warning(f"Student {id} department ID {dept_id} not found in departments")
            result["department"] = dept_id or "N/A"
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
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        result = await student_db.assign_course(student_id, course_id)
        dept_id = result.get("department")
        dept = await department_db.collection.find_one({"_id": ObjectId(dept_id)})
        if dept:
            result["department"] = dept.get("name", dept.get("shortName", dept_id))
        else:
            logger.warning(f"Student {student_id} department ID {dept_id} not found in departments")
            result["department"] = dept_id or "N/A"
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
    student_db: StudentDB = Depends(get_student_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        result = await student_db.remove_course(student_id, course_id)
        dept_id = result.get("department")
        dept = await department_db.collection.find_one({"_id": ObjectId(dept_id)})
        if dept:
            result["department"] = dept.get("name", dept.get("shortName", dept_id))
        else:
            logger.warning(f"Student {student_id} department ID {dept_id} not found in departments")
            result["department"] = dept_id or "N/A"
        logger.info(f"Course {course_id} removed from student {student_id} via API")
        return result
    except HTTPException as e:
        logger.error(f"HTTPException in remove_course: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in remove_course: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))