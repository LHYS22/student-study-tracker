# Student Pomodoro Study Tracker

A polished full-stack portfolio project that demonstrates how a decoupled web client can coordinate with a lightweight Node.js API to persist study-session history without requiring an external database server.

## Project Overview

This application helps a student focus on a single subject for a 25-minute Pomodoro session. When a timer completes, the frontend records the session by sending a JSON request to the backend, which asynchronously stores the result in a local file-based database.

## System Architecture

```text
+------------------------+
| Frontend (HTML/CSS/JS) |
|  - Timer UI            |
|  - Subject input       |
|  - History renderer    |
+-----------+------------+
            |
            | Fetch API (HTTP requests)
            v
+-----------+------------+
| Express Backend        |
|  - Route handling      |
|  - Validation          |
|  - Error responses     |
+-----------+------------+
            |
            | fs/promises asynchronous I/O
            v
+-----------+------------+
| sessions.json          |
|  Local text-file store |
+------------------------+
```

## Key Features

- Distraction-free single-page Pomodoro interface
- Native browser countdown timer with MM:SS formatting
- Express API with strict server-side validation
- Persistent session history stored in `backend/data/sessions.json`
- Reverse-chronological study log for quick review
- Resilient frontend error banner for backend connectivity failures
- Secure text sanitization before injecting dynamic content into the DOM

## Technology Stack Justification

| Technology | Role in the System | Why It Was Selected |
| --- | --- | --- |
| HTML5 | Semantic frontend structure | Provides accessible, standards-based markup for a professional single-page interface |
| CSS3 | Layout and visual design | Enables responsive, minimalist styling with modern features such as Flexbox and CSS variables |
| Vanilla JavaScript | Client-side behavior | Keeps the project dependency-light while clearly demonstrating core browser concepts such as timers, DOM updates, and Fetch API calls |
| Node.js | JavaScript runtime for the server | Allows one language across the stack and supports efficient non-blocking I/O |
| Express | Backend HTTP framework | Simplifies route creation, middleware configuration, and JSON API responses |
| CORS middleware | Cross-origin request support | Allows the decoupled frontend and backend to communicate safely during local development |
| `fs/promises` | Persistent file storage access | Demonstrates asynchronous server-side file reads and writes without introducing a heavyweight database |
| JSON file database | Lightweight persistence layer | Ideal for a local portfolio project because it is transparent, easy to inspect, and simple to reset |

## Repository Structure

```text
student-study-tracker/
├── backend/
│   ├── data/
│   │   └── sessions.json (generated locally at runtime)
│   ├── app.js
│   ├── package.json
│   ├── server.js
│   └── server.test.js
├── frontend/
│   └── index.html
├── .gitignore
└── README.md
```

## Local Installation and Startup

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Start the backend API server

```bash
npm start
```

The backend will run locally at `http://localhost:5000`.

### 3. Run the backend test suite

```bash
npm test
```

### 4. Open the frontend

Open `frontend/index.html` in your browser.

The page will communicate with the backend through the Fetch API. When the backend is running, completed Pomodoro sessions will be written to `backend/data/sessions.json` automatically.
If the data file does not exist yet, the server creates it on startup with an empty `[]` array.
By default, the frontend targets `http://localhost:5000`, but you can override that for other local environments with `?apiBaseUrl=http://127.0.0.1:5001` in the page URL or by setting `localStorage.studyTrackerApiBaseUrl`.

## API Summary

### `GET /api/sessions`
Returns the stored study-session history as a JSON array.

### `POST /api/sessions`
Accepts a JSON payload such as:

```json
{
  "subject": "Algorithms",
  "durationMinutes": 25
}
```

If validation succeeds, the backend appends a new record containing:

- `id` generated from `crypto.randomUUID()`
- `subject`
- `durationMinutes`
- `completedAt` in ISO 8601 format

## Computer Science Concepts Demonstrated

- **Client-server separation:** the browser handles interaction while Express handles persistence and validation.
- **Asynchronous I/O:** the backend uses non-blocking file operations so the event loop can continue handling other requests.
- **Data serialization:** session objects are converted between JavaScript objects and JSON text for storage and transport.
- **Defensive programming:** both client and server validate inputs and surface clear error states.
- **Basic application security:** text sanitization reduces cross-site scripting risk when rendering saved session history.

## Future Scalability

This local-first version is intentionally simple, but the architecture is designed to scale:

1. **MongoDB or PostgreSQL**
   - Replace the JSON file with a database driver or ORM.
   - Model sessions in a collection or relational table.
   - Add indexing, concurrent write safety, and richer analytics queries.

2. **JWT Authentication**
   - Introduce sign-up and sign-in endpoints.
   - Issue signed JSON Web Tokens after authentication.
   - Associate study sessions with user accounts and protect private routes.

3. **Docker Containers**
   - Containerize the frontend and backend for consistent deployment.
   - Add a database service in `docker-compose.yml`.
   - Standardize onboarding so reviewers can launch the entire stack with one command.

4. **Production Frontend Deployment**
   - Move the static frontend to a framework build pipeline or hosting platform.
   - Configure environment-specific API base URLs.
   - Add automated tests and CI workflows for reliability.

   > Current limitation: the demo frontend intentionally hardcodes `http://localhost:5000` because this repository is optimized for local portfolio review. A production deployment should replace that constant with an environment-aware configuration strategy.

## Portfolio Value

This project is intentionally interview-friendly: it demonstrates practical full-stack fundamentals, clean separation of concerns, persistent storage, API design, and security-aware frontend rendering in a compact application that is easy for reviewers to understand.
