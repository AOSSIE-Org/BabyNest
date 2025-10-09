# 🤖 RAG System Command Reference

## Complete App Control via Chat Commands

The RAG (Retrieval-Augmented Generation) system can control your entire BabyNest app through natural language commands. Here are all the available commands organized by category:

---

## 📅 **APPOINTMENT MANAGEMENT**

### Create Appointments
```
• "make an appointment for ultrasound tomorrow at 2pm at city hospital"
• "schedule a checkup today at 10am at delhi hospital"
• "book appointment for blood test next week at afternoon at medical center"
• "make appointment for consultation on monday at 3pm at clinic"
• "schedule ultrasound on 15 October at 11am at city hospital"
• "book appointment for checkup on 20 December 2026 at 9am at delhi"
• "I need to book an appointment for my regular checkup tomorrow afternoon at the city hospital"
```

### Smart Follow-ups
```
• "make an appointment tomorrow" → Will ask for type, time, location
• "schedule ultrasound tomorrow at city hospital" → Will ask for time
• "book appointment for 2pm" → Will ask for type, date, location
```

---

## ⚖️ **WEIGHT TRACKING**

### Log Weight
```
• "log my weight"
• "my weight is 65kg"
• "I weigh 65kg"
• "record weight"
• "add weight"
• "weight 65kg"
• "log weight 65kg for week 12"
• "my weight today is 68kg"
• "record 70kg weight"
```

### Smart Follow-ups
```
• "log weight" → Will ask for weight value
  💡 Tip: "log weight 65kg for week 12 with note feeling good"

• "my weight is 65" → Will ask for unit (kg/lbs)
  💡 Tip: "log weight 65kg for week 12 with note feeling good"
```

---

## 😊 **MOOD TRACKING** ✨ NEW!

### Log Mood
```
• "log my mood"
• "I feel happy"
• "feeling anxious"
• "my mood is good"
• "record mood"
• "add mood entry"
• "I am stressed"
• "feeling calm today"
• "I'm feeling very energetic"
• "quite tired today"
• "extremely frustrated"
```

### Smart Follow-ups
```
• "log mood" → Will ask for mood type
  💡 Tip: "log mood happy with high intensity today feeling great"

• "I feel" → Will ask for mood intensity
  💡 Tip: "log mood happy with high intensity today feeling great"
```

---

## 😴 **SLEEP TRACKING** ✨ NEW!

### Log Sleep
```
• "log sleep"
• "I slept 8 hours"
• "went to bed at 10pm"
• "woke up at 6am"
• "add sleep entry"
• "record sleep"
• "slept well"
• "poor sleep last night"
• "I slept 7.5 hours last night"
• "bedtime was 11pm, woke up at 7am"
• "excellent sleep quality"
```

### Smart Follow-ups
```
• "log sleep" → Will ask for duration
  💡 Tip: "log sleep 8 hours from 10pm to 6am with excellent quality"

• "I slept" → Will ask for quality and timing
  💡 Tip: "log sleep 8 hours from 10pm to 6am with excellent quality"

• "went to bed" → Will ask for wake time and quality
  💡 Tip: "log sleep 8 hours from 10pm to 6am with excellent quality"
```

---

## 📊 **ANALYTICS & REPORTS** ✨ NEW!

### Query Analytics
```
• "show weight trend"
• "how much did I gain"
• "average sleep this week"
• "weight statistics"
• "mood summary"
• "sleep analytics"
• "show me my data"
• "generate report"
• "weight trend this month"
• "sleep quality last week"
• "mood breakdown"
```

### Smart Analytics
```
• "analytics" → Will ask what to analyze
• "show stats" → Will ask for metric and timeframe
```

---

## ↩️ **UNDO ACTIONS** ✨ NEW!

### Undo Last Action
```
• "undo last action"
• "delete last entry"
• "remove last weight"
• "cancel last appointment"
• "revert changes"
• "undo my last log"
• "undo last weight entry"
• "cancel last mood log"
```

---

## 🤒 **SYMPTOM LOGGING**

### Log Symptoms
```
• "log symptoms"
• "I have nausea"
• "feeling sick"
• "add symptom"
• "record symptoms"
• "I feel dizzy"
• "morning sickness"
• "log symptom nausea"
• "having headache"
• "back pain"
• "feeling tired"
```

### Smart Follow-ups
```
• "log symptoms" → Will ask what symptoms you're experiencing
  💡 Tip: "log symptom nausea this morning with note mild discomfort"

• "I have nausea" → Will ask for additional details if needed
  💡 Tip: "log symptom nausea this morning with note mild discomfort"
```

---

## 🩺 **BLOOD PRESSURE TRACKING**

### Log Blood Pressure
```
• "log blood pressure"
• "blood pressure 120/80"
• "my bp is 120/80"
• "record blood pressure"
• "bp 120/80"
• "pressure reading"
• "blood pressure reading 110/70"
• "bp 130/85 today"
```

### Smart Follow-ups
```
• "log blood pressure" → Will ask for systolic and diastolic values
  💡 Tip: "log blood pressure 120/80 this morning with note feeling normal"

• "my bp is 120" → Will ask for diastolic value
  💡 Tip: "log blood pressure 120/80 this morning with note feeling normal"
```

---

## 💊 **MEDICINE LOGGING**

### Log Medicine
```
• "log medicine"
• "took paracetamol"
• "taking medicine"
• "add medication"
• "record medicine"
• "medicine paracetamol"
• "took 500mg paracetamol"
• "took iron tablets"
• "taking folic acid"
• "medicine at 2pm"
```

### Smart Follow-ups
```
• "log medicine" → Will ask what medicine you took
  💡 Tip: "log medicine paracetamol 500mg twice daily starting today"

• "took paracetamol" → Will ask for dose if not specified
  💡 Tip: "log medicine paracetamol 500mg twice daily starting today"
```

---

## 🩸 **DISCHARGE LOGGING**

### Log Discharge
```
• "log discharge"
• "having discharge"
• "bleeding"
• "spotting"
• "record discharge"
• "discharge normal"
• "light spotting"
• "heavy bleeding"
• "clear discharge"
• "pink discharge"
```

### Smart Follow-ups
```
• "log discharge" → Will ask for type and color
  💡 Tip: "log discharge normal this morning with note light flow"

• "having discharge" → Will ask for type and color
  💡 Tip: "log discharge normal this morning with note light flow"
```

---

## ✅ **TASK MANAGEMENT**

### Create Tasks
```
• "create task"
• "add reminder"
• "need ultrasound"
• "schedule blood test"
• "create reminder"
• "add todo"
• "task ultrasound scan"
• "reminder to take medicine"
• "need to buy vitamins"
• "schedule glucose test"
```

### Smart Follow-ups
```
• "create task" → Will ask what task you want to create
  💡 Tip: "create task buy vitamins for next week with note urgent"

• "need ultrasound" → Will ask for priority and details
  💡 Tip: "create task buy vitamins for next week with note urgent"
```

---

## 🧭 **NAVIGATION CONTROL**

### Navigate to Screens
```
• "go to weight screen"
• "navigate to appointments"
• "open calendar"
• "show symptoms"
• "take me to home"
• "switch to medicine"
• "open timeline"
• "go to profile"
• "show tasks"
• "open blood pressure screen"
• "navigate to discharge log"
```

### Available Screens
- `home` - Home screen with overview
- `weight` - Weight tracking screen
- `appointments` / `calendar` - Calendar/appointments screen
- `symptoms` - Symptom logging screen
- `blood_pressure` - Blood pressure screen
- `medicine` - Medicine tracking screen
- `discharge` - Discharge logging screen
- `tasks` - Task management screen
- `timeline` - Timeline view
- `settings` / `profile` - Settings screen

---

## 👤 **PROFILE MANAGEMENT**

### Update Profile
```
• "update my name to Shreya"
• "change due date to June 24, 2026"
• "set my age to 28"
• "update phone number to 9876543210"
• "modify profile"
• "edit details"
• "change my name"
• "update location to Mumbai"
• "set due date"
```

### Smart Follow-ups
```
• "update my name" → Will ask what name you want to set
• "change due date" → Will ask for the new due date
```

---

## 🔧 **APPOINTMENT MANAGEMENT**

### Update Appointments
```
• "update appointment"
• "change appointment time"
• "modify appointment date"
• "edit appointment"
• "reschedule appointment"
• "update my appointment"
• "change ultrasound appointment"
• "reschedule checkup for tomorrow"
• "change appointment time to 3pm"
• "update appointment location to delhi"
```

### Delete Appointments
```
• "delete appointment"
• "remove appointment"
• "cancel appointment"
• "delete my appointment"
• "cancel ultrasound"
• "remove checkup appointment"
• "delete appointment on monday"
• "cancel all appointments"
• "remove tomorrow's appointment"
• "delete first appointment"
• "cancel both appointments"
```

### Smart Disambiguation
When multiple appointments match your criteria, the system will ask:
```
🔍 I found 2 appointments that match your request:

1. **ultrasound**
   📅 2025-10-09 at 14:00
   📍 city hospital

2. **checkup**
   📅 2025-10-15 at 10:00
   📍 delhi

Please specify which appointment(s) you want to delete by saying:
• A number (1, 2, etc.) for a single appointment
• "all" to delete all matching appointments
• "both" if there are 2 appointments
• Or provide more specific details
```

**You can respond with:**
- `"1"` - Delete the first appointment
- `"both"` - Delete both appointments
- `"all"` - Delete all matching appointments
- `"the ultrasound one"` - More specific details

### Smart Date Matching
The system intelligently handles various date formats:
```
• "19 December" - Matches appointments on December 19th (any year)
• "delete appointment on 19 December" - Finds all appointments on that date
• "cancel my appointment tomorrow" - Matches tomorrow's appointments
• "reschedule for next week" - Handles relative dates
• "appointment on Monday" - Matches day names
```

**Examples:**
- `"Delete my appointment on 19 December"` → Finds all December 19th appointments
- `"Cancel appointment tomorrow"` → Finds tomorrow's appointments
- `"Update my Monday appointment"` → Finds Monday appointments

---

### View Data
```
• "show appointments"
• "get my weight history"
• "list symptoms"
• "view medicine log"
• "display tasks"
• "see blood pressure"
• "show my data"
• "get appointment list"
• "view weight trends"
• "list all tasks"
• "show medicine history"
• "when is my upcoming appointment"
• "what are my next appointments"
• "show my schedule"
• "list my appointments"
• "when is my next appointment"
• "upcoming appointments"
```

### Smart Follow-ups
```
• "show data" → Will ask what type of data you want to see
• "get my" → Will ask what specific data you want
```

---

## 🔄 **CRUD OPERATIONS (Update & Delete)**

### 📋 **Medicine Management**
```
Update Medicine:
• "update medicine"
• "change paracetamol dose"
• "modify iron tablets"
• "edit medicine record"
• "update paracetamol frequency"

Delete Medicine:
• "delete medicine"
• "remove paracetamol"
• "stop taking iron"
• "delete medicine entry"
• "remove medication record"
```

### 🩺 **Blood Pressure Management**
```
Update Blood Pressure:
• "update blood pressure"
• "change bp reading"
• "modify pressure entry"
• "edit blood pressure"
• "update pressure reading"

Delete Blood Pressure:
• "delete blood pressure"
• "remove bp reading"
• "delete pressure entry"
• "remove blood pressure record"
```

### 🩸 **Discharge Management**
```
Update Discharge:
• "update discharge"
• "change discharge record"
• "modify bleeding entry"
• "edit discharge log"
• "update spotting record"

Delete Discharge:
• "delete discharge"
• "remove discharge entry"
• "delete bleeding record"
• "remove discharge log"
```

### 🤒 **Symptoms Management**
```
Update Symptoms:
• "update symptoms"
• "change symptom entry"
• "modify nausea record"
• "edit symptoms"
• "update headache entry"

Delete Symptoms:
• "delete symptoms"
• "remove symptom entry"
• "delete nausea record"
• "remove symptoms log"
```

### ⚖️ **Weight Management**
```
Update Weight:
• "update weight"
• "change weight entry"
• "modify weight record"
• "edit weight log"
• "update weight reading"

Delete Weight:
• "delete weight"
• "remove weight entry"
• "delete weight record"
• "remove weight log"
```

### 😊 **Mood Management**
```
Update Mood:
• "update mood"
• "change mood entry"
• "modify feeling record"
• "edit mood log"
• "update mood entry"

Delete Mood:
• "delete mood"
• "remove mood entry"
• "delete mood record"
• "remove mood log"
```

### 😴 **Sleep Management**
```
Update Sleep:
• "update sleep"
• "change sleep entry"
• "modify sleep record"
• "edit sleep log"
• "update bedtime"

Delete Sleep:
• "delete sleep"
• "remove sleep entry"
• "delete sleep record"
• "remove sleep log"
```

### Smart Follow-ups for CRUD Operations
```
• "update medicine" → Will ask which medicine and what to update
  💡 Tip: "update paracetamol change dose to 1000mg twice daily"

• "delete weight" → Will ask which date to delete
  💡 Tip: "delete weight from yesterday"

• "change blood pressure" → Will ask for new reading
  💡 Tip: "update blood pressure change reading to 110/70"

• "modify symptoms" → Will ask which symptoms and date
  💡 Tip: "update symptoms change nausea to mild headache"

• "log medicine" → Will ask for medicine details
  💡 Tip: "log medicine paracetamol 500mg twice daily starting today"

• "update sleep" → Will ask what to change
  💡 Tip: "update sleep change to 7 hours with good quality"

• "delete mood" → Will ask which entry to remove
  💡 Tip: "delete mood from this morning"
```

---

## 🚨 **EMERGENCY FEATURES**

### Emergency Commands
```
• "emergency"
• "help me"
• "urgent"
• "sos"
• "critical situation"
• "need help"
• "emergency help"
• "urgent assistance"
```

---

## 🚪 **APP CONTROL**

### Logout
```
• "logout"
• "sign out"
• "exit app"
• "quit"
• "log out"
```

---

## 🧠 **SMART FEATURES**

### Multi-turn Conversations
The RAG system remembers context across multiple messages:

```
User: "make an appointment tomorrow"
Bot: "I'd be happy to help! I need a few more details:
• What type of appointment?
• What time works for you?
• Where should this be?"

User: "ultrasound at 2pm"
Bot: "Great! I have ultrasound at 2pm tomorrow. Where should this appointment be?"

User: "city hospital"
Bot: "Perfect! Appointment created: ultrasound tomorrow at 2pm at city hospital"
```

### Natural Language Processing
The system understands various ways of saying the same thing:
- **Dates**: "tomorrow", "today", "next week", "monday", "15 October", "December 20, 2026"
- **Times**: "2pm", "2:30pm", "morning", "afternoon", "evening", "10am"
- **Locations**: "city hospital", "delhi", "medical center", "clinic"
- **Medicine**: "paracetamol", "iron tablets", "folic acid", "500mg"
- **Symptoms**: "nausea", "morning sickness", "headache", "back pain"

### Intelligent Follow-ups
The system asks for missing information automatically:
- If you say "make appointment tomorrow" → asks for type, time, location
- If you say "my weight is 65" → asks for unit (kg/lbs)
- If you say "took medicine" → asks what medicine

---

## 🎯 **PRO TIPS**

1. **Be Natural**: Speak naturally - "I need an ultrasound tomorrow at 2pm"
2. **Mix Information**: You can provide multiple details at once
3. **Use Follow-ups**: If asked for more info, just provide it naturally
4. **Context Aware**: The system remembers what you're talking about
5. **Flexible**: Works with partial information and asks for what's missing

---

## 🔄 **COMPLETE APP CONTROL**

With these commands, you can:
- ✅ **Create and manage appointments** with smart date/time handling
- ✅ **Track all health metrics** (weight, symptoms, BP, medicine, discharge, mood, sleep)
- ✅ **Generate analytics and reports** with trend analysis and charts
- ✅ **Undo any action** with smart action recognition
- ✅ **Navigate to any screen** in the app
- ✅ **Update your profile** information
- ✅ **View and retrieve data** from any section
- ✅ **Handle emergencies** quickly
- ✅ **Control app flow** with navigation and logout

**The RAG system gives you complete voice/text control of your entire BabyNest app!** 🚀

## 🆕 **NEW FEATURES ADDED:**
- 😊 **Mood Tracking** - Log emotions and feelings with intensity levels
- 😴 **Sleep Tracking** - Record sleep duration, quality, bedtime, and wake times
- 📊 **Analytics & Reports** - Get insights on weight trends, sleep patterns, mood distribution
- ↩️ **Undo Actions** - Reverse any logged entry or action with smart recognition
