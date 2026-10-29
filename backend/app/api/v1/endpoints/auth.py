import re
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.core.config import settings
from app.core.database import get_db
from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, StudentProfile
from app.schemas.auth import (
    UserRegisterRequest,
    UserPublic,
    LoginRequest,
    TokenResponse,
)
from app.api.deps import get_current_active_user

router = APIRouter()


def compute_initials(name: str) -> str:
    """
    Computes 2-letter uppercase initials from student name.
    e.g., 'Nayan Kalita' -> 'NK'
    """
    parts = [p for p in name.strip().split() if p]
    if not parts:
        return "ST"
    if len(parts) == 1:
        return parts[0][:2].upper()
    return (parts[0][0] + parts[-1][0]).upper()


def generate_default_handle(full_name: str, db: Session) -> str:
    """
    Generates a unique handle from student name if none was supplied.
    """
    base = re.sub(r"[^a-zA-Z0-9]", "", full_name.lower())
    if not base:
        base = "student"
    candidate = f"@{base}"

    existing = db.query(StudentProfile).filter(StudentProfile.handle == candidate).first()
    if not existing:
        return candidate

    # Append random suffix if candidate exists
    suffix = str(uuid.uuid4())[:4]
    return f"@{base}_{suffix}"


def authenticate_user(email: str, password: str, db: Session) -> User:
    """
    Validates user credentials against stored Argon2 password hash.
    """
    normalized_email = email.strip().lower()
    user = db.query(User).filter(User.email == normalized_email).first()

    if not user or not user.hashed_password:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive.",
        )

    return user


@router.post(
    "/register",
    response_model=UserPublic,
    status_code=status.HTTP_201_CREATED,
    summary="Register a new student account",
    description="Creates a new User and associated StudentProfile in a single transactional step.",
)
def register(
    register_data: UserRegisterRequest,
    db: Session = Depends(get_db),
) -> User:
    # 1. Check for duplicate email
    existing_user = db.query(User).filter(User.email == register_data.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists.",
        )

    # 2. Determine and validate handle
    if register_data.handle:
        handle = register_data.handle
        existing_handle = db.query(StudentProfile).filter(StudentProfile.handle == handle).first()
        if existing_handle:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Username handle '{handle}' is already taken.",
            )
    else:
        handle = generate_default_handle(register_data.full_name, db)

    # 3. Compute initials & academic year title fallback
    initials = compute_initials(register_data.full_name)
    academic_year_title = (
        register_data.academic_year_title
        or f"Class of {register_data.graduation_year}"
    )

    # 4. Hash password with Argon2id
    hashed_pwd = hash_password(register_data.password)

    # 5. Create User and StudentProfile atomically
    new_user = User(
        email=register_data.email,
        hashed_password=hashed_pwd,
        role="student",
        is_active=True,
        is_verified=False,
    )
    db.add(new_user)
    db.flush()  # Populates new_user.id

    student_profile = StudentProfile(
        user_id=new_user.id,
        full_name=register_data.full_name,
        handle=handle,
        initials=initials,
        university=register_data.university or "National Institute of Technology",
        department_major=register_data.department_major,
        graduation_year=register_data.graduation_year,
        academic_year_title=academic_year_title,
        bio=register_data.bio,
        skills=register_data.skills or [],
        interests=register_data.interests or [],
    )
    db.add(student_profile)

    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email or username already exists.",
        )

    db.refresh(new_user)
    return new_user


@router.post(
    "/login",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with OAuth2 Form Data",
    description="OAuth2 standard login endpoint compatible with Swagger UI's Authorize dialog (username=email).",
)
def login_form(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = authenticate_user(
        email=form_data.username,
        password=form_data.password,
        db=db,
    )

    token = create_access_token(subject=user.id)
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in_seconds,
        user=user,
    )


@router.post(
    "/login/json",
    response_model=TokenResponse,
    status_code=status.HTTP_200_OK,
    summary="Login with JSON body",
    description="Alternative login endpoint accepting application/json payload with email and password.",
)
def login_json(
    payload: LoginRequest,
    db: Session = Depends(get_db),
) -> TokenResponse:
    user = authenticate_user(
        email=payload.email,
        password=payload.password,
        db=db,
    )

    token = create_access_token(subject=user.id)
    expires_in_seconds = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60

    return TokenResponse(
        access_token=token,
        token_type="bearer",
        expires_in=expires_in_seconds,
        user=user,
    )


@router.get(
    "/me",
    response_model=UserPublic,
    status_code=status.HTTP_200_OK,
    summary="Get current authenticated user profile",
    description="Returns public profile and account details for the bearer token subject.",
)
def get_current_user_profile(
    current_user: User = Depends(get_current_active_user),
) -> User:
    return current_user
