import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from sqlalchemy import text
from contextlib import asynccontextmanager

load_dotenv()

from database.database import engine
from database.base import Base
from auth.route import router as auth_router
from applications.route import router as application_router
from metrics.route import router as metrics_router
from realtime.aws_poller import start_poller_thread

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup (sync SQLAlchemy engine)
    with engine.connect() as conn:
        conn.execute(text("CREATE SCHEMA IF NOT EXISTS observability"))
        conn.commit()
    Base.metadata.create_all(bind=engine)
    print("Database ready")

    # Start background metrics poller
    start_poller_thread()
    print("Metrics poller started")

    print("\nServer running on http://localhost:8000")
    print("API Docs: http://localhost:8000/docs\n")

    yield
    # Shutdown (if needed)
    pass

app = FastAPI(
    title="Cloud Monitor Service",
    version="1.0.0",
    lifespan=lifespan,
    redirect_slashes=False
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://service-observability-platform.vercel.app",
    ],
    allow_origin_regex=r"https://service-observability-platform(-[a-z0-9]+)?\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(application_router, prefix="/applications", tags=["Applications"])
app.include_router(metrics_router, prefix="/metrics", tags=["Metrics"])

@app.get("/health")
def health():
    return {"status": "ok", "message": "Server is running"}

@app.get("/")
def root():
    return {
        "message": "Cloud Monitor API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health"
    }

# if __name__ == "__main__":
#     uvicorn.run(
#         "main:app",
#         host="0.0.0.0",
#         port=8000,
#         reload=True
#     )
