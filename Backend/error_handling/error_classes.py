class MissingFieldError(Exception):
    """Exception raised when a required field is missing in the input data."""
    status_code = 400
    def __init__(self, field_names: list):
        self.field_names = field_names
        self.message = "Missing required fields" 
        super().__init__(self.message)
        
    
class NotFoundError(Exception):
    status_code = 404
    def __init__(self, resource="Resource", resource_id=None):
        self.resource = resource
        self.resource_id = resource_id
        super().__init__()