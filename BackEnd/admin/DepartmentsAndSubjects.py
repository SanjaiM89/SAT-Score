from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field, validator
from typing import Dict, Any, List
from database import Database, DepartmentDB, SubjectDB
from dependencies import get_db
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter()

class DepartmentModel(BaseModel):
    code: str = Field(..., min_length=2, max_length=10)
    name: str = Field(..., min_length=3, max_length=100)
    shortName: str = Field(..., min_length=2, max_length=2)
    numberOfClasses: int = Field(..., ge=1, le=26)

    @validator("shortName")
    def short_name_uppercase(cls, v: str) -> str:
        return v.upper()

    @validator("numberOfClasses")
    def validate_number_of_classes(cls, v: int) -> int:
        if v < 1 or v > 26:
            logger.error(f"Invalid numberOfClasses: {v}. Must be between 1 and 26")
            raise ValueError("numberOfClasses must be between 1 and 26")
        return v

class SubjectModel(BaseModel):
    code: str = Field(..., min_length=2, max_length=10)
    name: str = Field(..., min_length=3, max_length=100)
    department: str = Field(..., min_length=3, max_length=100)
    type: str = Field(..., min_length=3, max_length=10)
    semester: int = Field(..., ge=1, le=8)
    credits: int = Field(..., ge=1, le=5)

    @validator("type")
    def validate_type(cls, v: str) -> str:
        allowed = ["theory", "lab"]
        if v.lower() not in allowed:
            logger.error(f"Invalid type: {v}. Allowed: {allowed}")
            raise ValueError(f"type must be one of {allowed}")
        return v.lower()

    @validator("semester")
    def validate_semester(cls, v: int) -> int:
        if v < 1 or v > 8:
            logger.error(f"Invalid semester: {v}. Must be between 1 and 8")
            raise ValueError("semester must be between 1 and 8")
        return v

    @validator("credits")
    def validate_credits(cls, v: int) -> int:
        if v < 1 or v > 5:
            logger.error(f"Invalid credits: {v}. Must be between 1 and 5")
            raise ValueError("credits must be between 1 and 5")
        return v

@router.post("/departments", response_model=Dict[str, Any])
async def create_department(department: DepartmentModel, db: Database = Depends(get_db)):
    department_db = DepartmentDB(db.db)
    try:
        result = await department_db.create_department(department)
        logger.info(f"Department created via API: {result}")
        return result
    except HTTPException as e:
        logger.error(f"HTTPException in create_department: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in create_department: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/departments", response_model=List[Dict[str, Any]])
async def get_departments(db: Database = Depends(get_db)):
    department_db = DepartmentDB(db.db)
    try:
        departments = await department_db.get_departments()
        logger.info(f"Departments retrieved via API: {len(departments)} departments")
        return departments
    except Exception as e:
        logger.error(f"Error in get_departments: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/departments/{id}", response_model=Dict[str, Any])
async def get_department(id: str, db: Database = Depends(get_db)):
    department_db = DepartmentDB(db.db)
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
async def update_department(id: str, department: DepartmentModel, db: Database = Depends(get_db)):
    department_db = DepartmentDB(db.db)
    try:
        result = await department_db.update_department(id, department)
        logger.info(f"Department updated via API: {id}")
        return result
    except HTTPException as e:
        logger.error(f"HTTPException in update_department: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in update_department: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/departments/{id}", response_model=Dict[str, Any])
async def delete_department(id: str, db: Database = Depends(get_db)):
    department_db = DepartmentDB(db.db)
    try:
        result = await department_db.delete_department(id)
        logger.info(f"Department deleted via API: {id}")
        return result
    except HTTPException as e:
        logger.error(f"HTTPException in delete_department: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in delete_department: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/subjects", response_model=Dict[str, Any])
async def create_subject(subject: SubjectModel, db: Database = Depends(get_db)):
    subject_db = SubjectDB(db.db)
    try:
        result = await subject_db.create_subject(subject)
        logger.info(f"Subject created via API: {result}")
        return result
    except HTTPException as e:
        logger.error(f"HTTPException in create_subject: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in create_subject: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/subjects", response_model=List[Dict[str, Any]])
async def get_subjects(db: Database = Depends(get_db)):
    subject_db = SubjectDB(db.db)
    try:
        subjects = await subject_db.get_subjects()
        logger.info(f"Subjects retrieved via API: {len(subjects)} subjects")
        return subjects
    except Exception as e:
        logger.error(f"Error in get_subjects: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/subjects/{id}", response_model=Dict[str, Any])
async def get_subject(id: str, db: Database = Depends(get_db)):
    subject_db = SubjectDB(db.db)
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
async def update_subject(id: str, subject: SubjectModel, db: Database = Depends(get_db)):
    subject_db = SubjectDB(db.db)
    try:
        result = await subject_db.update_subject(id, subject)
        logger.info(f"Subject updated via API: {id}")
        return result
    except HTTPException as e:
        logger.error(f"HTTPException in update_subject: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in update_subject: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/subjects/{id}", response_model=Dict[str, Any])
async def delete_subject(id: str, db: Database = Depends(get_db)):
    subject_db = SubjectDB(db.db)
    try:
        result = await subject_db.delete_subject(id)
        logger.info(f"Subject deleted via API: {id}")
        return result
    except HTTPException as e:
        logger.error(f"HTTPException in delete_subject: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in delete_subject: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))