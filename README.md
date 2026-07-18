# 404 Project Not Found

This repository contains the complete code for the **404 Project Not Found** application, a combined Kanban task board and image annotation workspace. It is organized as a monorepo containing both the frontend and backend.

## Live Demo URLs

- **Frontend (Vercel):** https://404-project-git-main-nishatmahis-projects.vercel.app
- **Backend API (PythonAnywhere):** https://mahitasnim.pythonanywhere.com/api/
- **Backend Admin (PythonAnywhere):** https://mahitasnim.pythonanywhere.com/admin/

---

## Quick Start (Local Development)

To run this project on your own machine, you need to start both the backend server and the frontend server.

### 1. Start the Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # (On Mac/Linux use: source venv/bin/activate)
pip install -r requirements.txt
copy .env.example .env  # Add dummy credentials to .env
python manage.py migrate
python manage.py seed_demo
python manage.py runserver
```
*The backend API will run on http://127.0.0.1:8000/api/*

### 2. Start the Frontend
```bash
# In a new terminal window
cd frontend
npm install
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api" > .env.local
npm run dev
```
*The frontend will run on http://localhost:3000*

---

# Part 1: Frontend

The frontend (the part you actually see and click on) was built with **Next.js** and **TypeScript**.

### Tech Stack
| Technology | What it does |
|---|---|
| **Next.js 16** | The main web framework — handles routing, pages, and rendering |
| **React 19** | The UI library — everything you see is built as React components |
| **TypeScript 5** | Adds types to JavaScript so bugs are caught before they run |
| **Tailwind CSS 4** | Utility-first CSS framework for styling |
| **Axios** | Sends HTTP requests to the Django backend |
| **Zustand** | Lightweight state management |
| **Konva / React-Konva** | Canvas library used to draw and save polygons on images |
| **@dnd-kit** | Drag-and-drop library for moving tasks |

### The Villains I Faced (Difficulties)
1. **The CORS Dragon:** The browser kept blocking requests. Added `django-cors-headers` to the backend and configured it to allow all Vercel domains.
2. **The JWT Zombie Token:** Access tokens expire silently. Implemented an Axios response interceptor that automatically uses the refresh token to get a new access token whenever a 401 is received.
3. **The Hydration Ghost:** `localStorage` only exists in the browser, causing Next.js server-rendering mismatch. Added an `isHydrated` state to the auth store that waits for the client-side token to be read.
4. **The Konva Canvas Scroll Curse:** Scrolling the page zoomed the canvas. Removed the `onWheel` event entirely and replaced it with predictable `+` / `-` buttons.
5. **The Stale Canvas Spectre:** Clicking "Refresh" reused the old component state. Passed a `refreshKey` prop to force React to fully unmount and remount the canvas.

---

# Part 2: Backend

The backend (the server-side brain) handles user authentication, stores tasks, manages image uploads, and saves polygon annotation data.

### Tech Stack
| Technology | What it does |
|---|---|
| **Python 3.12** | The programming language |
| **Django 5.0** | The main web framework — handles models, database, admin, URL routing |
| **Django REST Framework 3.15** | Turns Django into a REST API that the frontend can talk to |
| **SimpleJWT 5.3** | Handles login tokens (JWT) |
| **django-cors-headers 4.3** | Allows the frontend to make requests to this server |
| **Pillow 10.3** | Python image library — reads the width and height of uploaded images |
| **SQLite** | The lightweight database engine living in `db.sqlite3` |

### The Villains I Faced (Difficulties)
1. **The JWT Refresh Labyrinth:** Set access token lifetime to 60 minutes and refresh token to 7 days.
2. **The Media File Mystery:** Added `MEDIA_URL` and `MEDIA_ROOT` settings, then added a `urlpatterns` entry using `static()` to serve uploaded files.
3. **The Polygon Coordinate Mess:** Used Django's `JSONField` which stores the entire point array as JSON in a single database column.
4. **The Anonymous Admin Problem:** Wrote a custom Django management command (`seed_demo`) that idempotently creates both the demo user and the admin superuser.
5. **The Image Ownership Gap:** Overrode `get_queryset` in the `ImageUploadViewSet` to always filter by `owner=request.user` so users only see their own images.

### API Endpoints

| Method | URL | What it does |
|---|---|---|
| POST | `/api/auth/login/` | Log in, get JWT tokens |
| POST | `/api/auth/refresh/` | Get a new access token |
| POST | `/api/auth/register/` | Create a new user account |
| GET/POST | `/api/tasks/` | List or create tasks |
| PATCH/DELETE | `/api/tasks/{id}/` | Edit or delete a task |
| GET/POST | `/api/images/` | List active images or upload new |
| GET | `/api/images/archived/` | List previous session images |
| DELETE | `/api/images/{id}/` | Delete an image |
| GET/POST | `/api/polygons/` | List or create polygon annotations |
| PATCH/DELETE | `/api/polygons/{id}/` | Edit or delete a polygon |
