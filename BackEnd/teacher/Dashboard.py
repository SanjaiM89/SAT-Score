from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from bson import ObjectId
from database import StudentDB, SubjectDB, TeacherDB, DepartmentDB
from dependencies import get_student_db, get_subject_db, get_teacher_db, get_department_db, get_current_user
import logging
from datetime import date, timedelta

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

class Schedule(BaseModel):
    day: str
    time: str
    room: str

class AssignedClass(BaseModel):
    id: str
    name: str
    subject: str
    subject_id: str
    department: str
    semester: int
    students: int
    batch: str
    section: str
    schedule: List[Schedule]

class PendingTask(BaseModel):
    task_type: str
    class_name: str
    subject: str
    due_date: str

class DashboardStats(BaseModel):
    title: str
    value: str
    icon: str
    color: str

class DashboardResponse(BaseModel):
    classes: List[AssignedClass]
    stats: List[DashboardStats]
    pending_tasks: List[PendingTask]

def is_valid_object_id(oid: str) -> bool:
    """Check if the string is a valid MongoDB ObjectId."""
    try:
        ObjectId(oid)
        return True
    except Exception:
        return False

def sanitize_value(value: Any) -> Any:
    """Recursively convert ObjectId to string and handle nested structures."""
    if isinstance(value, ObjectId):
        return str(value)
    elif isinstance(value, list):
        return [sanitize_value(item) for item in value]
    elif isinstance(value, dict):
        return {key: sanitize_value(val) for key, val in value.items()}
    elif isinstance(value, (int, float, str, bool)) or value is None:
        return value
    else:
        logger.warning(f"Unexpected type in sanitize_value: {type(value)}")
        return str(value)

@router.get("/teacher/dashboard", response_model=DashboardResponse)
async def get_teacher_dashboard(
    user: dict = Depends(get_current_user),
    teacher_db: TeacherDB = Depends(get_teacher_db),
    student_db: StudentDB = Depends(get_student_db),
    subject_db: SubjectDB = Depends(get_subject_db),
    department_db: DepartmentDB = Depends(get_department_db)
):
    try:
        # Validate teacher
        if user.get("role") != "teacher":
            raise HTTPException(status_code=403, detail="Only teachers can access the dashboard")
        teacher_id = user.get("id")
        if not is_valid_object_id(teacher_id):
            raise HTTPException(status_code=400, detail="Invalid teacher ID format")

        # Fetch teacher data
        teacher = await teacher_db.collection.find_one({"_id": ObjectId(teacher_id)})
        if not teacher:
            raise HTTPException(status_code=404, detail="Teacher not found")
        teacher = sanitize_value(teacher)

        # Initialize response data
        assigned_classes = []
        total_students = 0
        subject_ids = set()
        pending_marks = 0
        pending_tasks = []

        # Fetch department
        dept_id = teacher.get("department")
        department = await department_db.collection.find_one({"_id": ObjectId(dept_id)})
        if not department:
            raise HTTPException(status_code=404, detail=f"Department {dept_id} not found")
        department = sanitize_value(department)
        dept_name = department.get("name", "Unknown")
        dept_short = "".join(word[0].upper() for word in dept_name.split())  # e.g., "Computer Science" -> "CS"

        # Process subjects handled
        for subject_handled in teacher.get("subjectsHandled", []):
            try:
                subject_id = subject_handled.get("subject_id")
                batch = subject_handled.get("batch", "Unknown")
                section = subject_handled.get("section", "A")

                # Fetch subject
                subject = await subject_db.collection.find_one({"_id": ObjectId(subject_id)})
                if not subject:
                    logger.warning(f"Subject {subject_id} not found")
                    continue
                subject = sanitize_value(subject)
                subject_name = subject.get("name", "Unknown")

                # Derive class name (e.g., "CS-A")
                class_name = f"{dept_short}-{section}"

                # Estimate semester (query students for yearOfStudy)
                students_in_class = await student_db.collection.find({
                    "courses": ObjectId(subject_id),
                    "department": ObjectId(dept_id),
                    "academic_year": {"$regex": f"^{batch}"}
                }).to_list(length=None)
                student_count = len(students_in_class)
                semester = 3  # Default
                if students_in_class:
                    years = [int(s.get("yearOfStudy", 1)) for s in students_in_class]
                    avg_year = sum(years) / len(years)
                    semester = min(8, max(1, int(avg_year * 2)))  # Year 2 -> Semester 3 or 4

                # Placeholder schedule (since not in schema)
                schedule = [
                    {"day": "Monday", "time": "9:00 AM - 10:30 AM", "room": f"{dept_short}-301"},
                    {"day": "Wednesday", "time": "11:00 AM - 12:30 PM", "room": f"{dept_short}-301"}
                ]

                # Build class data
                class_id = str(ObjectId())  # Generate unique ID since class_id not provided
                assigned_classes.append(AssignedClass(
                    id=class_id,
                    name=class_name,
                    subject=subject_name,
                    subject_id=subject_id,
                    department=dept_name,
                    semester=semester,
                    students=student_count,
                    batch=batch,
                    section=section,
                    schedule=[Schedule(**sch) for sch in schedule]
                ))

                total_students += student_count
                subject_ids.add(subject_id)

                # Check pending marks
                unsubmitted_marks = await student_db.collection.count_documents({
                    "courses": ObjectId(subject_id),
                    "department": ObjectId(dept_id),
                    "$or": [
                        {f"internal_marks.{subject_id}.isSubmitted": {"$ne": True}},
                        {f"sat_marks.{subject_id}.isSubmitted": {"$ne": True}}
                    ]
                })
                if unsubmitted_marks > 0:
                    pending_marks += unsubmitted_marks
                    # Add pending task
                    pending_tasks.append(PendingTask(
                        task_type="Marks Entry",
                        class_name=class_name,
                        subject=subject_name,
                        due_date=(date.today() + timedelta(days=2)).isoformat()
                    ))

            except Exception as e:
                logger.error(f"Error processing subject {subject_id}: {str(e)}")
                continue

        # Build stats
        stats = [
            DashboardStats(
                title="Assigned Classes",
                value=str(len(assigned_classes)),
                icon="Users",
                color="bg-blue-500"
            ),
            DashboardStats(
                title="Total Students",
                value=str(total_students),
                icon="GraduationCap",
                color="bg-green-500"
            ),
            DashboardStats(
                title="Subjects",
                value=str(len(subject_ids)),
                icon="BookOpen",
                color="bg-purple-500"
            ),
            DashboardStats(
                title="Pending Marks",
                value=str(pending_marks),
                icon="ClipboardCheck",
                color="bg-orange-500"
            )
        ]

        # Return response
        response = DashboardResponse(
            classes=assigned_classes,
            stats=stats,
            pending_tasks=pending_tasks
        )
        logger.info(f"Returning dashboard data for teacher {teacher_id}: {len(assigned_classes)} classes, {len(pending_tasks)} tasks")
        return response

    except HTTPException as e:
        logger.error(f"HTTP Exception in get_teacher_dashboard: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error in get_teacher_dashboard: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch dashboard data: {str(e)}")