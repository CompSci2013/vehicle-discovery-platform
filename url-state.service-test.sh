#!/bin/bash

##############################################################################
# UrlStateService Test Runner
##############################################################################
# Purpose: Start dev server and guide through browser-based service testing
# Note: Cannot use cURL because UrlStateService is frontend code (browser-only)
#
# What this script does:
# 1. Checks if dev container is running
# 2. Starts Angular dev server (port 4200)
# 3. Provides browser console commands for manual testing
#
# Created: 2025-11-11
##############################################################################

set -e  # Exit on error

echo "=========================================="
echo "UrlStateService Test Runner"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

##############################################################################
# Step 1: Check if container is running
##############################################################################

echo "🔍 Checking if dev container is running..."
if ! podman ps --format "{{.Names}}" | grep -q "vehicle-discovery-platform-dev"; then
    echo -e "${RED}❌ Dev container is not running!${NC}"
    echo ""
    echo "Start it with:"
    echo "  cd /home/odin/projects/vehicle-discovery-platform"
    echo "  podman run -d --name vehicle-discovery-platform-dev \\"
    echo "    -p 4200:4200 \\"
    echo "    -v ./frontend:/app:z \\"
    echo "    localhost/vehicle-discovery-platform-frontend:dev"
    exit 1
fi

echo -e "${GREEN}✅ Container is running${NC}"
echo ""

##############################################################################
# Step 2: Check if dev server is already running
##############################################################################

echo "🔍 Checking if Angular dev server is running..."
if podman exec vehicle-discovery-platform-dev pgrep -f "ng serve" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dev server already running${NC}"
    echo ""
else
    echo -e "${YELLOW}⚠️  Dev server not running. Starting...${NC}"
    echo ""

    # Start dev server in background
    podman exec -d vehicle-discovery-platform-dev sh -c "cd frontend && npm start > /tmp/ng-serve.log 2>&1"

    echo "⏳ Waiting for dev server to start..."
    echo "   (This may take 30-60 seconds for initial compilation)"
    echo ""

    # Wait for server to be ready (check for successful compilation)
    COUNTER=0
    MAX_WAIT=120  # 2 minutes max

    while [ $COUNTER -lt $MAX_WAIT ]; do
        if podman exec vehicle-discovery-platform-dev cat /tmp/ng-serve.log 2>/dev/null | grep -q "Compiled successfully"; then
            echo -e "${GREEN}✅ Dev server is ready!${NC}"
            echo ""
            break
        fi

        # Show progress
        if [ $((COUNTER % 10)) -eq 0 ]; then
            echo "   Still waiting... (${COUNTER}s elapsed)"
        fi

        sleep 1
        COUNTER=$((COUNTER + 1))
    done

    if [ $COUNTER -ge $MAX_WAIT ]; then
        echo -e "${RED}❌ Dev server failed to start within 2 minutes${NC}"
        echo ""
        echo "Check logs with:"
        echo "  podman exec vehicle-discovery-platform-dev cat /tmp/ng-serve.log"
        exit 1
    fi
fi

##############################################################################
# Step 3: Verify service is accessible
##############################################################################

# Try multiple possible URLs
DEV_URLS=(
    "http://192.168.0.244:4203"
    "http://localhost:4203"
    "http://192.168.0.244:4200"
    "http://localhost:4200"
)

echo "🔍 Testing server accessibility..."
FOUND_URL=""

for url in "${DEV_URLS[@]}"; do
    if curl -s --connect-timeout 2 "$url" > /dev/null 2>&1; then
        FOUND_URL="$url"
        echo -e "${GREEN}✅ Server is responding at $url${NC}"
        echo ""
        break
    fi
done

if [ -z "$FOUND_URL" ]; then
    echo -e "${RED}❌ Server not accessible at any expected URL${NC}"
    echo "   Tried:"
    for url in "${DEV_URLS[@]}"; do
        echo "     - $url"
    done
    echo ""
    echo "   Check if dev server is running and ports are exposed"
    exit 1
fi

##############################################################################
# Step 4: Display testing instructions
##############################################################################

echo "=========================================="
echo "🧪 Ready to Test UrlStateService"
echo "=========================================="
echo ""
echo -e "${GREEN}Frontend URL:${NC} $FOUND_URL"
echo ""
echo "📋 Why no cURL commands?"
echo "   UrlStateService is an Angular service that runs in the browser."
echo "   It manipulates browser URL state via Angular Router (client-side)."
echo "   cURL is for HTTP requests to backend APIs (server-side)."
echo ""
echo "✅ Testing Method: Browser DevTools Console"
echo ""
echo "📖 Complete testing guide:"
echo "   ${PWD}/frontend/url-state.service-browser-tests.md"
echo ""
echo "=========================================="
echo "Quick Start Testing Steps:"
echo "=========================================="
echo ""
echo "1️⃣  Open Browser to:"
echo "   $FOUND_URL"
echo ""
echo "2️⃣  Open DevTools Console:"
echo "   Press F12 → Console tab"
echo ""
echo "3️⃣  Get service instance:"
cat << 'EOF'
   const urlStateService = ng.probe(document.querySelector('app-root'))
     .injector.get('UrlStateService');
EOF
echo ""
echo "4️⃣  Run a quick test:"
cat << 'EOF'
   urlStateService.setQueryParams({ page: '2', sort: 'asc' })
     .subscribe(success => {
       console.log('✅ Success:', success);
       console.log('📍 URL:', window.location.href);
     });
EOF
echo ""
echo "5️⃣  Check URL in browser address bar:"
echo "   Should show: ?page=2&sort=asc"
echo ""
echo "=========================================="
echo "📚 Full Test Suite (14 Tests)"
echo "=========================================="
echo ""
echo "See detailed test commands in:"
echo "  frontend/url-state.service-browser-tests.md"
echo ""
echo "Key tests include:"
echo "  ✓ Set/merge/replace query parameters"
echo "  ✓ Get parameters (Observable & snapshot)"
echo "  ✓ Type conversion (string/number/boolean/array/object)"
echo "  ✓ Clear specific/all parameters"
echo "  ✓ Encoding/decoding complex types"
echo "  ✓ Observable reactivity & distinctUntilChanged"
echo ""
echo "=========================================="
echo "🛠️  Troubleshooting"
echo "=========================================="
echo ""
echo "If 'ng.probe' doesn't work, try Angular DevTools:"
echo "  1. Install: Chrome Web Store → 'Angular DevTools'"
echo "  2. Open DevTools → Angular tab"
echo "  3. Access service via profiler"
echo ""
echo "=========================================="
echo "💡 Tip: Keep This Terminal Open"
echo "=========================================="
echo ""
echo "View dev server logs:"
echo "  podman exec vehicle-discovery-platform-dev cat /tmp/ng-serve.log"
echo ""
echo "Stop dev server:"
echo "  podman exec vehicle-discovery-platform-dev pkill -f 'ng serve'"
echo ""
echo "Press Ctrl+C to exit this script (server keeps running)"
echo ""

# Keep script running so user can see output
echo "=========================================="
echo "⏸️  Script paused. Press Ctrl+C to exit."
echo "=========================================="
echo ""

# Wait indefinitely (user will Ctrl+C when done)
while true; do
    sleep 60
done
