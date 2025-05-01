from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from typing import Dict, Any, Optional, List
import logging
import base64
from AddStudentModel import AddStudentModel

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def sanitize_string(value: Any) -> str:
    """Convert value to string and replace invalid UTF-8 characters."""
    if value is None:
        return ""
    if isinstance(value, bytes):
        try:
            return value.decode('utf-8', errors='replace')
        except Exception as e:
            logger.warning(f"Failed to decode bytes: {value[:50]}, error: {str(e)}")
            return ""
    if isinstance(value, ObjectId):
        return str(value)
    if not isinstance(value, str):
        try:
            return str(value)
        except Exception as e:
            logger.warning(f"Failed to convert to string: {value}, error: {str(e)}")
            return ""
    try:
        # Ensure string is UTF-8 compliant
        return value.encode('utf-8', errors='replace').decode('utf-8')
    except Exception as e:
        logger.warning(f"Invalid UTF-8 string: {value[:50]}, error: {str(e)}")
        return ""

class Database:
    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = None
        self.MONGODB_URL = "mongodb://localhost:27017"
        self.DATABASE_NAME = "satscore"

    async def startup(self):
        try:
            self.client = AsyncIOMotorClient(self.MONGODB_URL)
            self.db = self.client[self.DATABASE_NAME]
            logger.info(f"MongoDB connection established to {self.DATABASE_NAME} database")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    async def shutdown(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

class StudentDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["students"]
        self.department_collection = db["db.departments"]

    async def generate_registration_number(self, year: str, department_id: str) -> str:
        try:
            dept = await self.department_collection.find_one({"_id": ObjectId(department_id)})
            if not dept:
                raise ValueError(f"Department with ID {department_id} not found")
            short_name = dept.get("shortName", "")
            count = await self.collection.count_documents({"yearOfJoining": year, "department": department_id})
            reg_number = f"{year}{short_name}{count + 1:04d}"
            logger.info(f"Generated registration number: {reg_number} for year: {year}, dept: {dept['name']}")
            return reg_number
        except Exception as e:
            logger.error(f"Error generating registration number: {str(e)}")
            raise

    async def create_student(self, student: AddStudentModel, file_content: Optional[bytes], registration_number: str) -> Dict[str, Any]:
        try:
            student_data = student.dict(by_alias=True)
            student_data["registrationNumber"] = registration_number
            student_data["department"] = ObjectId(student_data["department"])
            if file_content:
                student_data["fileContent"] = file_content  # Store as binary
            result = await self.collection.insert_one(student_data)
            student_id = str(result.inserted_id)
            await self.department_collection.update_one(
                {"_id": ObjectId(student.department)},
                {"$inc": {"totalStudents": 1}}
            )
            inserted_student = await self.collection.find_one({"_id": ObjectId(student_id)})
            if inserted_student:
                inserted_student["id"] = str(inserted_student["_id"])
                inserted_student["department"] = str(inserted_student["department"])
                del inserted_student["_id"]
                if inserted_student.get("fileContent"):
                    inserted_student["fileContent"] = base64.b64encode(inserted_student["fileContent"]).decode('utf-8')
            logger.info(f"Student created with ID: {student_id}, updated department {student.department}")
            return inserted_student
        except Exception as e:
            logger.error(f"Error creating student: {str(e)}")
            raise

    async def get_students(self) -> List[Dict[str, Any]]:
        try:
            students = []
            async for student in self.collection.find({}, {"fileContent": 0, "photo": 0}):
                # Sanitize all fields to ensure UTF-8 compliance
                sanitized_student = {}
                for key, value in student.items():
                    if key == "_id":
                        sanitized_student["id"] = str(value)
                    elif key == "department":
                        sanitized_student[key] = sanitize_string(value)
                    else:
                        sanitized_student[key] = sanitize_string(value)
                if "_id" in sanitized_student:
                    del sanitized_student["_id"]
                students.append(sanitized_student)
                logger.debug(f"Sanitized student: {sanitized_student['id']}")
            logger.info(f"Retrieved {len(students)} students via API")
            return students
        except Exception as e:
            logger.error(f"Error retrieving students: {str(e)}")
            raise

    async def update_student(self, id: str, student: AddStudentModel) -> Dict[str, Any]:
        try:
            student_data = student.dict(by_alias=True)
            student_data["department"] = ObjectId(student_data["department"])
            result = await self.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": student_data}
            )
            if result.matched_count == 0:
                raise ValueError(f"Student with ID {id} not found")
            updated_student = await self.collection.find_one({"_id": ObjectId(id)}, {"fileContent": 0})
            if updated_student:
                sanitized_student = {}
                for key, value in updated_student.items():
                    if key == "_id":
                        sanitized_student["id"] = str(value)
                    elif key == "department":
                        sanitized_student[key] = sanitize_string(value)
                    else:
                        sanitized_student[key] = sanitize_string(value)
                if "_id" in sanitized_student:
                    del sanitized_student["_id"]
                logger.info(f"Student updated with ID: {id}")
                return sanitized_student
        except Exception as e:
            logger.error(f"Error updating student {id}: {str(e)}")
            raise

    async def delete_student(self, id: str) -> Dict[str, Any]:
        try:
            student = await self.collection.find_one({"_id": ObjectId(id)})
            if not student:
                raise ValueError(f"Student with ID {id} not found")
            result = await self.collection.delete_one({"_id": ObjectId(id)})
            await self.department_collection.update_one(
                {"_id": ObjectId(student["department"])},
                {"$inc": {"totalStudents": -1}}
            )
            logger.info(f"Student deleted with ID: {id}")
            return {"id": id, "status": "deleted"}
        except Exception as e:
            logger.error(f"Error deleting student {id}: {str(e)}")
            raise

class DepartmentDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["db.departments"]

    async def create_department(self, department: Any) -> Dict[str, Any]:
        try:
            department_data = department.dict()
            result = await self.collection.insert_one(department_data)
            department_id = str(result.inserted_id)
            inserted_department = await self.collection.find_one({"_id": ObjectId(department_id)})
            if inserted_department:
                inserted_department["id"] = str(inserted_department["_id"])
                del inserted_department["_id"]
            logger.info(f"Department created with ID: {department_id}")
            return inserted_department
        except Exception as e:
            logger.error(f"Error creating department: {str(e)}")
            raise

    async def get_departments(self) -> List[Dict[str, Any]]:
        try:
            departments = []
            async for dept in self.collection.find():
                dept["id"] = str(dept["_id"])
                del dept["_id"]
                departments.append(dept)
            return departments
        except Exception as e:
            logger.error(f"Error retrieving departments: {str(e)}")
            raise

    async def get_department(self, id: str) -> Optional[Dict[str, Any]]:
        try:
            dept = await self.collection.find_one({"_id": ObjectId(id)})
            if dept:
                dept["id"] = str(dept["_id"])
                del dept["_id"]
                return dept
            return None
        except Exception as e:
            logger.error(f"Error retrieving department {id}: {str(e)}")
            raise

    async def update_department(self, id: str, department: Any) -> Dict[str, Any]:
        try:
            department_data = department.dict()
            result = await self.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": department_data}
            )
            if result.matched_count == 0:
                raise ValueError(f"Department with ID {id} not found")
            updated_department = await self.collection.find_one({"_id": ObjectId(id)})
            if updated_department:
                updated_department["id"] = str(updated_department["_id"])
                del updated_department["_id"]
            logger.info(f"Department updated with ID: {id}")
            return updated_department
        except Exception as e:
            logger.error(f"Error updating department {id}: {str(e)}")
            raise

    async def delete_department(self, id: str) -> Dict[str, Any]:
        try:
            result = await self.collection.delete_one({"_id": ObjectId(id)})
            if result.deleted_count == 0:
                raise ValueError(f"Department with ID {id} not found")
            logger.info(f"Department deleted with ID: {id}")
            return {"id": id, "status": "deleted"}
        except Exception as e:
            logger.error(f"Error deleting department {id}: {str(e)}")
            raise

class SubjectDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["db.subjects"]

    async def create_subject(self, subject: Any) -> Dict[str, Any]:
        try:
            subject_data = subject.dict()
            result = await self.collection.insert_one(subject_data)
            subject_id = str(result.inserted_id)
            inserted_subject = await self.collection.find_one({"_id": ObjectId(subject_id)})
            if inserted_subject:
                inserted_subject["id"] = str(inserted_subject["_id"])
                del inserted_subject["_id"]
            logger.info(f"Subject created with ID: {subject_id}")
            return inserted_subject
        except Exception as e:
            logger.error(f"Error creating subject: {str(e)}")
            raise

    async def get_subjects(self) -> List[Dict[str, Any]]:
        try:
            subjects = []
            async for subj in self.collection.find():
                subj["id"] = str(subj["_id"])
                del subj["_id"]
                subjects.append(subj)
            return subjects
        except Exception as e:
            logger.error(f"Error retrieving subjects: {str(e)}")
            raise

    async def get_subject(self, id: str) -> Optional[Dict[str, Any]]:
        try:
            subj = await self.collection.find_one({"_id": ObjectId(id)})
            if subj:
                subj["id"] = str(subj["_id"])
                del subj["_id"]
                return subj
            return None
        except Exception as e:
            logger.error(f"Error retrieving subject {id}: {str(e)}")
            raise

    async def update_subject(self, id: str, subject: Any) -> Dict[str, Any]:
        try:
            subject_data = subject.dict()
            result = await self.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": subject_data}
            )
            if result.matched_count == 0:
                raise ValueError(f"Subject with ID {id} not found")
            updated_subject = await self.collection.find_one({"_id": ObjectId(id)})
            if updated_subject:
                updated_subject["id"] = str(updated_subject["_id"])
                del updated_subject["_id"]
            logger.info(f"Subject updated with ID: {id}")
            return updated_subject
        except Exception as e:
            logger.error(f"Error updating subject {id}: {str(e)}")
            raise

    async def delete_subject(self, id: str) -> Dict[str, Any]:
        try:
            result = await self.collection.delete_one({"_id": ObjectId(id)})
            if result.deleted_count == 0:
                raise ValueError(f"Subject with ID {id} not found")
            logger.info(f"Subject deleted with ID: {id}")
            return {"id": id, "status": "deleted"}
        except Exception as e:
            logger.error(f"Error deleting subject {id}: {str(e)}")
            raise