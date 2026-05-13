from fastapi import APIRouter, HTTPException
from services.supabase_client import get_supabase

router = APIRouter()


@router.get("/tasks")
async def list_tasks():
    supabase = get_supabase()
    result = (
        supabase.table("tasks")
        .select("*, fields(id, name, crop_type)")
        .order("created_at", desc=True)
        .execute()
    )
    tasks = result.data or []
    for task in tasks:
        if task.get("fields"):
            task["field_name"] = task["fields"].get("name")
            task["crop_type"] = task["fields"].get("crop_type")
    return {"tasks": tasks}


@router.patch("/tasks/{task_id}")
async def update_task_status(task_id: str, body: dict):
    try:
        tid = int(task_id)
        supabase = get_supabase()
        result = (
            supabase.table("tasks")
            .update({"status": body["status"]})
            .eq("id", tid)
            .execute()
        )
        return {"task": result.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))