#!/bin/bash

# Script để khởi động web server

echo "🚀 Đang khởi động Weekly Report Web Server..."
echo ""

# Kiểm tra Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 chưa được cài đặt!"
    echo "💡 Vui lòng cài đặt Python 3 trước"
    exit 1
fi

# Chạy server
python3 server.py
