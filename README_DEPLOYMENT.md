# Medical Management System - Deployment Guide 🏥

A comprehensive medical and pharmaceutical management system with integrated financial management and visit tracking.

## 🚀 Quick Start

### Prerequisites

- Docker (version 20.0 or higher)
- Docker Compose (version 2.0 or higher)
- 4GB+ RAM available
- 10GB+ disk space

### Quick Deployment

1. **Clone the repository**
   ```bash
   git clone https://github.com/mafiaidola/13-8-office.git
   cd 13-8-office
   ```

2. **Setup environment**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

3. **Deploy the application**
   ```bash
   ./deploy.sh
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:8001
   - API Documentation: http://localhost:8001/docs

## 📋 Deployment Options

### Development Deployment
```bash
./deploy.sh development up
```

### Production Deployment
```bash
./deploy.sh production up
```

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React)       │◄──►│   (FastAPI)     │◄──►│   (MongoDB)     │
│   Port: 3000    │    │   Port: 8001    │    │   Port: 27017   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGO_ROOT_USERNAME` | MongoDB admin username | `admin` |
| `MONGO_ROOT_PASSWORD` | MongoDB admin password | `password123` |
| `DB_NAME` | Database name | `medical_management_system` |
| `JWT_SECRET` | JWT signing secret | `dev-jwt-secret-key` |
| `GOOGLE_MAPS_API_KEY` | Google Maps API key | Provided |
| `REACT_APP_BACKEND_URL` | Backend URL for frontend | `http://localhost:8001` |

### Production Settings

For production deployment, ensure you:

1. **Change default passwords**
   ```bash
   MONGO_ROOT_PASSWORD=your-secure-password
   JWT_SECRET=your-long-random-secret-key
   ```

2. **Update backend URL**
   ```bash
   REACT_APP_BACKEND_URL=https://your-domain.com
   ```

3. **Configure SSL certificates** (add to `nginx/ssl/`)

## 🛠️ Management Commands

### Basic Operations
```bash
# Start services
./deploy.sh development up

# Stop services
./deploy.sh development down

# Restart services
./deploy.sh development restart

# View logs
./deploy.sh development logs

# Check status
./deploy.sh development status
```

### Build Operations
```bash
# Build all images
./deploy.sh development build

# Rebuild specific service
docker compose -f docker-compose.dev.yml build backend
```

### Maintenance
```bash
# View service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb

# Execute commands in containers
docker-compose exec backend bash
docker-compose exec mongodb mongosh

# Backup database
docker-compose exec mongodb mongodump --out /data/backup
```

## 🔍 Health Checks

The application includes comprehensive health checks:

- **Frontend**: `http://localhost:3000/health`
- **Backend**: `http://localhost:8001/api/health`
- **Full API**: `http://localhost:8001/docs`

## 🗂️ File Structure

```
13-8-office/
├── backend/
│   ├── Dockerfile              # Backend container config
│   ├── requirements.txt        # Python dependencies
│   ├── server_enhanced.py      # Main application
│   └── routes/                 # API routes
├── frontend/
│   ├── Dockerfile              # Frontend container config
│   ├── nginx.conf              # Nginx configuration
│   ├── package.json            # Node dependencies
│   └── src/                    # React application
├── nginx/
│   └── nginx.conf              # Production proxy config
├── docker-compose.yml          # Production deployment
├── docker-compose.dev.yml      # Development deployment
├── deploy.sh                   # Deployment script
├── .env.example                # Environment template
└── README_DEPLOYMENT.md        # This file
```

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: API rate limiting via Nginx
- **Security Headers**: Comprehensive security headers
- **CORS Configuration**: Proper cross-origin setup
- **Non-root Containers**: All services run as non-root users
- **Network Isolation**: Services communicate via dedicated network

## 🎯 Features

- **User Management**: Professional user management with role-based access
- **Clinic Management**: Advanced clinic registration and management
- **Financial System**: Integrated accounting and financial tracking
- **Visit Management**: Medical representative visit tracking
- **Product Management**: Pharmaceutical product management
- **Analytics**: Comprehensive reporting and analytics
- **Multi-language**: Arabic and English support
- **Responsive Design**: Mobile-friendly interface

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**
   ```bash
   # Check if ports are in use
   lsof -i :3000
   lsof -i :8001
   lsof -i :27017
   ```

2. **Database connection issues**
   ```bash
   # Check MongoDB status
   docker-compose logs mongodb
   
   # Test connection
   docker-compose exec mongodb mongosh
   ```

3. **Build failures**
   ```bash
   # Clean build
   ./deploy.sh development cleanup
   ./deploy.sh development build
   ```

4. **Permission issues**
   ```bash
   # Fix permissions
   chmod +x deploy.sh
   sudo chown -R $USER:$USER .
   ```

### Log Analysis
```bash
# View all logs
./deploy.sh development logs

# View specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

## 🔄 Updates and Maintenance

### Application Updates
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
./deploy.sh development down
./deploy.sh development build
./deploy.sh development up
```

### Database Backup
```bash
# Create backup
docker-compose exec mongodb mongodump --out /tmp/backup

# Copy backup to host
docker cp medmanage_mongodb_dev:/tmp/backup ./mongodb_backup
```

### Database Restore
```bash
# Copy backup to container
docker cp ./mongodb_backup medmanage_mongodb_dev:/tmp/restore

# Restore database
docker compose exec mongodb mongorestore /tmp/restore
```

## 📊 Monitoring

### Health Monitoring
```bash
# Check all services
curl http://localhost:3000/health
curl http://localhost:8001/api/health

# Check service status
docker-compose ps
```

### Performance Monitoring
```bash
# Resource usage
docker stats

# Service logs
docker-compose logs --tail=50 -f
```

## 🤝 Support

For deployment issues or questions:

1. Check the troubleshooting section above
2. Review logs for error messages
3. Ensure all prerequisites are met
4. Verify environment configuration

## 📄 License

This project is part of a comprehensive medical management system.

---

**Ready to deploy? Run `./deploy.sh` and get started! 🚀**