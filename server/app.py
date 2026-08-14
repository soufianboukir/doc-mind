from fastapi import FastAPI

from routers.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from routers.chat import router as chats_router
from routers.documents import router as documents_router

app = FastAPI(title="DocMind API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # your frontend's exact origin(s)
    allow_credentials=True,  # required for the httpOnly cookie to be sent/received
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth_router)
app.include_router(chats_router)
app.include_router(documents_router)

@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}
