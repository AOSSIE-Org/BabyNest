
from flask import jsonify, current_app
from sqlite3 import DatabaseError, OperationalError
from functools import wraps


def create_error_response(dev_message, prod_message=None, details=None):
    """Create an error response based on the current environment."""
    mode = current_app.config.get('ENV', 'development') # Default to development if not set
    response = {"error": dev_message}
    if mode == 'development' and details:
        response["details"] = details
    if mode == 'production' and prod_message:
        response["error"] = prod_message
    return response


def handle_db_errors(f):
    """Decorator to handle database errors and return JSON responses."""
    @wraps(f)
    def wrapper(*args, **kwargs):
        response = {}
        try:
            return f(*args, **kwargs)
        except OperationalError as e:
            response = create_error_response("Database Operational Error", "Database Operation could not be performed. Try Again Later!", details=str(e))
            return jsonify(response), 500
        except DatabaseError as e:
            response = create_error_response("Database Error", details=str(e))
            return jsonify(response), 500
    return wrapper


def handle_missing_field_error(e):
    """Handle MissingFieldError exceptions."""
    mode = current_app.config.get('ENV', 'development')  # Default to development if not set
    if( mode == 'development'):
        response = {"error": e.message, "missing_fields": e.field_names}
    else:
        response = {"error": e.message}
    return jsonify(response), e.status_code

def handle_not_found_error(e):
    """Handle NotFoundError exceptions."""
    mode = current_app.config.get('ENV', 'development')  # Default to development if not set
    if mode == 'development' and e.resource_id is not None:
        response = {"error": f"{e.resource} with ID {e.resource_id} not found"}
    else:
        response = {"error": f"{e.resource} not found"}
    return jsonify(response), e.status_code
