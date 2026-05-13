from fastapi import APIRouter, HTTPException
from services.supabase_client import get_supabase

router = APIRouter()


@router.get("/fields")
async def list_fields():
    try:
        supabase = get_supabase()
        result = supabase.table("fields").select("*").execute()
        fields = result.data or []

        normalized_fields = []
        for field in fields:
            field_id = field.get("id") or field.get("field_id")
            field_name = field.get("name") or field.get("field_name")

            normalized_fields.append({
                **field,
                "id": str(field_id) if field_id is not None else "",
                "name": field_name or "Unnamed field",
                "field_id": str(field_id) if field_id is not None else "",
                "field_name": field_name or "Unnamed field",
                "crop_type": field.get("crop_type"),
            })

        return {"fields": normalized_fields}

    except Exception as e:
        print(f"ERROR fetching fields: {e}")
        raise HTTPException(status_code=500, detail=str(e))
