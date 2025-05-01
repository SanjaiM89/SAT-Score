from fastapi import Depends
from AddStudentModel import StudentDB
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Placeholder for FastAPI app, to be set in main.py
app = None

def get_student_db() -> StudentDB:
    logger.info("Providing StudentDB instance")
    if not hasattr(app, 'student_db'):
        logger.error("StudentDB not initialized in app")
        raise ValueError("StudentDB not initialized")
    return app.student_db