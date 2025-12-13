# 👶 BabyNest
*A Smart Pregnancy Companion for Expecting Parents*

---

## 📌 Table of Contents

1. [Overview](#overview)
2. [Key Features](#key-features)
3. [Tech Stack](#tech-stack)
4. [Architecture](#architecture)
5. [Installation & Setup](#installation--setup)
6. [Usage](#usage)
7. [Project Components](#project-components)
8. [Contributing](#contributing)
9. [License](#license)
10. [Contact](#contact)

---

## 🌸 Overview

**BabyNest** is a minimalist **React Native mobile application** designed to support expecting parents throughout their pregnancy journey.  
The application helps users track prenatal medical appointments, receive **country-specific healthcare notifications**, access **offline pregnancy guidelines**, and interact with an **AI-powered assistant** for personalized recommendations.

BabyNest focuses on reducing stress, improving organization, and ensuring that no important medical milestone is missed.

---

## ✨ Key Features

- **Automated Trimester Tracking**  
  Tracks pregnancy stages automatically based on the estimated due date and suggests relevant medical checkups.

- **Country-Specific Healthcare Notifications**  
  Notifies users about region-specific pregnancy healthcare requirements.

- **Offline Access**  
  Essential pregnancy care information remains available without an internet connection.

- **AI-Powered Assistant**  
  Provides personalized reminders, answers to pregnancy-related questions, and planning assistance.

---

## 🛠 Tech Stack

### Frontend
- **React Native** – Cross-platform mobile application development

### Backend
- **Flask (Python)** – REST API for data synchronization and business logic

### AI & NLP
- **Python**
- **LangChain** – For powering the AI assistant and natural language interactions

### Database
- **SQLite** – Local database to support offline functionality

---

## 🏗 Architecture

```mermaid
graph TD;
    subgraph Frontend["Frontend (React Native)"]
        D[BabyNest App] -->|Uses| E[SQLite Storage]
        D -->|Interacts with| F[AI Chatbot UI]
    end

    subgraph Database["Local Database (SQLite)"]
        B[SQLite] -->|Stores| C[Appointments, Tasks, Due Date, Location]
    end

    subgraph Backend["Backend (Flask API)"]
        A[API Routes] -->|Syncs Data| B
        A -->|Serves Data| D
    end

    subgraph AI["AI & LLM Processing"]
        G[Local LLM Engine] -->|Indexes Data| H[ChromaDB]
        H -->|Optimized Queries| F
    end

    D -->|Read/Write| B
    A -->|AI Requests| G
⚙ Installation & Setup
Prerequisites
Node.js (v16+)

npm or yarn

Python 3.9+

Android Studio / Xcode (for emulator)

Clone the Repository
bash
Copy code
git clone https://github.com/AOSSIE-Org/BabyNest.git
cd BabyNest
Frontend Setup
bash
Copy code
npm install
npm start
Run on emulator or connected device:

bash
Copy code
npx react-native run-android
# or
npx react-native run-ios
Backend Setup
bash
Copy code
cd backend
pip install -r requirements.txt
python app.py
🚀 Usage
Launch the application on a physical device or emulator.

Sign up and enter the estimated due date.

Receive reminders for medical appointments and healthcare tasks.

Access pregnancy care guidelines offline.

Interact with the AI assistant for advice and recommendations.

🧩 Project Components
📱 Frontend
Built using React Native

Clean and intuitive user interface

Offline support via SQLite

🔙 Backend
Flask-based REST APIs

Manages scheduling, reminders, and synchronization

🤖 AI & NLP
AI assistant powered using LangChain

Supports natural language queries for pregnancy-related guidance

🗄 Database
SQLite for local data persistence

Stores appointments, tasks, and user preferences

🤝 Contributing
We welcome contributions from the community 🎉

🔁 Fork & Pull Request Workflow
Fork this repository

Clone your fork:

bash
Copy code
git clone https://github.com/YOUR_USERNAME/BabyNest.git
Create a new branch:

bash
Copy code
git checkout -b feature/your-feature-name
Make your changes and commit:

bash
Copy code
git add .
git commit -m "Describe your changes clearly"
Push to your fork:

bash
Copy code
git push origin feature/your-feature-name
Open a Pull Request from your fork to the main repository

Maintainers will review and merge if approved ✅

📜 License
This project is licensed under the MIT License.
You are free to use, modify, and distribute this project with proper attribution.

📬 Contact
For queries, discussions, or collaboration:

Organization: AOSSIE

GitHub: https://github.com/AOSSIE-Org