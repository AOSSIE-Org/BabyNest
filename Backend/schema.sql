DROP TABLE IF EXISTS profile;

CREATE TABLE IF NOT EXISTS profile (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lmp Date NOT NULL,
    cycleLength INTEGER NOT NULL,
    periodLength INTEGER NOT NULL,
    age INTEGER NOT NULL,
    weight INTEGER NOT NULL,
    user_location TEXT NOT NULL,
    dueDate TEXT
);

INSERT INTO profile (lmp, cycleLength, periodLength, age, weight, user_location) VALUES
('2025-01-01', 28, 5, 30, 65, 'New York'),
('2025-01-15', 30, 6, 28, 70, 'Los Angeles'),
('2025-02-01', 26, 4, 32, 60, 'Chicago');


CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    appointment_location TEXT NOT NULL,
    appointment_status TEXT CHECK(appointment_status IN ('pending', 'completed')) DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES profile(id)
);

DROP TABLE IF EXISTS tasks;

CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    starting_week INTEGER NOT NULL,
    ending_week INTEGER NOT NULL DEFAULT starting_week,
    task_priority TEXT CHECK(task_priority IN ('low', 'medium', 'high')) DEFAULT 'low',
    isOptional BOOLEAN DEFAULT FALSE NOT NULL,
    isAppointmentMade BOOLEAN DEFAULT FALSE,
    task_status TEXT CHECK(task_status IN ('pending', 'completed')) DEFAULT 'pending',
    FOREIGN KEY (user_id) REFERENCES profile(id)
);

CREATE TABLE IF NOT EXISTS blood_pressure_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    systolic INTEGER NOT NULL,
    diastolic INTEGER NOT NULL,
    time TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profile(id)
);

CREATE TABLE IF NOT EXISTS discharge_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    type TEXT NOT NULL,
    color TEXT NOT NULL,
    bleeding TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profile(id)
);

-- Insert mock data into appointments
INSERT INTO appointments (user_id, title, content, appointment_date, appointment_time, appointment_location, appointment_status) VALUES
(0, 'Initial OB Appointment', 'Confirm pregnancy and general health.', '2025-06-22', '09:00 AM', 'City Clinic', 'completed'),
(0, 'Blood Work', 'Routine prenatal blood tests.', '2025-06-29', '10:00 AM', 'LabCorp', 'completed'),
(0, 'Nutritional Counseling', 'Discuss prenatal diet and supplements.', '2025-02-05', '11:00 AM', 'Wellness Center', 'pending'),
(0, 'First Ultrasound', 'Early scan to check for heartbeat.', '2025-02-12', '10:30 AM', 'City Hospital', 'pending'),
(0, 'Routine Check-up', 'Weekly monitoring and vitals.', '2025-02-19', '09:30 AM', 'OB-GYN Office', 'pending'),
(0, 'NT Scan Appointment', 'Nuchal translucency scan scheduling.', '2025-02-26', '02:00 PM', 'Radiology Dept.', 'pending'),
(0, 'Screening Lab Visit', 'Down syndrome blood screening.', '2025-06-05', '10:15 AM', 'Prenatal Lab', 'pending'),
(0, 'Follow-up Visit', 'Review test results and progress.', '2025-06-12', '09:00 AM', 'HealthCare Clinic', 'pending'),
(0, 'Anomaly Scan Prep', 'Discuss upcoming detailed scan.', '2025-06-19', '11:30 AM', 'OB-GYN Center', 'pending'),
(0, 'Mid-pregnancy Checkup', 'Weight, BP, baby growth tracking.', '2025-06-26', '01:00 PM', 'Wellness Clinic', 'pending'),
(0, 'Vaccination Discussion', 'Discuss vaccines for pregnancy.', '2025-06-02', '12:30 PM', 'OB-GYN Office', 'pending'),
(0, 'Mood & Sleep Check-in', 'Mental health & fatigue talk.', '2025-06-09', '10:00 AM', 'Care Center', 'pending');

-- Insert mock data into tasks
INSERT INTO tasks (user_id, title, content, starting_week, ending_week, task_priority, isOptional, isAppointmentMade ,task_status) VALUES
-- First Trimester
(0, 'Initial Prenatal Visit', 'First doctor visit to confirm pregnancy and health check.', 4, 4, 'high', FALSE, FALSE,'pending'),
(0, 'Early Ultrasound', 'Confirm pregnancy location and heartbeat.', 6, 8, 'high', FALSE,FALSE,'pending'),
(0, 'Folic Acid Supplementation', 'Start folic acid for neural tube development.', 4, 12, 'high', FALSE,FALSE,'pending'),
(0, 'Blood Tests', 'Check for blood type, hemoglobin, and infections.', 8, 10, 'high', FALSE,FALSE,'pending'),
(0, 'Down Syndrome Screening', 'Non-invasive prenatal screening for chromosomal conditions.', 10, 12, 'medium', FALSE,FALSE,'pending'),

-- Second Trimester
(0, 'NT Scan', 'Nuchal translucency scan for fetal abnormalities.', 12, 14, 'high', FALSE,FALSE,'pending'),
(0, 'Gestational Diabetes Test', 'Glucose test to check blood sugar levels.', 14, 16, 'high', FALSE,FALSE,'pending'),
(0, 'Detailed Anomaly Scan', '20-week scan to check fetal development.', 18, 20, 'high', FALSE,FALSE,'pending'),
(0, 'Fetal Movement Monitoring', 'Track baby movements for health assessment.', 21, 24, 'medium', FALSE,FALSE,'pending'),
(0, 'Iron and Calcium Supplements', 'Ensure proper bone and blood health for mother and baby.', 21, 28, 'medium', FALSE,FALSE,'pending'),

-- Third Trimester
(0, 'Rh Factor Screening', 'Test if mother needs Rh immunoglobulin.', 26, 28, 'high', FALSE,FALSE,'pending'),
(0, 'Glucose Tolerance Test', 'Second test if needed for gestational diabetes.', 28, 28, 'medium', FALSE,FALSE,'pending'),
(0, 'Pre-Birth Vaccination', 'Tdap and flu shots for maternal and newborn protection.', 30, 32, 'high', FALSE,FALSE,'pending'),
(0, 'Third-Trimester Ultrasound', 'Assess baby’s growth and position.', 30, 32, 'high', FALSE,FALSE,'pending'),
(0, 'Birth Plan Discussion', 'Discuss delivery preferences with doctor.', 33, 34, 'medium', TRUE,FALSE,'pending'),
(0, 'Hospital Tour', 'Visit maternity hospital to prepare for delivery.', 33, 34, 'low', TRUE,FALSE,'pending'),
(0, 'Labor Signs Monitoring', 'Educate about labor contractions and when to go to hospital.', 36, 40, 'high', FALSE,FALSE,'pending'),
(0, 'Final Checkups', 'Last medical assessments before labor.', 38, 40, 'high', FALSE,FALSE,'pending');


CREATE TABLE IF NOT EXISTS weekly_weight (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    weight REAL NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profile(id)
);

CREATE TABLE IF NOT EXISTS weekly_medicine (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    name TEXT NOT NULL,
    dose TEXT NOT NULL,
    time time NOT NULL,
    taken BOOLEAN DEFAULT 0,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profile(id)
);

CREATE TABLE IF NOT EXISTS weekly_symptoms (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    week_number INTEGER NOT NULL,
    symptom TEXT NOT NULL,
    note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES profile(id)
);

INSERT INTO weekly_weight (user_id, week_number, weight, note) VALUES
(0, 8, 60.5, 'Slight nausea, but overall feeling okay'),
(0, 9, 60.9, 'Appetite increasing slightly'),
(0, 10, 61.3, 'Started prenatal yoga, feeling good');


INSERT INTO weekly_medicine (user_id, week_number, name, dose, time, taken, note) VALUES
(0, 8, 'Prenatal Vitamin', '1 tablet', '08:00', 1, 'Daily multivitamin with folic acid'),
(0, 9, 'Iron Supplement', '30mg', '13:00', 1, 'Taking to help with mild anemia'),
(0, 10, 'Prenatal Vitamin', '1 tablet', '08:00', 1, 'No side effects, continuing as normal');

INSERT INTO weekly_symptoms (user_id, week_number, symptom, note) VALUES
(0, 8, 'Morning Sickness', 'Worse after waking up'),
(0, 9, 'Breast Tenderness', 'More sensitive than last week'),
(0, 10, 'Frequent Urination', 'Especially during the night');

