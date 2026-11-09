# Siddhi HRMS - Local Server Deployment Guide

This guide details how to deploy, configure, and maintain **Siddhi HRMS** on an on-premise physical server, local virtual machine, or private enterprise infrastructure using Docker Compose.

---

## 1. Prerequisites

- **Operating System**: Ubuntu 22.04 LTS / Debian 12 / Rocky Linux 9 (or any modern Linux host)
- **Container Engine**: Docker Engine 24.0+ and Docker Compose 2.20+
- **Hardware Sizing**:
  - Minimum: 2 CPU cores, 4 GB RAM, 40 GB SSD storage
  - Recommended: 4 CPU cores, 8 GB RAM, 100 GB SSD storage

---

## 2. Quickstart with Docker Compose

1. **Clone your repository** onto the local server:
   ```bash
   git clone git@github.com:your-org/siddhi-hrms.git /opt/siddhi-hrms
   cd /opt/siddhi-hrms
   ```

2. **Configure your environment**:
   ```bash
   cp .env.example .env
   # Edit .env and change default database passwords and secrets:
   nano .env
   ```

3. **Launch the services**:
   ```bash
   docker compose up -d --build
   ```

4. **Verify container health**:
   ```bash
   docker compose ps
   docker compose logs -f app
   ```

5. Open your web browser and navigate to `http://<your-server-ip>:3000`.

---

## 3. Reverse Proxy & HTTPS (Nginx Setup)

For secure access over your corporate network with TLS/SSL:

```nginx
# /etc/nginx/sites-available/siddhi.internal
server {
    listen 80;
    server_name hrms.internal.yourorg.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name hrms.internal.yourorg.com;

    ssl_certificate /etc/ssl/certs/siddhi_internal.crt;
    ssl_certificate_key /etc/ssl/private/siddhi_internal.key;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 4. Biometric Device Network Requirements

- **Firewall Rules**: If the biometric device is on a dedicated VLAN or physical punch clock subnet, ensure port forwarding or routing allows the Siddhi host to initiate HTTP/HTTPS requests to the device or vendor sync gateway.
- **Static IP Assignment**: Assign a reserved DHCP static lease or static IP address to your Realtime biometric attendance terminal.
- **Vendor API Details**: In the Siddhi Administrator settings (`/biometric`), configure the exact endpoint URL, HTTP method, and credentials once provided by your biometric hardware vendor.
