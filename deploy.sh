#!/usr/bin/env bash
set -euo pipefail

echo "🚀 Starting Seamless Solutions deployment..."

# Kill any existing processes on the ports
echo "📋 Cleaning up existing processes..."
pkill -f "node.*4000" || true
pkill -f "next.*3000" || true
sleep 2

# Start the API server in the background
echo "🔧 Starting API server on port 4000..."
cd /workspace/apps/api
nohup pnpm start > /tmp/api.log 2>&1 &
API_PID=$!
echo "API PID: $API_PID"

# Wait a moment for API to start
sleep 3

# Start the web server in the background
echo "🌐 Starting web server on port 3000..."
cd /workspace/apps/web
nohup pnpm start > /tmp/web.log 2>&1 &
WEB_PID=$!
echo "Web PID: $WEB_PID"

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are running
echo "🔍 Checking service health..."
if curl -s http://localhost:4000/health > /dev/null; then
    echo "✅ API is healthy at http://localhost:4000"
else
    echo "❌ API health check failed"
fi

if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Web app is healthy at http://localhost:3000"
else
    echo "❌ Web app health check failed"
fi

echo "🎉 Deployment complete!"
echo "📱 Web app: http://localhost:3000"
echo "🔧 API: http://localhost:4000"
echo "📋 API logs: tail -f /tmp/api.log"
echo "📋 Web logs: tail -f /tmp/web.log"

# Save PIDs for cleanup
echo "$API_PID" > /tmp/api.pid
echo "$WEB_PID" > /tmp/web.pid

echo "🛑 To stop services: kill \$(cat /tmp/api.pid) \$(cat /tmp/web.pid)"