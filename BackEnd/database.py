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
        self.subject_collection = db["db.subjects"]

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

    async def get_applicable_courses(self, department_id: str, year_of_study: str, semester: str) -> List[Dict[str, Any]]:
        try:
            courses = []
            async for subject in self.subject_collection.find({
                "department": ObjectId(department_id),
                "yearOfStudy": year_of_study,
                "semester": semester
            }):
                courses.append({
                    "id": str(subject["_id"]),
                    "code": sanitize_string(subject.get("code", "")),
                    "name": sanitize_string(subject.get("name", ""))
                })
            logger.info(f"Retrieved {len(courses)} courses for dept: {department_id}, year: {year_of_study}, semester: {semester}")
            return courses
        except Exception as e:
            logger.error(f"Error retrieving courses: {str(e)}")
            raise

    async def create_student(self, student: AddStudentModel, file_content: Optional[bytes], registration_number: str) -> Dict[str, Any]:
        try:
            student_data = student.dict(by_alias=True)
            student_data["registrationNumber"] = registration_number
            student_data["department"] = ObjectId(student_data["department"])
            
            # Automatically assign courses based on department, year, and semester
            courses = await self.get_applicable_courses(
                student_data["department"],
                student_data["yearOfStudy"],
                student_data["semester"]
            )
            student_data["courses"] = [course["id"] for course in courses] if courses else []

            if file_content:
                student_data["fileContent"] = file_content
            result = await self.collection.insert_one(student_data)
            student_id = str(result.inserted_id)
            await self.department_collection.update_one(
                {"_id": ObjectId(student.department)},
                {"$inc": {"totalStudents": 1}}
            )
            inserted_student = await self.collection.find_one({"_id": ObjectId(student_id)})
            if inserted_student:
                sanitized_student = {}
                for key, value in inserted_student.items():
                    if key == "_id":
                        sanitized_student["id"] = str(value)
                    elif key == "department":
                        sanitized_student[key] = sanitize_string(value)
                    elif key == "fileContent" and value:
                        sanitized_student[key] = base64.b64encode(value).decode('utf-8')
                    elif key == "courses":
                        sanitized_student[key] = [
                            {
                                "id": str(course_id),
                                "code": course["code"],
                                "name": course["name"]
                            } for course_id in value
                            for course in courses if course["id"] == str(course_id)
                        ]
                    else:
                        sanitized_student[key] = sanitize_string(value)
                if "_id" in sanitized_student:
                    del sanitized_student["_id"]
            logger.info(f"Student created with ID: {student_id}, updated department {student.department}, assigned {len(courses)} courses")
            return sanitized_student
        except Exception as e:
            logger.error(f"Error creating student: {str(e)}")
            raise

    async def get_students(self) -> List[Dict[str, Any]]:
        try:
            students = []
            async for student in self.collection.find({}, {"fileContent": 0, "photo": 0}):
                # Fetch course details for each student
                courses = []
                if student.get("courses"):
                    async for subject in self.subject_collection.find({"_id": {"$in": [ObjectId(cid) for cid in student["courses"]]}}):
                        courses.append({
                            "id": str(subject["_id"]),
                            "code": sanitize_string(subject.get("code", "")),
                            "name": sanitize_string(subject.get("name", ""))
                        })
                sanitized_student = {}
                for key, value in student.items():
                    if key == "_id":
                        sanitized_student["id"] = str(value)
                    elif key == "department":
                        sanitized_student[key] = sanitize_string(value)
                    elif key == "courses":
                        sanitized_student[key] = courses
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

    async def get_student(self, id: str) -> Optional[Dict[str, Any]]:
        try:
            student = await self.collection.find_one({"_id": ObjectId(id)}, {"fileContent": 0, "photo": 0})
            if not student:
                return None
            # Fetch course details
            courses = []
            if student.get("courses"):
                async for subject in self.subject_collection.find({"_id": {"$in": [ObjectId(cid) for cid in student["courses"]]}}):
                    courses.append({
                        "id": str(subject["_id"]),
                        "code": sanitize_string(subject.get("code", "")),
                        "name": sanitize_string(subject.get("name", ""))
                    })
            sanitized_student = {}
            for key, value in student.items():
                if key == "_id":
                    sanitized_student["id"] = str(value)
                elif key == "department":
                    sanitized_student[key] = sanitize_string(value)
                elif key == "courses":
                    sanitized_student[key] = courses
                else:
                    sanitized_student[key] = sanitize_string(value)
            if "_id" in sanitized_student:
                del sanitized_student["_id"]
            logger.info(f"Retrieved student: {id}")
            return sanitized_student
        except Exception as e:
            logger.error(f"Error retrieving student {id}: {str(e)}")
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
                # Fetch course details
                courses = []
                if updated_student.get("courses"):
                    async for subject in self.subject_collection.find({"_id": {"$in": [ObjectId(cid) for cid in updated_student["courses"]]}}):
                        courses.append({
                            "id": str(subject["_id"]),
                            "code": sanitize_string(subject.get("code", "")),
                            "name": sanitize_string(subject.get("name", ""))
                        })
                sanitized_student = {}
                for key, value in updated_student.items():
                    if key == "_id":
                        sanitized_student["id"] = str(value)
                    elif key == "department":
                        sanitized_student[key] = sanitize_string(value)
                    elif key == "courses":
                        sanitized_student[key] = courses
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
            # Attempt to update department's totalStudents
            try:
                department_id = student.get("department")
                if department_id:
                    # Validate department_id as ObjectId
                    try:
                        dept_object_id = ObjectId(department_id)
                        dept = await self.department_collection.find_one({"_id": dept_object_id})
                        if dept:
                            await self.department_collection.update_one(
                                {"_id": dept_object_id},
                                {"$inc": {"totalStudents": -1}}
                            )
                            logger.info(f"Updated totalStudents for department {dept['name']}")
                        else:
                            logger.warning(f"Department with ID {department_id} not found for student {id}")
                    except Exception as e:
                        logger.error(f"Invalid department ID {department_id} for student {id}: {str(e)}")
                else:
                    logger.warning(f"No department ID found for student {id}")
            except Exception as e:
                logger.error(f"Failed to update department for student {id}: {str(e)}")
                # Continue with deletion despite department update failure
            logger.info(f"Student deleted with ID: {id}")
            return {"id": id, "status": "deleted"}
        except Exception as e:
            logger.error(f"Error deleting student {id}: {str(e)}")
            raise

    async def assign_course(self, student_id: str, course_id: str) -> Dict[str, Any]:
        try:
            student = await self.collection.find_one({"_id": ObjectId(student_id)})
            if not student:
                raise ValueError(f"Student with ID {student_id} not found")
            course = await self.subject_collection.find_one({"_id": ObjectId(course_id)})
            if not course:
                raise ValueError(f"Course with ID {course_id} not found")
            result = await self.collection.update_one(
                {"_id": ObjectId(student_id)},
                {"$addToSet": {"courses": ObjectId(course_id)}}
            )
            if result.matched_count == 0:
                raise ValueError(f"Student with ID {student_id} not found")
            updated_student = await self.get_student(student_id)
            logger.info(f"Assigned course {course_id} to student {student_id}")
            return updated_student
        except Exception as e:
            logger.error(f"Error assigning course {course_id} to student {student_id}: {str(e)}")
            raise

    async def remove_course(self, student_id: str, course_id: str) -> Dict[str, Any]:
        try:
            student = await self.collection.find_one({"_id": ObjectId(student_id)})
            if not student:
                raise ValueError(f"Student with ID {student_id} not found")
            course = await self.subject_collection.find_one({"_id": ObjectId(course_id)})
            if not course:
                raise ValueError(f"Course with ID {course_id} not found")
            result = await self.collection.update_one(
                {"_id": ObjectId(student_id)},
                {"$pull": {"courses": ObjectId(course_id)}}
            )
            if result.matched_count == 0:
                raise ValueError(f"Student with ID {student_id} not found")
            updated_student = await self.get_student(student_id)
            logger.info(f"Removed course {course_id} from student {student_id}")
            return updated_student
        except Exception as e:
            logger.error(f"Error removing course {course_id} from student {student_id}: {str(e)}")
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