# 404 Project Not Found — Frontend

## What is this?

This is the **frontend** (the part you actually see and click on) of the **404 Project Not Found** application — a combined Kanban task board and image annotation workspace built for a university project.

It was built with **Next.js** (a React framework) and **TypeScript**, and talks to the Django backend via a REST API.

---

## Tech Stack

| Technology | What it does |
|---|---|
| **Next.js 16** | The main web framework — handles routing, pages, and rendering |
| **React 19** | The UI library — everything you see is built as React components |
| **TypeScript 5** | Adds types to JavaScript so bugs are caught before they run |
| **Tailwind CSS 4** | Utility-first CSS framework for styling |
| **Axios** | Sends HTTP requests to the Django backend (login, fetch tasks, upload images, etc.) |
| **Zustand** | Lightweight state management — stores your login token and selected date |
| **Konva / React-Konva** | Canvas library used to draw and save polygons on images |
| **@dnd-kit** | Drag-and-drop library for moving tasks between Kanban columns |
| **Lucide React** | Icon library |
| **Playfair Display** | Google Font used on the login page heading |

---

## The Villains I Faced (Difficulties)

### 1. 🐉 The CORS Dragon
**Problem:** The browser kept blocking requests from `localhost:3000` (frontend) to `localhost:8000` (backend) with a "CORS policy" error.  
**How I defeated it:** Added `django-cors-headers` to the backend and configured it to allow the frontend's origin. The browser and backend finally shook hands.

### 2. 🧟 The JWT Zombie Token
**Problem:** After logging in, the access token expired silently. Every API call after that returned 401 Unauthorized, and the user was stuck on a broken page with no error.  
**How I defeated it:** Implemented an Axios response interceptor that automatically uses the refresh token to get a new access token whenever a 401 is received, then retries the original request. Users never notice it.

### 3. 👻 The Hydration Ghost
**Problem:** Next.js renders pages on the server first, but the login token is stored in `localStorage` which only exists in the browser. This caused a flash of the wrong page (sometimes showing the login page even when logged in, or vice versa).  
**How I defeated it:** Added an `isHydrated` state to the auth store that only becomes `true` after the client-side token is read. Pages wait for hydration before deciding where to redirect.

### 4. 🌀 The Konva Canvas Scroll Curse
**Problem:** Scrolling the page also zoomed into the canvas image because the canvas was intercepting scroll wheel events.  
**How I defeated it:** Removed the `onWheel` event from the canvas entirely. Zoom is now controlled only by `+` / `−` buttons, which keeps it predictable.

### 5. 🗂️ The Stale Canvas Spectre
**Problem:** Clicking "Refresh" was supposed to clear the canvas (remove drawn points), but React was reusing the old component and its state remained.  
**How I defeated it:** Passed a `refreshKey` prop to the canvas component. Incrementing it forces React to fully unmount and remount the canvas, giving it a completely clean slate.

---

## Node Version

```
v24.16.0
```

---

## How to Run

### Prerequisites
- Node.js v18 or higher
- The backend Django server must be running (see backend README)

### Steps

```bash
# 1. Go into the frontend folder
cd frontend

# 2. Install all dependencies
npm install

# 3. Create your environment file
echo "NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api" > .env.local

# 4. Start the development server
npm run dev
```

Then open your browser at **http://localhost:3000**

### Build for Production

```bash
npm run build
npm run start
```

---

## Project Structure

```
frontend/
├── src/
│   ├── app/                  # Pages (Next.js App Router)
│   │   ├── login/            # Login page with animated hero panel
│   │   ├── register/         # Registration page
│   │   ├── home/             # Home / dashboard
│   │   ├── tasks/            # Kanban board
│   │   └── annotate/         # Image annotation workspace
│   ├── components/
│   │   ├── common/           # AppShell, DateSelector, etc.
│   │   └── annotate/         # PolygonCanvas component
│   ├── store/                # Zustand state stores (auth, date)
│   ├── lib/                  # Axios API client
│   └── types/                # Shared TypeScript types
└── package.json
```
