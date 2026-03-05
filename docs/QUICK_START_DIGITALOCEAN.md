# Quick Start: NanoClaw on DigitalOcean

The fastest way to get NanoClaw running on DigitalOcean Ubuntu 24.04.

## One-Line Install

SSH into your DigitalOcean droplet and run:

```bash
curl -fsSL https://raw.githubusercontent.com/caesarlab/nanoclaw/main/scripts/digitalocean-setup.sh | bash
```

Or with wget:

```bash
wget -qO- https://raw.githubusercontent.com/caesarlab/nanoclaw/main/scripts/digitalocean-setup.sh | bash
```

This automated script will:
- ✅ Install Node.js 20.x
- ✅ Install Docker
- ✅ Install Git and build tools
- ✅ Clone NanoClaw repository
- ✅ Install all dependencies
- ✅ Build Docker image
- ✅ Create configuration directories
- ✅ Setup systemd service
- ✅ Configure security settings

## After Installation

### 1. Configure API Keys

Edit the `.env` file:

```bash
nano ~/nanoclaw/.env
```

Add your API key (choose one):

**For Claude (default):**
```bash
ANTHROPIC_API_KEY=sk-ant-your_key_here
```

**For OpenAI:**
```bash
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-your_key_here
LLM_MODEL=gpt-4-turbo
```

**For OpenRouter:**
```bash
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=sk-or-your_key_here
LLM_MODEL=anthropic/claude-3.5-sonnet
```

Save and exit (Ctrl+X, Y, Enter).

### 2. Start NanoClaw

```bash
sudo systemctl start nanoclaw
```

### 3. Check Status

```bash
sudo systemctl status nanoclaw
```

You should see "active (running)" in green.

### 4. View Logs

```bash
sudo journalctl -u nanoclaw -f
```

Press Ctrl+C to stop viewing logs.

### 5. Add Messaging Channel

Choose your preferred messaging platform:

#### WhatsApp

```bash
cd ~/nanoclaw
npx @anthropic-ai/claude-code
```

In the Claude Code prompt:
```
/add-whatsapp
```

Follow the QR code authentication process.

#### Telegram

First, create a bot with [@BotFather](https://t.me/botfather) on Telegram, then:

```bash
cd ~/nanoclaw
npx @anthropic-ai/claude-code
```

In the Claude Code prompt:
```
/add-telegram
```

Enter your bot token when prompted.

#### Other Channels

- `/add-slack` - Slack integration
- `/add-discord` - Discord integration
- `/add-gmail` - Gmail integration

### 6. Test Your Bot

Send a message to your bot:

**WhatsApp:** Message yourself with `@Andy hello`

**Telegram:** Message your bot with `@Andy hello`

You should get a response!

## Common Commands

```bash
# Start service
sudo systemctl start nanoclaw

# Stop service
sudo systemctl stop nanoclaw

# Restart service
sudo systemctl restart nanoclaw

# Check status
sudo systemctl status nanoclaw

# View logs (real-time)
sudo journalctl -u nanoclaw -f

# View recent logs
sudo journalctl -u nanoclaw -n 100

# Check Docker containers
docker ps -a

# Check Docker images
docker images | grep nanoclaw
```

## Troubleshooting

### Service won't start

```bash
# Check logs for errors
sudo journalctl -u nanoclaw -n 50

# Verify .env file has API key
cat ~/nanoclaw/.env | grep API_KEY

# Check Docker is running
sudo systemctl status docker
```

### Docker permission denied

```bash
# Add user to docker group
sudo usermod -aG docker $USER

# Log out and back in, or run:
newgrp docker

# Restart service
sudo systemctl restart nanoclaw
```

### Out of memory

```bash
# Check memory usage
free -h

# Reduce concurrent containers in .env
nano ~/nanoclaw/.env
# Set: MAX_CONCURRENT_CONTAINERS=2

# Restart service
sudo systemctl restart nanoclaw
```

### Container fails to build

```bash
# Rebuild Docker image
cd ~/nanoclaw
docker build -t nanoclaw-agent:latest -f container/Dockerfile .

# Restart service
sudo systemctl restart nanoclaw
```

## Updating NanoClaw

```bash
# Stop service
sudo systemctl stop nanoclaw

# Update code
cd ~/nanoclaw
git pull origin main

# Install dependencies
npm install
cd container/agent-runner && npm install && npm run build && cd ../..

# Rebuild
npm run build
docker build -t nanoclaw-agent:latest -f container/Dockerfile .

# Start service
sudo systemctl start nanoclaw
```

## Security Checklist

- [ ] Changed default SSH port (optional)
- [ ] Setup UFW firewall
- [ ] Configured fail2ban
- [ ] Setup automatic security updates
- [ ] Created sender allowlist
- [ ] Configured mount allowlist
- [ ] Setup automated backups

See [full installation guide](./DIGITALOCEAN_INSTALLATION.md) for security setup.

## Next Steps

1. **Configure groups**: Set up different groups for different purposes
2. **Customize memory**: Edit `CLAUDE.md` files in each group folder
3. **Setup scheduled tasks**: Create recurring jobs
4. **Configure per-group LLMs**: Use different models for different groups
5. **Setup monitoring**: Configure alerts and monitoring

## Resources

- [Full Installation Guide](./DIGITALOCEAN_INSTALLATION.md) - Detailed step-by-step instructions
- [LLM Configuration](./LLM_CONFIGURATION.md) - Configure different LLM providers
- [Multi-LLM Implementation](./MULTI_LLM_IMPLEMENTATION.md) - Technical details
- [Main README](../README.md) - Project overview

## Support

If you encounter issues:

1. Check the logs: `sudo journalctl -u nanoclaw -f`
2. Review the [troubleshooting section](./DIGITALOCEAN_INSTALLATION.md#part-12-troubleshooting)
3. Check [GitHub Issues](https://github.com/caesarlab/nanoclaw/issues)
4. Join the [Discord community](https://discord.gg/VDdww8qS42)

## Minimum Requirements

- **RAM**: 2 GB (4 GB recommended)
- **CPU**: 1 vCPU (2 vCPU recommended)
- **Storage**: 25 GB SSD
- **OS**: Ubuntu 24.04 LTS x64

## Recommended Droplet Sizes

| Size | RAM | vCPU | Storage | Price/mo | Use Case |
|------|-----|------|---------|----------|----------|
| Basic | 2 GB | 1 | 50 GB | $12 | Single user, 1-2 groups |
| Regular | 4 GB | 2 | 80 GB | $24 | Multiple users, 3-5 groups |
| Professional | 8 GB | 4 | 160 GB | $48 | Heavy usage, 10+ groups |

Start with Basic and upgrade as needed.
