from fastapi import APIRouter, HTTPException
from services.supabase_client import get_supabase

router = APIRouter()

@router.get("/fields")
async def list_fields():
    try:
        supabase = get_supabase()
        result = supabase.table("fields").select("*").order("id").execute()
        return {"fields": result.data or []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))