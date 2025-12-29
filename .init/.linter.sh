#!/bin/bash
cd /home/kavia/workspace/code-generation/simple-notes-app-50967-50976/notes_app_frontend
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

