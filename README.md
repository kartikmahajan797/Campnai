# Campnai

An AI-powered influencer marketing operations dashboard built with React and FastAPI.

---

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **Python** (v3.9 or higher) - [Download](https://www.python.org/downloads/)
- **npm** or **bun** (package manager)
- **Git** - [Download](https://git-scm.com/)

---

## Getting Started

### 1. Clone the Repository

```bash
git clone <your-repository-url>
cd Campnai
```

---

## Frontend Setup

The frontend is a **Vite + React + TypeScript** application with TailwindCSS and shadcn/ui components.

### Installation

```bash
# Navigate to the project root (Campnai folder)
cd Campnai

# Install dependencies using npm
npm install

# OR using bun
bun install
```

### Run Development Server

```bash
npm run dev
# OR
bun run dev
```

The frontend will be available at: **http://localhost:5173**

### Build for Production

```bash
npm run build
```

---

## Backend Setup

The backend is a **FastAPI** application with Firebase Firestore integration.

### 1. Navigate to Backend Directory

```bash
cd backend
```

### 2. Create a Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate

# On macOS/Linux:
source venv/bin/activate
```

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

### 4. Firebase Service Account Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project → **Project Settings** → **Service Accounts**
3. Click **"Generate new private key"**
4. Save the downloaded JSON file as `serviceAccountKey.json`
5. Move `serviceAccountKey.json` to the `backend` folder

> ⚠️ **Important:** Never commit `serviceAccountKey.json` to version control. It should be listed in `.gitignore`.

### 5. Run the Backend Server

```bash
uvicorn app.main:app --reload
```

The backend will be available at: **http://127.0.0.1:8000**

- **API Documentation:** http://127.0.0.1:8000/docs
- **Health Check:** http://127.0.0.1:8000/

---

## Project Structure

```
Campnai/
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/              # Page components
│   ├── firebaseConfig.js   # Firebase client configuration
│   └── ...
├── backend/                # Backend source code
│   ├── app/
│   │   ├── main.py         # FastAPI application entry point
│   │   └── api/            # API routes
│   ├── requirements.txt    # Python dependencies
│   └── serviceAccountKey.json  # Firebase credentials (not tracked)
├── package.json            # Frontend dependencies
└── README.md               # This file
```

---

## Running Both Frontend and Backend

Open two terminal windows:

**Terminal 1 - Backend:**
```bash
cd Campnai/backend
venv\Scripts\activate   # Windows
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend:**
```bash
cd Campnai
npm run dev
```

---

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | React, TypeScript, Vite, TailwindCSS |
| UI       | shadcn/ui, Radix UI, Framer Motion  |
| Backend  | FastAPI, Python                     |
| Database | Firebase Firestore                  |
| Auth     | Firebase Authentication             |

---

## License

This project is private and proprietary.
