from db.db import open_db
import re
from datetime import datetime, timedelta

# Finds regex match
def patterns_match(patterns, query_lower):
    temp = None
    for pattern in patterns:
        match = re.search(pattern, query_lower)
        if match:
            temp = match.group(1).strip()
            break
    return temp

def parse_appointment_command(query: str):
    """Parse appointment creation commands from natural language."""
    query_lower = query.lower().strip()
    
    # Extract appointment type/title
    title_patterns = [
        r'(?:make|book|schedule|create|set|arrange|fix)\s+(?:\b(?:a|an|the)\b\s+)?(?:appointment\s+for\s+)?(.+?)\s+(?:\s+on\s+|\s+at\s+|\s+in\s+|$)',
        r'(?:appointment|meeting|visit)\s+(?:for|to)?\s+(.+?)(?:\s+on\s+|\s+at\s+|\s+in\s+|$)',
         r'(?:make|book|schedule|create|set|arrange|fix)\s+.*?(?:\b(?:a|an|the)\b\s+)?(appointment|meeting|visit|checkup|scan|ultrasound|doctor|gynecologist|sonography)'
    ]
    
    #(?:(?:a|an|the)?\s+)
    title = patterns_match(title_patterns, query_lower)
    
    if not title:
        # Try to extract from common appointment types
        appointment_types = ['ultrasound', 'checkup', 'doctor', 'prenatal', 'blood test', 'scan', 'sonography']
        for apt_type in appointment_types:
            if apt_type in query_lower:
                title = f"{apt_type.title()} Appointment"
                break
    
    # Extract date
    date_patterns = [
        r'(?:on\s+|for\s+|at\s+)(today|tomorrow|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thurs|fri|sat|sun)',
        r'(?:on\s+|for\s+|at\s+)(\d{1,2}/\d{1,2}|\d{4}-\d{2}-\d{2}|\d{4}/\d{2}/\d{2})',
        r'(today|tomorrow|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|\d{1,2}/\d{1,2}|\d{4}-\d{2}-\d{2}|\d{4}/\d{2}/\d{2})',
    ]
    
    date_str = patterns_match(date_patterns, query_lower)
    
    # Extract time
    time_patterns = [
        r'(?:at\s+|for\s+)(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|morning|afternoon|evening|night)',
        r'(\d{1,2}:\d{2}\s*(?:am|pm)?|\d{1,2}\s*(?:am|pm)|morning|afternoon|evening|night)',
    ]
    
    time_str = patterns_match(time_patterns, query_lower)
    
    # Extract location
    location_patterns = [
        r'(?:in\s+|at\s+|location\s+)(.+?)(?:\s+on\s+|\s+at\s+|\s+today|\s+tomorrow|\s+for\s+|$)',
        r'(?:hospital|clinic|\boffice\b|center|chamber|facility|ward)\s+(.+?)(?:\s+on\s+|\s+at\s+|$)',
    ]
    
    location = None
    i=0 

    while(i<len(location_patterns)):
        pattern=location_patterns[i]
        match = re.search(pattern, query_lower)
        if match:
            if any(keyword in match.group(1) for keyword in ['today', 'tomorrow', 'morning', 'afternoon', 'evening', 'night', 'next week', 'am', 'pm']):
                query_lower = (query_lower[match.end(1):]).strip()
                i=0
                continue
            else:
                location = match.group(1).strip()
                break
        i+=1
    
    return {
        'title': title,
        'date': date_str,
        'time': time_str,
        'location': location
    }

def parse_date(date_str):
    if not date_str: return None
    today = datetime.now()
    date_str_lower = date_str.lower().strip()
    
    
    if date_str_lower == 'next month':
        next_month = (today.month % 12) + 1
        year = today.year + (1 if today.month == 12 else 0)
        return f"{year}-{next_month:02d}-01"
    
    day_mapping = {
        'monday': 0, 'mon': 0, 'tuesday': 1, 'tue': 1,
        'wednesday': 2, 'wed': 2, 'thursday': 3, 'thu': 3, 'thurs': 3,
        'friday': 4, 'fri': 4, 'saturday': 5, 'sat': 5, 'sunday': 6, 'sun': 6,
    }
    
    if date_str_lower in day_mapping:
        days_ahead = day_mapping[date_str_lower] - today.weekday()
        if days_ahead <= 0: days_ahead += 7
        return (today + timedelta(days=days_ahead)).strftime('%Y-%m-%d')
    
    return date_str 

def parse_time(time_str):
    """Parse time string to HH:MM format."""
    if not time_str:
        return '09:00'
    
    time_str_lower = time_str.lower()
    
    time_map = {
        'morning': '09:00',
        'afternoon': '14:00',
        'evening': '18:00',
        'night': '20:00',
    }
    
    if time_str_lower in time_map:
        return time_map[time_str_lower]
    
    # Try to parse as HH:MM
    try:
        if ':' in time_str:
            parts = time_str.split(':')
            hours, minutes = int(parts[0]), int(parts[1])
            return f"{hours:02d}:{minutes:02d}"
    except:
        pass
    
    # Try to parse as HH AM/PM
    try:
        match = re.match(r'(\d{1,2})\s*(am|pm)', time_str_lower)
        if match:
            hours = int(match.group(1))
            ampm = match.group(2)
            if ampm == 'pm' and hours != 12:
                hours += 12
            elif ampm == 'am' and hours == 12:
                hours = 0
            return f"{hours:02d}:00"
    except:
        pass
    
    return '09:00'

def create_appointment(appointment_data):
    """Create a new appointment in the database."""
    db = open_db()
    
    try:
        db.execute(
            'INSERT INTO appointments (title, content, appointment_date, appointment_time, appointment_location, appointment_status) VALUES (?, ?, ?, ?, ?, ?)',
            (
                appointment_data['title'],
                f"Appointment created via chat: {appointment_data.get('content', '')}",
                appointment_data['date'],
                appointment_data['time'],
                appointment_data.get('location', 'TBD'),
                'pending'
            )
        )
        db.commit()
        return True
    except Exception as e:
        print(f"Error creating appointment: {e}")
        return False

def handle(query: str, user_context=None):
    query_lower = query.lower()
    
    # Check if this is an appointment creation command
    if any(word in query_lower for word in ['make', 'schedule', 'book', 'create', 'appointment', 'set', 'arrange', 'fix']):
        parsed = parse_appointment_command(query)
        
        if parsed['title']:
            # Parse date and time
            parsed['date'] = parse_date(parsed['date'])
            parsed['time'] = parse_time(parsed['time'])
            
            if not parsed['date']:
                parsed['date'] = (datetime.now() + timedelta(days=1)).strftime('%Y-%m-%d')
            
            # Create the appointment
            if create_appointment(parsed):
                return f"✅ Appointment '{parsed['title']}' has been scheduled for {parsed['date']} at {parsed['time']}"
            else:
                return "❌ Failed to create appointment. Please try again."
        else:
            return "❌ Could not understand the appointment details. Please specify what type of appointment you want to schedule."
    
    # Default: show existing appointments
    db = open_db()
    rows = db.execute("""
        SELECT title, appointment_date, appointment_time, appointment_location, appointment_status 
        FROM appointments ORDER BY appointment_date
    """).fetchall()

    if not rows:
        return "No appointments found."

    # Build response with user context if available
    response_parts = []
    
    if user_context:
        current_week = user_context.get('current_week', 'Unknown')
        response_parts.append(f"Current Status: You are in week {current_week} of pregnancy.")
        response_parts.append("")
    
    response_parts.append("Your Appointments:")
    response_parts.extend(
        f"• {r['title']} on {r['appointment_date']} at {r['appointment_time']} ({r['appointment_status']})"
        for r in rows
    )
    
    return "\n".join(response_parts)