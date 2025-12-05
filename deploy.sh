#!/bin/bash
set -e

echo "Building frontend..."
cd ~/monopoly-ui/frontend && bun run build

echo "Building backend..."
cd ~/monopoly-ui/backend && cargo build --release

echo "Restarting backend..."
sudo systemctl restart monopoly-backend

echo "Done!"
