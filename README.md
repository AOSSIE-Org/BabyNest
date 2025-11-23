# BabyNest

## Table of Contents

1. [Overview](#overview)
2. [Features](#features)
3. [Tech Stack](#tech-stack)
5. [Usage](#usage)
6. [Components](#components)
4. [Architecture](#architecture)
7. [Contact](#contact)

## Overview

**BabyNest** is a minimalist React Native application designed to support expecting parents by tracking prenatal medical appointments, providing country-specific healthcare requirement notifications, and delivering AI-powered personalized recommendations. This intelligent pregnancy planner ensures parents stay informed, organized, and stress-free throughout their journey.

## Features

- **Automated Trimester Tracking**: Keeps track of medical appointments based on the pregnancy timeline.
- **Country-Specific Notifications**: Alerts users about healthcare requirements specific to their region.
- **Offline Access**: Provides essential pregnancy care guidelines without requiring internet access.
- **AI-Powered Assistant**: Offers personalized recommendations, reminders, and scheduling assistance.

## Tech Stack

- **Frontend**: React Native
- **Backend**: Flask (Python)
- **AI & NLP**: Python, LangChain
- **Database**: SQLite

## Usage

- Open the mobile app on an emulator or device.
- Sign up and input the estimated due date to personalize your experience.
- Get notified of upcoming medical appointments and tasks.
- Access offline pregnancy care guidelines.
- Interact with the AI assistant for advice and recommendations.

## Components

### Frontend

- Built using **React Native** for a seamless mobile experience.
- Provides a clean and intuitive UI to track pregnancy milestones.
- Supports offline mode for essential features.

### Backend

- Developed using Flask\*\*(Python)\*\* for fast and efficient API interactions.
- Handles appointment scheduling and task management.
- Provides data syncing when the user is online.

### AI & NLP

- **LangChain** is used to power the AI assistant for personalized insights.
- Supports natural language queries to search for symptoms, medications, and appointments.

### Database

- Uses **SQLite** for local data storage to support offline functionality.
- Stores user information, appointment schedules, and task lists.

# Architecture

This diagram illustrates the architecture of BabyNest.

```mermaid
graph TD;
    %% Frontend in React Native
    subgraph Frontend["Frontend (React Native)"]
        D[BabyNest App] -->|Uses| E[react-native-sqlite-storage]
        D -->|Interacts with| F[Chatbot]
    end

    %% Local Storage (SQLite)
    subgraph Database["Local Database (SQLite)"]
        B[SQLite] -->|Stores & Retrieves| C[Appointments, Tasks, Due Date, Location]
    end

    %% Backend in Flask
    subgraph Backend["Main Backend (Flask)"]
        A[API Routes] -->|Syncs Data| B
        A -->|Provides Data to| D
    end
    
    %% LLM Agents & AI Processing
    subgraph AI["LLM Agents & AI Processing"]
        G[Local llm give response] -->|Indexes Data| H[ChromaDB]
    end

    %% Connections Between Components
    D -->|Reads & Writes Data| B
    A -->|Can Query AI Offline| G
    H -->|Provides Faster Query Results| F
```

## Contact

For any inquiries or support, please reach out to us on [Discord](#).

