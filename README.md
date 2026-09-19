# Student Pomodoro Study Tracker

A local full-stack portfolio application that helps students run Pomodoro study sessions, log completed work, and review recent study history. The project uses a decoupled architecture with a browser-based frontend and a lightweight Node.js/Express backend that persists data to a local JSON file.

## System Architecture

```text
+-------------------+      HTTP requests       +---------------------+
| Frontend (HTML/CSS|  --------------------->  | Express API Server   |
| + JavaScript UI)  |      Fetch API          | /api/sessions        |
+-------------------+  <---------------------  | /api/session         |
          |              JSON responses        +----------+----------+
          |                                                |
          |                                                v
          |                                      +-------------------+
          |                                      | Node.js fs module |
          |                                      | async file I/O    |
          |                                      +---------+---------+
          |                                                |
          |                                                v
          |                                      +-------------------+
          +------------------------------------> | backend/data/     |
                                                 | sessions.json     |
                                                 +-------------------+
```

## Why This Tech Stack?

| Technology | Role in the System | Why It Was Chosen |
| --- | --- | --- |
| HTML5 + CSS3 | Frontend structure and styling | Semantic HTML and modern CSS make the interface accessible, lightweight, and easy to discuss in interviews. |
| Vanilla JavaScript | Timer logic and API communication | Native browser APIs keep the project dependency-light while demonstrating core programming fundamentals clearly. |
| Fetch API | Client-server communication | Shows understanding of asynchronous networking and JSON-based data exchange without extra libraries. |
| Node.js | JavaScript runtime for the backend | Allows a single language across the stack and supports non-blocking I/O for responsive server behavior. |
| Express | REST API framework | Provides minimal, industry-standard routing and middleware support for building backend services quickly. |
| CORS | Cross-origin request handling | Enables the decoupled frontend and backend to communicate safely during local development. |
| `fs` module | File-based persistence layer | Demonstrates asynchronous disk operations and CRUD fundamentals without requiring a heavy database installation. |
| JSON file storage | Local database substitute | Simple, transparent, and easy for reviewers to inspect when evaluating how session records are persisted. |

## Features

- 25-minute Pomodoro countdown timer
- Subject-based study session logging
- Automatic persistence to a local JSON file
- Reverse-chronological session history
- Friendly UI error banner when the backend is unavailable
- Input validation on both client and server

## Local Installation

1. Clone the repository and open a terminal in the project root:

   ```bash
   cd student-study-tracker
   ```

2. Install backend dependencies:

   ```bash
   cd backend
   npm install
   ```

3. Start the Express backend:

   ```bash
   npm start
   ```

4. Open the frontend in your browser:

   - Open `frontend/index.html` from your cloned repository folder
   - Keep the backend running on `http://localhost:5000`

## API Summary

### `GET /api/sessions`

Reads the local JSON data store asynchronously and returns the full array of completed study sessions.

### `POST /api/session`

Accepts JSON in the following shape:

```json
{
  "subject": "Algorithms",
  "durationMinutes": 25
}
```

The backend validates the payload, adds a unique ID and ISO timestamp, appends the new record, and writes the updated array back to disk.

## Computer Science Concepts Demonstrated

- **Decoupled architecture:** the frontend and backend are separate layers that communicate through HTTP.
- **Asynchronous I/O:** the backend uses promise-based file operations so the event loop is not blocked during disk access.
- **Data serialization:** JavaScript objects are converted to JSON strings for storage and transport.
- **Input validation:** the API rejects malformed input before mutating persisted state.
- **Array mutation patterns:** completed sessions are appended to history and displayed in reverse chronological order.
- **Basic web security:** output sanitization is used in the client before inserting dynamic text into `innerHTML`.

## Future Scalability

This project is intentionally lightweight for local development, but it can scale into a more production-oriented platform:

1. **MongoDB or PostgreSQL**
   - Replace the JSON file with a real database for concurrent access, indexing, richer queries, and stronger data integrity.
   - Add a data access layer or ORM/ODM to separate persistence logic from route handlers.

2. **JWT Authentication**
   - Introduce user accounts so each student can securely manage personal study history.
   - Use signed JWTs for stateless authentication between the frontend and backend.

3. **Docker Containers**
   - Containerize the frontend and backend to standardize local development and deployment environments.
   - Use Docker Compose to run the API, frontend, and database together with predictable networking and configuration.

4. **Production Frontend Deployment**
   - Move the interface into a dedicated frontend build system if the UI grows more complex.
   - Add environment-based API configuration for staging and production targets.

## Project Structure

```text
student-study-tracker/
├── backend/
│   ├── data/
│   │   └── sessions.json
│   ├── package.json
│   └── server.js
├── frontend/
│   └── index.html
├── .gitignore
└── README.md
```
