from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager

from routers.tasks import router as tasks_router
from routers.recommend import router as recommend_router
from routers.activities import router as activities_router
from routers.notifications import router as notifications_router
from routers.workers import router as workers_router
from routers.fields import router as fields_router

from config.settings import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 FarmFlow Backend Starting...")
    yield
    print("🛑 FarmFlow Backend Shutting Down...")


app = FastAPI(
    title="FarmFlow API",
    description="Agricultural Decision Support System - Farm to Feed Kenya",
    version="1.0.0",
    lifespan=lifespan
)

# ====================== CORS ======================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ====================== Routers ======================
app.include_router(recommend_router, prefix="/api", tags=["Recommendations"])
app.include_router(tasks_router, prefix="/api", tags=["Tasks"])
app.include_router(activities_router, prefix="/api", tags=["Activities"])
app.include_router(notifications_router, prefix="/api", tags=["Notifications"])
app.include_router(workers_router, prefix="/api", tags=["Workers"])
app.include_router(fields_router, prefix="/api", tags=["Fields"])

# catch-all route
@app.options("/api/{path:path}")
async def options_handler(path: str):
    return {"message": "OK"}

# ====================== Global Error Handler ======================
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"❌ Global Error: {type(exc).__name__}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "detail": "Internal Server Error",
            "error_type": type(exc).__name__,
            "message": str(exc)
        }
    )


@app.get("/")
async def root():
    return {
        "message": "🚀 FarmFlow Backend is running!",
        "docs": "/docs",
        "health": "/health",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "version": "1.0.0",
        "project": "FarmFlow - Farm to Feed Kenya"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
