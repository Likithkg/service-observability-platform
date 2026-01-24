import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import os

# -------------------------------------------------
# Load environment variables
# -------------------------------------------------
load_dotenv()

# -------------------------------------------------
# Database
# -------------------------------------------------
from database.database import engine
from database.models import Base

# -------------------------------------------------
# Routers
# -------------------------------------------------
from auth.route import router as auth_router
from applications.route import router as application_router

# -------------------------------------------------
# App
# -------------------------------------------------
app = FastAPI(
    title="Cloud Monitor Service",
    version="1.0.0"
)

# -------------------------------------------------
# CORS - Allow frontend to communicate with backend
# -------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------------------------------
# Database startup
# -------------------------------------------------
@app.on_event("startup")
def startup():
    Base.metadata.create_all(bind=engine)
    print("Database ready")
    print("Server running on http://localhost:8000")
    print("API Docs available at http://localhost:8000/docs")

# -------------------------------------------------
# API Routers
# -------------------------------------------------
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(application_router, prefix="/applications", tags=["Applications"])

# -------------------------------------------------
# Health Check
# -------------------------------------------------
@app.get("/health")
def health():
    return {"status": "ok", "message": "Server is running"}

# -------------------------------------------------
# Root endpoint
# -------------------------------------------------
@app.get("/")
def root():
    return {
        "message": "Cloud Monitor API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# -------------------------------------------------
# Entry point
# -------------------------------------------------
if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )