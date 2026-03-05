# NanoClaw Installation Guide for DigitalOcean Ubuntu 24.04

Complete step-by-step guide to deploy NanoClaw on a DigitalOcean droplet running Ubuntu 24.04 LTS.

## Prerequisites

- DigitalOcean account
- Domain name (optional, for easier access)
- Anthropic API key (for Claude) or OpenAI/OpenRouter API key
- WhatsApp/Telegram/Slack account for messaging integration

## Part 1: Create and Configure Droplet

### Step 1: Create Droplet

1. Log into DigitalOcean
2. Click "Create" → "Droplets"
3. Choose configuration:
   - **Image**: Ubuntu 24.04 (LTS) x64
   - **Plan**: 
     - Basic: $12/month (2 GB RAM, 1 vCPU) - Minimum recommended
     - Regular: $24/month (4 GB RAM, 2 vCPU) - Better for multiple groups
   - **Datacenter**: Choose closest to your location
   - **Authentication**: SSH keys (recommended) or password
   - **Hostname**: `nanoclaw-server` (or your preference)
4. Click "Create Droplet"
5. Note your droplet's IP address

### Step 2: Initial Server Setup

SSH into your droplet:

```bash
ssh root@your_droplet_ip
```

Update system packages:

```bash
apt update && apt upgrade -y
```

Set timezone (optional but recommended):

```bash
timedatectl set-timezone America/New_York  # Change to your timezone
timedatectl  # Verify
```

Create a non-root user (recommended for security):

```bash
adduser nanoclaw
usermod -aG sudo nanoclaw
```

Switch to the new user:

```bash
su - nanoclaw
```

## Part 2: Install Dependencies

### Step 3: Install Node.js 20+

```bash
# Install Node.js 20.x from NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version
```

### Step 4: Install Docker

NanoClaw uses Docker for container isolation:

```bash
# Install Docker
sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io

# Add your user to docker group (avoid sudo for docker commands)
sudo usermod -aG docker $USER

# Apply group changes (or logout/login)
newgrp docker

# Verify Docker installation
docker --version
docker run hello-world  # Should download and run successfully
```

### Step 5: Install Git

```bash
sudo apt install -y git
git --version
```

### Step 6: Install Build Tools

```bash
sudo apt install -y build-essential python3
```

## Part 3: Clone and Setup NanoClaw

### Step 7: Clone Repository

```bash
cd ~
git clone https://github.com/caesarlab/nanoclaw.git
cd nanoclaw
```

### Step 8: Install Dependencies

```bash
# Install main dependencies
npm install

# Install container agent-runner dependencies
cd container/agent-runner
npm install
cd ../..
```

### Step 9: Build Container Agent Runner

```bash
cd container/agent-runner
npm run build
cd ../..
```

### Step 10: Build Docker Image

```bash
# Build the NanoClaw agent container image
docker build -t nanoclaw-agent:latest -f container/Dockerfile .

# Verify image was created
docker images | grep nanoclaw-agent
```

## Part 4: Configuration

### Step 11: Create Configuration Directories

```bash
# Create config directories
mkdir -p ~/.config/nanoclaw

# Create data directories
mkdir -p ~/nanoclaw/groups
mkdir -p ~/nanoclaw/data
mkdir -p ~/nanoclaw/store
```

### Step 12: Configure Environment Variables

Create `.env` file:

```bash
cd ~/nanoclaw
cp .env.example .env
nano .env
```

Add your configuration:

```bash
# Assistant Configuration
ASSISTANT_NAME=Andy
ASSISTANT_HAS_OWN_NUMBER=false

# Claude API (default provider)
ANTHROPIC_API_KEY=sk-ant-your_key_here

# OR use OpenAI
# LLM_PROVIDER=openai
# OPENAI_API_KEY=your_openai_key
# LLM_MODEL=gpt-4-turbo

# OR use OpenRouter
# LLM_PROVIDER=openrouter
# OPENROUTER_API_KEY=your_openrouter_key
# LLM_MODEL=anthropic/claude-3.5-sonnet

# Container Configuration
CONTAINER_IMAGE=nanoclaw-agent:latest
CONTAINER_TIMEOUT=1800000
IDLE_TIMEOUT=1800000
MAX_CONCURRENT_CONTAINERS=5
```

Save and exit (Ctrl+X, Y, Enter)

### Step 13: Configure Mount Allowlist (Security)

Create mount allowlist for additional directories:

```bash
nano ~/.config/nanoclaw/mount-allowlist.json
```

Add configuration:

```json
{
  "allowedRoots": [
    {
      "path": "~/projects",
      "allowReadWrite": true,
      "description": "Personal projects directory"
    },
    {
      "path": "~/documents",
      "allowReadWrite": false,
      "description": "Documents (read-only)"
    }
  ],
  "blockedPatterns": [
    ".ssh",
    ".gnupg",
    ".aws",
    "*.key",
    "*.pem"
  ],
  "nonMainReadOnly": true
}
```

Save and exit.

### Step 14: Configure Sender Allowlist (Optional)

For WhatsApp/Telegram security:

```bash
nano ~/.config/nanoclaw/sender-allowlist.json
```

Add your phone numbers or user IDs:

```json
{
  "allowedSenders": [
    "+1234567890",
    "telegram:123456789"
  ],
  "allowedTriggers": {
    "+1234567890": ["@Andy", "@Bot"]
  }
}
```

Save and exit.

## Part 5: Build and Test

### Step 15: Build NanoClaw

```bash
cd ~/nanoclaw
npm run build
```

### Step 16: Test Run

Test that everything works:

```bash
npm start
```

You should see:
```
[INFO] NanoClaw starting...
[INFO] Container runtime: docker
[INFO] Registered channels: []
[INFO] Message loop started
[INFO] Scheduler loop started
```

Press Ctrl+C to stop.

## Part 6: Add Messaging Channels

### Step 17: Add WhatsApp (Optional)

If you want WhatsApp integration, you'll need to add the WhatsApp channel skill. This requires Claude Code CLI:

```bash
# Install Claude Code CLI (if not already installed)
npm install -g @anthropic-ai/claude-code

# Run Claude Code
claude

# In Claude Code prompt, type:
# /add-whatsapp
```

Follow the prompts to authenticate WhatsApp.

### Step 18: Add Telegram (Optional)

For Telegram integration:

```bash
# In Claude Code prompt:
# /add-telegram
```

You'll need a Telegram Bot Token from [@BotFather](https://t.me/botfather).

### Step 19: Add Other Channels

Available channels:
- `/add-slack` - Slack integration
- `/add-discord` - Discord integration
- `/add-gmail` - Gmail integration

## Part 7: Setup as System Service

### Step 20: Create Systemd Service

Create service file:

```bash
sudo nano /etc/systemd/system/nanoclaw.service
```

Add configuration:

```ini
[Unit]
Description=NanoClaw AI Assistant
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=nanoclaw
WorkingDirectory=/home/nanoclaw/nanoclaw
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=nanoclaw

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=read-only
ReadWritePaths=/home/nanoclaw/nanoclaw/groups /home/nanoclaw/nanoclaw/data /home/nanoclaw/nanoclaw/store

[Install]
WantedBy=multi-user.target
```

Save and exit.

### Step 21: Enable and Start Service

```bash
# Reload systemd
sudo systemctl daemon-reload

# Enable service to start on boot
sudo systemctl enable nanoclaw

# Start service
sudo systemctl start nanoclaw

# Check status
sudo systemctl status nanoclaw
```

### Step 22: View Logs

```bash
# View real-time logs
sudo journalctl -u nanoclaw -f

# View recent logs
sudo journalctl -u nanoclaw -n 100

# View logs since boot
sudo journalctl -u nanoclaw -b
```

## Part 8: Setup Main Control Group

### Step 23: Register Main Group

The main group is your private control channel. You'll need to register it programmatically or through your messaging app.

For WhatsApp, send a message to yourself (saved messages) with:
```
@Andy register main
```

For Telegram, message your bot:
```
/start
@Andy register main
```

## Part 9: Firewall and Security

### Step 24: Configure UFW Firewall

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow 22/tcp

# Allow HTTP/HTTPS (if you plan to add a web interface later)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### Step 25: Setup Automatic Updates (Optional)

```bash
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### Step 26: Setup Fail2Ban (Optional)

Protect against brute force attacks:

```bash
sudo apt install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## Part 10: Monitoring and Maintenance

### Step 27: Setup Log Rotation

Create log rotation config:

```bash
sudo nano /etc/logrotate.d/nanoclaw
```

Add:

```
/home/nanoclaw/nanoclaw/groups/*/logs/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 nanoclaw nanoclaw
}
```

### Step 28: Monitor Resources

```bash
# Check memory usage
free -h

# Check disk usage
df -h

# Check Docker containers
docker ps

# Check running processes
htop  # Install with: sudo apt install htop
```

### Step 29: Backup Strategy

Create backup script:

```bash
nano ~/backup-nanoclaw.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR=~/nanoclaw-backups
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database and groups
tar -czf $BACKUP_DIR/nanoclaw-$DATE.tar.gz \
    ~/nanoclaw/data \
    ~/nanoclaw/groups \
    ~/nanoclaw/.env \
    ~/.config/nanoclaw

# Keep only last 7 backups
ls -t $BACKUP_DIR/nanoclaw-*.tar.gz | tail -n +8 | xargs -r rm

echo "Backup completed: nanoclaw-$DATE.tar.gz"
```

Make executable:

```bash
chmod +x ~/backup-nanoclaw.sh
```

Setup daily backup cron:

```bash
crontab -e
```

Add:

```
0 2 * * * /home/nanoclaw/backup-nanoclaw.sh
```

## Part 11: Testing and Verification

### Step 30: Test Your Installation

1. **Check service status**:
   ```bash
   sudo systemctl status nanoclaw
   ```

2. **Send test message**:
   - WhatsApp: Message yourself with `@Andy hello`
   - Telegram: Message your bot with `@Andy hello`

3. **Check logs**:
   ```bash
   sudo journalctl -u nanoclaw -f
   ```

4. **Verify container creation**:
   ```bash
   docker ps -a
   ```

5. **Check database**:
   ```bash
   ls -la ~/nanoclaw/data/
   ```

## Part 12: Troubleshooting

### Common Issues

**Service won't start:**
```bash
# Check logs
sudo journalctl -u nanoclaw -n 50

# Check permissions
ls -la ~/nanoclaw

# Verify Docker is running
sudo systemctl status docker
```

**Docker permission denied:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

**Container fails to start:**
```bash
# Check Docker image
docker images | grep nanoclaw-agent

# Rebuild if needed
cd ~/nanoclaw
docker build -t nanoclaw-agent:latest -f container/Dockerfile .
```

**Out of memory:**
```bash
# Check memory
free -h

# Reduce MAX_CONCURRENT_CONTAINERS in .env
nano ~/nanoclaw/.env
# Set MAX_CONCURRENT_CONTAINERS=2

# Restart service
sudo systemctl restart nanoclaw
```

**API key errors:**
```bash
# Verify .env file
cat ~/nanoclaw/.env | grep API_KEY

# Check logs for specific error
sudo journalctl -u nanoclaw | grep -i "api"
```

## Part 13: Updating NanoClaw

### Step 31: Update to Latest Version

```bash
# Stop service
sudo systemctl stop nanoclaw

# Backup current version
cd ~
cp -r nanoclaw nanoclaw-backup-$(date +%Y%m%d)

# Pull latest changes
cd ~/nanoclaw
git pull origin main

# Install dependencies
npm install
cd container/agent-runner
npm install
npm run build
cd ../..

# Rebuild main project
npm run build

# Rebuild Docker image
docker build -t nanoclaw-agent:latest -f container/Dockerfile .

# Start service
sudo systemctl start nanoclaw

# Check status
sudo systemctl status nanoclaw
```

## Part 14: Advanced Configuration

### Per-Group LLM Configuration

To use different LLMs for different groups, you'll need to update the database programmatically. Create a script:

```bash
nano ~/nanoclaw/configure-groups.js
```

Add:

```javascript
import { setRegisteredGroup } from './dist/db.js';

// Main group uses Claude
setRegisteredGroup('main-jid', {
  name: 'Main',
  folder: 'main',
  trigger: '@Andy',
  added_at: new Date().toISOString(),
  isMain: true,
  llmConfig: {
    provider: 'claude',
    model: 'claude-3-5-sonnet-20241022',
  },
});

// Family group uses GPT-4
setRegisteredGroup('family-jid', {
  name: 'Family',
  folder: 'family',
  trigger: '@Andy',
  added_at: new Date().toISOString(),
  llmConfig: {
    provider: 'openai',
    model: 'gpt-4-turbo',
    baseURL: 'https://api.openai.com/v1',
  },
});

console.log('Groups configured!');
```

Run:

```bash
cd ~/nanoclaw
node configure-groups.js
```

## Part 15: Performance Optimization

### Optimize for Production

1. **Increase file descriptors**:
   ```bash
   sudo nano /etc/security/limits.conf
   ```
   Add:
   ```
   nanoclaw soft nofile 65536
   nanoclaw hard nofile 65536
   ```

2. **Optimize Docker**:
   ```bash
   sudo nano /etc/docker/daemon.json
   ```
   Add:
   ```json
   {
     "log-driver": "json-file",
     "log-opts": {
       "max-size": "10m",
       "max-file": "3"
     }
   }
   ```
   Restart Docker:
   ```bash
   sudo systemctl restart docker
   ```

3. **Enable swap** (if needed):
   ```bash
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

## Summary

You now have NanoClaw running on DigitalOcean with:
- ✅ Docker container isolation
- ✅ Systemd service management
- ✅ Automatic startup on boot
- ✅ Log rotation
- ✅ Firewall protection
- ✅ Automated backups
- ✅ Multi-LLM support

## Quick Reference Commands

```bash
# Service management
sudo systemctl start nanoclaw
sudo systemctl stop nanoclaw
sudo systemctl restart nanoclaw
sudo systemctl status nanoclaw

# View logs
sudo journalctl -u nanoclaw -f

# Check containers
docker ps -a

# Backup
~/backup-nanoclaw.sh

# Update
cd ~/nanoclaw && git pull && npm install && npm run build
```

## Next Steps

1. Configure your messaging channels (WhatsApp, Telegram, etc.)
2. Set up scheduled tasks
3. Customize CLAUDE.md memory files for each group
4. Configure per-group LLM settings
5. Set up monitoring and alerts

For more information, see:
- [LLM Configuration Guide](./LLM_CONFIGURATION.md)
- [Multi-LLM Implementation](./MULTI_LLM_IMPLEMENTATION.md)
- [Main README](../README.md)
