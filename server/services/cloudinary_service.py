import cloudinary
import cloudinary.uploader

from config.config import settings


cloudinary.config(
    cloud_name=settings.cloudinary_cloud_name,
    api_key=settings.cloudinary_api_key,
    api_secret=settings.cloudinary_api_secret,
    secure=True,
)


def upload_document(
    file,
    folder: str,
):
    result = cloudinary.uploader.upload(
        file,
        folder=folder,
        resource_type="raw",
    )

    return {
        "public_id": result["public_id"],
        "secure_url": result["secure_url"],
    }


def delete_document(public_id: str):
    return cloudinary.uploader.destroy(
        public_id,
        resource_type="raw",
    )