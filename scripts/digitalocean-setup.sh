#!/bin/bash
#
# NanoClaw DigitalOcean Setup Script
# Automates installation on Ubuntu 24.04 LTS
#
# Usage: curl -fsSL https://raw.githubusercontent.com/caesarlab/nanoclaw/main/scripts/digitalocean-setup.sh | bash
# Or: wget -qO- https://raw.githubusercontent.com/caesarlab/nanoclaw/main/scripts/digitalocean-setup.sh | bash
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print functions
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "\n${GREEN}==>${NC} $1\n"
}

# Check if running as root
if [ "$EUID" -eq 0 ]; then 
    print_error "Please do not run this script as root. Run as a regular user with sudo privileges."
    exit 1
fi

# Check Ubuntu version
if ! grep -q "Ubuntu 24.04" /etc/os-release; then
    print_warn "This script is designed for Ubuntu 24.04 LTS. Your system may not be compatible."
    read -p "Continue anyway? (y/N) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

print_step "NanoClaw Installation for DigitalOcean Ubuntu 24.04"
echo "This script will install:"
echo "  - Node.js 20.x"
echo "  - Docker"
echo "  - Git and build tools"
echo "  - NanoClaw and dependencies"
echo ""
read -p "Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Update system
print_step "Step 1: Updating system packages"
sudo apt update
sudo apt upgrade -y

# Install Node.js
print_step "Step 2: Installing Node.js 20.x"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_info "Node.js already installed: $NODE_VERSION"
else
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs
    print_info "Node.js installed: $(node --version)"
fi

# Install Docker
print_step "Step 3: Installing Docker"
if command -v docker &> /dev/null; then
    print_info "Docker already installed: $(docker --version)"
else
    sudo apt install -y apt-transport-https ca-certificates curl software-properties-common
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    sudo apt update
    sudo apt install -y docker-ce docker-ce-cli containerd.io
    
    # Add user to docker group
    sudo usermod -aG docker $USER
    print_info "Docker installed. You may need to log out and back in for group changes to take effect."
fi

# Install Git and build tools
print_step "Step 4: Installing Git and build tools"
sudo apt install -y git build-essential python3

# Clone NanoClaw
print_step "Step 5: Cloning NanoClaw repository"
cd ~
if [ -d "nanoclaw" ]; then
    print_warn "nanoclaw directory already exists. Skipping clone."
    cd nanoclaw
    git pull origin main
else
    git clone https://github.com/caesarlab/nanoclaw.git
    cd nanoclaw
fi

# Install dependencies
print_step "Step 6: Installing dependencies"
npm install

cd container/agent-runner
npm install
cd ../..

# Build agent runner
print_step "Step 7: Building agent runner"
cd container/agent-runner
npm run build
cd ../..

# Build Docker image
print_step "Step 8: Building Docker image"
if docker images | grep -q nanoclaw-agent; then
    print_info "Docker image already exists. Rebuilding..."
fi
docker build -t nanoclaw-agent:latest -f container/Dockerfile .

# Create directories
print_step "Step 9: Creating configuration directories"
mkdir -p ~/.config/nanoclaw
mkdir -p ~/nanoclaw/groups
mkdir -p ~/nanoclaw/data
mkdir -p ~/nanoclaw/store

# Create .env file
print_step "Step 10: Creating .env configuration"
if [ -f ".env" ]; then
    print_warn ".env file already exists. Skipping."
else
    cp .env.example .env
    print_info "Created .env file. Please edit it with your API keys:"
    print_info "  nano ~/nanoclaw/.env"
fi

# Create mount allowlist
print_step "Step 11: Creating mount allowlist"
if [ ! -f ~/.config/nanoclaw/mount-allowlist.json ]; then
    cat > ~/.config/nanoclaw/mount-allowlist.json << 'EOF'
{
  "allowedRoots": [
    {
      "path": "~/projects",
      "allowReadWrite": true,
      "description": "Personal projects directory"
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
EOF
    print_info "Created mount allowlist at ~/.config/nanoclaw/mount-allowlist.json"
fi

# Build main project
print_step "Step 12: Building NanoClaw"
npm run build

# Create systemd service
print_step "Step 13: Creating systemd service"
sudo tee /etc/systemd/system/nanoclaw.service > /dev/null << EOF
[Unit]
Description=NanoClaw AI Assistant
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=$USER
WorkingDirectory=$HOME/nanoclaw
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
ReadWritePaths=$HOME/nanoclaw/groups $HOME/nanoclaw/data $HOME/nanoclaw/store

[Install]
WantedBy=multi-user.target
EOF

# Enable and start service
sudo systemctl daemon-reload
sudo systemctl enable nanoclaw

print_step "Step 14: Setup complete!"
echo ""
print_info "NanoClaw has been installed successfully!"
echo ""
echo "Next steps:"
echo "  1. Edit your .env file with API keys:"
echo "     nano ~/nanoclaw/.env"
echo ""
echo "  2. Start the service:"
echo "     sudo systemctl start nanoclaw"
echo ""
echo "  3. Check status:"
echo "     sudo systemctl status nanoclaw"
echo ""
echo "  4. View logs:"
echo "     sudo journalctl -u nanoclaw -f"
echo ""
echo "  5. Add messaging channels (WhatsApp, Telegram, etc.):"
echo "     cd ~/nanoclaw"
echo "     npx @anthropic-ai/claude-code"
echo "     # Then use /add-whatsapp or /add-telegram"
echo ""
echo "For detailed documentation, see:"
echo "  ~/nanoclaw/docs/DIGITALOCEAN_INSTALLATION.md"
echo ""
print_warn "Note: If you just added your user to the docker group, you may need to log out and back in."
