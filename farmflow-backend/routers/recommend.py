from fastapi import APIRouter, HTTPException
from services.supabase_client import get_supabase
from services.rule_engine import evaluate_rules

router = APIRouter()


@router.post("/recommend/{field_id}")
async def get_recommendations(field_id: str):
    try:
        supabase = get_supabase()

        # Get latest climate record
        climate_result = (
            supabase.table("climate_records")
            .select("*")
            .eq("field_id", field_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        if not climate_result.data:
            raise HTTPException(
                status_code=404,
                detail="No climate data found for this field"
            )

        latest_climate = climate_result.data[0]

        # Get field info
        field_result = (
            supabase.table("fields")
            .select("*")
            .eq("id", field_id)
            .limit(1)
            .execute()
        )

        if not field_result.data:
            raise HTTPException(
                status_code=404,
                detail="Field not found"
            )

        field_data = field_result.data[0]

        # Run rule engine
        raw_recommendations = evaluate_rules(
            latest_climate,
            field_id
        )

        recommendations_to_insert = []

        # Normalize recommendations to REAL DB schema
        for rec in raw_recommendations:

            normalized = {
                "field_id": field_id,
                "farm_id": field_data.get("farm_id"),
                "source": "rule_engine",
                "rule_id": rec.get("rule_id"),
                "title": rec.get(
                    "title",
                    rec.get("rule_id", "Recommendation")
                ),
                "description": rec.get(
                    "description",
                    rec.get("rationale", "")
                ),
                "action": rec.get(
                    "action",
                    rec.get("rationale", "")
                ),
                "rationale": rec.get("rationale", ""),
                "urgency": rec.get("urgency", "MEDIUM"),
                "confidence": rec.get("confidence", 0.85),
                "triggered_by_metrics": {
                    "temp_anomaly": latest_climate.get("temp_anomaly"),
                    "rainfall_mm": latest_climate.get("rainfall_mm")
                },
                "status": "active"
            }

            recommendations_to_insert.append(normalized)

        # Save recommendations
        if recommendations_to_insert:
            supabase.table("recommendations") \
                .insert(recommendations_to_insert) \
                .execute()

        # Return all recommendations
        all_recs = (
            supabase.table("recommendations")
            .select("""
                *,
                fields (
                    id,
                    name,
                    crop_type
                )
            """)
            .eq("field_id", field_id)
            .order("created_at", desc=True)
            .execute()
        )

        recommendations = all_recs.data or []

        # Frontend compatibility layer
        for rec in recommendations:
            if rec.get("fields"):
                rec["field_name"] = rec["fields"].get("name")
                rec["crop_type"] = rec["fields"].get("crop_type")

        print(
            f"✅ Generated {len(recommendations_to_insert)} "
            f"recommendations for field {field_id}"
        )

        return {
            "field_id": field_id,
            "new_recommendations": len(recommendations_to_insert),
            "recommendations": recommendations
        }

    except Exception as e:
        print(f"❌ ERROR generating recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/recommend/{field_id}")
async def list_recommendations(field_id: str):
    try:
        supabase = get_supabase()

        result = (
            supabase.table("recommendations")
            .select("""
                *,
                fields (
                    id,
                    name,
                    crop_type
                )
            """)
            .eq("field_id", field_id)
            .order("created_at", desc=True)
            .execute()
        )

        recommendations = result.data or []

        # Frontend compatibility
        for rec in recommendations:
            if rec.get("fields"):
                rec["field_name"] = rec["fields"].get("name")
                rec["crop_type"] = rec["fields"].get("crop_type")

        return {
            "field_id": field_id,
            "recommendations": recommendations
        }

    except Exception as e:
        print(f"❌ ERROR fetching recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))
