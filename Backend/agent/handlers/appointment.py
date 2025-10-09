from db.db import open_db
import re
from datetime import datetime, timedelta

def parse_appointment_command(query: str):
    """Parse appointment creation commands from natural language."""
    query_lower = query.lower()
    
    # Extract appointment type/title
    title_patterns = [
        r'(?:make|schedule|book|create)\s+(?:an?\s+)?(?:appointment\s+for\s+)?(.+?)(?:\s+on\s+|\s+at\s+|\s+in\s+|$)',
        r'(?:appointment|meeting)\s+(?:for\s+)?(.+?)(?:\s+on\s+|\s+at\s+|\s+in\s+|$)',
    ]
    
    title = None
    for pattern in title_patterns:
        match = re.search(pattern, query_lower)
        if match:
            title = match.group(1).strip()
            break
    
    if not title:
        # Try to extract from common appointment types
        appointment_types = ['ultrasound', 'checkup', 'doctor', 'prenatal', 'blood test', 'scan']
        for apt_type in appointment_types:
            if apt_type in query_lower:
                title = f"{apt_type.title()} Appointment"
                break
    
    # Extract date
    date_patterns = [
        r'(?:on\s+|for\s+)(today|tomorrow|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}/\d{1,2}|\d{4}-\d{2}-\d{2})',
        r'(today|tomorrow|next\s+week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}/\d{1,2}|\d{4}-\d{2}-\d{2})',
    ]
    
    date_str = None
    for pattern in date_patterns:
        match = re.search(pattern, query_lower)
        if match:
            date_str = match.group(1).strip()
            break
    
    # Extract time
    time_patterns = [
        r'(?:at\s+|for\s+)(\d{1,2}:\d{2}|\d{1,2}\s*(?:am|pm)|morning|afternoon|evening|night)',
        r'(\d{1,2}:\d{2}|\d{1,2}\s*(?:am|pm)|morning|afternoon|evening|night)',
    ]
    
    time_str = None
    for pattern in time_patterns:
        match = re.search(pattern, query_lower)
        if match:
            time_str = match.group(1).strip()
            break
    
    # Extract location
    location_patterns = [
        r'(?:in\s+|at\s+|location\s+)(.+?)(?:\s+on\s+|\s+at\s+|$)',
        r'(?:hospital|clinic|office|center)\s+(.+?)(?:\s+on\s+|\s+at\s+|$)',
    ]
    
    location = None
    for pattern in location_patterns:
        match = re.search(pattern, query_lower)
        if match:
            location = match.group(1).strip()
            break
    
    return {
        'title': title,
        'date': date_str,
        'time': time_str,
        'location': location
    }

def parse_date(date_str):
    """Parse date string to ISO format."""
    if not date_str:
        return None
    
    today = datetime.now()
    date_str_lower = date_str.lower()
    
    if date_str_lower == 'today':
        return today.strftime('%Y-%m-%d')
    elif date_str_lower == 'tomorrow':
        return (today + timedelta(days=1)).strftime('%Y-%m-%d')
    elif date_str_lower == 'next week':
        return (today + timedelta(days=7)).strftime('%Y-%m-%d')
    
    # Try to parse as MM/DD or MM/DD/YYYY
    try:
        if '/' in date_str:
            parts = date_str.split('/')
            if len(parts) == 2:
                month, day = int(parts[0]), int(parts[1])
                year = today.year
                if month < today.month or (month == today.month and day < today.day):
                    year += 1
                return f"{year}-{month:02d}-{day:02d}"
            elif len(parts) == 3:
                month, day, year = int(parts[0]), int(parts[1]), int(parts[2])
                return f"{year}-{month:02d}-{day:02d}"
    except:
        pass
    
    # Try to parse as YYYY-MM-DD
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return date_str
    except:
        pass
    
    return None

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
    if any(word in query_lower for word in ['make', 'schedule', 'book', 'create', 'appointment']):
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