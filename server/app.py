from fastapi import FastAPI

from routers.auth import router as auth_router

app = FastAPI(title="DocMind API", version="0.1.0")

app.include_router(auth_router)


@app.get("/health", tags=["health"])
def health_check():
    return {"status": "ok"}