# Service Observability Platform

A full-stack application for monitoring and managing cloud service metrics in real-time, built with **FastAPI** (backend), **Vite SPA** (frontend, plain JS/JSX, no React), and **PostgreSQL** (database). The platform provides a user-friendly interface to register applications, authenticate securely, and visualize AWS metrics with live updates.

## Features

- **User Authentication**: Secure JWT-based authentication with role-based access control
- **Application Management**: Create, view, and delete applications with ease
- **Real-time Metrics Visualization**: Display CPU, Memory, Network, and Disk metrics with live streaming updates
- **Dark/Light Theme**: Global theme system persisted across sessions
- **AWS Integration**: Fetch and monitor real-time AWS metrics from CloudWatch
- **Responsive Design**: Tailwind CSS for modern, mobile-friendly UI
- **Docker Support**: Complete containerization for development and production deployment

## Tech Stack

### Backend
- **Framework**: FastAPI (Python 3.12)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with Bearer scheme
- **Real-time**: Server-Sent Events (SSE) for metrics streaming
- **Cloud**: AWS SDK for CloudWatch metrics integration

### Frontend
- **Framework**: Vite SPA (plain JS/JSX, no React)
- **Styling**: Tailwind CSS
- **Charts**: (Add your charting library or custom implementation)
- **Icons**: (Add your icon library or custom SVGs)
- **State Management**: LocalStorage, custom hooks/utilities
- **HTTP Client**: axios

## Project Structure

```
├── api/                    # FastAPI application setup
├── auth/                   # Authentication & authorization
├── applications/           # Application management (CRUD)
├── metrics/                # Metrics endpoints & visualization
├── realtime/               # Real-time metrics polling
├── database/               # SQLAlchemy models & ORM
├── config/                 # Configuration & metrics schema
├── helper/                 # Utility functions
├── frontend/               # Vite SPA application
│   ├── src/
│   │   ├── components/     # UI Components (Dashboard, Metrics, Auth, etc.)
│   │   ├── services/       # API client (axios)
│   │   └── utils/          # Constants & helpers
│   └── package.json
├── main.py                 # Application entry point
├── Dockerfile              # Backend containerization
├── Dockerfile.frontend     # Frontend containerization
├── docker-compose.yaml     # Multi-service orchestration
├── fly.toml                # Fly.io deployment configuration
└── DOCKER_SETUP.md         # Docker setup documentation
```

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose (optional)

### Backend Setup

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:password@localhost/observability_db"
export SECRET_KEY="your-secret-key"
export AWS_ACCESS_KEY_ID="your-aws-key"
export AWS_SECRET_ACCESS_KEY="your-aws-secret"
export AWS_REGION="us-east-1"

# Run migrations (if applicable)
# Alembic or manual setup depending on setup

# Start the server
python main.py
# Server runs on http://localhost:8000
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Set environment variables
export VITE_API_URL="http://localhost:8000"

# Start development server
npm run dev
# App runs on http://localhost:5173
```

## Docker Deployment

### Local Development with Docker Compose

```bash
docker-compose up -d
```

This starts:
- **PostgreSQL** (port 5432)
- **Backend API** (port 8000)
- **Frontend** (port 3000)

### Production Deployment

- **Frontend**: Deploy to Vercel (SPA routing via vercel.json)
- **Backend**: Deploy to Railway or Fly.io

See [DOCKER_SETUP.md](DOCKER_SETUP.md) for detailed Docker setup instructions.

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login and receive JWT token
- `GET /auth/me` - Get current user info

### Applications
- `GET /applications` - List all applications
- `POST /applications` - Create new application
- `GET /applications/{app_id}` - Get application details
- `DELETE /applications/{app_id}` - Delete application

### Metrics
- `GET /metrics/{app_id}` - Get latest metrics
- `GET /metrics/{app_id}/realtime` - Stream real-time metrics (SSE)

## Key Components

### Dashboard Component
Displays registered applications with options to:
- View application details
- Delete applications (with confirmation)
- Toggle between dark and light themes

### Metrics Component
Visualizes real-time metrics with:
- 4 interactive line charts (CPU, Memory, Network, Disk)
- 2-column responsive grid layout
- Real-time updates via EventSource
- Dark theme support

### Authentication Flow
- Users register with email and password
- Credentials validated, JWT token generated
- Token stored in localStorage and sent with requests
- Protected endpoints verify token via dependency injection

## Environment Variables

### Backend
```
DATABASE_URL=postgresql://user:password@localhost/observability_db
SECRET_KEY=your-secret-key-here
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret
AWS_REGION=us-east-1
```

### Frontend
```
VITE_API_URL=http://localhost:8000
```

## Testing

### Backend Tests
```bash
pytest
pytest test/test_auth.py
```

### Frontend Tests
```bash
npm run test
```

## Future Plans & Enhancements

- [ ] Multi-stage Docker builds for optimized production images
- [ ] Gunicorn + Uvicorn for production-grade ASGI serving
- [ ] HttpOnly cookies for token storage (security improvement)
- [ ] Advanced metrics analytics and alerts
- [ ] User role management and permissions
- [ ] Comprehensive test coverage (backend & frontend)
- [ ] CI/CD pipeline setup (GitHub Actions, Vercel, Railway)
- [ ] OAuth2/Social login support
- [ ] Multi-cloud provider support (GCP, Azure)
- [ ] Customizable dashboards and widgets
- [ ] Notification system (email, Slack, etc.)
- [ ] Improved error handling and logging
- [ ] Accessibility improvements
- [ ] Internationalization (i18n)

---

# 🚀 Remote Build & Deployment Script (Cloud VM / Azure VM)

This project includes a local deployment automation script that allows you to build and deploy the application on a remote cloud VM (such as an Azure VM) directly from your local machine.

### What the Script Does

- Connects to a remote VM using SSH
- Validates `.pem` certificate permissions
- Verifies Git access
- Clones repository (if missing)
- Pulls latest changes
- Installs Docker (if missing)
- Stops running container (if exists)
- Rebuilds Docker image
- Restarts container
- Streams live build logs
- Automatically closes SSH connection even if the build fails

---

## 📂 Certificate Setup

Place your SSH private key inside:

```
script/cert/
```

Example:

```
script/
 ├── cert/
 │   └── observability_key.pem
```

---

## ⚙️ Required `.env` Variables for Build Script

```
HOST_NAME=YOU_HOST_NAME
HOST_IP=HOST_IP
CERT_NAME=file.pem
SSH_PORT=22
CONTAINER_NAME=CINTAINER_NAME
REPO_URL=REPO_URL
REPO_PATH=PROJECT_PATH_IN_VM
GIT_BRANCH=DESIRED_BRANCH
YAML_NAME=cmd.yaml
```

---

## 📜 YAML Deployment Configuration

Deployment commands are defined in:

```
script/cmd/commands.yaml
```

You may modify this file as required to customize deployment steps.

Example:

```yaml
tasks:
  - name: check_git_login
    command: "git ls-remote {repo_url}"

  - name: check_repo_cloned
    command: "test -d {repo_path}"

  - name: clone_repo
    command: "git clone -b {branch} {repo_url} {repo_path}"

  - name: pull_latest
    command: "cd {repo_path} && git pull origin {branch}"

  - name: check_docker
    command: "docker --version"

  - name: install_docker
    command: "curl -fsSL https://get.docker.com | sh"

  - name: check_container
    command: "docker ps -q -f name={image_name}"

  - name: docker_down
    command: "cd {repo_path} && docker-compose down"

  - name: docker_build
    command: "cd {repo_path} && docker-compose up -d --build"
```

---

## ▶️ Running the Build Script

From your local machine:

```bash
python build.py
```

This script can be used when the code is deployed on a cloud VM such as an Azure VM or any SSH-accessible Linux server.

It enables automated remote builds without manually logging into the VM.