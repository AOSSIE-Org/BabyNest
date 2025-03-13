DROP TABLE IF EXISTS users;
CREATE TABLE appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    appointment_location TEXT NOT NULL,
    appointment_status TEXT CHECK(appointment_status IN ('pending', 'completed')) DEFAULT 'pending'
);

DROP TABLE IF EXISTS tasks;
CREATE TABLE tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    content TEXT,
    starting_week INTEGER NOT NULL,
    ending_week INTEGER NOT NULL DEFAULT starting_week,
    task_status TEXT CHECK(task_status IN ('pending','ongoing', 'completed')) DEFAULT 'pending',
    task_priority TEXT CHECK(task_priority IN ('low', 'medium', 'high')) DEFAULT 'low',
    isOptional BOOLEAN DEFAULT FALSE
);

CREATE TABLE user (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    user_location TEXT NOT NULL,
    baby_name TEXT,
    expected_due_date DATE NOT NULL,
    fundal_height_waist_size TEXT,
    weights TEXT CHECK(json_valid(weights)), 
    other_health_stuff TEXT
);

