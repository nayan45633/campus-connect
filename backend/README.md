# Campus Connect — Backend API (Phase 6: Student Profiles & Media)

> High-performance Python backend REST API built with **FastAPI**, **PostgreSQL**, **SQLAlchemy 2.0**, **Alembic**, **Argon2**, **PyJWT**, and **Pydantic**.

---

## 🏛️ Architecture Overview

The backend is organized into clean, modular layers:

```text
backend/
├── app/
│   ├── api/
│   │   ├── deps.py                    # get_current_user, get_current_active_user & get_current_user_optional
│   │   └── v1/
│   │       ├── endpoints/
│   │       │   ├── auth.py            # /register, /login, /login/json, /me endpoints
│   │       │   ├── health.py          # /health diagnostic probe endpoint
│   │       │   ├── posts.py           # Posts CRUD, feed pagination, likes, and comments
│   │       │   ├── comments.py        # Dedicated /comments/{comment_id} deletion endpoint
│   │       │   ├── events.py          # Events CRUD, filtering, capacity check, and RSVP management
│   │       │   ├── notices.py         # Notice board circulars, pinned ordering, and read tracking
│   │       │   ├── communities.py     # Communities CRUD, join/leave, member directory
│   │       │   ├── notifications.py   # User notifications, unread count, read-all, delete
│   │       │   ├── profiles.py        # Profiles /me, PATCH /me, /{user_id}, and /{user_id}/posts
│   │       │   └── media.py           # /avatar and /banner uploads with magic-byte validation
│   │       └── router.py              # Versioned API router
│   ├── core/
│   │   ├── config.py                  # Pydantic-settings configuration, CORS, JWT secrets, media limits
│   │   ├── database.py                # SQLAlchemy 2.0 engine, SessionLocal, get_db & health probes
│   │   ├── exceptions.py              # Centralized JSON exception handlers with jsonable_encoder
│   │   └── security.py                # Argon2 password hashing & PyJWT token utilities
│   ├── models/                        # SQLAlchemy 2.0 ORM domain models
│   │   ├── base.py                    # DeclarativeBase
│   │   ├── user.py                    # User & StudentProfile (1-to-1)
│   │   ├── post.py                    # Post, Comment, PostLike
│   │   ├── event.py                   # Event, EventRSVP (with creator_id)
│   │   ├── notice.py                  # Notice, NoticeRead (with creator_id)
│   │   ├── community.py               # Community, CommunityMembership
│   │   └── notification.py            # Notification
│   ├── schemas/                       # Pydantic validation & response schemas
│   │   ├── auth.py                    # UserRegisterRequest, LoginRequest, TokenResponse, UserPublic
│   │   ├── common.py                  # RootInfoResponse, ErrorDetail
│   │   ├── health.py                  # HealthCheckResponse, DatabaseHealth
│   │   ├── post.py                    # PostCreateRequest, PostResponse, CommentCreateRequest, LikeResponse
│   │   ├── event.py                   # EventCreateRequest, EventUpdateRequest, EventResponse, RSVPResponse
│   │   ├── notice.py                  # NoticeCreateRequest, NoticeUpdateRequest, NoticeResponse, NoticeReadResponse
│   │   ├── community.py               # CommunityCreateRequest, CommunityUpdateRequest, CommunityResponse, Members
│   │   ├── notification.py            # NotificationResponse, PaginatedNotificationsResponse, UnreadCountResponse
│   │   └── profile.py                 # StudentProfileUpdateRequest, StudentProfileResponse, MediaUploadResponse
│   ├── services/                      # Business logic layer
│   └── main.py                        # FastAPI application entry point & /media static files mount
├── uploads/                           # Local development media storage (gitignored)
│   ├── avatars/                       # Uploaded student avatar images
│   └── banners/                       # Uploaded student profile banners
├── alembic/                           # Database migration scripts
│   ├── versions/
│   │   ├── 20261029_0001_initial_schema.py
│   │   └── 20261029_4f8551731601_add_creator_id_to_events_and_notices.py
│   ├── env.py                         # Alembic migration environment
│   └── script.py.mako                 # Migration template
├── tests/                             # Pytest test suite (isolated in-memory SQLite)
│   ├── conftest.py                    # TestClient & isolated DB fixtures
│   ├── test_auth.py                   # Registration, Argon2 hashing, login & JWT tests
│   ├── test_posts.py                  # Posts CRUD, feed pagination, likes, and comments tests
│   ├── test_events.py                 # Events CRUD, filtering, capacity, and RSVP tests
│   ├── test_notices.py                # Notice board CRUD, pinned priority, and read tracking tests
│   ├── test_communities.py            # Communities CRUD, join/leave, member directory tests
│   ├── test_notifications.py          # Notification isolation, unread count, read-all tests
│   ├── test_profiles.py               # Student profiles, PATCH updates, public profile & user posts tests
│   ├── test_media.py                  # Media upload, magic bytes inspection & size enforcement tests
│   ├── test_root.py                   # Root endpoint & CORS tests
│   └── test_health.py                 # Health probe & DB fallback tests
├── .env.example                       # Environment template with JWT settings
├── alembic.ini                        # Alembic configuration
├── pytest.ini                         # Pytest configuration
├── requirements.txt                   # Production & development dependencies
└── README.md                          # Backend documentation
```

---

## 📋 Prerequisites

- **Python**: Version `3.11+` (tested with Python `3.13.5`)
- **PostgreSQL**: Version `14+`
- **PowerShell**: Windows PowerShell 5.1 or PowerShell 7+

---

## 🚀 Quickstart Guide (Windows PowerShell)

### 1. Navigate to the backend directory
```powershell
cd "c:\Users\nayan\OneDrive\Pictures\Desktop\campus connect\backend"
```

### 2. Activate virtual environment
```powershell
.\.venv\Scripts\Activate.ps1
```

### 3. Run migrations
```powershell
alembic upgrade head
```

### 4. Start development server
```powershell
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
- **Interactive Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **ReDoc UI**: [http://localhost:8000/redoc](http://localhost:8000/redoc)

---

## 📡 API Endpoints Summary

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new student account (`User` + `StudentProfile`). | No |
| `POST` | `/api/v1/auth/login` | OAuth2 form login (`username` = email, `password`). | No |
| `POST` | `/api/v1/auth/login/json` | JSON body login accepting `{ "email": "...", "password": "..." }`. | No |
| `GET` | `/api/v1/auth/me` | Protected route returning authenticated student profile. | **Yes** |

### Posts & Campus Feed (`/api/v1/posts`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/posts` | Create a new campus post with category and tags. | **Yes** |
| `GET` | `/api/v1/posts` | Paginated campus feed sorted newest first (`page`, `limit`, `category`, `search`). Computes `is_liked_by_me`. | Optional |
| `GET` | `/api/v1/posts/{post_id}` | Retrieve single post details. | Optional |
| `DELETE` | `/api/v1/posts/{post_id}` | Delete a post (creator only). | **Yes** |
| `POST` | `/api/v1/posts/{post_id}/like` | Like a post. Enforces unique like constraint. | **Yes** |
| `DELETE` | `/api/v1/posts/{post_id}/like` | Unlike a previously liked post. | **Yes** |
| `POST` | `/api/v1/posts/{post_id}/comments` | Add a comment to a post. | **Yes** |
| `GET` | `/api/v1/posts/{post_id}/comments` | Chronological paginated comments. | Optional |
| `DELETE` | `/api/v1/comments/{comment_id}` | Delete a comment (creator only). | **Yes** |

### Events & RSVP (`/api/v1/events`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/events` | Create a campus event with automated scheduling and organizer fallbacks. | **Yes** |
| `GET` | `/api/v1/events` | Paginated list of events with category, search, and featured filters. Returns RSVP counts and `is_rsvpd`. | Optional |
| `GET` | `/api/v1/events/{event_id}` | Retrieve comprehensive event details. | Optional |
| `PATCH` | `/api/v1/events/{event_id}` | Edit an event. Enforces that only the creator can edit it. | **Yes** |
| `DELETE` | `/api/v1/events/{event_id}` | Delete an event. Enforces that only the creator can delete it. | **Yes** |
| `POST` | `/api/v1/events/{event_id}/rsvp` | RSVP to an event. Enforces capacity limits and prevents duplicate RSVPs. | **Yes** |
| `DELETE` | `/api/v1/events/{event_id}/rsvp` | Cancel an existing confirmed RSVP. | **Yes** |

### Notice Board (`/api/v1/notices`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/notices` | Publish an official campus circular or notice. | **Yes** |
| `GET` | `/api/v1/notices` | Paginated notice board items (pinned notices first, then newest). Returns read counts and `is_read`. | Optional |
| `GET` | `/api/v1/notices/{notice_id}` | Retrieve comprehensive notice details. | Optional |
| `PATCH` | `/api/v1/notices/{notice_id}` | Edit a notice. Enforces that only the creator can edit it. | **Yes** |
| `DELETE` | `/api/v1/notices/{notice_id}` | Delete a notice. Enforces that only the creator can delete it. | **Yes** |
| `POST` | `/api/v1/notices/{notice_id}/read` | Mark a notice as read (idempotent). | **Yes** |

### Communities & Clubs (`/api/v1/communities`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/communities` | Create a student club/community. Creator is assigned lead and first member. | **Yes** |
| `GET` | `/api/v1/communities` | Paginated list of communities with category and search filters. Returns member counts and `is_joined`. | Optional |
| `GET` | `/api/v1/communities/{community_id}` | Retrieve single community details with member count and membership status. | Optional |
| `PATCH` | `/api/v1/communities/{community_id}` | Update community details (creator/lead only). | **Yes** |
| `DELETE` | `/api/v1/communities/{community_id}` | Delete community and cascade memberships (creator/lead only). | **Yes** |
| `POST` | `/api/v1/communities/{community_id}/join` | Join a community. Prevents duplicate memberships. | **Yes** |
| `DELETE` | `/api/v1/communities/{community_id}/join` | Leave a community. Rejects if not a member. | **Yes** |
| `GET` | `/api/v1/communities/{community_id}/members` | Paginated member directory with safe public profiles. | Optional |

### Notifications (`/api/v1/notifications`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/notifications` | Paginated notifications for authenticated user, newest first. Filter by `is_read` or `type`. | **Yes** |
| `GET` | `/api/v1/notifications/unread-count` | Get unread notification count for authenticated user. | **Yes** |
| `PATCH` | `/api/v1/notifications/{notification_id}/read` | Mark a single notification as read (strictly scoped to owner). | **Yes** |
| `PATCH` | `/api/v1/notifications/read-all` | Mark all unread notifications belonging to authenticated user as read. | **Yes** |
| `DELETE` | `/api/v1/notifications/{notification_id}` | Delete a notification (strictly scoped to owner). | **Yes** |

### Student Profiles (`/api/v1/profiles`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/v1/profiles/me` | Retrieve authenticated student's full profile and user account details. | **Yes** |
| `PATCH` | `/api/v1/profiles/me` | Update editable profile attributes (bio, skills, interests, year, location, handle, etc.). Recomputes initials automatically. Disallows editing sensitive user credentials or roles. | **Yes** |
| `GET` | `/api/v1/profiles/{user_id}` | Retrieve safe public profile for another student (never exposes private email or credentials). | Optional |
| `GET` | `/api/v1/profiles/{user_id}/posts` | Paginated posts published by this student, newest first, with like/comment counts and `is_liked_by_me`. | Optional |

### Media Uploads & Serving (`/api/v1/media` & `/media`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/v1/media/avatar` | Upload and validate student profile avatar (JPEG, PNG, WebP, max 5 MB). Validates magic bytes, assigns safe UUID filename, and links to user profile. | **Yes** |
| `POST` | `/api/v1/media/banner` | Upload and validate profile cover banner (JPEG, PNG, WebP, max 8 MB). Validates magic bytes, assigns safe UUID filename, and links to user profile. | **Yes** |
| `GET` | `/media/{folder}/{filename}` | Serve uploaded static media files directly from local storage. | No |

---

## 🧪 Running Automated Tests

Run the full automated test suite using `pytest`:
```powershell
pytest -v
```

All **76 tests** execute against an isolated in-memory SQLite database, guaranteeing that your development PostgreSQL database is never modified or deleted during test runs.

---

## 🔍 Swagger UI Interactive Testing Flow

1. Open [http://localhost:8000/docs](http://localhost:8000/docs) in your browser.
2. Authenticate:
   - Expand `POST /api/v1/auth/login` (or `/login/json`).
   - Submit your student credentials to acquire a JWT `access_token`.
   - Click the green **Authorize** button at the top right of the Swagger UI and paste your token in the format: `Bearer <your_token>`.
3. Profile Management:
   - Try `GET /api/v1/profiles/me` to inspect your full profile.
   - Try `PATCH /api/v1/profiles/me` with a JSON payload updating `bio`, `skills`, or `location`.
4. Media Uploads:
   - Try `POST /api/v1/media/avatar` or `/api/v1/media/banner` using the file picker (upload a PNG, JPEG, or WebP).
   - Verify the returned URL (e.g. `/media/avatars/<uuid>.png`) and visit `http://localhost:8000/media/avatars/<uuid>.png` to view the served file.
   - Run `GET /api/v1/profiles/me` to verify that `avatar_url` or `banner_url` was automatically updated on your profile.
