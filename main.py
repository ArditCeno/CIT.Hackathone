from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import database
from api.endpoints import router
from models.behaviour_profile import profile_manager

app = FastAPI(
    title="Fraud Detection API",
    description="Real-time fraud detection system for hackathon",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.on_event("startup")
def startup():
    database.init_db()
    profile_manager.load_all()


@app.get("/")
def root():
    return {
        "service": "Fraud Detection API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": [
            "POST /api/events/login",
            "POST /api/events/transaction",
            "GET  /api/dashboard/events",
            "GET  /api/dashboard/event/{event_id}",
            "GET  /api/dashboard/profiles",
            "GET  /api/dashboard/stats",
            "GET  /api/dashboard/profile/{client_id}",
        ],
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
