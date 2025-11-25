#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script test để xem format report mà không cần gửi lên Discord
"""

import json
import sys
from send_report import load_report, format_report_for_discord

def main():
    if len(sys.argv) > 1:
        report_file = sys.argv[1]
    else:
        report_file = 'reports/test-new-format.json'
    
    print(f"📖 Đang đọc report từ: {report_file}")
    report = load_report(report_file)
    
    print("\n📝 Format report:\n")
    print("=" * 80)
    message = format_report_for_discord(report)
    print(message)
    print("=" * 80)
    print(f"\n📊 Tổng số ký tự: {len(message)}")

if __name__ == "__main__":
    main()

