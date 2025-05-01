from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Dict, Any, List
from database import DepartmentDB, SubjectDB
from dependencies import get_department_db, get_subject_db
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class Department(BaseModel):
    code: str
    name: str
    shortName: str
    numberOfClasses: int
    totalTeachers: int
    totalStudents: int

class Subject(BaseModel):
    code: str
    name: str
    department: str
    semester: int
    credits: int
    totalClasses: int

@router.post("/departments", response_model=Dict[str, Any])
async def create_department(department: Department, department_db: DepartmentDB = Depends(get_department_db)):
    try:
        result = await department_db.create_department(department)
        logger.info(f"Department created: {department.name}")
        return result
    except Exception as e:
        logger.error(f"Error in create_department: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/departments", response_model=List[Dict[str, Any]])
async def get_departments(department_db: DepartmentDB = Depends(get_department_db)):
    try:
        departments = await department_db.get_departments()
        logger.info(f"Retrieved {len(departments)} departments via API")
        return departments
    except Exception as e:
        logger.error(f"Error in get_departments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/departments/{id}", response_model=Dict[str, Any])
async def get_department(id: str, department_db: DepartmentDB = Depends(get_department_db)):
    try:
        department = await department_db.get_department(id)
        if not department:
            logger.warning(f"Department not found for ID: {id}")
            raise HTTPException(status_code=404, detail="Department not found")
        logger.info(f"Department retrieved via API: {id}")
        return department
    except HTTPException as e:
        logger.error(f"HTTPException in get_department: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_department: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/departments/{id}", response_model=Dict[str, Any])
async def update_department(id: str, department: Department, department_db: DepartmentDB = Depends(get_department_db)):
    try:
        result = await department_db.update_department(id, department)
        logger.info(f"Department updated via API: {id}")
        return result
    except Exception as e:
        logger.error(f"Error in update_department: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/departments/{id}", response_model=Dict[str, Any])
async def delete_department(id: str, department_db: DepartmentDB = Depends(get_department_db)):
    try:
        result = await department_db.delete_department(id)
        logger.info(f"Department deleted via API: {id}")
        return result
    except Exception as e:
        logger.error(f"Error in delete_department: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subjects", response_model=Dict[str, Any])
async def create_subject(subject: Subject, subject_db: SubjectDB = Depends(get_subject_db)):
    try:
        result = await subject_db.create_subject(subject)
        logger.info(f"Subject created: {subject.name}")
        return result
    except Exception as e:
        logger.error(f"Error in create_subject: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/subjects", response_model=List[Dict[str, Any]])
async def get_subjects(subject_db: SubjectDB = Depends(get_subject_db)):
    try:
        subjects = await subject_db.get_subjects()
        logger.info(f"Retrieved {len(subjects)} subjects via API")
        return subjects
    except Exception as e:
        logger.error(f"Error in get_subjects: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/subjects/{id}", response_model=Dict[str, Any])
async def get_subject(id: str, subject_db: SubjectDB = Depends(get_subject_db)):
    try:
        subject = await subject_db.get_subject(id)
        if not subject:
            logger.warning(f"Subject not found for ID: {id}")
            raise HTTPException(status_code=404, detail="Subject not found")
        logger.info(f"Subject retrieved via API: {id}")
        return subject
    except HTTPException as e:
        logger.error(f"HTTPException in get_subject: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_subject: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.put("/subjects/{id}", response_model=Dict[str, Any])
async def update_subject(id: str, subject: Subject, subject_db: SubjectDB = Depends(get_subject_db)):
    try:
        result = await subject_db.update_subject(id, subject)
        logger.info(f"Subject updated via API: {id}")
        return result
    except Exception as e:
        logger.error(f"Error in update_subject: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/subjects/{id}", response_model=Dict[str, Any])
async def delete_subject(id: str, subject_db: SubjectDB = Depends(get_subject_db)):
    try:
        result = await subject_db.delete_subject(id)
        logger.info(f"Subject deleted via API: {id}")
        return result
    except Exception as e:
        logger.error(f"Error in delete_subject: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))