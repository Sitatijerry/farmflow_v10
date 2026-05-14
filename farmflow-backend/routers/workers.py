from typing import Optional
from fastapi import APIRouter, HTTPException
from services.supabase_client import get_supabase, get_supabase_admin

router = APIRouter()

# ──────────────────────────────────────────
# POST /api/workers   (create worker)
# ──────────────────────────────────────────
@router.post("/workers")
async def create_worker(body: dict):
    try:
        admin_client = get_supabase_admin()
        supabase = get_supabase()

        email = body.get("contact")
        password = body.get("password")
        name = body.get("name")
        role = body.get("role", "worker")
        assigned_sector = body.get("assigned_sector", "")

        if not email or not password or not name:
            raise HTTPException(status_code=400, detail="name, contact (email), and password are required")

        # 1) Create Supabase Auth user (UUID)
        auth_response = admin_client.auth.admin.create_user({
            "email": email,
            "password": password,
            "email_confirm": True
        })

        auth_user = auth_response.user
        if not auth_user:
            raise HTTPException(status_code=500, detail="Failed to create auth user")

        auth_id = str(auth_user.id)

        # 2) Ensure public.users row exists (numeric id needed for FKs)
        #    If your DB sequence is stuck, this will fail with:
        #    "Key (id)=(1) already exists"
        #    Fix: run the SQL at the bottom of this file in Supabase SQL Editor.
        existing = supabase.table("users").select("id,auth_id").eq("auth_id", auth_id).limit(1).execute()
        existing_data = getattr(existing, "data", None) or (existing.get("data") if isinstance(existing, dict) else None)

        if existing_data and len(existing_data) > 0:
            user_row = existing_data[0]
        else:
            insert = supabase.table("users").insert({
                "auth_id": auth_id,
                "email": email,
                "name": name,
                "role": role,
            }).execute()
            insert_data = getattr(insert, "data", None) or (insert.get("data") if isinstance(insert, dict) else None)
            if not insert_data:
                raise HTTPException(status_code=500, detail="Failed to insert into public.users")
            user_row = insert_data[0]

        print(f"✅ Worker created: {email} auth_id={auth_id} numeric_id={user_row.get('id')}")

        return {
            "worker": {
                "id": str(user_row.get("id", "")),
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
        err_msg = str(e)
        print(f"❌ ERROR creating worker: {err_msg}")
        # Surface the sequence-conflict hint if we detect it
        if "already exists" in err_msg and "Key (id)" in err_msg:
            raise HTTPException(
                status_code=500,
                detail="DB sequence conflict on users.id. Run: SELECT setval('users_id_seq', (SELECT MAX(id) FROM users)); in Supabase SQL Editor, then retry."
            )
        raise HTTPException(status_code=500, detail=err_msg)


# ──────────────────────────────────────────
# GET /api/workers?farm_id=1   (list workers)
# ──────────────────────────────────────────
@router.get("/workers")
async def list_workers(farm_id: str = None):
    try:
        supabase = get_supabase()
        result = supabase.table("users").select("id, name, role, email").execute()
        workers = result.data or []
        # Map to expected frontend shape
        mapped = [
            {
                "id": str(w["id"]),
                "name": w.get("name") or w.get("email", "Worker"),
                "role": w.get("role", "worker"),
                "contact": w.get("email", ""),
                "assigned_sector": "",
                "login_id": str(w["id"]),
            }
            for w in workers
        ]
        return {"workers": mapped}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))