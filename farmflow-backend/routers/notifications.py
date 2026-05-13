from fastapi import APIRouter, HTTPException
from services.supabase_client import get_supabase
from datetime import datetime

router = APIRouter()


@router.get("/notifications")
async def list_notifications():
    try:
        supabase = get_supabase()

        result = (
            supabase.table("notifications")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )

        notifications = result.data or []

        # Optional frontend compatibility
        for notification in notifications:
            notification["read"] = notification.get("is_read", False)
            notification["content"] = notification.get("message")

        print(f"✅ Notifications fetched: {len(notifications)}")

        return {"notifications": notifications}

    except Exception as e:
        print(f"❌ ERROR fetching notifications: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.patch("/notifications/{notification_id}/read")
async def mark_read(notification_id: int):
    try:
        supabase = get_supabase()

        result = (
            supabase.table("notifications")
            .update({
                "is_read": True,
                "read_at": datetime.utcnow().isoformat()
            })
            .eq("id", notification_id)
            .execute()
        )

        if not result.data:
            raise HTTPException(status_code=404, detail="Notification not found")

        print(f"✅ Notification {notification_id} marked as read")

        return {"notification": result.data[0]}

    except Exception as e:
        print(f"❌ ERROR updating notification {notification_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))