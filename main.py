from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database
from api.endpoints import router as events_router
from api.auth import router as auth_router
from models.behaviour_profile import profile_manager

app = FastAPI(
    title="GuardianAI API",
    description="Real-time fraud detection and banking demo",
    version="2.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(events_router)


@app.on_event("startup")
def startup():
    database.init_db()
    profile_manager.load_all()


@app.get("/")
def root():
    return {
        "service": "GuardianAI API",
        "version": "2.0.0",
        "status": "running",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
