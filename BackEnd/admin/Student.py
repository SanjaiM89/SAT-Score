from fastapi import APIRouter, HTTPException, UploadFile, File, Form, Depends
from typing import List, Optional
from AddStudentModel import AddStudentModel, StudentDB
from dependencies import get_student_db
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

student_router = APIRouter()

async def generate_registration_number(db: StudentDB, department: str, students_count: int) -> str:
    dept_short_name = department.split(' ')[0]
    current_year = "2025"
    department_code = dept_short_name[:2].upper()
    sequence = str(students_count + 1).zfill(4)
    return f"{current_year}{department_code}{sequence}"

@student_router.post("/students", response_model=dict)
async def create_student(
    fullName: str = Form(...),
    dateOfBirth: str = Form(...),
    gender: str = Form(...),
    phoneNumber: str = Form(...),
    email: str = Form(...),
    parentName: str = Form(...),
    parentContact: str = Form(...),
    address: str = Form(...),
    city: str = Form(...),
    state: str = Form(...),
    postalCode: str = Form(...),
    department: str = Form(...),
    program: str = Form(...),
    yearOfStudy: str = Form(...),
    semester: str = Form(...),
    section: str = Form(...),
    admissionType: str = Form(...),
    scholarshipStatus: str = Form(...),
    hostelStudent: str = Form(...),
    bloodGroup: str = Form(...),
    emergencyContact: str = Form(...),
    remarks: Optional[str] = Form(None),
    profilePicture: UploadFile = File(None),
    student_db: StudentDB = Depends(get_student_db)
):
    try:
        # Create student data dictionary
        student_data = {
            "fullName": fullName,
            "dateOfBirth": dateOfBirth,
            "gender": gender,
            "phoneNumber": phoneNumber,
            "email": email,
            "parentName": parentName,
            "parentContact": parentContact,
            "address": address,
            "city": city,
            "state": state,
            "postalCode": postalCode,
            "department": department,
            "program": program,
            "yearOfStudy": yearOfStudy,
            "semester": semester,
            "section": section,
            "admissionType": admissionType,
            "scholarshipStatus": scholarshipStatus,
            "hostelStudent": hostelStudent,
            "bloodGroup": bloodGroup,
            "emergencyContact": emergencyContact,
            "remarks": remarks
        }
        logger.info(f"Received student data: {student_data}")
        
        # Validate with AddStudentModel
        student = AddStudentModel(**student_data)
        
        # Read file content
        file_content = await profilePicture.read() if profilePicture else None
        
        # Generate registration number
        students_count = await student_db.collection.count_documents({})
        registration_number = await generate_registration_number(student_db, student.department, students_count)
        
        # Create student in database
        result = await student_db.create_student(student, file_content, registration_number)
        logger.info(f"Student created with ID: {result.get('id')}")
        return result
    except Exception as e:
        logger.error(f"Error creating student: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to create student: {str(e)}")

@student_router.get("/students", response_model=List[dict])
async def get_students(student_db: StudentDB = Depends(get_student_db)):
    try:
        students = await student_db.get_students()
        logger.info(f"Retrieved {len(students)} students")
        return students
    except Exception as e:
        logger.error(f"Error retrieving students: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve students: {str(e)}")

@student_router.get("/students/{id}", response_model=dict)
async def get_student(id: str, student_db: StudentDB = Depends(get_student_db)):
    try:
        student = await student_db.get_student(id)
        if student:
            logger.info(f"Retrieved student with ID: {id}")
            return student
        else:
            logger.warning(f"Student with ID {id} not found")
            raise HTTPException(status_code=404, detail="Student not found")
    except Exception as e:
        logger.error(f"Error retrieving student {id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve student: {str(e)}")