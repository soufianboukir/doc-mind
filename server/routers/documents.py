import uuid

from fastapi import (
    APIRouter,
    Depends,
    File,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from db.db import get_db
from models.chat import Chat
from models.document import Document, DocumentStatus
from models.user import User
from routers.auth import get_current_user
from schemas.document import DocumentOut, ChatDocumentsOut
from services.cloudinary_service import (
    delete_document as cloudinary_delete,
    upload_document,
)


router = APIRouter(
    prefix="/api/v1/chats",
    tags=["documents"],
)


@router.get(
    "/{chat_id}/documents",
    response_model=ChatDocumentsOut,
)
def get_documents(
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

    documents = (
        db.query(Document)
        .filter(
            Document.chat_id == chat_id,
            Document.user_id == current_user.id,
        )
        .order_by(Document.uploaded_at.desc())
        .all()
    )

    return ChatDocumentsOut(
        id=chat.id,
        title=chat.title,
        created_at=chat.created_at,
        updated_at=chat.updated_at,
        documents=documents,
    )


@router.post(
    "/{chat_id}/documents",
    response_model=list[DocumentOut],
    status_code=status.HTTP_201_CREATED,
)
async def upload_documents(
    chat_id: uuid.UUID,
    files: list[UploadFile] = File(...),
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

    if not files:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No files were provided.",
        )

    documents = []

    for file in files:

        if not file.filename:
            continue

        folder = (
            f"docmind/"
            f"{current_user.id}/"
            f"{chat_id}"
        )

        try:
            result = upload_document(
                file.file,
                folder=folder,
            )

            document = Document(
                id=uuid.uuid4(),
                chat_id=chat_id,
                user_id=current_user.id,
                filename=file.filename,

                # Store Cloudinary public_id here
                storage_path=result["public_id"],

                mime_type=file.content_type,
                file_size_bytes=None,
                status=DocumentStatus.PENDING,
            )

            db.add(document)
            documents.append(document)

        except Exception:
            db.rollback()

            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to upload {file.filename}.",
            ) from None

    if not documents:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid files were provided.",
        )

    db.commit()

    for document in documents:
        db.refresh(document)

    return documents


@router.delete(
    "/{chat_id}/documents/{document_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_document(
    chat_id: uuid.UUID,
    document_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    document = (
        db.query(Document)
        .filter(
            Document.id == document_id,
            Document.chat_id == chat_id,
            Document.user_id == current_user.id,
        )
        .first()
    )

    if document is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found.",
        )

    try:
        cloudinary_delete(
            document.storage_path
        )

    except Exception:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete document from storage.",
        ) from None

    db.delete(document)
    db.commit()

    return None