import sqlite3
from datetime import datetime, timedelta
from db.db import open_db

def handle(query, user_context):
    """
    Analyzes data from the last 7 days across all logs to provide
    a comprehensive health summary.
    """
    db = open_db()
    try:
        week = user_context.get('week_number', 1)
        
        # 1. Fetch Blood Pressure Data (Last 7 Days)
        bp_rows = db.execute(
            "SELECT systolic, diastolic FROM blood_pressure_logs WHERE time >= datetime('now', '-7 days')"
        ).fetchall()
        
        # 2. Fetch Medicine Data (Last 7 Days)
        med_rows = db.execute(
            "SELECT status FROM weekly_medicine_logs WHERE time >= datetime('now', '-7 days')"
        ).fetchall()

        # 3. Fetch Weight Data (Last 7 Days)
        weight_rows = db.execute(
            "SELECT weight_value FROM weight_logs WHERE time >= datetime('now', '-7 days')"
        ).fetchall()

        # --- ANALYSIS LOGIC ---
        
        # BP Analysis
        if bp_rows:
            avg_sys = sum(r[0] for r in bp_rows) // len(bp_rows)
            avg_dia = sum(r[1] for r in bp_rows) // len(bp_rows)
            bp_status = "Stable" if avg_sys < 140 else "High (Consult Doctor)"
        else:
            avg_sys, avg_dia, bp_status = "N/A", "N/A", "No data logged"

        # Medicine Adherence
        total_meds = len(med_rows)
        taken_meds = sum(1 for r in med_rows if r[0] == 'taken')
        adherence = (taken_meds / total_meds * 100) if total_meds > 0 else 0

        # Response Building
        response = (
            f"📊 **Weekly Health Insights (Week {week})**\n\n"
            f"🩺 **Blood Pressure:** Avg {avg_sys}/{avg_dia} mmHg\n"
            f"💡 *Status:* {bp_status}\n\n"
            f"💊 **Medicine Adherence:** {adherence:.1f}%\n"
            f"💡 *Tip:* {'Great job staying consistent!' if adherence > 80 else 'Try to set reminders for your supplements.'}\n\n"
            f"⚖️ **Weight Logs:** {len(weight_rows)} entries found this week."
        )

        return response

    except Exception as e:
        return f"Error generating insights: {str(e)}"
    finally:
        db.close()