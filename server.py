#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Simple HTTP server để chạy web interface local
"""

import http.server
import socketserver
import webbrowser
import os
import sys

PORT = 8989

class Handler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Thêm CORS headers nếu cần
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()

def main():
    # Đổi thư mục làm việc
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    
    try:
        with socketserver.TCPServer(("", PORT), Handler) as httpd:
            url = f"http://localhost:{PORT}"
            print("=" * 60)
            print("🚀 Web Server đang chạy!")
            print("=" * 60)
            print(f"📖 Mở trình duyệt tại: {url}")
            print(f"📁 Thư mục: {os.getcwd()}")
            print("=" * 60)
            print("💡 Nhấn Ctrl+C để dừng server")
            print("=" * 60)
            
            # Tự động mở trình duyệt
            try:
                webbrowser.open(url)
                print("✅ Đã tự động mở trình duyệt!")
            except:
                print("⚠️  Không thể tự động mở trình duyệt, vui lòng mở thủ công")
            
            print()
            httpd.serve_forever()
            
    except OSError as e:
        if e.errno == 48:  # Address already in use
            print(f"❌ Port {PORT} đang được sử dụng!")
            print(f"💡 Thử port khác: python server.py {PORT + 1}")
        else:
            print(f"❌ Lỗi: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        print("\n\n👋 Đã dừng server. Tạm biệt!")

if __name__ == "__main__":
    # Có thể chỉ định port khác
    if len(sys.argv) > 1:
        try:
            PORT = int(sys.argv[1])
        except ValueError:
            print(f"⚠️  Port không hợp lệ: {sys.argv[1]}, sử dụng port mặc định: {PORT}")
    
    main()
