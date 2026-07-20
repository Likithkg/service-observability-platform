# System Architecture

## Table of Contents

1. [System Overview](#system-overview)
2. [High-Level Architecture](#high-level-architecture)
3. [Component Architecture](#component-architecture)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Database Design](#database-design)
7. [API Design](#api-design)
8. [Real-time Streaming Architecture](#real-time-streaming-architecture)
9. [Deployment Architecture](#deployment-architecture)
10. [Design Decisions & Trade-offs](#design-decisions--trade-offs)

---

## System Overview

Cloud Monitor Service is a full-stack cloud observability platform that provides real-time monitoring of AWS infrastructure resources. The system collects metrics from AWS CloudWatch, stores them in PostgreSQL, and streams live updates to a React frontend via Server-Sent Events (SSE).

**Core Capabilities:**
- User authentication with JWT tokens and Argon2 password hashing
- Multi-resource registration (EC2, S3, Lambda)
- Background metric collection from AWS CloudWatch every 30 seconds
- Real-time metrics streaming to frontend via SSE
- Encrypted storage of AWS credentials using Fernet symmetric encryption

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT LAYER                                  │
├─────────────────────────────────────────────────────────────────────────┤
│  React 18 SPA (Vite)                                                    │
│  ├── Dashboard Component (Application cards grid)                      │
│  ├── Metrics Component (Real-time charts via EventSource)              │
│  ├── AddApplication Component (Resource registration form)             │
│  └── Auth Components (Login, Register, Forgot/Reset Password)          │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    │ HTTPS / CORS
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        API GATEWAY LAYER                                │
├─────────────────────────────────────────────────────────────────────────┤
│  FastAPI Application (Python 3.12)                                      │
│  ├── CORS Middleware                                                     │
│  ├── Request Validation (Pydantic)                                     │
│  └── Response Formatting                                                 │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   AUTH MODULE        │  │ APPLICATIONS     │  │   METRICS        │
│                      │  │ MODULE           │  │                  │
│ • /auth/register     │  │ • CRUD ops       │  │ • GET metrics    │
│ • /auth/login        │  │ • AWS creds mgmt │  │ • SSE streaming  │
│ • /auth/me           │  │ • Soft delete    │  │ • Snapshot API   │
└──────────────────────┘  └──────────────────┘  └──────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        BUSINESS LOGIC LAYER                             │
├─────────────────────────────────────────────────────────────────────────┤
│  • Authentication & Authorization                                       │
│    - JWT token creation/validation (HS256)                              │
│    - Password hashing with Argon2id                                   │
│    - Reset token generation (30-min expiry)                           │
│                                                                         │
│  • Application Management                                               │
│    - Credential encryption/decryption (Fernet)                        │
│    - Per-user application isolation                                   │
│                                                                         │
│  • Metric Collection                                                    │
│    - AWS CloudWatch API integration (boto3)                           │
│    - Collector-specific implementations                               │
│    - Metric configuration via YAML                                    │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
┌──────────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│   DATA ACCESS LAYER  │  │ REALTIME         │  │ EXTERNAL APIs    │
│                      │  │ PROCESSING       │  │                  │
│ • SQLAlchemy ORM     │  │                  │  │ • AWS CloudWatch │
│ • Session Management │  │ • Background     │  │   API (boto3)    │
│ • Encryption Helpers │  │   Poller         │  │ • SSE Streaming  │
│                      │  │ • LATEST_METRICS │  │                  │
└──────────────────────┘  └──────────────────┘  └──────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         PERSISTENCE LAYER                               │
├─────────────────────────────────────────────────────────────────────────┤
│  PostgreSQL 14+ (Schema: observability)                                 │
│  ├── users table                                                       │
│  │   - id, email, password, reset_token, reset_token_expire            │
│  └── applications table                                                │
│      - id, user_id, name, collector_type, cloud, region               │
│      - instance_id, bucket_name, function_name                          │
│      - is_active, encrypted aws keys                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Component Architecture

### 1. Frontend (React SPA)

**Technology Stack:**
- React 18 with JSX
- Vite 7.x build tool
- Tailwind CSS 3.4 for styling
- Recharts 2.10 for data visualization
- Lucide React for icons
- Native `fetch` API for HTTP requests

**Directory Structure:**
```
frontend/src/
├── App.jsx                    # Main app with routing
├── main.jsx                   # React entry point
├── components/                # UI Components
│   ├── Dashboard.jsx          # Application grid view
│   ├── Metrics.jsx            # Real-time chart visualization
│   ├── AddApplication.jsx     # Resource registration form
│   ├── AwsCredentialsForm.jsx # Credential management modal
│   ├── Login.jsx              # Authentication forms
│   ├── Register.jsx
│   ├── ForgotPassword.jsx
│   ├── ResetPassword.jsx
│   └── Navbar.jsx             # Navigation with theme toggle
├── services/
│   └── api.js                 # API client wrapper (authAPI, applicationsAPI, metricsAPI)
└── utils/
    ├── constants.js           # Configuration constants
    └── clouds.js              # Cloud provider definitions
```

**Key Features:**
- Server-Sent Events (EventSource) for real-time metric updates every 5 seconds
- Dark/light theme persistence via localStorage
- Responsive grid layouts with mobile-friendly design
- Form validation and error handling

### 2. Backend API (FastAPI)

**Technology Stack:**
- Python 3.12
- FastAPI async ASGI framework
- SQLAlchemy ORM for database operations
- Pydantic for request/response validation
- Uvicorn ASGI server

**Directory Structure:**
```
├── main.py                    # Application entry point with lifespan
├── auth/                      # Authentication module
│   ├── route.py               # Auth endpoints (register, login, me)
│   ├── security.py            # JWT creation, password hashing utilities
│   ├── dependency.py          # FastAPI dependencies for user authentication
│   └── schema.py              # Pydantic models for auth requests/responses
├── applications/              # Resource management module
│   ├── route.py               # CRUD operations for cloud resources
│   ├── repo.py                # Data access with credential encryption
│   └── schema.py              # Pydantic schemas for applications
├── metrics/                   # CloudWatch integration module
│   ├── route.py               # SSE streaming and snapshot endpoints
│   ├── aws.py                 # EC2 metric collector implementation
│   ├── aws_S3.py              # S3 metric collector implementation
│   ├── aws_labda.py           # Lambda metric collector implementation
│   └── aws_fetcher.py        # Generic CloudWatch API wrapper
├── realtime/                  # Background processing module
│   └── aws_poller.py          # Daemon thread for 30s polling loop
├── database/                  # Database layer
│   ├── models.py              # SQLAlchemy ORM models (User, Application)
│   ├── database.py            # Engine creation and session factory
│   └── base.py                # DeclarativeBase definition
├── config/                    # Configuration
│   └── metrics.yaml           # Metric definitions by AWS namespace
└── helper/                    # Utility functions
    ├── encryption.py          # Fernet encrypt/decrypt helpers
    └── yamlLoader.py          # Metrics configuration loader
```

### 3. Database Layer (PostgreSQL)

**Schema Design:**
All tables reside in the `observability` schema for isolation.

**Users Table:**
- `id`: UUID primary key with auto-generation
- `email`: Unique, indexed email address
- `password`: Argon2 hashed password
- `reset_token`: Temporary token for password recovery (nullable)
- `reset_token_expire`: Token expiration timestamp (nullable)
- `created_at`: Automatic creation timestamp

**Applications Table:**
- `id`: UUID primary key with auto-generation
- `user_id`: Foreign key to users table (CASCADE delete)
- `name`: Application display name
- `collector_type`: Resource type (ec2/s3/lambda)
- `cloud`: Cloud provider identifier
- `region`: AWS region code
- `instance_id`: EC2 instance ID (required for EC2 resources)
- `bucket_name`: S3 bucket name (optional, for S3 resources)
- `function_name`: Lambda function name (optional, for Lambda resources)
- `is_active`: Boolean flag for soft-delete functionality
- `aws_access_key_id`: Encrypted AWS access key
- `aws_secret_access_key`: Encrypted AWS secret key
- `created_at`: Automatic creation timestamp

---

## Data Flow

### 1. User Registration & Authentication Flow

```
┌─────────┐     POST /auth/register      ┌──────────────┐
│ Browser │ ───────────────────────────► │   FastAPI    │
│         │                              │              │
│         │ ◄──────────────────────────  │ • Validate   │
│ JWT     │    201 Created + Token       │ • Hash pwd   │
│         │                              │ • Create user│
└─────────┘                              └──────────────┘
```

**Authentication Process:**
1. User submits email/password to `/auth/login`
2. Backend verifies credentials against PostgreSQL
3. JWT token created with 30-minute expiry (HS256 algorithm)
4. Token returned in response body
5. Frontend stores token in localStorage
6. Subsequent requests include `Authorization: Bearer <token>` header
7. FastAPI dependency `get_current_user` validates token on protected routes

### 2. Application Registration Flow

```
┌─────────┐     POST /applications       ┌──────────────┐      ┌──────────────┐
│ Browser │ ───────────────────────────► │   FastAPI    │      │ PostgreSQL   │
│         │                              │              │      │              │
│         │ ◄──────────────────────────  │ • Validate   │      │ INSERT INTO  │
│ App ID  │    201 Created               │ • Encrypt AWS│ ──► │ applications │
│         │                              │ • Store user │      │              │
└─────────┘                              └──────────────┘      └──────────────┘
```

**Registration Process:**
1. User submits application form with resource details and AWS credentials
2. Backend validates request payload using Pydantic schemas
3. AWS access keys encrypted using Fernet symmetric encryption
4. Application record created in `applications` table linked to authenticated user
5. Encrypted credentials stored alongside application metadata
6. Confirmation returned to frontend

### 3. Metric Collection Flow (Background Poller)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    BACKGROUND POLLER THREAD                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌──────────┐    ┌──────────────┐    ┌──────────────┐             │
│  │ PostgreSQL│───►│   Fetch Apps │───►│ Iterate Apps │             │
│  │ (Active) │    │  from DB     │    │              │             │
│  └──────────┘    └──────────────┘    └──────┬───────┘             │
│                                             │                       │
│                                    ┌────────▼────────┐            │
│                                    │ Decrypt AWS Creds│            │
│                                    └────────┬────────┘            │
│                                             │                       │
│                     ┌───────────────────────┼──────────────────┐   │
│                     ▼                       ▼                  │   │
│              ┌─────────────┐      ┌────────────────┐         │   │
│              │ EC2 Collector│      │ S3/Lambda      │         │   │
│              │ (aws.py)    │      │ Collectors     │         │   │
│              └──────┬──────┘      │ (aws_S3,       │         │   │
│                     │             │  aws_labda)    │         │   │
│                     ▼             └────────┬───────┘         │   │
│              ┌─────────────┐               │                 │   │
│              │ AWS CloudWatch│ ◄─────────────┘               │   │
│              │ API (boto3)  │                                 │   │
│              └──────┬──────┘                                 │   │
│                     ▼                                        │   │
│              ┌─────────────┐                                 │   │
│              │ Store in    │                                 │   │
│              │ LATEST_METRICS│                               │   │
│              │ (in-memory)  │                                 │   │
│              └─────────────┘                                 │   │
│                                                              │   │
│  Polls every 30 seconds                                      │   │
└─────────────────────────────────────────────────────────────────────┘
```

**Collection Process:**
1. Daemon thread starts on application startup via `start_poller_thread()`
2. Every 30 seconds, queries PostgreSQL for active applications (`is_active = True`)
3. For each application:
   - Decrypts AWS credentials from database using Fernet
   - Routes to appropriate collector based on `collector_type`:
     - **EC2**: Calls `collect_ec2_metrics()` with instance ID and region
     - **S3**: Calls `collect_S3_metrics()` with bucket name and region
     - **Lambda**: Calls `collect_lambda_metrics()` with function name and region
4. Collectors use boto3 to query AWS CloudWatch API for metric statistics
5. Results stored in global `LATEST_METRICS` dictionary keyed by application ID
6. Error handling ensures single collector failure doesn't stop the entire polling cycle

### 4. Real-time Metrics Streaming Flow (SSE)

```
┌─────────┐     GET /metrics/{app_id}/realtime   ┌──────────────┐
│ Browser │ ───────────────────────────────────► │   FastAPI    │
│         │                                      │              │
│ EventSource│                                  │ • Verify app │
│           │ ◄═════════════════════════════════  │ • SSE stream │
│ (5s updates)                                    │ from LATEST_ │
└─────────┘                                      │ METRICS      │
                                                 └──────────────┘
```

**Streaming Process:**
1. Frontend establishes EventSource connection to `/metrics/{app_id}/realtime`
2. Backend verifies application ownership (user must own the app)
3. Server-Sent Events endpoint streams updates every 5 seconds:
   - For EC2: CPU, memory, network in/out, disk usage metrics
   - For S3: Bucket size and object count metrics
4. Each SSE event contains JSON-formatted metric data with timestamp
5. Connection maintained via keep-alive headers for persistent streaming

---

## Security Architecture

### 1. Authentication & Authorization

**JWT Token Structure:**
```json
{
  "exp": <expiration_timestamp>,
  "sub": "<user_id>"
}
```

**Token Lifecycle:**
- **Creation**: Generated upon successful login with 30-minute expiry
- **Storage**: Client-side in localStorage (note: HttpOnly cookies recommended for production)
- **Validation**: Every protected endpoint validates token via `get_current_user` dependency
- **Algorithm**: HS256 (HMAC-SHA256) using `SECRET_KEY` environment variable

**Password Security:**
- **Hashing Algorithm**: Argon2id (via passlib)
- **Salt Generation**: Automatic per-password salt generation
- **Storage**: Only hashed passwords stored in database (never plaintext)

### 2. Credential Encryption

**AWS Credentials Protection:**
- **Algorithm**: Fernet symmetric encryption (AES-128-CBC + HMAC-SHA256)
- **Key Management**: 
  - Production: `ENCRYPTION_KEY` environment variable (required)
  - Development: Auto-generated key with warning message
- **Encryption Points**:
  - On application creation (`repo.py`)
  - On credential update (`POST /applications/{app_id}/aws-credentials`)
- **Decryption Points**: 
  - During metric collection by background poller
  - Never exposed in API responses

**Encryption Flow:**
```
User Input → Pydantic Validation → Fernet.encrypt() → PostgreSQL Storage
                                                                    ↓
Background Poller ← Fernet.decrypt() ← Encrypted Value from DB
```

### 3. Password Recovery Security

**Reset Token Mechanism:**
- **Generation**: Cryptographically secure random token (`secrets.token_urlsafe(32)`)
- **Storage**: `reset_token` and `reset_token_expire` columns in users table
- **Expiry**: 30 minutes from generation time
- **Usage**: Single-use only (cleared after successful password reset)

**Flow:**
1. User requests password reset → token generated, stored with expiry
2. Email sent with reset link containing token
3. User submits new password with token
4. Backend validates token exists and hasn't expired
5. Password updated, token cleared from database

### 4. CORS Configuration

**Allowed Origins:**
- Production: `https://service-observability-platform.vercel.app`
- Development: `http://localhost:3000`, `http://localhost:5173`, `http://localhost:8000`
- Staging: `https://*.trycloudflare.com`

**CORS Headers:**
- `Access-Control-Allow-Credentials`: true (enables cookie-based auth)
- `Access-Control-Allow-Methods`: * (all methods allowed)
- `Access-Control-Allow-Headers`: * (all headers allowed)

---

## Database Design

### Schema Isolation

All application data resides in the `observability` schema to provide:
- **Logical separation** from other potential databases on the same PostgreSQL instance
- **Permission scoping** for database users with limited access
- **Backup/restore granularity** for observability-specific data

### Indexing Strategy

| Table | Column | Type | Purpose |
|-------|--------|------|---------|
| `users` | `email` | Unique Index | Fast lookup during authentication |
| `applications` | `id` | Primary Key | Row identification |
| `applications` | `user_id` | Non-unique Index | Fast filtering by owner for multi-user isolation |

### Relationship Model

```
User (1) ──< (N) Application
   │                   │
   │                   ├── collector_type: ec2/s3/lambda
   │                   ├── is_active: boolean (soft-delete)
   │                   └── encrypted AWS credentials
   │
   └── reset_token: string (nullable, temporary)
```

**Cascade Behavior:**
- Deleting a user cascades to all their applications (`ON DELETE CASCADE`)
- Ensures referential integrity and prevents orphaned application records

### Soft Delete Implementation

Rather than permanent deletion, applications use an `is_active` boolean flag:
- **Deletion**: Sets `is_active = False` instead of physical delete
- **Querying**: Poller only processes active applications (`WHERE is_active = True`)
- **Recovery**: Can restore deleted applications by setting `is_active = True`

---

## API Design

### RESTful Endpoint Structure

**Authentication Endpoints:**
```
POST   /auth/register          # Create new user account
POST   /auth/login             # Authenticate and receive JWT token
GET    /auth/me                # Get current authenticated user info
POST   /auth/forgot-password   # Initiate password reset flow
POST   /auth/reset-password    # Complete password reset with token
```

**Application Management Endpoints:**
```
GET    /applications           # List all applications for current user
POST   /applications           # Register new cloud resource
GET    /applications/{app_id}  # Get specific application details
DELETE /applications/{app_id}  # Soft-delete an application
PUT    /applications/{app_id}/aws-credentials  # Update AWS credentials
```

**Metrics Endpoints:**
```
GET    /metrics/{app_id}              # Get latest metrics snapshot
GET    /metrics/{app_id}/realtime     # Stream real-time metrics via SSE
```

### Request/Response Patterns

**Authentication Response (Login):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer"
}
```

**Application Creation Request:**
```json
{
  "name": "production-web-server",
  "collector_type": "ec2",
  "cloud": "aws",
  "region": "us-east-1",
  "instance_id": "i-0abc123def456789",
  "aws_access_key_id": "...",      // Will be encrypted before storage
  "aws_secret_access_key": "..."   // Will be encrypted before storage
}
```

**Application Response:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "user_id": "...",
  "name": "production-web-server",
  "collector_type": "ec2",
  "cloud": "aws",
  "region": "us-east-1",
  "instance_id": "i-0abc123def456789",
  "is_active": true,
  "created_at": "2023-07-20T10:30:00Z"
}
```

**Real-time Metrics Response (SSE event):**
```json
{
  "timestamp": "2023-07-20T10:35:00Z",
  "cpu": 45.2,
  "memory": 68.7,
  "network_in": 10.5,      // MB/s
  "network_out": 8.3,      // MB/s
  "network": 18.8,         // Total MB/s
  "disk": 42.1
}
```

---

## Real-time Streaming Architecture

### Server-Sent Events (SSE) Implementation

**Protocol Overview:**
- **Direction**: Unidirectional (server → client only)
- **Transport**: HTTP/HTTPS with persistent connection
- **Format**: Text-based events with specific delimiters
- **Reconnection**: Automatic by browser EventSource API on disconnect

**SSE Message Format:**
```
event: metrics_update
data: {"timestamp": "...", "cpu": 45.2, ...}

id: 1234567890

```

**Implementation Details:**

1. **Endpoint**: `GET /metrics/{app_id}/realtime`
2. **Authentication**: Token required in query parameter (for SSE compatibility)
3. **Ownership Verification**: Validates application belongs to authenticated user
4. **Streaming Loop**:
   - Polls `LATEST_METRICS` dictionary every 5 seconds
   - Formats metrics based on collector type (EC2 vs S3)
   - Yields formatted JSON as SSE event data
5. **Headers**:
   - `Cache-Control: no-cache` — Prevents caching proxies from buffering responses
   - `Connection: keep-alive` — Maintains persistent connection
   - `X-Accel-Buffering: no` — Disables nginx buffering (if applicable)

**Frontend Integration:**
```javascript
const eventSource = new EventSource(`/metrics/${appId}/realtime?token=${token}`);

eventSource.onmessage = (event) => {
  const metrics = JSON.parse(event.data);
  updateCharts(metrics);
};

eventSource.onerror = () => {
  console.error('SSE connection error');
};
```

**Advantages of SSE over WebSockets:**
- Simpler implementation (HTTP-based, no new protocol)
- Built-in reconnection logic in browsers
- Easier to debug and proxy through existing infrastructure
- Sufficient for unidirectional data flow (server → client metrics)

---

## Deployment Architecture

### Docker Containerization

**Backend Container (`Dockerfile`):**
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Frontend Container (`Dockerfile.frontend`):**
- Multi-stage build for optimized image size
- Stage 1: Build React application with Vite
- Stage 2: Serve static files with `serve` package

**Docker Compose Orchestration:**
```yaml
services:
  backend:
    build: .
    ports:
      - "8000:8000"
    environment:
      - DATA_BASE_URL=postgresql://user:pass@db:5432/observability_db
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend

  # Note: PostgreSQL service should be added for full stack deployment
```

### Cloud Deployment Options

**Fly.io (Backend):**
- Configuration in `fly.toml`
- 512MB VM allocation
- Region: IAD (Ashburn, Virginia)
- Auto-rollback enabled on deployment failures
- Command: `flyctl launch && flyctl deploy`

**Vercel (Frontend):**
- Automatic deployment from git push
- SPA routing configured via `vercel.json` with rewrites to `/index.html`
- Environment variables managed in Vercel dashboard
- Edge network for global low-latency access

**Railway (Backend Alternative):**
- Procfile-based deployment: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add PostgreSQL add-on for database service
- Automatic environment variable injection from Railway secrets

### Remote Build Script (`script/build.py`)

Automated SSH-based deployment pipeline:
1. Validates SSH certificate permissions (chmod 600)
2. Verifies Git access to repository
3. Clones repository if not present on remote VM
4. Pulls latest changes from specified branch
5. Installs Docker if missing on target VM
6. Stops existing container if running
7. Rebuilds and restarts containers with `docker-compose up -d --build`
8. Streams live build logs to local terminal

---

## Design Decisions & Trade-offs

### 1. In-Memory Metrics Storage (`LATEST_METRICS`)

**Decision**: Store recent metrics in a global Python dictionary rather than PostgreSQL.

**Rationale:**
- **Performance**: Sub-millisecond retrieval for SSE streaming without database overhead
- **Simplicity**: Avoids complex time-series database integration (InfluxDB, TimescaleDB)
- **Development Speed**: Faster iteration during early development phase

**Trade-offs:**
- ❌ **Data Loss**: Metrics lost on server restart
- ❌ **No Historical Queries**: Cannot query past metrics beyond current session
- ❌ **Memory Growth**: Dictionary grows with number of applications (mitigated by overwriting)

**Future Improvement**: Implement time-series database integration for persistent metric storage and historical analysis.

### 2. Background Thread Polling vs Async Task Queue

**Decision**: Use a simple daemon thread instead of Celery/RQ task queue.

**Rationale:**
- **Simplicity**: Single-process deployment without additional infrastructure (Redis, workers)
- **Low Volume**: Small number of applications makes threading sufficient
- **Operational Overhead**: No need to manage worker processes and message brokers

**Trade-offs:**
- ❌ **Scalability Limits**: Thread per application would be needed for thousands of apps
- ❌ **Fault Isolation**: One failing collector could potentially block the entire poller (mitigated by try/except)
- ❌ **Monitoring Difficulty**: Harder to monitor and scale individual collection tasks

**Future Improvement**: Migrate to Celery with Redis broker for distributed task processing when scaling beyond hundreds of applications.

### 3. Fernet Encryption for AWS Credentials

**Decision**: Use symmetric encryption (Fernet) instead of asymmetric (AWS KMS, HashiCorp Vault).

**Rationale:**
- **Simplicity**: Single key management without external service dependencies
- **Performance**: Faster than asymmetric operations (though negligible at this scale)
- **Development Speed**: Easier to implement and debug

**Trade-offs:**
- ❌ **Key Distribution**: Same key needed everywhere the data is decrypted (poller, future services)
- ❌ **Rotation Complexity**: Key rotation requires re-encrypting all stored credentials
- ❌ **Security Boundary**: If encryption key is compromised, all credentials are exposed

**Future Improvement**: Integrate AWS KMS for envelope encryption or HashiCorp Vault for secret management with automatic rotation.

### 4. Server-Sent Events vs WebSockets

**Decision**: Use SSE instead of WebSocket for real-time metric streaming.

**Rationale:**
- **Unidirectional Flow**: Metrics only flow server → client (no need for bidirectional communication)
- **Browser Support**: Native `EventSource` API with automatic reconnection
- **Infrastructure Compatibility**: Works through standard HTTP proxies and load balancers without special configuration

**Trade-offs:**
- ❌ **No Client-to-Server Real-time**: Cannot stream updates from client (e.g., user actions needing immediate feedback)
- ❌ **Protocol Limitation**: Text-based format less efficient than binary WebSocket frames for high-volume data

**Future Improvement**: Consider WebSocket if bidirectional real-time features are needed (e.g., collaborative dashboards, instant alerting acknowledgment).

### 5. Soft Delete vs Hard Delete

**Decision**: Use `is_active` boolean flag instead of physical deletion.

**Rationale:**
- **Data Recovery**: Allows restoration of accidentally deleted applications
- **Audit Trail**: Maintains history of all registered resources over time
- **Referential Integrity**: Prevents orphaned metric records if they were stored in database

**Trade-offs:**
- ❌ **Query Complexity**: All queries must filter by `is_active = True`
- ❌ **Storage Growth**: Deleted applications remain in database indefinitely
- ❌ **UI Confusion**: Users might expect permanent deletion after "Delete" action

**Future Improvement**: Implement automated cleanup job to archive or permanently delete inactive applications older than X days.

### 6. YAML Configuration for Metrics

**Decision**: Define metric collections in `config/metrics.yaml` instead of hardcoding in Python.

**Rationale:**
- **Flexibility**: Non-developers can add new metrics without code changes
- **Namespace Organization**: Clear separation by AWS service (EC2, S3, Lambda)
- **Maintainability**: Centralized configuration easier to review and update

**Trade-offs:**
- ❌ **No Runtime Validation**: YAML schema not validated at startup
- ❌ **Typo Risk**: Misspelled metric names fail silently or cause runtime errors
- ❌ **Documentation Gap**: Users must understand CloudWatch API to add valid metrics

**Future Improvement**: Implement YAML schema validation with Pydantic models and comprehensive documentation for supported metrics.

---

## Future Architecture Considerations

### 1. Time-Series Database Integration

**Current Limitation**: In-memory `LATEST_METRICS` dictionary loses data on restart and provides no historical queries.

**Proposed Solution**: 
- Integrate InfluxDB or TimescaleDB (PostgreSQL extension)
- Store all collected metrics with timestamps
- Enable time-range queries for historical analysis
- Implement metric retention policies (e.g., keep 30 days of high-resolution data, aggregate to daily thereafter)

### 2. Alerting System

**Current Limitation**: No mechanism to detect and notify about anomalous metric values.

**Proposed Solution**:
- Define alert rules per application (e.g., CPU > 90% for 5 minutes)
- Implement threshold evaluation engine in poller
- Support multiple notification channels: email, Slack, webhooks
- Alert history stored in database for audit and reporting

### 3. Multi-Cloud Support

**Current Limitation**: Only AWS CloudWatch integration implemented.

**Proposed Solution**:
- Abstract metric collection behind provider interface:
  ```python
  class MetricsCollector(Protocol):
      def collect(self, resource_id: str) -> dict[str, float]: ...
  
  class AWSCloudWatchCollector(MetricsCollector): ...
  class GCPStackdriverCollector(MetricsCollector): ...
  class AzureMonitorCollector(MetricsCollector): ...
  ```
- Provider-specific credential management
- Unified metric format for consistent frontend visualization

### 4. Kubernetes Deployment

**Current Limitation**: Docker Compose suitable for development and small deployments, not production-grade Kubernetes setups.

**Proposed Solution**: 
- Helm charts for backend and frontend
- ConfigMaps and Secrets for environment configuration
- Horizontal Pod Autoscaler based on CPU/memory usage
- Ingress controller with TLS termination
- Service mesh integration (Istio/Linkerd) for observability

### 5. GraphQL API Layer

**Current Limitation**: REST endpoints return fixed data shapes, leading to over-fetching or under-fetching.

**Proposed Solution**:
- Implement Apollo Server or Strawberry GraphQL gateway
- Define schema with queries and subscriptions:
  ```graphql
  type Query {
    applications: [Application!]!
    application(id: ID!): Application
    metrics(appId: ID!, from: DateTime, to: DateTime): [MetricPoint!]!
  }
  
  type Subscription {
    realtimeMetrics(appId: ID!): MetricPoint!
  }
  ```
- Enable frontend to request exact data shape needed

### 6. OAuth2/Social Login

**Current Limitation**: Only email/password authentication supported.

**Proposed Solution**:
- Add GitHub, Google, Microsoft OAuth2 providers
- Implement PKCE flow for security
- Store social provider user IDs in separate `social_accounts` table
- Allow linking multiple social accounts to single user

---

## Monitoring & Observability (Internal)

### Application Health Checks

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "ok",
  "message": "Server is running"
}
```

**Usage**: 
- Load balancer health checks
- Kubernetes liveness/readiness probes
- Uptime monitoring services (UptimeRobot, Pingdom)

### Database Connection Monitoring

**Implementation**: SQLAlchemy `engine.connect()` test queries during startup and periodic validation.

**Failure Handling**: Log connection errors with retry logic; alert operators via configured notification channels.

### Metric Collection Success Rate

**Tracking**: Count successful vs failed CloudWatch API calls per poller iteration.

**Alerting Threshold**: >10% failure rate triggers operator notification for AWS API issues or credential problems.

---

## Security Considerations

### Threat Model

**Assets to Protect:**
- User credentials (passwords, reset tokens)
- AWS access keys (encrypted at rest)
- Application data (multi-tenant isolation)
- Metric collection infrastructure (CloudWatch API calls)

**Threat Vectors:**
1. **Credential Theft**: Brute force attacks on authentication endpoints → Mitigated by Argon2 hashing and rate limiting (future)
2. **AWS Key Exposure**: Database breach exposing encrypted keys → Mitigated by Fernet encryption; further improved with KMS integration
3. **Multi-tenant Data Leak**: User A accessing User B's applications → Mitigated by `user_id` filtering on all queries
4. **SSE Injection**: Malformed metric data in streaming responses → Mitigated by JSON serialization and CORS headers

### Rate Limiting (Future)

**Current State**: No rate limiting implemented.

**Proposed Implementation**:
- Use `slowapi` library for FastAPI
- Apply limits per IP address:
  - Login attempts: 5 per minute
  - API calls: 100 per minute
  - SSE connections: 10 per user
- Return `429 Too Many Requests` with retry-after header

### Input Validation

**Current State**: Pydantic models validate request payloads.

**Enhancement Opportunities**:
- Validate AWS region codes against known valid values
- Sanitize application names to prevent XSS in frontend rendering
- Validate instance IDs, bucket names, function names against AWS resource naming rules

---

*Last Updated: July 2026*
*Document Version: 1.0*
