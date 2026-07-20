# Cloud Monitor Service

<p align="center">
  <strong>A real-time cloud observability platform for monitoring AWS resources with live metrics streaming.</strong>
</p>

<div align="center">

[![Python](https://img.shields.io/badge/Python-3.12-blue)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-modern-green)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-purple)](https://reactjs.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-blue)](https://postgresql.org)

</div>

---

## ✨ Overview

Cloud Monitor Service provides real-time visibility into your AWS infrastructure. Register EC2 instances, S3 buckets, or Lambda functions, and watch their metrics stream live through an intuitive dashboard powered by Server-Sent Events (SSE).

**Key capabilities:**
- 📊 **Real-time monitoring** — CloudWatch metrics polled every 30s, streamed to frontend via SSE
- 🔐 **Secure credential storage** — AWS keys encrypted at rest using Fernet symmetric encryption
- ☁️ **Multi-resource support** — EC2, S3, Lambda with comprehensive metric coverage
- 🎨 **Modern UI** — React + Tailwind CSS with dark/light theme support
- 🚀 **Production-ready** — Docker deployment with Fly.io, Vercel, or Railway

---

## 🏗️ Architecture

```mermaid
graph TB
    subgraph "Frontend"
        A[React 18 SPA] --> B[Vite Dev Server :3000]
        B --> C[Tailwind CSS + Recharts]
    end
    
    subgraph "Backend API"
        D[FastAPI :8000] --> E[Auth System<br/>JWT + Argon2]
        D --> F[Application CRUD]
        D --> G[Metric Collection]
        G --> H[Background Poller<br/>30s interval]
        H --> I[AWS CloudWatch API]
    end
    
    subgraph "Data Layer"
        J[(PostgreSQL)] --> K[Encrypted Credentials]
        J --> L[Application Data]
        J --> M[Metric History]
    end
    
    B -.->|Proxy /api/*| D
    E --> J
    F --> J
```

---

## 🚀 Quick Start

### Prerequisites

- **Python** 3.12+
- **Node.js** 18+ (or 20 for Docker builds)
- **PostgreSQL** 14+
- **AWS Account** with CloudWatch access

### Backend Setup

```bash
# Clone and setup backend
git clone <repository-url>
cd service-observability-platform

python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Configure environment variables
export DATA_BASE_URL="postgresql://user:password@localhost/observability"
export SECRET_KEY="your-jwt-secret-key"
export ENCRYPTION_KEY="your-fernet-key"  # Optional: auto-generates in dev

# Start the API server
python main.py
# → API available at http://localhost:8000
# → Swagger docs at http://localhost:8000/docs
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# → UI available at http://localhost:3000
# → Proxies API requests to localhost:8000
```

### Docker Deployment

```bash
docker-compose up -d
# Backend API runs on port 8000
# Note: Include PostgreSQL and frontend services for full stack
```

---

## 📦 Project Structure

```
service-observability-platform/
├── main.py                          # FastAPI application entry point
├── requirements.txt                 # Python dependencies
├── Dockerfile                       # Backend container image
├── docker-compose.yaml              # Multi-container orchestration
│
├── auth/                            # Authentication & authorization
│   ├── route.py                     # Auth endpoints (register, login, me)
│   ├── security.py                  # JWT creation, password hashing
│   └── dependency.py                # Request dependencies (get_current_user)
│
├── applications/                    # Resource management
│   ├── route.py                     # CRUD operations for cloud resources
│   ├── repo.py                      # Data access with credential encryption
│   └── schema.py                    # Pydantic request/response models
│
├── metrics/                         # CloudWatch integration
│   ├── route.py                     # SSE streaming endpoint
│   ├── aws.py                       # EC2 metric collector
│   ├── aws_S3.py                    # S3 metric collector
│   ├── aws_labda.py                 # Lambda metric collector
│   └── aws_fetcher.py              # Generic CloudWatch API wrapper
│
├── realtime/                        # Background processing
│   └── aws_poller.py               # 30s polling loop for active apps
│
├── config/                          # Configuration
│   └── metrics.yaml                # Metric definitions by namespace
│
├── helper/                          # Utilities
│   ├── encryption.py               # Fernet encrypt/decrypt helpers
│   └── yamlLoader.py              # Metrics configuration loader
│
└── frontend/                        # React SPA
    ├── src/
    │   ├── App.jsx                  # Main application with routing
    │   ├── services/api.js         # API client (fetch-based)
    │   ├── components/             # UI components
    │   │   ├── Dashboard.jsx       # Application cards grid
    │   │   ├── Metrics.jsx         # Real-time chart visualization
    │   │   └── AddApplication.jsx  # Resource registration form
    │   └── utils/                  # Constants and helpers
    └── vite.config.js              # Dev server with API proxy
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Purpose | Required |
|----------|---------|----------|
| `DATA_BASE_URL` | PostgreSQL connection string | ✅ Yes |
| `SECRET_KEY` | JWT signing secret (HS256) | ✅ Yes |
| `ENCRYPTION_KEY` | Fernet key for AWS credential encryption | Optional |
| `AWS_ACCESS_KEY_ID` | Global AWS credentials (fallback) | Per-app or env |
| `AWS_SECRET_ACCESS_KEY` | Global AWS credentials (fallback) | Per-app or env |

### Metrics Configuration

Metrics are defined in `config/metrics.yaml` by AWS namespace:

```yaml
ec2:
  - metric: CPUUtilization
    statistic: Average
  - metric: NetworkIn
    statistic: Sum
    
s3:
  - metric: BucketSizeBytes
    statistic: Maximum
    
lambda:
  - metric: Invocations
    statistic: Sum
```

---

## 🎯 Features

### Authentication & Security
- User registration with email/password
- JWT-based authentication (HS256)
- Password hashing with Argon2id
- Forgot/reset password flow with 30-minute token expiry
- Encrypted AWS credential storage (Fernet symmetric encryption)

### Cloud Resource Monitoring

**EC2 Instances**
- CPU Utilization (Average, Maximum)
- Network In/Out traffic
- Status Check Failed (System)
- CPUCreditBalance
- CWAgent memory and disk usage metrics

**S3 Buckets**
- Bucket Size in bytes
- Number of Objects

**Lambda Functions**
- Invocations count
- Errors count
- Throttles count
- Average Duration
- Maximum Duration
- Concurrent Executions

### Real-time Data Streaming
- **Collection**: Background poller queries CloudWatch every 30 seconds
- **Storage**: Metrics stored in PostgreSQL with rolling history
- **Streaming**: Server-Sent Events (SSE) push updates to frontend every 5 seconds
- **Visualization**: Recharts LineChart with 20-point rolling window

### User Experience
- Responsive design with mobile-friendly layouts
- Dark/light theme toggle
- Per-user application isolation
- Soft-delete with cascading relationships

---

## 🌐 Deployment Options

### Fly.io (Backend)
```bash
flyctl launch
flyctl deploy
# Configured in fly.toml (512MB VM, iad region)
```

### Vercel (Frontend)
- Automatic deployment from git push
- SPA routing configured via `vercel.json`
- Environment variables set in Vercel dashboard

### Railway (Backend)
- Deploy via Procfile: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- Add PostgreSQL add-on for database

### Remote VM Deployment
```bash
python script/build.py
# SSH-based remote Docker build and deploy
```

---

## 🧪 Development

### Running Tests
```bash
pytest tests/
```

*Note: Test suite is currently being developed. No actual tests exist yet despite the existing test directory structure.*

### API Documentation
Once the backend is running, interactive API documentation is available at:
- **Swagger UI**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

---

## 🔮 Roadmap

- [ ] Comprehensive test suite (unit + integration)
- [ ] Additional AWS service support (RDS, DynamoDB, ECS)
- [ ] Alerting and notification system
- [ ] Historical data export (CSV, JSON)
- [ ] Multi-cloud support (GCP, Azure)
- [ ] Kubernetes deployment manifests
- [ ] GraphQL API layer

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request


