# Typeform Clone - Fullstack Assignment

A functional clone of the Typeform application replicating Typeform's design, user experience, drag-and-drop form building, logic branching, custom themes, and signature one-question-at-a-time conversational respondent flow.

---

## 🌟 Tech Stack

### Frontend
- **Framework**: Next.js (App Router, TypeScript)
- **Styling**: Tailwind CSS, Custom Theme CSS variables
- **Animations**: Framer Motion (for smooth slide & fade 1-question transitions), Canvas Confetti
- **Drag & Drop**: `@dnd-kit/core`, `@dnd-kit/sortable`
- **Icons**: Lucide React

### Backend
- **Framework**: Python FastAPI
- **Database**: SQLite (`typeform.db`)
- **ORM & Validation**: SQLAlchemy 2.0, Pydantic v2
- **Data Export**: Built-in CSV streaming generator

---

## 🚀 Key Features

### 1. Drag & Drop Form Builder (`/forms/[id]/builder`)
- **Question Reordering**: Smooth drag-and-drop reordering using `@dnd-kit`.
- **Question Types**:
  1. Short Text
  2. Long Text
  3. Multiple Choice (with letter shortcuts A, B, C...)
  4. Dropdown
  5. Email (with client & server validation)
  6. Number
  7. Yes / No
  8. Rating (Star rating 1–5)
- **Per-Question Settings**: Required toggle, title, description / help text, option editor.
- **Custom Theme Customizer**: Custom background color, button color, text color.
- **Logic Branching**: Jump to target questions dynamically based on selected choice answers.
- **Real-Time Live Interactive Preview**: Split screen live desktop & mobile interactive preview canvas.

### 2. Form Management & CRUD (`/`)
- List forms with draft/published status and response counts.
- Search forms by title.
- Create, rename, duplicate, and delete forms.
- Toggle published status generating a shareable public link (`/to/[slug]`).

### 3. Respondent Flow (`/to/[slug]`)
- **Signature Typeform Experience**: Full-screen, one-question-at-a-time flow.
- **Smooth Animations**: Animated transitions powered by Framer Motion.
- **Keyboard Navigation**: Advance with `Enter` ↵, navigate with `Up`/`Down` arrows.
- **Validation**: Required check, email syntax check, numeric input check.
- **Thank-You Screen**: Customizable thank-you screen with confetti animation on submission.
- **Public & No Auth Required**: Anybody with the link can fill out published forms.

### 4. Results & Response Analytics (`/forms/[id]/results`)
- Aggregate statistics & percentage breakdown charts per question.
- Average rating calculator for rating & numerical questions.
- Submissions table view with timestamps.
- Detailed modal view for inspecting individual submissions.
- **CSV Export**: One-click export of form responses to CSV.

---

## 🗄 Database Schema Design

### `Form`
- `id`: `String` (Primary Key, UUID)
- `title`: `String`
- `description`: `String`
- `status`: `String` (`draft` | `published`)
- `slug`: `String` (Unique public key)
- `theme`: `JSON` (`backgroundColor`, `textColor`, `buttonColor`, etc.)
- `thank_you_title`: `String`
- `thank_you_description`: `String`
- `created_at`: `DateTime`
- `updated_at`: `DateTime`

### `Question`
- `id`: `String` (Primary Key, UUID)
- `form_id`: `String` (Foreign Key -> `forms.id`, ON DELETE CASCADE)
- `type`: `String` (`short_text`, `long_text`, `multiple_choice`, `dropdown`, `email`, `number`, `yes_no`, `rating`)
- `title`: `String`
- `description`: `String`
- `required`: `Boolean`
- `order`: `Integer`
- `options`: `JSON` (List of choice options)
- `logic`: `JSON` (List of logic rules: `[{ ifValue, goToQuestionId }]`)

### `Response`
- `id`: `String` (Primary Key, UUID)
- `form_id`: `String` (Foreign Key -> `forms.id`, ON DELETE CASCADE)
- `answers`: `JSON` (Map of `{ question_id: answer_value }`)
- `submitted_at`: `DateTime`

---

## 🔌 API Overview

### Form Management & CRUD
- `GET /api/forms` - List all forms with response counts
- `POST /api/forms` - Create new form
- `GET /api/forms/{id}` - Get form details with ordered questions
- `PUT /api/forms/{id}` - Update form metadata, theme, or questions
- `DELETE /api/forms/{id}` - Delete form
- `POST /api/forms/{id}/duplicate` - Duplicate form definition

### Public Respondent Endpoints
- `GET /api/public/forms/{slug}` - Fetch published form definition
- `POST /api/public/forms/{slug}/submit` - Validate and record respondent answers

### Analytics & Results
- `GET /api/forms/{id}/responses` - List all submitted responses
- `GET /api/forms/{id}/stats` - Get summary stats and option distribution counts
- `GET /api/forms/{id}/export/csv` - Stream response data as CSV file

---

## 🛠 Local Setup Instructions

### 1. Prerequisites
- Python 3.10+ installed
- Node.js 18+ installed

### 2. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate virtual environment (Windows PowerShell)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install requirements
pip install fastapi uvicorn sqlalchemy pydantic

# Seed database with sample forms & realistic responses
python seed.py

# Start FastAPI server (runs at http://localhost:8000)
uvicorn main:app --reload --port 8000
```

### 3. Frontend Setup
```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install dependencies
npm install

# (Optional) Point the frontend at your deployed backend
# Create .env.local with: NEXT_PUBLIC_API_URL=https://your-backend-url/api

# Start Next.js development server (runs at http://localhost:3000)
npm run dev
```

Visit **http://localhost:3000** in your browser to start building forms!

---

## 🗄️ Database Schema

The database (`typeform.db`) is designed around three related tables:

### `forms`
| Column | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `title` | String | Form title |
| `description` | String | Optional form description |
| `status` | String | `draft` or `published` |
| `slug` | String (unique) | Public shareable URL slug |
| `theme` | JSON | Theme colors, fonts, button styling |
| `welcome_enabled` | Boolean | Toggle welcome screen |
| `welcome_title` | String | Welcome screen heading |
| `welcome_description` | String | Welcome screen text |
| `welcome_button_text` | String | Welcome start button label |
| `thank_you_title` | String | Thank-you screen heading |
| `thank_you_description` | String | Thank-you screen text |
| `thank_you_button_text` | String | Submit-another button label |
| `thank_you_button_url` | String | Optional redirect URL |
| `created_at` / `updated_at` | DateTime | Timestamps |

### `questions`
| Column | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `form_id` | String (FK) | Parent form |
| `type` | String | `short_text`, `long_text`, `multiple_choice`, `dropdown`, `email`, `number`, `yes_no`, `rating` |
| `title` | String | Question text |
| `description` | String | Help text |
| `required` | Boolean | Required toggle |
| `order` | Integer | Question ordering (for drag-and-drop) |
| `options` | JSON | Answer choices for choice/rating types |
| `logic` | JSON | Conditional branching rules |

### `responses`
| Column | Type | Description |
|---|---|---|
| `id` | String (UUID) | Primary key |
| `form_id` | String (FK) | Parent form |
| `answers` | JSON | Map of `question_id` → answer value |
| `submitted_at` | DateTime | Submission timestamp |

---

## 🔌 API Overview

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/forms` | List all forms with response counts |
| `POST` | `/api/forms` | Create a form |
| `GET` | `/api/forms/{id}` | Get a form with questions |
| `PUT` | `/api/forms/{id}` | Update form / questions |
| `DELETE` | `/api/forms/{id}` | Delete a form |
| `POST` | `/api/forms/{id}/duplicate` | Duplicate a form |
| `POST` | `/api/forms/{id}/publish` | Publish / unpublish |
| `GET` | `/api/forms/{id}/responses` | List form responses |
| `GET` | `/api/forms/{id}/stats` | Aggregate response stats |
| `GET` | `/api/forms/{id}/export/csv` | Export responses as CSV |
| `GET` | `/api/public/forms/{slug}` | Public form (no auth) |
| `POST` | `/api/public/forms/{slug}/submit` | Submit a response (no auth) |

---

## 🚢 Deployment Guide

### Option A: Render.com (Backend) + Vercel (Frontend)

**1. Backend on Render.com**
1. Push this repo to GitHub.
2. In Render Dashboard → **New → Web Service** → connect your GitHub repo.
3. Set **Root Directory** to `backend`.
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT` (the included `Procfile` is also supported).
6. Deploy. You'll get a URL like `https://your-backend.onrender.com`.

**2. Frontend on Vercel**
1. In Vercel Dashboard → **New Project** → import the same GitHub repo.
2. Set **Root Directory** to `frontend`.
3. Add environment variable `NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api`.
4. Deploy. You'll get a URL like `https://your-frontend.vercel.app`.

**3. Environment Variables**
```bash
# frontend/.env.local
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

> Note: SQLite is file-based, so data persists per instance on Render. For production scale you can swap in PostgreSQL via SQLAlchemy by changing `DATABASE_URL` in `backend/database.py`.

### Option B: Railway (both services)
1. Railway supports multiple services per repo — add a `frontend` and `backend` service.
2. Set the backend start command to `uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. Set `NEXT_PUBLIC_API_URL` on the frontend service to the backend's public URL.

---

## ✨ Bonus Features Implemented

- **Conditional Logic Branching**: "If answer is X → jump to Question Y or End of Form", with backward history tracking in the respondent flow.
- **Custom Themes**: 6 built-in design presets + custom color pickers for background, button, and text colors.
- **CSV Export**: One-click response export endpoint.
- **Pre-Built Templates**: 5 starter templates (Customer Satisfaction, Lead Generation, Event RSVP, Product Feedback, Job Application).
- **Results Analytics**: Per-question distribution bars, average ratings, and submission search.
