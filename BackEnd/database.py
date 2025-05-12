from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from bson import ObjectId
from typing import Dict, Any, Optional, List
import logging
import base64
from datetime import date, datetime
from AddStudentModel import AddStudentModel

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
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
        return value.encode('utf-8', errors='replace').decode('utf-8')
    except Exception as e:
        logger.warning(f"Invalid UTF-8 string: {value[:50]}, error: {str(e)}")
        return ""

class Database:
    def __init__(self, db: AsyncIOMotorDatabase = None):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db: Optional[AsyncIOMotorDatabase] = db
        self.MONGODB_URL = "mongodb://localhost:27017"
        self.DATABASE_NAME = "satscore"
        self.collection = {
            "db.teachers": self.db["db.teachers"] if self.db is not None else None,
            "db.students": self.db["db.students"] if self.db is not None else None,
            "db.departments": self.db["db.departments"] if self.db is not None else None,
            "db.subjects": self.db["db.subjects"] if self.db is not None else None,
            "db.refresh_tokens": self.db["db.refresh_tokens"] if self.db is not None else None,
            "mark_criteria": self.db["mark_criteria"] if self.db is not None else None,
            "marks": self.db["marks"] if self.db is not None else None,
        }

    async def startup(self):
        try:
            if self.db is None:
                self.client = AsyncIOMotorClient(self.MONGODB_URL)
                self.db = self.client[self.DATABASE_NAME]
                self.collection = {
                    "db.teachers": self.db["db.teachers"],
                    "db.students": self.db["db.students"],
                    "db.departments": self.db["db.departments"],
                    "db.subjects": self.db["db.subjects"],
                    "db.refresh_tokens": self.db["db.refresh_tokens"],
                    "mark_criteria": self.db["mark_criteria"],
                    "marks": self.db["marks"],
                }
            logger.info(f"MongoDB connection established to {self.DATABASE_NAME} database")
            await self.db.command("ping")
        except Exception as e:
            logger.error(f"Failed to connect to MongoDB: {str(e)}")
            raise

    async def shutdown(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed")

class StudentDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["db.students"]
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
            try:
                department_id = student.get("department")
                if department_id:
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

class TeacherDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["db.teachers"]
        self.department_collection = db["db.departments"]

    async def create_teacher(self, teacher: Dict[str, Any]) -> Dict[str, Any]:
        try:
            teacher_data = teacher.copy()  # Create a copy to avoid modifying input
            if "department" in teacher_data:
                # Expect department to be an ObjectId string from Teachers.py
                teacher_data["department"] = ObjectId(teacher_data["department"])
            # subjectsHandled should already be validated by Teachers.py, so no ObjectId conversion
            # Ensure teacherId is included
            if not teacher_data.get("teacherId"):
                raise ValueError("teacherId is required")
            # Convert string-based date fields to datetime objects
            for date_field in ["dateOfBirth", "joiningDate", "last_login"]:
                if date_field in teacher_data and isinstance(teacher_data[date_field], str):
                    try:
                        teacher_data[date_field] = datetime.fromisoformat(teacher_data[date_field].replace('Z', '+00:00'))
                    except ValueError as e:
                        logger.warning(f"Invalid date format for {date_field}: {teacher_data[date_field]}, error: {str(e)}")
            result = await self.collection.insert_one(teacher_data)
            teacher_id = str(result.inserted_id)
            inserted_teacher = await self.collection.find_one({"_id": ObjectId(teacher_id)})
            if inserted_teacher:
                sanitized_teacher = {}
                for key, value in inserted_teacher.items():
                    if key == "_id":
                        sanitized_teacher["id"] = str(value)
                    elif key == "department":
                        sanitized_teacher[key] = sanitize_string(value)
                    elif key == "subjectsHandled":
                        sanitized_teacher[key] = [
                            {
                                "subject_id": sanitize_string(assignment["subject_id"]),
                                "batch": sanitize_string(assignment.get("batch", "")),
                                "section": sanitize_string(assignment.get("section", ""))
                            }
                            for assignment in value
                        ]
                    elif isinstance(value, datetime):
                        sanitized_teacher[key] = value.isoformat()
                    else:
                        sanitized_teacher[key] = sanitize_string(value)
                logger.info(f"Teacher created with ID: {teacher_id}, teacherId: {teacher_data['teacherId']}")
                return sanitized_teacher
            raise ValueError("Failed to retrieve inserted teacher")
        except Exception as e:
            logger.error(f"Error creating teacher: {str(e)}")
            raise

    async def get_teachers(self) -> List[Dict[str, Any]]:
        try:
            teachers = []
            async for teacher in self.collection.find():
                sanitized_teacher = {}
                for key, value in teacher.items():
                    if key == "_id":
                        sanitized_teacher["id"] = str(value)
                    elif key == "department":
                        sanitized_teacher[key] = sanitize_string(value)
                    elif key == "subjectsHandled":
                        sanitized_teacher[key] = [
                            {
                                "subject_id": sanitize_string(assignment["subject_id"]),
                                "batch": sanitize_string(assignment.get("batch", "")),
                                "section": sanitize_string(assignment.get("section", ""))
                            }
                            for assignment in value
                        ]
                    elif isinstance(value, datetime):
                        sanitized_teacher[key] = value.isoformat()
                    else:
                        sanitized_teacher[key] = sanitize_string(value)
                teachers.append(sanitized_teacher)
            logger.info(f"Retrieved {len(teachers)} teachers via API")
            return teachers
        except Exception as e:
            logger.error(f"Error retrieving teachers: {str(e)}")
            raise

    async def get_teacher(self, id: str) -> Optional[Dict[str, Any]]:
        try:
            teacher = await self.collection.find_one({"teacherId": id})
            if teacher:
                sanitized_teacher = {}
                for key, value in teacher.items():
                    if key == "_id":
                        sanitized_teacher["id"] = str(value)
                    elif key == "department":
                        sanitized_teacher[key] = sanitize_string(value)
                    elif key == "subjectsHandled":
                        sanitized_teacher[key] = [
                            {
                                "subject_id": sanitize_string(assignment["subject_id"]),
                                "batch": sanitize_string(assignment.get("batch", "")),
                                "section": sanitize_string(assignment.get("section", ""))
                            }
                            for assignment in value
                        ]
                    elif isinstance(value, datetime):
                        sanitized_teacher[key] = value.isoformat()
                    else:
                        sanitized_teacher[key] = sanitize_string(value)
                logger.info(f"Retrieved teacher: {id}")
                return sanitized_teacher
            return None
        except Exception as e:
            logger.error(f"Error retrieving teacher {id}: {str(e)}")
            raise

    async def update_teacher(self, id: str, teacher: Dict[str, Any]) -> Dict[str, Any]:
        try:
            teacher_data = teacher.copy()
            if "department" in teacher_data:
                teacher_data["department"] = ObjectId(teacher_data["department"])
            # subjectsHandled should already be validated by Teachers.py, so no ObjectId conversion
            # Convert string-based date fields to datetime objects
            for date_field in ["dateOfBirth", "joiningDate", "last_login"]:
                if date_field in teacher_data and isinstance(teacher_data[date_field], str):
                    try:
                        teacher_data[date_field] = datetime.fromisoformat(teacher_data[date_field].replace('Z', '+00:00'))
                    except ValueError as e:
                        logger.warning(f"Invalid date format for {date_field}: {teacher_data[date_field]}, error: {str(e)}")
            result = await self.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": teacher_data}
            )
            if result.matched_count == 0:
                raise ValueError(f"Teacher with ID {id} not found")
            updated_teacher = await self.collection.find_one({"_id": ObjectId(id)})
            if updated_teacher:
                sanitized_teacher = {}
                for key, value in updated_teacher.items():
                    if key == "_id":
                        sanitized_teacher["id"] = str(value)
                    elif key == "department":
                        sanitized_teacher[key] = sanitize_string(value)
                    elif key == "subjectsHandled":
                        sanitized_teacher[key] = [
                            {
                                "subject_id": sanitize_string(assignment["subject_id"]),
                                "batch": sanitize_string(assignment.get("batch", "")),
                                "section": sanitize_string(assignment.get("section", ""))
                            }
                            for assignment in value
                        ]
                    elif isinstance(value, datetime):
                        sanitized_teacher[key] = value.isoformat()
                    else:
                        sanitized_teacher[key] = sanitize_string(value)
                logger.info(f"Teacher updated with ID: {id}")
                return sanitized_teacher
            raise ValueError("Failed to retrieve updated teacher")
        except Exception as e:
            logger.error(f"Error updating teacher {id}: {str(e)}")
            raise

    async def delete_teacher(self, id: str) -> Dict[str, Any]:
        try:
            result = await self.collection.delete_one({"_id": ObjectId(id)})
            if result.deleted_count == 0:
                raise ValueError(f"Teacher with ID {id} not found")
            logger.info(f"Teacher deleted with ID: {id}")
            return {"id": id, "status": "deleted"}
        except Exception as e:
            logger.error(f"Error deleting teacher {id}: {str(e)}")
            raise

class MarkCriteriaDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["mark_criteria"]

    async def create_mark_criteria(self, criteria: Any) -> Dict[str, Any]:
        try:
            criteria_data = criteria.dict()
            result = await self.collection.insert_one(criteria_data)
            criteria_id = str(result.inserted_id)
            inserted_criteria = await self.collection.find_one({"_id": ObjectId(criteria_id)})
            if inserted_criteria:
                inserted_criteria["id"] = str(inserted_criteria["_id"])
                del inserted_criteria["_id"]
            logger.info(f"Mark criteria created with ID: {criteria_id}")
            return inserted_criteria
        except Exception as e:
            logger.error(f"Error creating mark criteria: {str(e)}")
            raise

    async def get_mark_criteria(self) -> List[Dict[str, Any]]:
        try:
            criteria = []
            async for crit in self.collection.find():
                crit["id"] = str(crit["_id"])
                del crit["_id"]
                criteria.append(crit)
            logger.info(f"Retrieved {len(criteria)} mark criteria via API")
            return criteria
        except Exception as e:
            logger.error(f"Error retrieving mark criteria: {str(e)}")
            raise

    async def get_mark_criterion(self, id: str) -> Optional[Dict[str, Any]]:
        try:
            crit = await self.collection.find_one({"_id": ObjectId(id)})
            if crit:
                crit["id"] = str(crit["_id"])
                del crit["_id"]
                return crit
            return None
        except Exception as e:
            logger.error(f"Error retrieving mark criterion {id}: {str(e)}")
            raise

    async def update_mark_criterion(self, id: str, criteria: Any) -> Dict[str, Any]:
        try:
            criteria_data = criteria.dict()
            result = await self.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": criteria_data}
            )
            if result.matched_count == 0:
                raise ValueError(f"Mark criterion with ID {id} not found")
            updated_criterion = await self.collection.find_one({"_id": ObjectId(id)})
            if updated_criterion:
                updated_criterion["id"] = str(updated_criterion["_id"])
                del updated_criterion["_id"]
            logger.info(f"Mark criterion updated with ID: {id}")
            return updated_criterion
        except Exception as e:
            logger.error(f"Error updating mark criterion {id}: {str(e)}")
            raise

    async def delete_mark_criterion(self, id: str) -> Dict[str, Any]:
        try:
            result = await self.collection.delete_one({"_id": ObjectId(id)})
            if result.deleted_count == 0:
                raise ValueError(f"Mark criterion with ID {id} not found")
            logger.info(f"Mark criterion deleted with ID: {id}")
            return {"id": id, "status": "deleted"}
        except Exception as e:
            logger.error(f"Error deleting mark criterion {id}: {str(e)}")
            raise

class MarksDB:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.collection = db["marks"]
        self.student_collection = db["db.students"]
        self.subject_collection = db["db.subjects"]

    async def create_mark(self, mark: Dict[str, Any]) -> Dict[str, Any]:
        try:
            # Use the dictionary directly, no .dict() call
            mark_data = mark.copy()  # Create a copy to avoid modifying the input
            mark_data["student"] = ObjectId(mark_data["student"])
            mark_data["subject"] = ObjectId(mark_data["subject"])
            mark_data["created_at"] = date.today().isoformat() if "created_at" not in mark_data else mark_data["created_at"]
            result = await self.collection.insert_one(mark_data)
            mark_id = str(result.inserted_id)
            inserted_mark = await self.collection.find_one({"_id": ObjectId(mark_id)})
            if inserted_mark:
                inserted_mark["id"] = str(inserted_mark["_id"])
                del inserted_mark["_id"]
                inserted_mark["student"] = sanitize_string(inserted_mark["student"])
                inserted_mark["subject"] = sanitize_string(inserted_mark["subject"])
            logger.info(f"Mark created with ID: {mark_id}")
            return inserted_mark
        except Exception as e:
            logger.error(f"Error creating mark: {str(e)}")
            raise

    async def get_marks(self) -> List[Dict[str, Any]]:
        try:
            marks = []
            async for mark in self.collection.find():
                mark["id"] = str(mark["_id"])
                del mark["_id"]
                mark["student"] = sanitize_string(mark["student"])
                mark["subject"] = sanitize_string(mark["subject"])
                marks.append(mark)
            logger.info(f"Retrieved {len(marks)} marks via API")
            return marks
        except Exception as e:
            logger.error(f"Error retrieving marks: {str(e)}")
            raise

    async def get_mark(self, id: str) -> Optional[Dict[str, Any]]:
        try:
            mark = await self.collection.find_one({"_id": ObjectId(id)})
            if mark:
                mark["id"] = str(mark["_id"])
                del mark["_id"]
                mark["student"] = sanitize_string(mark["student"])
                mark["subject"] = sanitize_string(mark["subject"])
                return mark
            return None
        except Exception as e:
            logger.error(f"Error retrieving mark {id}: {str(e)}")
            raise

    async def update_mark(self, id: str, mark: Dict[str, Any]) -> Dict[str, Any]:
        try:
            mark_data = mark.copy()
            mark_data["student"] = ObjectId(mark_data["student"])
            mark_data["subject"] = ObjectId(mark_data["subject"])
            result = await self.collection.update_one(
                {"_id": ObjectId(id)},
                {"$set": mark_data}
            )
            if result.matched_count == 0:
                raise ValueError(f"Mark with ID {id} not found")
            updated_mark = await self.collection.find_one({"_id": ObjectId(id)})
            if updated_mark:
                updated_mark["id"] = str(updated_mark["_id"])
                del updated_mark["_id"]
                updated_mark["student"] = sanitize_string(updated_mark["student"])
                updated_mark["subject"] = sanitize_string(updated_mark["subject"])
            logger.info(f"Mark updated with ID: {id}")
            return updated_mark
        except Exception as e:
            logger.error(f"Error updating mark {id}: {str(e)}")
            raise

    async def delete_mark(self, id: str) -> Dict[str, Any]:
        try:
            result = await self.collection.delete_one({"_id": ObjectId(id)})
            if result.deleted_count == 0:
                raise ValueError(f"Mark with ID {id} not found")
            logger.info(f"Mark deleted with ID: {id}")
            return {"id": id, "status": "deleted"}
        except Exception as e:
            logger.error(f"Error deleting mark {id}: {str(e)}")
            raise