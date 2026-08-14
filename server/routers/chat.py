import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from db.db import get_db
from models.user import User
from models.chat import Chat
from schemas.chat import ChatCreate, ChatOut, ChatUpdate
from routers.auth import get_current_user

router = APIRouter(
    prefix="/api/v1/chats",
    tags=["chats"],
)


@router.post(
    "",
    response_model=ChatOut,
    status_code=status.HTTP_201_CREATED,
)
def create_chat(
    payload: ChatCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = Chat(
        user_id=current_user.id,
        title=payload.title,
    )

    db.add(chat)
    db.commit()
    db.refresh(chat)

    return chat


@router.get(
    "",
    response_model=list[ChatOut],
)
def get_chats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chats = (
        db.query(Chat)
        .filter(Chat.user_id == current_user.id)
        .order_by(Chat.updated_at.desc())
        .all()
    )

    return chats


@router.get(
    "/{chat_id}",
    response_model=ChatOut,
)
def get_chat(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = (
        db.query(Chat)
        .filter(
            Chat.id == chat_id,
            Chat.user_id == current_user.id,
        )
        .first()
    )

    if chat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )

    return chat


@router.patch(
    "/{chat_id}",
    response_model=ChatOut,
)
def update_chat(
    chat_id: uuid.UUID,
    payload: ChatUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = (
        db.query(Chat)
        .filter(
            Chat.id == chat_id,
            Chat.user_id == current_user.id,
        )
        .first()
    )

    if chat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )

    chat.title = payload.title

    db.commit()
    db.refresh(chat)

    return chat


@router.delete(
    "/{chat_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_chat(
    chat_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    chat = (
        db.query(Chat)
        .filter(
            Chat.id == chat_id,
            Chat.user_id == current_user.id,
        )
        .first()
    )

    if chat is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Chat not found.",
        )

    db.delete(chat)
    db.commit()

    return None
