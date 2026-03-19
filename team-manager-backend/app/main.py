from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import Base, engine
from app.routers import auth, team, holidays, egypt_duty, history, notifications, dashboard, exports

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Team Manager API", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Include routers
app.include_router(auth.router)
app.include_router(team.router)
app.include_router(holidays.router)
app.include_router(egypt_duty.router)
app.include_router(history.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)
app.include_router(exports.router)


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}
