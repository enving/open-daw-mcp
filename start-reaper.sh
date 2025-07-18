#!/bin/bash
set -e

echo "Starting REAPER Headless Setup..."

# Set up virtual display for headless mode
export DISPLAY=:99
Xvfb :99 -screen 0 1024x768x24 > /dev/null 2>&1 &

# Start JACK with dummy driver (no real audio hardware needed)
echo "Starting JACK audio server..."
jackd -d dummy -r 44100 -p 1024 &
JACK_PID=$!

# Allow JACK some time to initialize
sleep 2

echo "JACK audio server started (PID: $JACK_PID)."
echo "-----------------------------------------------"

# Start REAPER in the background
echo "Starting REAPER..."
reaper -nosplash -nonewinst &
REAPER_PID=$!
echo "REAPER PID=$REAPER_PID"

# Wait for REAPER to initialize
echo "Waiting for REAPER to initialize (max 30s)..."
for i in $(seq 1 30); do
    if pgrep -f reaper > /dev/null; then
        echo "REAPER is running after ${i}s"
        break
    fi
    sleep 1
done

# Start API server
echo "Starting API server..."
python3 /app/src/server/reaper_api.py &
API_PID=$!

echo "-----------------------------------------------"
echo "REAPER and API server started successfully!"
echo "REAPER PID: $REAPER_PID"
echo "API PID: $API_PID"

# Keep the container running
tail -f /dev/null 