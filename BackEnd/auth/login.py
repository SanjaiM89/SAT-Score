from fastapi import APIRouter, Depends, HTTPException, status, Response
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from database import TeacherDB, StudentDB
from dependencies import get_teacher_db, get_student_db, get_session_id, get_current_user, oauth2_scheme
import logging
from datetime import datetime, timedelta
import pymongo
import jwt
import bcrypt
from dotenv import load_dotenv
import os
import uuid

# Load environment variables
load_dotenv()

# JWT configuration
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 15))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", 7))

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

router = APIRouter()

class LoginRequest(BaseModel):
    role: str = Field(..., pattern="^(admin|teacher|student)$")
    email: Optional[str] = None
    teacherId: Optional[str] = None
    teacherName: Optional[str] = None
    studentId: Optional[str] = None
    password: str

class ChangePasswordRequest(BaseModel):
    role: str = Field(..., pattern="^(teacher|student)$")
    id: str
    newPassword: str = Field(..., min_length=6)

class LoginResponse(BaseModel):
    role: str
    id: str
    fullName: Optional[str] = None
    email: Optional[str] = None
    requiresPasswordChange: bool = False
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    session_id: str

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, stored_password: str) -> bool:
    if stored_password.startswith('$2b$'):
        return bcrypt.checkpw(plain_password.encode('utf-8'), stored_password.encode('utf-8'))
    return plain_password == stored_password

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def store_refresh_token(teacher_db: TeacherDB, user_id: str, role: str, refresh_token: str):
    logger.debug(f"Storing refresh token for user_id={user_id}, role={role}")
    await teacher_db.collection.database["refresh_tokens"].update_one(
        {"user_id": user_id, "role": role},
        {
            "$set": {
                "refresh_token": refresh_token,
                "created_at": datetime.utcnow(),
                "expires_at": datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
            }
        },
        upsert=True
    )

async def store_session_id(teacher_db: TeacherDB, student_db: StudentDB, user_id: str, role: str, session_id: str):
    logger.debug(f"Storing session_id for user_id={user_id}, role={role}")
    if role == "teacher":
        await teacher_db.collection.update_one(
            {"teacherId": user_id},
            {
                "$set": {
                    "session_id": session_id,
                    "session_created_at": datetime.utcnow()
                }
            }
        )
    elif role == "student":
        await student_db.collection.update_one(
            {"registrationNumber": user_id},
            {
                "$set": {
                    "session_id": session_id,
                    "session_created_at": datetime.utcnow()
                }
            }
        )

async def validate_refresh_token(teacher_db: TeacherDB, refresh_token: str):
    logger.debug(f"Validating refresh token: {refresh_token[:20]}...")
    try:
        payload = jwt.decode(refresh_token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            logger.warning("Invalid token type")
            raise HTTPException(status_code=401, detail="Invalid token type")
        user_id = payload.get("id")
        role = payload.get("role")
        if not user_id or not role:
            logger.warning("Missing user_id or role in token")
            raise HTTPException(status_code=401, detail="Invalid token")
        token_data = await teacher_db.collection.database["refresh_tokens"].find_one({
            "user_id": user_id,
            "role": role,
            "refresh_token": refresh_token,
            "expires_at": {"$gt": datetime.utcnow()}
        })
        if not token_data:
            logger.warning(f"Refresh token not found or expired for user_id={user_id}, role={role}")
            raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        return {"user_id": user_id, "role": role}
    except jwt.ExpiredSignatureError:
        logger.warning("Refresh token expired")
        raise HTTPException(status_code=401, detail="Refresh token expired")
    except jwt.PyJWTError as e:
        logger.error(f"JWT decode error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/login")
async def login(
    response: Response,
    login_data: LoginRequest,
    teacher_db: TeacherDB = Depends(get_teacher_db),
    student_db: StudentDB = Depends(get_student_db)
):
    logger.debug(f"Login attempt: role={login_data.role}, data={login_data.dict()}")
    try:
        session_id = str(uuid.uuid4())
        if login_data.role == "admin":
            stored_hashed_password = hash_password("123456")
            if login_data.email != "admin@gmail.com" or not verify_password(login_data.password, stored_hashed_password):
                logger.warning(f"Invalid admin credentials: email={login_data.email}")
                raise HTTPException(status_code=401, detail="Invalid email or password")
            access_token = create_access_token(data={"role": "admin", "id": "admin"})
            refresh_token = create_refresh_token(data={"role": "admin", "id": "admin"})
            await store_refresh_token(teacher_db, "admin", "admin", refresh_token)
            response_data = LoginResponse(
                role="admin",
                id="admin",
                email=login_data.email,
                requiresPasswordChange=False,
                access_token=access_token,
                refresh_token=refresh_token,
                session_id=session_id
            ).dict()
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
            )
            response.set_cookie(
                key="session_id",
                value=session_id,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
            logger.info(f"Successful admin login: email={login_data.email}")
            return response_data

        elif login_data.role == "teacher":
            if not login_data.teacherId or not login_data.teacherName:
                raise HTTPException(status_code=400, detail="Teacher ID and name are required")
            
            logger.debug(f"Querying teacher: teacherId='{login_data.teacherId.strip()}', fullName='{login_data.teacherName.strip()}'")
            teacher = await teacher_db.collection.find_one({
                "teacherId": login_data.teacherId.strip(),
                "fullName": login_data.teacherName.strip()
            })
            if not teacher:
                teachers = await teacher_db.collection.find({"teacherId": login_data.teacherId.strip()}).to_list(length=None)
                logger.warning(f"Teacher not found. Found teachers with teacherId='{login_data.teacherId.strip()}': {[t['fullName'] for t in teachers]}")
                raise HTTPException(status_code=401, detail="Invalid teacher ID or name")
            
            stored_password = teacher.get("password", "123456")
            requires_password_change = teacher.get("requiresPasswordChange", True)
            
            if not verify_password(login_data.password, stored_password):
                logger.warning(f"Invalid password for teacher: teacherId={login_data.teacherId}")
                raise HTTPException(status_code=401, detail="Invalid password")
            
            access_token = create_access_token(data={"role": "teacher", "id": login_data.teacherId})
            refresh_token = create_refresh_token(data={"role": "teacher", "id": login_data.teacherId})
            await store_refresh_token(teacher_db, login_data.teacherId, "teacher", refresh_token)
            await store_session_id(teacher_db, student_db, login_data.teacherId, "teacher", session_id)
            response_data = LoginResponse(
                role="teacher",
                id=login_data.teacherId,
                fullName=login_data.teacherName,
                requiresPasswordChange=requires_password_change,
                access_token=access_token,
                refresh_token=refresh_token,
                session_id=session_id
            ).dict()
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
            )
            response.set_cookie(
                key="session_id",
                value=session_id,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
            logger.info(f"Successful login for teacher: teacherId={login_data.teacherId}")
            return response_data

        elif login_data.role == "student":
            if not login_data.studentId:
                raise HTTPException(status_code=400, detail="Student ID is required")
            
            student = await student_db.collection.find_one({"registrationNumber": login_data.studentId.strip()})
            if not student:
                logger.warning(f"Student not found: registrationNumber={login_data.studentId}")
                raise HTTPException(status_code=401, detail="Invalid student ID")
            
            stored_password = student.get("password", "123456")
            requires_password_change = student.get("requiresPasswordChange", True)
            
            if not verify_password(login_data.password, stored_password):
                logger.warning(f"Invalid password for student: registrationNumber={login_data.studentId}")
                raise HTTPException(status_code=401, detail="Invalid password")
            
            access_token = create_access_token(data={"role": "student", "id": login_data.studentId})
            refresh_token = create_refresh_token(data={"role": "student", "id": login_data.studentId})
            await store_refresh_token(teacher_db, login_data.studentId, "student", refresh_token)
            await store_session_id(teacher_db, student_db, login_data.studentId, "student", session_id)
            response_data = LoginResponse(
                role="student",
                id=login_data.studentId,
                fullName=student.get("fullName", "Unknown"),
                requiresPasswordChange=requires_password_change,
                access_token=access_token,
                refresh_token=refresh_token,
                session_id=session_id
            ).dict()
            response.set_cookie(
                key="access_token",
                value=access_token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
            response.set_cookie(
                key="refresh_token",
                value=refresh_token,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
            )
            response.set_cookie(
                key="session_id",
                value=session_id,
                httponly=True,
                secure=False,
                samesite="lax",
                max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
            )
            logger.info(f"Successful login for student: registrationNumber={login_data.studentId}")
            return response_data

        else:
            raise HTTPException(status_code=400, detail="Invalid role")

    except HTTPException as e:
        logger.error(f"Login error: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during login: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/refresh")
async def refresh_token(
    response: Response,
    refresh_token: str = Depends(oauth2_scheme),
    teacher_db: TeacherDB = Depends(get_teacher_db),
    student_db: StudentDB = Depends(get_student_db)
):
    logger.debug(f"Refresh token request: token={refresh_token[:20]}...")
    try:
        token_data = await validate_refresh_token(teacher_db, refresh_token)
        user_id = token_data["user_id"]
        role = token_data["role"]
        session_id = str(uuid.uuid4())
        access_token = create_access_token(data={"role": role, "id": user_id})
        new_refresh_token = create_refresh_token(data={"role": role, "id": user_id})
        await store_refresh_token(teacher_db, user_id, role, new_refresh_token)
        await store_session_id(teacher_db, student_db, user_id, role, session_id)
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        response.set_cookie(
            key="refresh_token",
            value=new_refresh_token,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=REFRESH_TOKEN_EXPIRE_DAYS * 24 * 60 * 60
        )
        response.set_cookie(
            key="session_id",
            value=session_id,
            httponly=True,
            secure=False,
            samesite="lax",
            max_age=ACCESS_TOKEN_EXPIRE_MINUTES * 60
        )
        logger.info(f"Token refreshed for user: {user_id}, role: {role}")
        return {
            "access_token": access_token,
            "refresh_token": new_refresh_token,
            "session_id": session_id,
            "token_type": "bearer"
        }
    except HTTPException as e:
        logger.error(f"Refresh token error: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during token refresh: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.post("/change-password", response_model=Dict[str, str])
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: dict = Depends(get_current_user),
    teacher_db: TeacherDB = Depends(get_teacher_db),
    student_db: StudentDB = Depends(get_student_db)
):
    logger.debug(f"Change password request: role={password_data.role}, id={password_data.id}")
    try:
        if password_data.role != current_user["role"] or password_data.id != current_user["id"]:
            raise HTTPException(status_code=403, detail="Unauthorized action")
        hashed_password = hash_password(password_data.newPassword)
        if password_data.role == "teacher":
            teacher = await teacher_db.collection.find_one({"teacherId": password_data.id})
            if not teacher:
                logger.warning(f"Teacher not found: teacherId={password_data.id}")
                raise HTTPException(status_code=404, detail="Teacher not found")
            update_result = await teacher_db.collection.update_one(
                {"teacherId": password_data.id},
                {
                    "$set": {
                        "password": hashed_password,
                        "requiresPasswordChange": False,
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
            )
            if update_result.modified_count == 0 and update_result.matched_count == 0:
                logger.warning(f"Failed to update password for teacher: teacherId={password_data.id}")
                raise HTTPException(status_code=400, detail="Failed to update password")
            logger.info(f"Password changed for teacher: teacherId={password_data.id}")
            return {"status": "Password changed successfully"}
        elif password_data.role == "student":
            student = await student_db.collection.find_one({"registrationNumber": password_data.id})
            if not student:
                logger.warning(f"Student not found: registrationNumber={password_data.id}")
                raise HTTPException(status_code=404, detail="Student not found")
            update_result = await student_db.collection.update_one(
                {"registrationNumber": password_data.id},
                {
                    "$set": {
                        "password": hashed_password,
                        "requiresPasswordChange": False,
                        "updated_at": datetime.utcnow().isoformat()
                    }
                }
            )
            if update_result.modified_count == 0 and update_result.matched_count == 0:
                logger.warning(f"Failed to update password for student: registrationNumber={password_data.id}")
                raise HTTPException(status_code=400, detail="Failed to update password")
            logger.info(f"Password changed for student: registrationNumber={password_data.id}")
            return {"status": "Password changed successfully"}
        else:
            raise HTTPException(status_code=400, detail="Invalid role")
    except HTTPException as e:
        logger.error(f"Change password error: {e.detail}")
        raise e
    except Exception as e:
        logger.error(f"Unexpected error during password change: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Unexpected error: {str(e)}")

@router.post("/logout")
async def logout(
    response: Response,
    current_user: dict = Depends(get_current_user),
    teacher_db: TeacherDB = Depends(get_teacher_db),
    student_db: StudentDB = Depends(get_student_db)
):
    try:
        await teacher_db.collection.database["refresh_tokens"].delete_many({"user_id": current_user["id"], "role": current_user["role"]})
        if current_user["role"] == "teacher":
            await teacher_db.collection.update_one(
                {"teacherId": current_user["id"]},
                {"$unset": {"session_id": "", "session_created_at": ""}}
            )
        else:
            await student_db.collection.update_one(
                {"registrationNumber": current_user["id"]},
                {"$unset": {"session_id": "", "session_created_at": ""}}
            )
        response.delete_cookie("access_token")
        response.delete_cookie("refresh_token")
        response.delete_cookie("session_id")
        logger.info(f"User logged out: {current_user['id']}")
        return {"status": "Logged out successfully"}
    except Exception as e:
        logger.error(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to logout")

@router.get("/check-cookie")
async def check_cookie(
    session_id: str = Depends(get_session_id),
    teacher_db: TeacherDB = Depends(get_teacher_db)
):
    try:
        teacher = await teacher_db.collection.find_one({"session_id": session_id})
        if not teacher:
            logger.error(f"No teacher found for session_id: {session_id[:10]}...")
            raise HTTPException(status_code=403, detail="Invalid session")
        return {
            "message": "Valid session found",
            "session_id": session_id,
            "teacherId": teacher["teacherId"],
            "fullName": teacher["fullName"]
        }
    except HTTPException as e:
        raise e
    except Exception as e:
        logger.error(f"Check cookie error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return {
        "role": current_user["role"],
        "id": current_user["id"],
        "fullName": current_user.get("fullName", "Unknown")
    }