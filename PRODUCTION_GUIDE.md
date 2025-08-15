# Production Deployment Guide 🚀

## Quick Production Setup

### Prerequisites
- Docker and Docker Compose installed
- 4GB+ RAM and 10GB+ disk space
- Open ports: 80, 443 (web), 8001 (API), 27017 (database)

### 1. Clone and Setup
```bash
git clone https://github.com/mafiaidola/13-8-office.git
cd 13-8-office
cp .env.example .env
```

### 2. Configure Production Environment
Edit `.env` file with your production settings:
```bash
# Required changes for production:
MONGO_ROOT_PASSWORD=your-very-secure-password
JWT_SECRET=your-super-long-random-secret-key-for-jwt-tokens
REACT_APP_BACKEND_URL=https://your-domain.com

# Optional: Update API key if needed
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

### 3. Deploy
```bash
# Option 1: Using deployment script
./deploy.sh production up

# Option 2: Using Makefile
make prod-start

# Option 3: Direct Docker Compose
docker compose -f docker-compose.yml up -d
```

### 4. Verify Deployment
```bash
# Check service status
docker compose -f docker-compose.yml ps

# Check logs
docker compose -f docker-compose.yml logs

# Access application
# Frontend: http://your-server
# Backend API: http://your-server:8001
# API Docs: http://your-server:8001/docs
```

## SSL/HTTPS Setup

### 1. Obtain SSL Certificate
```bash
# Using Let's Encrypt (recommended)
sudo certbot certonly --standalone -d your-domain.com

# Or place your certificates in:
mkdir nginx/ssl
# Copy cert.pem and key.pem to nginx/ssl/
```

### 2. Update Nginx Configuration
Edit `nginx/nginx.conf` and uncomment SSL lines:
```nginx
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
```

### 3. Update Environment
```bash
REACT_APP_BACKEND_URL=https://your-domain.com
```

## Domain Setup

### 1. DNS Configuration
Point your domain to your server:
```
A record: your-domain.com → your-server-ip
A record: api.your-domain.com → your-server-ip (optional)
```

### 2. Update Backend URL
```bash
# In .env file:
REACT_APP_BACKEND_URL=https://your-domain.com
# Or for separate API subdomain:
REACT_APP_BACKEND_URL=https://api.your-domain.com
```

## Monitoring and Maintenance

### Health Checks
```bash
# Service status
curl http://your-domain.com/health
curl http://your-domain.com:8001/api/health

# System resources
docker stats
```

### Backup Database
```bash
# Create backup
docker compose exec mongodb mongodump --out /tmp/backup
docker cp medmanage_mongodb:/tmp/backup ./backup-$(date +%Y%m%d)
```

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.yml down
docker compose -f docker-compose.yml build
docker compose -f docker-compose.yml up -d
```

### Log Management
```bash
# View logs
docker compose -f docker-compose.yml logs -f

# Clean old logs
docker system prune -f
```

## Security Considerations

1. **Change Default Passwords**: Update all default passwords in `.env`
2. **Firewall**: Only open necessary ports (80, 443, 22 for SSH)
3. **SSL/TLS**: Always use HTTPS in production
4. **Regular Updates**: Keep Docker images and system updated
5. **Monitoring**: Set up log monitoring and alerting
6. **Backups**: Regular database backups

## Scaling Options

### Horizontal Scaling
- Use Docker Swarm or Kubernetes for multi-node deployment
- Add load balancer for multiple frontend/backend instances
- Database clustering with MongoDB replica sets

### Resource Scaling
- Increase container resources in docker-compose.yml
- Use SSD storage for better database performance
- Monitor and adjust based on usage patterns

## Troubleshooting

### Common Issues

1. **Port Conflicts**
   ```bash
   sudo lsof -i :80
   sudo lsof -i :8001
   ```

2. **Memory Issues**
   ```bash
   free -h
   docker stats
   ```

3. **Database Connection**
   ```bash
   docker compose logs mongodb
   docker compose exec mongodb mongosh
   ```

4. **Certificate Issues**
   ```bash
   # Check certificate
   openssl x509 -in nginx/ssl/cert.pem -text -noout
   ```

### Getting Help
- Check logs: `docker compose logs`
- Validate config: `./validate-deployment.sh`
- Service status: `docker compose ps`

## Performance Optimization

### Database
- Enable MongoDB indexes
- Regular database maintenance
- Monitor query performance

### Frontend
- Enable Nginx compression (already configured)
- Use CDN for static assets
- Monitor bundle size

### Backend
- API response caching
- Database connection pooling
- Monitor API performance

---

**Ready for production? Follow this guide and you'll have a robust, scalable medical management system! 🏥**