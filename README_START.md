# 🚀 Hướng dẫn khởi động ứng dụng

## Cách 1: Double-click file (Dễ nhất - macOS)

1. Tìm file `start.command` trong thư mục project
2. **Double-click** vào file `start.command`
3. Terminal sẽ tự động mở và khởi động server
4. Trình duyệt sẽ tự động mở tại: http://localhost:8000

**Lưu ý**: Lần đầu chạy có thể macOS sẽ hỏi xác nhận, chọn "Open" hoặc "Allow".

## Cách 2: Dùng Terminal

Mở Terminal và chạy:

```bash
cd /Users/fe-giaan/Documents/Github/StudioReportAndLeave
./start.sh
```

hoặc:

```bash
python3 server.py
```

## Cách 3: Dùng file .command

```bash
./start.command
```

## Dừng server

Nhấn `Ctrl + C` trong Terminal để dừng server.

## Troubleshooting

- **Lỗi "Permission denied"**: Chạy `chmod +x start.command` trong Terminal
- **Lỗi "Python not found"**: Cài đặt Python 3 từ https://www.python.org/
- **Port đã được sử dụng**: Đổi port trong file `server.py` (dòng 13)

