from datetime import datetime


def evaluate_rules(climate_record: dict, field_id: int) -> list:
    """
    Evaluate climate conditions and generate recommendation objects.

    This service returns lightweight recommendation payloads.
    The router is responsible for normalizing them
    into the full database schema.
    """

    recommendations = []

    temp_anomaly = climate_record.get("temp_anomaly", 0) or 0
    rainfall_mm = climate_record.get("rainfall_mm", 0) or 0

    # -----------------------------
    # R-03: IPM Intervention
    # temp anomaly > 2.0
    # -----------------------------
    if temp_anomaly > 2.0:

        recommendations.append({
            "rule_id": "R-03",
            "title": "IPM Intervention Required",
            "description": (
                f"Temperature anomaly of "
                f"{temp_anomaly:.1f}°C detected."
            ),
            "action": (
                "Inspect crops for heat-related pest "
                "and disease outbreaks."
            ),
            "urgency": "CRITICAL",
            "confidence": 0.95,
            "rationale": (
                f"Temperature anomaly of "
                f"{temp_anomaly:.1f}°C exceeds "
                f"critical threshold."
            ),
            "created_at": datetime.utcnow().isoformat()
        })

    # -----------------------------
    # R-04: Harvest Timing
    # temp anomaly > 1.5
    # -----------------------------
    elif temp_anomaly > 1.5:

        recommendations.append({
            "rule_id": "R-04",
            "title": "Advance Harvest Schedule",
            "description": (
                f"Heat stress detected at "
                f"{temp_anomaly:.1f}°C above normal."
            ),
            "action": (
                "Advance harvest timeline by "
                "3–5 days if crops are mature."
            ),
            "urgency": "HIGH",
            "confidence": 0.88,
            "rationale": (
                f"Elevated temperatures may "
                f"accelerate crop stress and maturity."
            ),
            "created_at": datetime.utcnow().isoformat()
        })

    # -----------------------------
    # R-05: Low Rainfall
    # rainfall < 20mm
    # -----------------------------
    if rainfall_mm < 20:

        recommendations.append({
            "rule_id": "R-05",
            "title": "Increase Irrigation",
            "description": (
                f"Low rainfall detected "
                f"({rainfall_mm:.1f}mm)."
            ),
            "action": (
                "Increase irrigation frequency "
                "to maintain soil moisture."
            ),
            "urgency": "MEDIUM",
            "confidence": 0.90,
            "rationale": (
                f"Rainfall below 20mm threshold "
                f"may reduce soil moisture availability."
            ),
            "created_at": datetime.utcnow().isoformat()
        })

    return recommendations