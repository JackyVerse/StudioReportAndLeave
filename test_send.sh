#!/bin/bash

# Script test gửi report qua Backend API (khuyến nghị) hoặc fallback webhook nếu cần

echo "🧪 Test gửi Weekly Report lên Discord"
echo ""

# Kiểm tra file report
if [ -z "$1" ]; then
    REPORT_FILE="reports/weekly-report-template.json"
    echo "📄 Sử dụng file mặc định: $REPORT_FILE"
else
    REPORT_FILE="$1"
fi

if [ ! -f "$REPORT_FILE" ]; then
    echo "❌ Không tìm thấy file: $REPORT_FILE"
    echo "💡 Tạo file report mới từ template hoặc chỉ định file khác"
    exit 1
fi

echo "📖 Đang đọc report từ: $REPORT_FILE"
echo "🚀 Đang gửi..."
echo ""

# Ưu tiên dùng Backend API: set REPORT_API_BASE_URL trước khi chạy
# Ví dụ:
# export REPORT_API_BASE_URL="https://leave.yourdomain.tld"

# Sử dụng venv nếu có
if [ -d "venv" ]; then
    source venv/bin/activate
    python send_report.py "$REPORT_FILE"
    deactivate
else
    python3 send_report.py "$REPORT_FILE"
fi

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Test thành công! Kiểm tra kênh Discord hoặc log Backend API."
else
    echo ""
    echo "❌ Test thất bại! Kiểm tra lại file report và cấu hình REPORT_API_BASE_URL (hoặc webhook fallback)."
fi
