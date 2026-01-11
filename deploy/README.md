# DB Monitor Deployment Files

This directory contains all files needed for on-premises deployment.

## Directory Structure

```
deploy/
├── docker/
│   ├── docker-compose.yml      # Main orchestration file
│   ├── Dockerfile.frontend     # Frontend container build
│   ├── Dockerfile.backend      # Backend container build
│   ├── nginx.conf              # Nginx configuration
│   ├── .env.example            # Environment template
│   └── init-db/
│       └── 01-init.sql         # Database initialization
├── backend/
│   ├── server.js               # Express.js server
│   └── package.json            # Backend dependencies
└── README.md                   # This file
```

## Quick Start (Docker)

```bash
cd deploy/docker
cp .env.example .env
# Edit .env with your settings
docker compose up -d --build
```

## Documentation

See [docs/ON_PREM_DEPLOYMENT.md](../docs/ON_PREM_DEPLOYMENT.md) for complete instructions.
