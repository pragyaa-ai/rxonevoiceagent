#!/bin/bash
# Quick GCP VM Setup Script for rxone voiceagent v2.3
# Run this on your GCP VM instance

set -e

echo "🚀 Setting up rxone voiceagent v2.3 on GCP VM..."

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Clone the repository
git clone https://github.com/pragyaa-ai/rxonevoiceagent.git
cd rxonevoiceagent

# Install dependencies
npm install

# Build the production app
npm run build

# Create environment file
cat > .env.production << EOF
OPENAI_API_KEY=your_openai_api_key_here
OZONETEL_API_KEY=KK11001341678ccf2d10f850135f15c809
OZONETEL_DID=04048353553
NODE_ENV=production
PORT=3000
EOF

echo "⚙️ Environment file created. Please update your OpenAI API key in .env.production"

# Get the VM's external IP
EXTERNAL_IP=$(curl -s ifconfig.me)
echo "🌐 VM External IP: $EXTERNAL_IP"

# Configure firewall rules (if using Google Cloud)
echo "🔥 Configuring firewall rules..."
gcloud compute firewall-rules create allow-port-3000 --allow tcp:3000 --source-ranges 0.0.0.0/0 --description "Allow port 3000 for rxone voiceagent" || echo "Firewall rule may already exist"

# Start the application with PM2
echo "🚀 Starting rxone voiceagent..."
pm2 start custom-server.js --name "rxone-voiceagent"
pm2 startup
pm2 save

echo "✅ Setup complete!"
echo ""
echo "🔗 Your application is running at: http://$EXTERNAL_IP:3000"
echo "🎧 WebSocket endpoint: ws://$EXTERNAL_IP:3000/ws/ozonetel"
echo ""
echo "📝 Next steps:"
echo "1. Update .env.production with your OpenAI API key"
echo "2. Update XML endpoint to use: ws://$EXTERNAL_IP:3000/ws/ozonetel"
echo "3. Test the call connectivity"
echo ""
echo "📊 Monitor with: pm2 logs rxone-voiceagent"
echo "🔄 Restart with: pm2 restart rxone-voiceagent" 