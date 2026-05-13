from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.supabase_client import get_supabase

router = APIRouter()


class TaskStatusUpdate(BaseModel):
    status: str


@router.get("/tasks")
async def list_tasks():
    try:
        supabase = get_supabase()

        # Fetch tasks with related field info
        result = supabase.table("tasks").select("""
            *,
            fields (
                id,
                name,
                crop_type
            )
        """).execute()

        tasks = result.data or []

        # Optional frontend compatibility cleanup
        for task in tasks:
            if task.get("fields"):
                task["field_name"] = task["fields"].get("name")
                task["crop_type"] = task["fields"].get("crop_type")

        print(f"✅ Tasks fetched: {len(tasks)} records")

        return {"tasks": tasks}

    except Exception as e:
        print(f"❌ ERROR in list_tasks: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/tasks/{task_id}")
async def update_task_status(task_id: str, body: TaskStatusUpdate):
    try:
        supabase = get_supabase()

        result = (
            supabase.table("tasks")
            .update({"status": body.status})
            .eq("id", task_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Task not found")

        print(f"✅ Task {task_id} updated to {body.status}")

        return {"task": result.data[0]}

    except Exception as e:
        print(f"❌ ERROR updating task {task_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))
