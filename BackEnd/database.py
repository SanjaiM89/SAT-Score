from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from typing import Optional, Dict, Any, List
from pydantic import BaseModel
from fastapi import HTTPException
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class Database:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None

    async def startup(self):
        self.client = AsyncIOMotorClient("mongodb://localhost:27017")
        self.db = self.client["satscore"]
        logger.info("MongoDB connection established to satscore database")

    async def shutdown(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

class StudentDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["students"]
        self.departments_collection = db["departments"]
        logger.info("StudentDB initialized")

    async def create_student(self, student: BaseModel) -> Dict[str, Any]:
        student_dict = student.dict(exclude_unset=True)
        student_dict["registrationNumber"] = await self.generate_registration_number(
            student_dict.get("yearOfJoining"), student_dict.get("department")
        )
        result = await self.collection.insert_one(student_dict)
        # Increment totalStudents in the corresponding department
        update_result = await self.departments_collection.update_one(
            {"name": student_dict.get("department")},
            {"$inc": {"totalStudents": 1}}
        )
        logger.info(f"Student created with ID: {result.inserted_id}, updated department {student_dict.get('department')}, matched: {update_result.matched_count}")
        return {"message": "Student added successfully", "id": str(result.inserted_id)}

    async def generate_registration_number(self, year_of_joining: int, department: str) -> str:
        department_short = (await self.departments_collection.find_one({"name": department}))["shortName"]
        count = await self.collection.count_documents({"yearOfJoining": year_of_joining, "department": department})
        registration_number = f"{year_of_joining}{department_short}{count + 1:04d}"
        logger.info(f"Generated registration number: {registration_number} for year: {year_of_joining}, dept: {department}")
        return registration_number

    async def get_student(self, id: str) -> Optional[Dict[str, Any]]:
        student = await self.collection.find_one({"_id": ObjectId(id)})
        if student:
            student["id"] = str(student.pop("_id"))
            logger.info(f"Retrieved student with ID: {id}")
            return student
        logger.warning(f"Student with ID {id} not found")
        return None

    async def get_students(self) -> List[Dict[str, Any]]:
        cursor = self.collection.find()
        students = []
        async for student in cursor:
            student["id"] = str(student.pop("_id"))
            students.append(student)
        logger.info(f"Retrieved {len(students)} students")
        return students

    async def update_student(self, id: str, student: BaseModel) -> Dict[str, Any]:
        student_dict = student.dict(exclude_unset=True)
        result = await self.collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": student_dict}
        )
        if result.modified_count:
            logger.info(f"Student updated with ID: {id}")
            return {"message": "Student updated successfully", "id": id}
        logger.warning(f"Student with ID {id} not found for update")
        raise HTTPException(status_code=404, detail="Student not found")

    async def delete_student(self, id: str) -> Dict[str, Any]:
        student = await self.collection.find_one({"_id": ObjectId(id)})
        if student:
            update_result = await self.departments_collection.update_one(
                {"name": student.get("department")},
                {"$inc": {"totalStudents": -1}}
            )
            logger.info(f"Decremented totalStudents for department {student.get('department')}, matched: {update_result.matched_count}")
        result = await self.collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count:
            logger.info(f"Student deleted with ID: {id}")
            return {"message": "Student deleted successfully"}
        logger.warning(f"Student with ID {id} not found for deletion")
        raise HTTPException(status_code=404, detail="Student not found")

class DepartmentDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["departments"]
        logger.info("DepartmentDB initialized")

    async def create_department(self, department: BaseModel) -> Dict[str, Any]:
        department_dict = department.dict(exclude_unset=True)
        department_dict["totalTeachers"] = 0
        department_dict["totalStudents"] = 0
        existing_dept = await self.collection.find_one({"code": department_dict["code"]})
        if existing_dept:
            logger.warning(f"Department with code {department_dict['code']} already exists")
            raise HTTPException(status_code=400, detail=f"Department {department_dict['code']} already exists")
        result = await self.collection.insert_one(department_dict)
        department_dict["_id"] = str(result.inserted_id)
        logger.info(f"Department created with ID: {result.inserted_id}, data: {department_dict}")
        return department_dict

    async def get_department(self, id: str) -> Optional[Dict[str, Any]]:
        department = await self.collection.find_one({"_id": ObjectId(id)})
        if department:
            department["id"] = str(department.pop("_id"))
            logger.info(f"Retrieved department with ID: {id}")
            return department
        logger.warning(f"Department with ID {id} not found")
        return None

    async def get_departments(self) -> List[Dict[str, Any]]:
        cursor = self.collection.find()
        departments = []
        async for department in cursor:
            department["id"] = str(department.pop("_id"))
            departments.append(department)
        logger.info(f"Retrieved {len(departments)} departments: {departments}")
        return departments

    async def update_department(self, id: str, department: BaseModel) -> Dict[str, Any]:
        department_dict = department.dict(exclude_unset=True)
        if "code" in department_dict:
            existing_dept = await self.collection.find_one({"code": department_dict["code"], "_id": {"$ne": ObjectId(id)}})
            if existing_dept:
                logger.warning(f"Department with code {department_dict['code']} already exists")
                raise HTTPException(status_code=400, detail=f"Department {department_dict['code']} already exists")
        result = await self.collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": department_dict}
        )
        if result.modified_count:
            logger.info(f"Department updated with ID: {id}")
            return {"message": "Department updated successfully", "id": id}
        logger.warning(f"Department with ID {id} not found for update")
        raise HTTPException(status_code=404, detail="Department not found")

    async def delete_department(self, id: str) -> Dict[str, Any]:
        result = await self.collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count:
            logger.info(f"Department deleted with ID: {id}")
            return {"message": "Department deleted successfully"}
        logger.warning(f"Department with ID {id} not found for deletion")
        raise HTTPException(status_code=404, detail="Department not found")

class SubjectDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["subjects"]
        logger.info("SubjectDB initialized")

    async def create_subject(self, subject: BaseModel) -> Dict[str, Any]:
        subject_dict = subject.dict(exclude_unset=True)
        existing_subject = await self.collection.find_one({"code": subject_dict["code"], "department": subject_dict["department"]})
        if existing_subject:
            logger.warning(f"Subject {subject_dict['code']} already exists in {subject_dict['department']}")
            raise HTTPException(status_code=400, detail=f"Subject {subject_dict['code']} already exists in {subject_dict['department']}")
        result = await self.collection.insert_one(subject_dict)
        subject_dict["_id"] = str(result.inserted_id)
        logger.info(f"Subject created with ID: {result.inserted_id}, data: {subject_dict}")
        return subject_dict

    async def get_subject(self, id: str) -> Optional[Dict[str, Any]]:
        subject = await self.collection.find_one({"_id": ObjectId(id)})
        if subject:
            subject["id"] = str(subject.pop("_id"))
            logger.info(f"Retrieved subject with ID: {id}")
            return subject
        logger.warning(f"Subject with ID {id} not found")
        return None

    async def get_subjects(self) -> List[Dict[str, Any]]:
        cursor = self.collection.find()
        subjects = []
        async for subject in cursor:
            subject["id"] = str(subject.pop("_id"))
            subjects.append(subject)
        logger.info(f"Retrieved {len(subjects)} subjects: {subjects}")
        return subjects

    async def update_subject(self, id: str, subject: BaseModel) -> Dict[str, Any]:
        subject_dict = subject.dict(exclude_unset=True)
        if "code" in subject_dict and "department" in subject_dict:
            existing_subject = await self.collection.find_one(
                {"code": subject_dict["code"], "department": subject_dict["department"], "_id": {"$ne": ObjectId(id)}}
            )
            if existing_subject:
                logger.warning(f"Subject {subject_dict['code']} already exists in {subject_dict['department']}")
                raise HTTPException(status_code=400, detail=f"Subject {subject_dict['code']} already exists in {subject_dict['department']}")
        result = await self.collection.update_one(
            {"_id": ObjectId(id)},
            {"$set": subject_dict}
        )
        if result.modified_count:
            logger.info(f"Subject updated with ID: {id}")
            return {"message": "Subject updated successfully", "id": id}
        logger.warning(f"Subject with ID {id} not found for update")
        raise HTTPException(status_code=404, detail="Subject not found")

    async def delete_subject(self, id: str) -> Dict[str, Any]:
        result = await self.collection.delete_one({"_id": ObjectId(id)})
        if result.deleted_count:
            logger.info(f"Subject deleted with ID: {id}")
            return {"message": "Subject deleted successfully"}
        logger.warning(f"Subject with ID {id} not found for deletion")
        raise HTTPException(status_code=404, detail="Subject not found")