
def validate_bp_data(data):
    errors = {}
    if not isinstance(data['week_number'], int) or data['week_number'] < 1:
            errors["week_number"] = "week_number must be a positive integer."

    if not isinstance(data['systolic'], int) or not (50 < data['systolic'] < 300):
            errors["systolic"] = "systolic must be an integer between 50 and 300."

    if not isinstance(data['diastolic'], int) or not (30 < data['diastolic'] < 200):
            errors["diastolic"] = "diastolic must be an integer between 30 and 200."
    

    return errors


def validate_medicine_data(data):
    errors = {}
    week_number = data.get('week_number')
    name = data.get('name')
    dose = data.get('dose')
    week_result = {"status": True}
    if week_number is not None:
        week_result = validate_week_number(week_number)

    if not week_result["status"]:
            errors["week_number"] = week_result["error"]

    if name and (not isinstance(data['name'], str) or len(data['name'].strip()) == 0):
            errors["name"] = "Medicine name must be a non-empty string."

    if dose and (isinstance(data['dose'], str) or len(data['dose'].strip()) == 0):
            errors["dose"] = "Dose must be a non-empty string."
    
    return errors


def validate_week_number(week) -> dict:
    try:
        week = int(week)
        if week < 1 or week > 52:
            return {"status": False, "error": "Week number must be between 1 and 52"}
        return {"status": True}
    except (ValueError, TypeError):
        return {"status": False, "error": "Week number must be a valid integer"}
    

def validate_weight_value(weight) -> dict:
    try:
        weight = float(weight)
        if weight <= 0 or weight > 1000: # reasonable range in kg
            return {"status": False, "error": "Weight must be a positive number up to 1000kg"}
        return {"status": True}
    except (ValueError, TypeError):
        return {"status": False, "error": "Weight must be a valid number"}