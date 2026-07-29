#!/bin/bash
cd "/c/Users/Sarjana Ajay Kumar/AI-Workspace/Helix"
GEMINI_API_KEY=test-key OPENROUTER_API_KEY=test-key LOG_TO_FILE=false node dist/server.js > /tmp/server.log 2>&1 &
SERVER_PID=$!
sleep 5
curl -s -X POST http://localhost:3120/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-key" \
  -d '{
    "model": "gemini-2.5-flash",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50
  }'
sleep 2
kill $SERVER_PID
cat /tmp/server.log