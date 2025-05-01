from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from bson import ObjectId
import logging
import base64

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AddStudentModel(BaseModel):
    fullName: str = Field(..., alias="fullName")
    dateOfBirth: str = Field(..., alias="dateOfBirth")
    gender: str = Field(..., alias="gender")
    phoneNumber: str = Field(..., alias="phoneNumber")
    email: EmailStr = Field(..., alias="email")
    parentName: str = Field(..., alias="parentName")
    parentContact: str = Field(..., alias="parentContact")
    address: str = Field(..., alias="address")
    city: str = Field(..., alias="city")
    state: str = Field(..., alias="state")
    postalCode: str = Field(..., alias="postalCode")
    department: str = Field(..., alias="department")
    program: str = Field(..., alias="program")
    yearOfStudy: str = Field(..., alias="yearOfStudy")
    semester: str = Field(..., alias="semester")
    section: str = Field(..., alias="section")
    admissionType: str = Field(..., alias="admissionType")
    scholarshipStatus: str = Field(..., alias="scholarshipStatus")
    hostelStudent: str = Field(..., alias="hostelStudent")
    bloodGroup: str = Field(..., alias="bloodGroup")
    emergencyContact: str = Field(..., alias="emergencyContact")
    remarks: Optional[str] = Field(None, alias="remarks")

    @validator("gender")
    def validate_gender(cls, v: str) -> str:
        allowed = ["male", "female", "other"]
        if v.lower() not in allowed:
            logger.error(f"Invalid gender: {v}. Allowed: {allowed}")
            raise ValueError(f"gender must be one of {allowed}")
        return v.lower()

    @validator("department")
    def validate_department(cls, v: str) -> str:
        allowed = ["Computer Science", "Electronics", "Mechanical", "Civil"]
        if v not in allowed:
            logger.error(f"Invalid department: {v}. Allowed: {allowed}")
            raise ValueError(f"department must be one of {allowed}")
        return v

    @validator("program")
    def validate_program(cls, v: str) -> str:
        allowed = ["BE", "BTECH", "ME", "MTECH"]
        if v not in allowed:
            logger.error(f"Invalid program: {v}. Allowed: {allowed}")
            raise ValueError(f"program must be one of {allowed}")
        return v

    @validator("yearOfStudy")
    def validate_year_of_study(cls, v: str) -> str:
        allowed = ["1", "2", "3", "4"]
        if v not in allowed:
            logger.error(f"Invalid yearOfStudy: {v}. Allowed: {allowed}")
            raise ValueError(f"yearOfStudy must be one of {allowed}")
        return v

    @validator("semester")
    def validate_semester(cls, v: str) -> str:
        allowed = ["1", "2", "3", "4", "5", "6", "7", "8"]
        if v not in allowed:
            logger.error(f"Invalid semester: {v}. Allowed: {allowed}")
            raise ValueError(f"semester must be one of {allowed}")
        return v

    @validator("section")
    def validate_section(cls, v: str) -> str:
        allowed = ["A", "B", "C"]
        if v not in allowed:
            logger.error(f"Invalid section: {v}. Allowed: {allowed}")
            raise ValueError(f"section must be one of {allowed}")
        return v

    @validator("admissionType")
    def validate_admission_type(cls, v: str) -> str:
        allowed = ["regular", "lateral", "management"]
        if v.lower() not in allowed:
            logger.error(f"Invalid admissionType: {v}. Allowed: {allowed}")
            raise ValueError(f"admissionType must be one of {allowed}")
        return v.lower()

    @validator("bloodGroup")
    def validate_blood_group(cls, v: str) -> str:
        allowed = ["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"]
        if v not in allowed:
            logger.error(f"Invalid bloodGroup: {v}. Allowed: {allowed}")
            raise ValueError(f"bloodGroup must be one of {allowed}")
        return v

    @validator("scholarshipStatus")
    def validate_scholarship_status(cls, v: str) -> bool:
        if v.lower() not in ["true", "false"]:
            logger.error(f"Invalid scholarshipStatus: {v}")
            raise ValueError("scholarshipStatus must be 'true' or 'false'")
        return v.lower() == "true"

    @validator("hostelStudent")
    def validate_hostel_student(cls, v: str) -> bool:
        if v.lower() not in ["true", "false"]:
            logger.error(f"Invalid hostelStudent: {v}")
            raise ValueError("hostelStudent must be 'true' or 'false'")
        return v.lower() == "true"

    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_schema_extra = {
            "example": {
                "fullName": "John Doe",
                "dateOfBirth": "2000-01-01",
                "gender": "male",
                "phoneNumber": "1234567890",
                "email": "john@example.com",
                "parentName": "Jane Doe",
                "parentContact": "0987654321",
                "address": "123 Main St",
                "city": "Springfield",
                "state": "IL",
                "postalCode": "62701",
                "department": "Computer Science",
                "program": "BTECH",
                "yearOfStudy": "1",
                "semester": "1",
                "section": "A",
                "admissionType": "regular",
                "scholarshipStatus": "false",
                "hostelStudent": "false",
                "bloodGroup": "O+",
                "emergencyContact": "0987654321",
                "remarks": ""
            }
        }

class StudentDB:
    def __init__(self, db):
        self.db = db
        self.collection = db.get_collection("students")

    async def create_student(self, student: AddStudentModel, file_content: Optional[bytes] = None, registration_number: Optional[str] = None):
        try:
            student_data = student.dict(by_alias=True)
            student_data["registrationNumber"] = registration_number
            student_data["courses"] = []  # Initialize courses as empty list
            if file_content:
                student_data["profilePicture"] = file_content
            else:
                student_data["profilePicture"] = None
            logger.info(f"Inserting student data: {student_data}")
            result = await self.collection.insert_one(student_data)
            logger.info(f"Student inserted with ID: {result.inserted_id}")
            return {"message": "Student added successfully", "id": str(result.inserted_id)}
        except Exception as e:
            logger.error(f"Failed to create student: {str(e)}")
            raise

    async def get_students(self):
        try:
            students = []
            async for student in self.collection.find():
                if student.get("profilePicture"):
                    # Encode binary data as Base64 for frontend
                    student["profilePicture"] = base64.b64encode(student["profilePicture"]).decode('utf-8')
                student["_id"] = str(student["_id"])
                students.append(student)
            logger.info(f"Retrieved {len(students)} students")
            return students
        except Exception as e:
            logger.error(f"Failed to retrieve students: {str(e)}")
            raise

    async def get_student(self, id: str):
        try:
            student = await self.collection.find_one({"_id": ObjectId(id)})
            if student:
                if student.get("profilePicture"):
                    # Encode binary data as Base64 for frontend
                    student["profilePicture"] = base64.b64encode(student["profilePicture"]).decode('utf-8')
                student["_id"] = str(student["_id"])
                logger.info(f"Retrieved student with ID: {id}")
                return student
            logger.warning(f"Student with ID {id} not found")
            return None
        except Exception as e:
            logger.error(f"Failed to retrieve student {id}: {str(e)}")
            raise