import uuid

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from db.db import get_db
from models.user import User
from schemas.auth import (
    LoginRequest,
    TokenResponse,
    UserCreate,
    UserOut,
)
from security import (
    create_access_token,
    decode_token,
    hash_password,
    verify_password,
)

router = APIRouter(
    prefix="/api/v1/auth",
    tags=["auth"],
)


# This is still useful for Swagger's authentication mechanism.
oauth2_scheme = OAuth2PasswordBearer(
    tokenUrl="/api/v1/auth/login",
)


def _set_auth_cookie(
    response: Response,
    token: str,
) -> None:
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=False,  # True in production with HTTPS
        samesite="lax",
        max_age=30 * 60,
        path="/",
    )


@router.post(
    "/register",
    response_model=TokenResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    payload: UserCreate,
    response: Response,
    db: Session = Depends(get_db),
):
    avatar_url = "https://api.dicebear.com/10.x/moods/svg" f"?seed={uuid.uuid4()}"

    user = User(
        username=payload.username,
        email=payload.email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
        avatar_url=avatar_url,
    )

    db.add(user)

    try:
        db.commit()

    except IntegrityError:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this username or email already exists.",
        ) from None

    db.refresh(user)

    access_token = create_access_token(user.id)

    _set_auth_cookie(
        response,
        access_token,
    )

    return TokenResponse(
        user=UserOut.model_validate(user),
    )


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login(
    payload: LoginRequest,
    response: Response,
    db: Session = Depends(get_db),
):
    user = db.query(User).filter(User.email == payload.email).first()

    if user is None or not verify_password(
        payload.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated.",
        )

    access_token = create_access_token(user.id)

    _set_auth_cookie(
        response,
        access_token,
    )

    return TokenResponse(
        user=UserOut.model_validate(user),
    )


def get_current_user(
    access_token: str | None = Cookie(default=None),
    db: Session = Depends(get_db),
) -> User:

    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials.",
    )

    if access_token is None:
        raise credentials_error

    token_data = decode_token(access_token)

    if token_data is None or token_data.get("type") != "access":
        raise credentials_error

    try:
        user_id = uuid.UUID(token_data["sub"])

    except (KeyError, ValueError):
        raise credentials_error from None

    user = db.query(User).filter(User.id == user_id).first()

    if user is None or not user.is_active:
        raise credentials_error

    return user


@router.get(
    "/me",
    response_model=UserOut,
)
def read_current_user(
    current_user: User = Depends(get_current_user),
):
    return current_user


@router.post("/logout")
def logout(response: Response):

    response.delete_cookie(
        key="access_token",
        path="/",
    )

    return {"message": "Successfully logged out."}
