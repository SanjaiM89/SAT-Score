from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from bson import ObjectId
import logging
import base64
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AddStudentModel(BaseModel):
    fullName: str = Field(..., alias="fullName", min_length=3, max_length=100)
    dateOfBirth: str = Field(..., alias="dateOfBirth")
    gender: str = Field(..., alias="gender")
    phoneNumber: str = Field(..., alias="phoneNumber", min_length=10, max_length=15)
    email: EmailStr = Field(..., alias="email")
    parentName: str = Field(..., alias="parentName", min_length=3, max_length=100)
    parentContact: str = Field(..., alias="parentContact", min_length=10, max_length=15)
    address: str = Field(..., alias="address", min_length=5, max_length=200)
    city: str = Field(..., alias="city", min_length=2, max_length=100)
    state: str = Field(..., alias="state", min_length=2, max_length=100)
    postalCode: str = Field(..., alias="postalCode", min_length=5, max_length=10)
    department: str = Field(..., alias="department")
    program: str = Field(..., alias="program")
    yearOfStudy: str = Field(..., alias="yearOfStudy")
    semester: str = Field(..., alias="semester")
    section: str = Field(..., alias="section")
    admissionType: str = Field(..., alias="admissionType")
    scholarshipStatus: bool = Field(..., alias="scholarshipStatus")
    hostelStudent: bool = Field(..., alias="hostelStudent")
    bloodGroup: str = Field(..., alias="bloodGroup")
    emergencyContact: str = Field(..., alias="emergencyContact", min_length=10, max_length=15)
    remarks: Optional[str] = Field(None, alias="remarks", max_length=500)
    yearOfJoining: int = Field(..., alias="yearOfJoining", ge=2000, le=datetime.now().year)
    registrationNumber: Optional[str] = Field(None, alias="registrationNumber")

    @validator("dateOfBirth")
    def validate_date_of_birth(cls, v: str) -> str:
        try:
            datetime.strptime(v, '%Y-%m-%d')
            return v
        except ValueError:
            logger.error(f"Invalid dateOfBirth: {v}. Expected format: YYYY-MM-DD")
            raise ValueError("dateOfBirth must be in YYYY-MM-DD format")

    @validator("phoneNumber")
    def validate_phone_number(cls, v: str) -> str:
        if not v.isdigit() or len(v) < 10 or len(v) > 15:
            logger.error(f"Invalid phoneNumber: {v}. Must be 10-15 digits")
            raise ValueError("phoneNumber must be 10 to 15 digits")
        return v

    @validator("parentContact")
    def validate_parent_contact(cls, v: str) -> str:
        if not v.isdigit() or len(v) < 10 or len(v) > 15:
            logger.error(f"Invalid parentContact: {v}. Must be 10-15 digits")
            raise ValueError("parentContact must be 10 to 15 digits")
        return v

    @validator("emergencyContact")
    def validate_emergency_contact(cls, v: str) -> str:
        if not v.isdigit() or len(v) < 10 or len(v) > 15:
            logger.error(f"Invalid emergencyContact: {v}. Must be 10-15 digits")
            raise ValueError("emergencyContact must be 10 to 15 digits")
        return v

    @validator("postalCode")
    def validate_postal_code(cls, v: str) -> str:
        if not v.isdigit() or len(v) < 5 or len(v) > 10:
            logger.error(f"Invalid postalCode: {v}. Must be 5-10 digits")
            raise ValueError("postalCode must be 5 to 10 digits")
        return v

    @validator("gender")
    def validate_gender(cls, v: str) -> str:
        allowed = ["male", "female", "other"]
        if v.lower() not in allowed:
            logger.error(f"Invalid gender: {v}. Allowed: {allowed}")
            raise ValueError(f"gender must be one of {allowed}")
        return v.lower()

    @validator("department")
    def validate_department(cls, v: str) -> str:
        # Note: Dynamic validation requires database access, which is handled in Student.py
        # For model validation, we only ensure it's a non-empty string
        if not v.strip():
            logger.error("Department cannot be empty")
            raise ValueError("department cannot be empty")
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

    @validator("scholarshipStatus", pre=True)
    def validate_scholarship_status(cls, v) -> bool:
        if isinstance(v, str):
            if v.lower() not in ["true", "false"]:
                logger.error(f"Invalid scholarshipStatus: {v}")
                raise ValueError("scholarshipStatus must be 'true' or 'false'")
            return v.lower() == "true"
        return v

    @validator("hostelStudent", pre=True)
    def validate_hostel_student(cls, v) -> bool:
        if isinstance(v, str):
            if v.lower() not in ["true", "false"]:
                logger.error(f"Invalid hostelStudent: {v}")
                raise ValueError("hostelStudent must be 'true' or 'false'")
            return v.lower() == "true"
        return v

    @validator("yearOfJoining")
    def validate_year_of_joining(cls, v: int) -> int:
        current_year = datetime.now().year
        if v < 2000 or v > current_year:
            logger.error(f"Invalid yearOfJoining: {v}. Must be between 2000 and {current_year}")
            raise ValueError(f"yearOfJoining must be between 2000 and {current_year}")
        return v

    @validator("registrationNumber", always=True)
    def validate_registration_number(cls, v: Optional[str], values: dict) -> Optional[str]:
        if v is None:
            return v  # registrationNumber is generated in Student.py
        # Validate format: YYYYXXNNNN (e.g., 2025EL0005)
        import re
        pattern = r'^\d{4}[A-Z]{2}\d{4}$'
        if not re.match(pattern, v):
            logger.error(f"Invalid registrationNumber: {v}. Must match YYYYXXNNNN (e.g., 2025EL0005)")
            raise ValueError("registrationNumber must match format YYYYXXNNNN (e.g., 2025EL0005)")
        # Ensure year matches yearOfJoining
        if 'yearOfJoining' in values:
            year = v[:4]
            if int(year) != values['yearOfJoining']:
                logger.error(f"registrationNumber year {year} does not match yearOfJoining {values['yearOfJoining']}")
                raise ValueError("registrationNumber year must match yearOfJoining")
        return v

    class Config:
        validate_assignment = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}
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
                "department": "Electronics & Communication",
                "program": "BTECH",
                "yearOfStudy": "1",
                "semester": "1",
                "section": "A",
                "admissionType": "regular",
                "scholarshipStatus": "false",
                "hostelStudent": "false",
                "bloodGroup": "O+",
                "emergencyContact": "0987654321",
                "remarks": "",
                "yearOfJoining": 2025,
                "registrationNumber": "2025EL0001"
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