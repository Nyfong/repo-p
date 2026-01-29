# Docker Deployment Guide

This guide explains how to build and deploy the SonarQube Issues Viewer using Docker and Docker Compose.

## Prerequisites

- Docker Engine 20.10 or later
- Docker Compose 2.0 or later

## Quick Start

1. **Build and start the container:**
   ```bash
   docker-compose up -d --build
   ```

2. **View logs:**
   ```bash
   docker-compose logs -f
   ```

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

## Building the Image

To build the Docker image manually:

```bash
docker build -t sonarqube-issues-viewer .
```

## Running the Container

To run the container manually:

```bash
docker run -d \
  -p 3000:3000 \
  --name sonarqube-viewer \
  sonarqube-issues-viewer
```

## Configuration

### Environment Variables

You can customize the deployment by setting environment variables in `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=production
  - PORT=3000
  - HOSTNAME=0.0.0.0
```

### Port Configuration

To change the port, modify the `ports` section in `docker-compose.yml`:

```yaml
ports:
  - "8080:3000"  # Maps host port 8080 to container port 3000
```

## Production Considerations

1. **Reverse Proxy**: For production, use a reverse proxy (nginx, traefik) in front of the container
2. **SSL/TLS**: Configure SSL certificates in your reverse proxy
3. **Resource Limits**: Add resource limits in docker-compose.yml:
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1'
         memory: 1G
   ```

## Troubleshooting

### Container won't start
- Check logs: `docker-compose logs sonarqube-viewer`
- Verify port 3000 is not in use: `lsof -i :3000`

### Build fails
- Clear Docker cache: `docker-compose build --no-cache`
- Check Node.js version compatibility

### Application not accessible
- Verify container is running: `docker-compose ps`
- Check port mapping: `docker-compose port sonarqube-viewer 3000`

