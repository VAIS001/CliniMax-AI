# Infrastructure Setup and Development Guide

This guide explains how to set up the local development environment and describes the deployment pipelines for the CliniMax project.

## Environment Setup Guide

Follow these steps to configure and run the project components locally.

### 1. Local Database (Supabase)
We use the Supabase CLI for local database development and migrations.

To start the local database and services, run:
```bash
npx supabase start
```
*Note: Make sure Docker is running on your system, as Supabase runs its services inside Docker containers.*

### 2. Environment Variables Setup
You need to configure the environment files for both the backend and frontend.

> [!IMPORTANT]
> Never commit actual secret keys to Git. A `.gitignore` file is configured at the root to prevent environment files from being pushed to version control. Please ask the **Infrastructure Lead** for the actual secret values.

#### Backend Environment File (`backend/.env`)
Create a `.env` file inside the `backend/` directory with the following keys:
```env
SUPABASE_URL=
SUPABASE_KEY=
GEMINI_API_KEY=
```

#### Frontend Environment File (`frontend/.env.local`)
Create a `.env.local` file inside the `frontend/` directory with the following key:
```env
VITE_BACKEND_URL=http://127.0.0.1:8000
```

For the live deployed frontend, set this to your public backend URL instead, for example:
```env
VITE_BACKEND_URL=https://your-backend.onrender.com
```

### 3. Running the Backend Locally
To run the FastAPI backend:
1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install the Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the development server using Uvicorn:
   ```bash
   uvicorn main:app --reload
   ```
The backend server will start at `http://127.0.0.1:8000`.

### 4. Running the Frontend Locally
To run the Next.js frontend:
1. Navigate to the `frontend/` directory:
   ```bash
   cd frontend
   ```
2. Install the Node dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
The frontend will start at `http://127.0.0.1:3000`.

---

## Deployment Guide

We utilize automated deployment pipelines triggered by activity in our Git repository.

### Backend Deployment (Render)
- The backend is deployed automatically as a web service via **Render**.
- The deployment is configured using the [render.yaml](file:///home/knol/Documents/Code/J/CliniMax-AI/render.yaml) blueprint in the project root.
- The environment variables (`SUPABASE_URL`, `SUPABASE_KEY`, and `GEMINI_API_KEY`) must be manually input in the Render Dashboard interface under the service configuration.

### Frontend Deployment (Vercel)
- The frontend is deployed automatically via **Vercel** connected to the GitHub repository.
- Any merge to the `main` branch triggers an automatic production build and deployment.

### CI/CD Pipelines (GitHub Actions)
Our codebase is protected by separate automated CI pipelines that run on every pull request targeting the `main` branch:
1. **Backend CI** ([backend.yml](file:///home/knol/Documents/Code/J/CliniMax-AI/.github/workflows/backend.yml)): Checks out code, sets up Python, installs backend dependencies, and runs testing scripts.
2. **Frontend CI** ([frontend.yml](file:///home/knol/Documents/Code/J/CliniMax-AI/.github/workflows/frontend.yml)): Checks out code, sets up Node.js, installs frontend dependencies, and runs linting/building checks.
