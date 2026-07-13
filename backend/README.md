# 404 Project Not Found — Backend

## What is this?

This is the **backend** (the server-side brain) of the **404 Project Not Found** application. It handles user authentication, stores tasks, manages image uploads, and saves polygon annotation data.

It was built with **Django** and **Django REST Framework**, and uses **SQLite** as its database.

---

## Tech Stack

| Technology | What it does |
|---|---|
| **Python 3.12** | The programming language |
| **Django 5.0** | The main web framework — handles models, database, admin, URL routing |
| **Django REST Framework 3.15** | Turns Django into a REST API that the frontend can talk to |
| **SimpleJWT 5.3** | Handles login tokens (JWT = JSON Web Token). Issues access + refresh tokens so users stay logged in securely |
| **django-cors-headers 4.3** | Allows the frontend (running on a different port) to make requests to this server |
| **Pillow 10.3** | Python image library — reads the width and height of uploaded images |
| **SQLite** | The database engine. Django ORM stores everything (users, tasks, images, polygons) in a single `db.sqlite3` file — no separate database server needed |

---

## What is a Database and why SQLite?

A **database** is where all your data is permanently saved. Without it, everything you create (tasks, annotations) would disappear the moment the server restarts.

**SQLite** is a lightweight database that lives in a single file (`db.sqlite3`) right inside the project. It needs zero configuration and zero extra software — Django creates and manages it automatically. For a university project or small app, it is perfect. Large production apps would use PostgreSQL or MySQL instead.

---

## The Villains I Faced (Difficulties)

### 1. 🔐 The JWT Refresh Labyrinth
**Problem:** Django REST Framework by default has no concept of "keep me logged in". SimpleJWT provides access tokens (short-lived) and refresh tokens (longer-lived), but wiring them together with the frontend's Axios interceptor took careful coordination.  
**How I defeated it:** Set access token lifetime to 30 minutes and refresh token to 7 days. The frontend interceptor silently refreshes on every 401, so users are never unexpectedly logged out.

### 2. 📁 The Media File Mystery
**Problem:** When images were uploaded, Django saved them to disk, but the frontend could not load them because the server was not serving the `/media/` URL path.  
**How I defeated it:** Added `MEDIA_URL` and `MEDIA_ROOT` settings, then added a `urlpatterns` entry using `static()` to serve uploaded files during development.

### 3. 🧩 The Polygon Coordinate Mess
**Problem:** Polygon points are a list of `[x, y]` coordinate pairs. Storing nested lists in a relational database column is not straightforward.  
**How I defeated it:** Used Django's `JSONField` which stores the entire point array as JSON in a single database column. This keeps the data model simple without needing a separate `Point` table.

### 4. 👤 The Anonymous Admin Problem
**Problem:** Running `createsuperuser` on the command line every time you set up a fresh database was tedious and easy to forget. The demo user and admin had to be re-created manually.  
**How I defeated it:** Wrote a custom Django management command (`seed_demo`) that reads credentials from environment variables (`.env`) and idempotently creates both the demo user and the admin superuser. One command sets everything up.

### 5. 🗂️ The Image Ownership Gap
**Problem:** The images API initially returned all images from all users, meaning one logged-in user could see or delete another user's images.  
**How I defeated it:** Overrode `get_queryset` in the `ImageUploadViewSet` to always filter by `owner=request.user`. Users can only ever see and touch their own images.

---

## Python Version

```
Python 3.12.10
```

## Key Package Versions

```
Django                   5.0.6
djangorestframework      3.15.1
djangorestframework-simplejwt  5.3.1
django-cors-headers      4.3.1
Pillow                   10.3.0
```

---

## How to Run

### Prerequisites
- Python 3.10 or higher
- `pip` (comes with Python)

### Steps

```bash
# 1. Go into the backend folder
cd backend

# 2. Create a virtual environment (keeps packages isolated)
python -m venv venv

# 3. Activate the virtual environment
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

# 4. Install all required packages
pip install -r requirements.txt

# 5. Create your environment file
# Copy the example file and fill in your values:
copy .env.example .env
# (Edit .env with your secret key and credentials)

# 6. Set up the database (creates db.sqlite3)
python manage.py migrate

# 7. Create the demo user and admin (reads from .env)
python manage.py seed_demo

# 8. Start the development server
python manage.py runserver
```

The API will be live at **http://127.0.0.1:8000/api/**  
The admin panel is at **http://127.0.0.1:8000/admin/**

### Admin Login
The admin credentials are whatever you set in `.env` for `ADMIN_EMAIL` and `ADMIN_PASSWORD`.

---

## API Endpoints

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

---

## Project Structure

```
backend/
├── config/               # Django project settings, URLs, WSGI
├── accounts/             # Custom user model and auth views
│   └── management/
│       └── commands/
│           └── seed_demo.py   # Creates demo + admin user from .env
├── annotations/          # Image upload and polygon models + API
├── tasks/                # Task/Kanban models + API
├── media/                # Uploaded images (auto-created, git-ignored)
├── db.sqlite3            # SQLite database (auto-created, git-ignored)
├── requirements.txt      # All Python dependencies
└── .env.example          # Template for environment variables
```
