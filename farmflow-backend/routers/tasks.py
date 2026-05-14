from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import Optional
from services.supabase_client import get_supabase, get_supabase_admin
from datetime import datetime, date

router = APIRouter(tags=["tasks"])  # <-- NO prefix here

class TaskCreate(BaseModel):
    farm_id: int
    field_id: int
    assigned_to: int
    title: str
    description: Optional[str] = None
    priority: Optional[str] = "medium"
    due_date: Optional[date] = None

class TaskStatusUpdate(BaseModel):
    status: str

@router.get("/tasks")
async def list_tasks(assigned_to: Optional[str] = None):
    try:
        supabase = get_supabase()
        query = supabase.table("tasks").select("""
            *,
            fields (name),
            worker:users!assigned_to (name)
        """)

        if assigned_to:
            try:
                query = query.eq("assigned_to", int(assigned_to))
            except (ValueError, TypeError):
                raise HTTPException(status_code=400, detail="assigned_to must be an integer")

        result = query.order("created_at", desc=True).execute()

        tasks = []
        for t in result.data or []:
            flat = dict(t)
            flat["field_name"] = flat.get("fields", {}).get("name") if flat.get("fields") else None
            flat["worker_name"] = flat.get("worker", {}).get("name") if flat.get("worker") else None
            flat.pop("fields", None)
            flat.pop("worker", None)
            flat["id"] = str(flat.get("id", ""))
            flat["field_id"] = str(flat.get("field_id", ""))
            flat["farm_id"] = str(flat.get("farm_id", ""))
            flat["assigned_to"] = str(flat.get("assigned_to", ""))
            flat["assigned_by"] = str(flat.get("assigned_by", ""))
            tasks.append(flat)

        return {"tasks": tasks}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tasks", status_code=status.HTTP_201_CREATED)
async def create_task(body: TaskCreate):
    try:
        supabase = get_supabase_admin()

        farm_res = supabase.table("farms").select("manager_id").eq("id", body.farm_id).limit(1).execute()
        farm_data = getattr(farm_res, "data", None) or (farm_res.get("data") if isinstance(farm_res, dict) else None)
        manager_id = farm_data[0].get("manager_id") if farm_data and len(farm_data) > 0 else body.assigned_to

        task_data = {
            "farm_id": body.farm_id,
            "field_id": body.field_id,
            "assigned_to": body.assigned_to,
            "assigned_by": manager_id,
            "title": body.title,
            "description": body.description,
            "priority": body.priority,
            "due_date": str(body.due_date) if body.due_date else None,
            "status": "pending"
        }

        result = supabase.table("tasks").insert(task_data).execute()
        insert_data = getattr(result, "data", None) or (result.get("data") if isinstance(result, dict) else None)

        if not insert_data:
            raise HTTPException(status_code=500, detail="Failed to create task")

        return {"task": insert_data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/tasks/{task_id}")
async def update_task_status(task_id: str, body: TaskStatusUpdate):
    try:
        int_task_id = int(task_id)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Invalid task_id; expected integer")

    try:
        supabase = get_supabase()
        update_data = {"status": body.status}

        if body.status == "done":
            update_data["completed_at"] = datetime.now().isoformat()

        result = (
            supabase.table("tasks")
            .update(update_data)
            .eq("id", int_task_id)
            .execute()
        )

        data = getattr(result, "data", None) or (result.get("data") if isinstance(result, dict) else None)
        if not data:
            raise HTTPException(status_code=404, detail="Task not found")

        return {"task": data[0]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))