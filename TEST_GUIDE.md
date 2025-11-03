# 🧪 Hướng dẫn Test Dự án

## 🚀 Cách Chạy Web Interface

### Phương pháp 1: Sử dụng Python Server (Khuyên dùng)

```bash
# Chạy server
python3 server.py
```

Hoặc đơn giản:

```bash
# Trên macOS/Linux
./start.sh

# Hoặc nếu chưa có quyền execute
chmod +x start.sh
./start.sh
```

Server sẽ tự động mở trình duyệt tại `http://localhost:8989`

### Phương pháp 2: Mở trực tiếp file HTML

1. Mở Finder (macOS) hoặc File Explorer (Windows)
2. Tìm file `index.html`
3. Double-click để mở trong trình duyệt
4. ⚠️ Lưu ý: Một số tính năng có thể không hoạt động tốt khi mở trực tiếp

### Phương pháp 3: Sử dụng VS Code Live Server

Nếu bạn dùng VS Code:
1. Cài extension "Live Server"
2. Right-click vào `index.html`
3. Chọn "Open with Live Server"

## ✅ Test Checklist

### 1. Test Tạo Report

- [ ] Mở web interface
- [ ] Điền đầy đủ thông tin:
  - Số tuần (ví dụ: 1)
  - Năm (ví dụ: 2024)
  - Ngày bắt đầu và kết thúc
  - Các công việc đã hoàn thành (mỗi dòng một task)
  - Các công việc đang thực hiện
  - Các công việc dự kiến
  - Ghi chú (tùy chọn)

### 2. Test Xem Trước

- [ ] Click nút "👁️ Xem Trước"
- [ ] Kiểm tra format hiển thị có đúng không
- [ ] Kiểm tra các emoji và format markdown

### 3. Test Lưu Report

- [ ] Click nút "💾 Lưu Report"
- [ ] Xem có thông báo thành công không
- [ ] Kiểm tra report đã xuất hiện trong "Danh Sách Reports Đã Lưu" chưa
- [ ] Click vào report card để xem lại

### 4. Test Tải File JSON

- [ ] Điền form và click "📥 Tải File JSON"
- [ ] Kiểm tra file đã được tải về chưa
- [ ] Mở file JSON và kiểm tra format:
  ```json
  {
    "weekNumber": 1,
    "year": 2024,
    "startDate": "2024-01-01",
    "endDate": "2024-01-07",
    "completedTasks": ["Task 1", "Task 2"],
    "inProgressTasks": ["Task 1"],
    "plannedTasks": ["Task 1"],
    "notes": "Ghi chú..."
  }
  ```

### 5. Test Gửi lên Discord (Local)

Trước tiên, cần có Discord Webhook URL:

1. **Lấy Webhook URL:**
   - Vào Discord Server → Server Settings → Integrations → Webhooks
   - Tạo webhook mới hoặc copy URL của webhook có sẵn
   - Chọn channel muốn nhận report

2. **Test gửi:**
   ```bash
   # Set webhook URL
   export DISCORD_WEBHOOK_URL="your-webhook-url-here"
   
   # Tạo file test report
   cp reports/weekly-report-template.json reports/test-report.json
   
   # Chỉnh sửa file test-report.json nếu cần
   
   # Gửi test
   python3 send_report.py reports/test-report.json
   ```

3. **Kiểm tra:**
   - Vào Discord channel
   - Xem có nhận được message report không
   - Kiểm tra format có đẹp không

### 6. Test GitHub Actions (Nếu đã setup)

1. **Commit file report lên GitHub:**
   ```bash
   git add reports/weekly-report-1-2024.json
   git commit -m "Add test report"
   git push
   ```

2. **Chạy workflow thủ công:**
   - Vào GitHub repo → tab "Actions"
   - Chọn workflow "Weekly Report Sender"
   - Click "Run workflow"
   - Chọn branch và click "Run workflow"

3. **Kiểm tra:**
   - Xem logs trong GitHub Actions
   - Kiểm tra Discord channel có nhận được report không

## 🐛 Test Cases Đặc Biệt

### Test với dữ liệu rỗng
- Tạo report với một số trường để trống
- Xem preview và format có đúng không

### Test với dữ liệu dài
- Tạo report với rất nhiều tasks (10-20 tasks mỗi loại)
- Kiểm tra format hiển thị
- Test gửi lên Discord (có thể bị chia thành nhiều message)

### Test với ký tự đặc biệt
- Thử nhập emoji, ký tự đặc biệt (/, *, _, etc.)
- Kiểm tra format markdown có đúng không

### Test localStorage
- Tạo nhiều reports
- Refresh trang
- Kiểm tra reports có còn lưu không

## 🔧 Troubleshooting

### Server không chạy được

**Lỗi: Port đang được sử dụng**
```bash
# Dùng port khác
python3 server.py 8001
```

**Lỗi: Module không tìm thấy**
```bash
# Đảm bảo đang ở đúng thư mục
cd /path/to/WeeklyDeliveryDiscordChannel
python3 server.py
```

### Discord không nhận được message

1. **Kiểm tra Webhook URL:**
   - URL có đúng không
   - Webhook có còn hoạt động không (chưa bị xóa)

2. **Kiểm tra logs:**
   ```bash
   python3 send_report.py reports/test-report.json
   ```
   Xem có lỗi gì không

3. **Kiểm tra file JSON:**
   - File có format đúng không
   - Có thể parse được không

### Web interface không hiển thị đẹp

- Mở Developer Tools (F12) xem có lỗi console không
- Kiểm tra file CSS có load được không
- Thử hard refresh (Ctrl+Shift+R hoặc Cmd+Shift+R)

## 📝 Test Report Mẫu

Sau khi test, bạn có thể tạo test report mẫu:

```json
{
  "weekNumber": 1,
  "year": 2024,
  "startDate": "2024-01-01",
  "endDate": "2024-01-07",
  "completedTasks": [
    "Hoàn thành setup dự án Weekly Report",
    "Tạo web interface",
    "Setup GitHub Actions"
  ],
  "inProgressTasks": [
    "Test các tính năng",
    "Viết documentation"
  ],
  "plannedTasks": [
    "Deploy production",
    "Thêm tính năng export PDF"
  ],
  "notes": "Dự án đang trong giai đoạn test. Mọi thứ hoạt động tốt!"
}
```

Chúc bạn test vui vẻ! 🎉
