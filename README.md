# PocketID WebFinger Server

A Docker container that provides the missing WebFinger functionality for PocketID, as described in [this video](https://www.youtube.com/watch?v=sPUkAm7yDlU).

This RFC 7033 WebFinger server implementation allows you to host your own WebFinger endpoint when using PocketID for decentralized identity, enabling proper discovery and linking of your identity across the web.

## What is this for?

PocketID is a decentralized identity solution that allows you to own and control your digital identity. However, it requires a WebFinger endpoint for proper discovery and linking functionality. Most hosting providers don't offer WebFinger services out of the box, so this Docker container fills that gap by providing a simple, self-hosted WebFinger server.

**⚠️ Important**: This container is designed to run behind a reverse proxy (nginx, Apache, etc.) and should **NOT** be exposed directly to the internet. The reverse proxy handles SSL termination and routes `/.well-known/webfinger` requests to this container.

## Prerequisites

- Docker and Docker Compose installed on your system
- A domain name where you want to host your identity
- Basic knowledge of Docker and web hosting

## Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vonjunge/pocketid-webfinger-server.git
cd pocketid-webfinger-server
```

### 2. Configure Your Identity

1. Create your configuration file by copying the example:

```bash
# Copy the example configuration file
cp user_conf.example.env user_conf.env
```

2. Edit the `user_conf.env` file to configure your identity:

```yaml
# Replace with your actual email and identity URL
USER_1_EMAIL=your-email@your-domain.com
USER_1_LINK_1_REL=self
USER_1_LINK_1_TYPE=application/activity+json
USER_1_LINK_1_HREF=https://your-identity-provider.com
```

### 3. Start the Server

```bash
# Start the container in the background
docker-compose up -d

# Check that it's running
docker-compose ps

# View logs if needed
docker-compose logs
```

### 4. Test Your WebFinger Endpoint

**For testing only** (uncomment the ports in docker-compose.yml):
```bash
curl "http://localhost:3000/.well-known/webfinger?resource=acct:your-email@your-domain.com"
```

You should see a JSON response with your identity information.

**Note**: In production, this endpoint should be accessible via your domain's `/.well-known/webfinger` path through a reverse proxy, not directly on port 3000.

### 5. Deploy to Production

For production use, you'll need to:

1. **Deploy this container to a server with your domain**
2. **Make sure you've created your `user_conf.env` file** from the example and populated it with your real identity information
3. **Set up a reverse proxy (nginx, Apache, etc.)** to route `/.well-known/webfinger` requests to this container on port 3000
3. **Ensure HTTPS is properly configured** (required for WebFinger)
4. **Configure security environment variables:**
   ```yaml
   environment:
     - ALLOWED_ORIGINS=https://your-domain.com,https://trusted-domain.com
   ```
5. **Set up monitoring and log aggregation**
6. **Configure resource limits** in your Docker deployment
7. **Regular security updates** of the container image

#### Example Nginx Configuration

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;
    
    # SSL configuration
    ssl_certificate /path/to/your/cert.pem;
    ssl_certificate_key /path/to/your/key.pem;
    
    # WebFinger endpoint
    location /.well-known/webfinger {
        proxy_pass http://127.0.0.1:3000/.well-known/webfinger;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Your other website content
    location / {
        # Your main website configuration
    }
}
```

⚠️ **Security Note**: This server includes basic security measures (rate limiting, input validation, security headers), but for high-security environments, consider additional measures like WAF, DDoS protection, and regular security audits.

🔒 **Important**: Never expose this container directly to the internet. Always use a reverse proxy with proper SSL/TLS termination.

## Usage

## Advanced Configuration

### Multiple Users

You can configure multiple identities by adding more user blocks to your `user_conf.env` file:

```
# User 1
USER_1_EMAIL=alice@example.com
USER_1_LINK_1_REL=self
USER_1_LINK_1_TYPE=application/activity+json
USER_1_LINK_1_HREF=https://id.example.com

# User 2  
USER_2_EMAIL=bob@example.com
USER_2_LINK_1_REL=self
USER_2_LINK_1_TYPE=application/activity+json
USER_2_LINK_1_HREF=https://id.example.com
```

### Environment Variables Reference

Users are configured via environment variables:

- `USER_N_EMAIL`: The email address (required, "acct:" prefix added automatically for both resource and subject)
- `USER_N_ALIASES`: Comma-separated aliases (optional)
- `USER_N_LINK_M_REL`: Link relation (required if defining a link)
- `USER_N_LINK_M_HREF`: Link URL (required if defining a link)
- `USER_N_LINK_M_TYPE`: Link media type (optional)

Where N is the user number (1, 2, 3...) and M is the link number (1, 2, 3...).

### Docker Commands

```bash
# Build the image locally
docker-compose build

# Start in foreground (to see logs)
docker-compose up

# Start in background
docker-compose up -d

# Stop the container
docker-compose down

# View logs
docker-compose logs -f

# Restart the container
docker-compose restart
```

## About PocketID

PocketID is a decentralized identity solution that allows you to own and control your digital identity. However, it requires a WebFinger endpoint for proper discovery and linking functionality. This Docker container fills that gap by providing a simple, self-hosted WebFinger server.

For more information about setting up PocketID and the need for WebFinger, watch [this explanatory video](https://www.youtube.com/watch?v=sPUkAm7yDlU).

## License

This project is open source and available under the MIT License.
