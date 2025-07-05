# GCP VM Deployment Guide for Ozonetel + OpenAI Realtime

## 1. Create GCP VM Instance

```bash
# Create VM with external IP
gcloud compute instances create ozonetel-realtime-vm \
  --zone=us-central1-a \
  --machine-type=e2-standard-2 \
  --subnet=default \
  --network-tier=PREMIUM \
  --maintenance-policy=MIGRATE \
  --provisioning-model=STANDARD \
  --tags=http-server,https-server \
  --image=ubuntu-2004-focal-v20231213 \
  --image-project=ubuntu-os-cloud \
  --boot-disk-size=20GB \
  --boot-disk-type=pd-standard \
  --boot-disk-device-name=ozonetel-vm
```

## 2. Configure Firewall Rules

```bash
# Allow HTTP traffic
gcloud compute firewall-rules create allow-http-8080 \
  --allow tcp:8080 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow HTTP traffic on port 8080"

# Allow WebSocket traffic
gcloud compute firewall-rules create allow-websocket-8080 \
  --allow tcp:8080 \
  --source-ranges 0.0.0.0/0 \
  --description "Allow WebSocket traffic on port 8080"
```

## 3. VM Setup Script

```bash
#!/bin/bash
# Save as setup-vm.sh and run on GCP VM

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Install nginx for reverse proxy (optional)
sudo apt install -y nginx

# Clone your repository
git clone https://github.com/your-username/your-repo.git
cd your-repo

# Install dependencies
npm install

# Build production app
npm run build

# Set environment variables
cat > .env.production << EOF
OPENAI_API_KEY=your_openai_api_key_here
OZONETEL_API_KEY=KK11001341678ccf2d10f850135f15c809
OZONETEL_DID=04048353553
NODE_ENV=production
PORT=3000
EOF

# Start with PM2
pm2 start custom-server.js --name "ozonetel-realtime"
pm2 startup
pm2 save

echo "✅ Server setup complete!"
echo "🔗 Your server will be available at: http://YOUR_VM_EXTERNAL_IP:3000"
echo "🎧 WebSocket endpoint: ws://YOUR_VM_EXTERNAL_IP:3000/ws/ozonetel"
```

## 4. Update XML Endpoint for GCP

Update your XML endpoint to use VM IP instead of ngrok:

```xml
<!-- Instead of ngrok URL -->
<stream is_sip="true" url="ws://YOUR_VM_EXTERNAL_IP:3000/ws/ozonetel?cust_name=Mr.Sachin&key=KK11001341678ccf2d10f850135f15c809" />
```

## 5. Benefits of GCP VM Deployment

### Performance
- **No tunneling overhead** - Direct connection
- **Better latency** - No ngrok proxy delays
- **Stable connections** - No tunnel disconnections

### Scalability
- **Multiple ports** - Run HTTP + WebSocket on same or different ports
- **Auto-scaling** - GCP can auto-scale based on demand
- **Load balancing** - Distribute traffic across multiple instances

### Production Ready
- **SSL/TLS** - Proper certificates with domain
- **Monitoring** - GCP monitoring and logging
- **Backup** - VM snapshots and backups

## 6. Expected Results

With GCP VM deployment:
- **Call duration** should increase from 1 second to full conversation length
- **WebSocket connections** will work properly
- **No ngrok limitations** - unlimited simultaneous connections
- **Better performance** - faster response times

## 7. Domain Setup (Optional)

```bash
# Point your domain to VM external IP
# Update DNS A record: ozonetel.yourdomain.com -> VM_EXTERNAL_IP

# Install SSL certificate
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d ozonetel.yourdomain.com

# Update XML to use domain
# <stream is_sip="true" url="wss://ozonetel.yourdomain.com/ws/ozonetel" />
```

## 8. Monitoring & Debugging

```bash
# View logs
pm2 logs ozonetel-realtime

# Monitor process
pm2 monit

# Restart if needed
pm2 restart ozonetel-realtime

# Check WebSocket connections
sudo netstat -tlnp | grep :3000
```

## Cost Estimation

- **e2-standard-2** VM: ~$50/month
- **20GB SSD**: ~$3/month
- **External IP**: ~$5/month
- **Total**: ~$60/month

Much cheaper than paid ngrok plans and production-ready! 