from fastapi import APIRouter, HTTPException
from services.supabase_client import get_supabase
from config.settings import settings
from supabase import create_client
import uuid

router = APIRouter()


@router.post("/workers")
async def create_worker(body: dict):
    try:
        # Admin client needed to create auth users
        admin_client = create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

        email = body.get("contact")
        password = body.get("password")
        name = body.get("name")
        role = body.get("role", "worker")
        assigned_sector = body.get("assigned_sector", "")

        if not email or not password or not name:
            raise HTTPException(status_code=400, detail="name, contact (email), and password are required")

        # Create Supabase Auth user
        auth_response = admin_client.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })

        auth_user = auth_response.user
        if not auth_user:
            raise HTTPException(status_code=500, detail="Failed to create auth user")

        auth_id = str(auth_user.id)

        # Insert into users table
        supabase = get_supabase()
        user_result = supabase.table("users").insert({
            "auth_id": auth_id,
            "email": email,
            "name": name,
            "role": role,
        }).execute()

        user_row = user_result.data[0] if user_result.data else {}

        print(f"✅ Worker created: {email} auth_id={auth_id}")

        return {
            "worker": {
                "id": user_row.get("id"),
                "name": name,
                "role": role,
                "contact": email,
                "assigned_sector": assigned_sector,
                "login_id": auth_id,
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ERROR creating worker: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/workers")
async def list_workers():
    try:
        supabase = get_supabase()
        result = supabase.table("users").select("*").eq("role", "worker").execute()
        return {"workers": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))