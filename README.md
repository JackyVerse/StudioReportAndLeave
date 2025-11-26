# 📊 Weekly Report Discord Channel

Dự án tự động gửi báo cáo tuần (Weekly Report) lên kênh Discord thông qua GitHub Actions.

## ✨ Tính năng

- 🎨 **Giao diện Web trực quan**: Tạo và quản lý reports dễ dàng qua trình duyệt
- 🤖 **Tự động hóa**: Tự động gửi report mỗi tuần qua GitHub Actions
- 📝 **Format đẹp**: Report được format đẹp mắt với markdown trên Discord
- 💾 **Lưu trữ local**: Lưu reports trong trình duyệt (localStorage)
- 📥 **Export JSON**: Tải xuống file JSON để commit lên GitHub

## 🚀 Hướng dẫn sử dụng

### 0. Chạy Web Interface Local (Để test và tạo report)

#### Cách 1: Sử dụng Python Server (Khuyên dùng)
```bash
# Chạy server
python3 server.py

# Hoặc sử dụng script
./start.sh
```

Mỗi dự án trong form Weekly Report có thêm 2 trường:

- **Scope of work**: mô tả nhanh phase/phạm vi công việc tuần đó (hiển thị nguyên văn ngay dưới tên dự án trong report).
- **WBS**: link hoặc ghi chú đi kèm (WBS, doc planning...) – hiển thị ngay sau Scope nếu có.

Server sẽ tự động mở trình duyệt tại `http://localhost:8989`

#### Cách 2: Mở trực tiếp file HTML
- Double-click vào file `index.html` để mở trong trình duyệt
- ⚠️ Một số tính năng có thể hoạt động tốt hơn khi chạy qua server

#### Cách 3: Sử dụng VS Code Live Server
- Cài extension "Live Server"
- Right-click vào `index.html` → "Open with Live Server"

📖 **Xem chi tiết:** [TEST_GUIDE.md](TEST_GUIDE.md)

### 1. Setup Backend API (khuyến nghị) hoặc Discord Webhook (fallback)

1. Vào Discord Server của bạn
2. Chọn **Server Settings** → **Integrations** → **Webhooks**
3. Click **New Webhook**
4. Chọn channel muốn gửi report
5. Copy **Webhook URL**
6. Vào GitHub repo → **Settings** → **Secrets and variables** → **Actions**
7. (Khuyến nghị) Tạo Backend API giữ Webhook ở server. Ứng dụng client sẽ gọi `REPORT_API_BASE_URL` → server gửi lên Discord.
8. (Fallback) Nếu chưa có backend, tạo secret `DISCORD_WEBHOOK_URL` và dán URL webhook.

### 2. Sử dụng Web Interface

1. Mở file `index.html` trong trình duyệt
2. Điền thông tin report:
   - Số tuần và năm
   - Ngày bắt đầu và kết thúc
   - Công việc đã hoàn thành
   - Công việc đang thực hiện
   - Công việc dự kiến
   - Ghi chú/Blockers
3. Click **Xem Trước** để preview
4. Click **Lưu Report** để lưu vào localStorage
5. Click **Tải File JSON** để tải file JSON

### 3. Commit file JSON lên GitHub

1. Sau khi tải file JSON, đặt nó vào thư mục `reports/`
2. Commit và push lên GitHub:
   ```bash
   git add reports/weekly-report-*.json
   git commit -m "Add weekly report for week X"
   git push
   ```

### 4. Cấu hình GitHub Actions

Workflow sẽ tự động chạy:
- **Tự động**: Mỗi Thứ 2 lúc 9:00 AM (UTC+7)
- **Thủ công**: Vào tab **Actions** → Chọn workflow → Click **Run workflow**

### 5. Test thử

Bạn có thể test bằng cách:
- Chạy thủ công workflow từ GitHub Actions
- Hoặc chạy script Python local:

```bash
# Cài đặt dependencies
pip install -r requirements.txt

# Ưu tiên: Set Backend API
export REPORT_API_BASE_URL="https://leave.yourdomain.tld"

# Fallback: Set webhook URL nếu chưa có backend
# export DISCORD_WEBHOOK_URL="your-webhook-url"

# Chạy script
python send_report.py reports/weekly-report-1-2024.json
```

## 📁 Cấu trúc dự án

```
WeeklyDeliveryDiscordChannel/
├── .github/
│   └── workflows/
│       └── weekly-report.yml      # GitHub Actions workflow
├── reports/
│   ├── .gitkeep
│   └── weekly-report-template.json # Template mẫu
├── index.html                      # Web interface
├── styles.css                      # CSS styling
├── app.js                          # JavaScript logic
├── send_report.py                  # Python script gửi Discord
├── requirements.txt                # Python dependencies
└── README.md                       # File này
```

## 📝 Format Report

Report được format với cấu trúc:

```
----
TEAM - WEEKLY REPORT
DD/MM - DD/MM

🎮 **GAME-001 - Project name**
*Scope:* Finetune phase
*WBS:* https://example.com/wbs

**1/ ONTIME (4) - 30% % thực tế đã xong:**
• Task A ---> T2 Done (Hoàn thành như commit đầu tuần)
• Task B ---> T3 Done (Hoàn thành bổ sung)

**2/ NEXT TARGET (3) - 50% % dự định hoàn thành:**
• Task C ---> T2
• Task D ---> T3
• Task E ---> T4

**3/ NOTE (2):**
• Delivery Planning (GDD) ---> Tuần 4, Tháng 11
• Flow game trong doc chưa clear...
```

## 🔧 Tùy chỉnh

### Thay đổi lịch gửi

Chỉnh sửa file `.github/workflows/weekly-report.yml`:

```yaml
schedule:
  - cron: '0 2 * * 1'  # Thứ 2 lúc 9:00 AM UTC+7
```

Công thức cron: `phút giờ ngày tháng thứ-trong-tuần`

### Thay đổi format message

Chỉnh sửa hàm `format_report_for_discord()` trong file `send_report.py`

## ⚙️ Requirements

- Python 3.7+
- Discord Webhook URL
- GitHub repository với GitHub Actions enabled

## 📄 License

MIT License

## 🤝 Đóng góp

Mọi đóng góp đều được chào đón! Hãy tạo issue hoặc pull request.

### 🔁 Chuẩn Commit Message (Conventional Commits)

Áp dụng format: `type(scope?): short description`

#### Các `type` nên dùng

| Type  | Khi sử dụng                                                                    |
|-------|---------------------------------------------------------------------------------|
| `feat`| Thêm/chỉnh sửa tính năng (ví dụ đổi format report, thêm trường mới)             |
| `fix` | Sửa bug, lỗi logic                                                              |
| `docs`| Chỉnh README, guide, comment                                                    |
| `style`| Chỉ đổi định dạng (lint, indent)                                               |
| `refactor`| Tái cấu trúc code không đổi behavior                                         |
| `test`| Thêm/chỉnh test                                                                 |
| `chore`| Việc meta: cập nhật deps, config build, scripts                                |

#### Quy tắc nhanh

1. **Tiếng Anh, hiện tại**, <= 72 ký tự
2. Không viết hoa chữ cái đầu mô tả sau dấu `:` (trừ danh từ riêng)
3. Có thể thêm `scope` trong ngoặc để chỉ phần ảnh hưởng (`feat(report): bold headers`)
4. Dùng body khi cần mô tả lý do/ảnh hưởng (mỗi dòng <= 72 ký tự)

Ví dụ:
```
feat(report): support bold weekly headers

fix: handle empty planned tasks crash
docs: add commit guidelines section
```

Lợi ích: changelog / release tự động dễ phân loại, review nhanh, CI dễ trigger.

## 📞 Hỗ trợ

Nếu có vấn đề, hãy tạo issue trên GitHub repo.