# routers/workers.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
from services.supabase_client import get_supabase_admin

router = APIRouter(prefix="/workers", tags=["workers"])


class WorkerCreate(BaseModel):
    name: str
    role: str
    contact: EmailStr
    assigned_sector: str
    password: str


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_worker(body: WorkerCreate):
    try:
        supabase = get_supabase_admin()   # Must use admin client for auth

        result = supabase.auth.admin.create_user({
            "email": body.contact,
            "password": body.password,
            "email_confirm": True,
            "user_metadata": {
                "name": body.name,
                "role": body.role,
                "assigned_sector": body.assigned_sector,
                "user_type": "worker",
            },
            "app_metadata": {"role": "worker"}
        })

        user = result.user

        # Optional: Insert into public.workers table (remove if you don't have the table yet)
        worker_data = {
            "id": user.id,
            "name": body.name,
            "email": body.contact,
            "role": body.role,
            "assigned_sector": body.assigned_sector,
        }
        supabase.table("workers").insert(worker_data).execute()

        return {
            "worker": {
                "id": user.id,
                "name": body.name,
                "role": body.role,
                "contact": body.contact,
                "assigned_sector": body.assigned_sector,
                "login_id": body.contact,
            }
        }

    except Exception as e:
        print(f"❌ Worker creation error: {e}")
        raise HTTPException(status_code=400, detail=str(e))