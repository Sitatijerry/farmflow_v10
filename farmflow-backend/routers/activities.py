from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.supabase_client import get_supabase
from datetime import datetime

router = APIRouter()


class ActivityCreate(BaseModel):
    farm_id: int | None = None
    field_id: int
    worker_id: int | None = None
    task_id: int | None = None
    activity_type: str
    description: str = ""
    duration_minutes: int = 0
    location: str | None = None


@router.post("/activities")
async def log_activity(body: ActivityCreate):
    try:
        supabase = get_supabase()

        activity = {
            "farm_id": body.farm_id,
            "field_id": body.field_id,
            "worker_id": body.worker_id,
            "task_id": body.task_id,
            "activity_type": body.activity_type,
            "description": body.description,
            "duration_minutes": body.duration_minutes,
            "location": body.location,
            "created_at": datetime.utcnow().isoformat()
        }

        result = (
            supabase.table("activities")
            .insert(activity)
            .execute()
        )

        print("✅ Activity logged successfully")

        return {"activity": result.data[0]}

    except Exception as e:
        print(f"❌ ERROR logging activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/activities")
async def list_activities():
    try:
        supabase = get_supabase()

        result = (
            supabase.table("activities")
            .select("""
                *,
                fields (
                    id,
                    name,
                    crop_type
                )
            """)
            .order("created_at", desc=True)
            .execute()
        )

        activities = result.data or []

        # Frontend compatibility layer
        for activity in activities:
            activity["notes"] = activity.get("description")
            activity["hours_logged"] = (
                activity.get("duration_minutes", 0) / 60
            )

            if activity.get("fields"):
                activity["field_name"] = activity["fields"].get("name")

        print(f"✅ Activities fetched: {len(activities)}")

        return {"activities": activities}

    except Exception as e:
        print(f"❌ ERROR fetching activities: {e}")
        raise HTTPException(status_code=500, detail=str(e))