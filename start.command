#!/bin/bash

# Script để khởi động web server - Double-click để chạy trên macOS

# Lấy thư mục hiện tại
cd "$(dirname "$0")"

# Hiển thị thông báo
echo "🚀 Đang khởi động Studio Report & Leave Web Server..."
echo ""

# Kiểm tra Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 chưa được cài đặt!"
    echo "💡 Vui lòng cài đặt Python 3 trước"
    echo ""
    echo "Nhấn phím bất kỳ để đóng..."
    read -n 1
    exit 1
fi

# Chạy server
python3 server.py

# Giữ terminal mở sau khi server dừng
echo ""
echo "Nhấn phím bất kỳ để đóng..."
read -n 1

