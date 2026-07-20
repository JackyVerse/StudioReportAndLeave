#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Script để gửi Weekly Report lên Discord Channel
"""

import json
import sys
import os
import requests
from datetime import datetime
from typing import Dict, Any, Optional, List


def load_report(file_path: str) -> Dict[str, Any]:
    """Đọc file report JSON"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"❌ Không tìm thấy file: {file_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        print(f"❌ Lỗi đọc JSON: {e}")
        sys.exit(1)


def format_date(date_string: str) -> str:
    """Format date từ YYYY-MM-DD sang DD/MM/YYYY"""
    try:
        date = datetime.strptime(date_string, "%Y-%m-%d")
        return date.strftime("%d/%m/%Y")
    except ValueError:
        return date_string


def format_date_short(date_string: str) -> str:
    """Format date từ YYYY-MM-DD sang DD/MM"""
    try:
        date = datetime.strptime(date_string, "%Y-%m-%d")
        return date.strftime("%d/%m")
    except ValueError:
        return date_string


def normalize_task_list(raw) -> List[str]:
    """Đưa dữ liệu task về dạng list string"""
    if not raw:
        return []
    if isinstance(raw, list):
        normalized = []
        for item in raw:
            if isinstance(item, str):
                text = item.strip()
                if text:
                    normalized.append(text)
        return normalized
    if isinstance(raw, str):
        return [line.strip() for line in raw.split('\n') if line.strip()]
    return []


def format_bullet_lines(items) -> str:
    """Format danh sách task thành bullet list"""
    normalized = normalize_task_list(items)
    if not normalized:
        return "• N/A"
    return "\n".join(f"• {item}" for item in normalized)


def format_report_for_discord(report: Dict[str, Any]) -> str:
    """Format report thành message Discord với markdown"""
    
    # Check report type
    report_type = report.get('type', 'weekly')
    
    if report_type == 'daily':
        return format_daily_report_for_discord(report)
    else:
        return format_weekly_report_for_discord(report)


def format_daily_report_for_discord(report: Dict[str, Any]) -> str:
    """Format daily report thành message Discord"""
    message = ""
    
    # Header: Team Name DAILY REPORT
    team_name = report.get('teamName', '')
    if not team_name or not team_name.strip():
        team_name = 'N/A'
    else:
        team_name = team_name.strip()
    
    message += f"{team_name} DAILY REPORT\n\n"
    
    # Pre-compute date (used per-project below)
    date_str = report.get('date', '')
    date_formatted = format_date(date_str) if date_str else 'N/A'
    
    # Projects
    projects = report.get('projects', [])
    if projects and len(projects) > 0:
        for index, project in enumerate(projects, start=1):
            if index > 1:
                message += "\n"
            
            # Get project ID and Name
            project_id = project.get('projectId', '')
            project_name = project.get('projectName', '')
            
            # Format display name
            if project_id and project_name:
                display_name = f"{project_id} - {project_name}"
            elif project_id:
                display_name = project_id
            elif project_name:
                display_name = project_name
            else:
                display_name = 'Unnamed Project'
            
            # Project header with improved format - cleaner and easier to read
            message += f"📁 **PROJECT:** {display_name}\n"
            message += f"📅 **DATE:** {date_formatted}\n\n"
            
            overall_progress = (project.get('overallProgress') or '').strip()
            today_progress = (project.get('todayProgress') or '').strip()
            phase = (project.get('phase') or '').strip()
            
            if overall_progress or today_progress or phase:
                message += "📊 STATUS:\n"
                if overall_progress:
                    overall_display = overall_progress if overall_progress.endswith('%') else f"{overall_progress}%"
                    message += f"• Overall Progress: {overall_display}\n"
                if today_progress:
                    today_display = today_progress if today_progress.endswith('%') else f"{today_progress}%"
                    message += f"• Today Progress: {today_display}\n"
                if phase:
                    message += f"• Phase: {phase}\n"
                message += "\n"
            
            # DONE
            done = project.get('done', [])
            done_count = len(done) if done else 0
            message += f"✅ DONE: ({done_count})\n"
            if done_count > 0:
                for task in done:
                    if task:
                        message += f"- {task}\n"
            message += "\n"
            
            # IN-PROGRESS
            in_progress = project.get('inProgress', [])
            in_progress_count = len(in_progress) if in_progress else 0
            message += f"🔄 IN-PROGRESS: ({in_progress_count})\n"
            if in_progress_count > 0:
                for task in in_progress:
                    if task:
                        message += f"- {task}\n"
            message += "\n"
            
            # REMAINING
            remaining = project.get('remaining', [])
            remaining_count = len(remaining) if remaining else 0
            message += f"📋 REMAINING: ({remaining_count})\n"
            if remaining_count > 0:
                for task in remaining:
                    if task:
                        message += f"- {task}\n"
            message += "\n"
            
            # NOTE
            note = project.get('note', '')
            note_count = 1 if note and note.strip() else 0
            message += f"📝 NOTE: ({note_count})\n"
            if note_count > 0 and note and note.strip():
                message += f"{note.strip()}\n"
            message += "\n"
    
    return message


def format_weekly_report_for_discord(report: Dict[str, Any]) -> str:
    """Format weekly report thành message Discord với layout mới"""
    
    start_short = format_date_short(report.get('startDate', ''))
    end_short = format_date_short(report.get('endDate', ''))
    team_name = (report.get('teamName') or '').strip()
    
    lines: List[str] = []
    team_label = f"{team_name} - WEEKLY REPORT" if team_name else "TEAM - WEEKLY REPORT"
    period_label = f"{start_short or format_date(report.get('startDate', ''))} - {end_short or format_date(report.get('endDate', ''))}"
    lines.append(team_label)
    lines.append(period_label)
    
    projects = report.get('projects', [])
    
    if projects:
        for index, project in enumerate(projects):
            if index > 0:
                lines.append("")
            
            project_id = project.get('projectId', '')
            project_name = project.get('projectName', '')
            if project_id and project_name:
                display_name = f"{project_id} - {project_name}"
            elif project_id:
                display_name = project_id
            elif project_name:
                display_name = project_name
            else:
                display_name = project.get('name', 'Unnamed Project')
            
            lines.append(f"🎮 **{display_name}**")
            scope = (project.get('scopeOfWork') or '').strip()
            if scope:
                lines.append(f"*Scope:* {scope}")
            
            wbs = (project.get('wbs') or '').strip()
            if wbs:
                lines.append(f"*WBS:* {wbs}")
            
            # PROJECT STATUS block
            current_progress = (project.get('currentProgress') or '').strip()
            estimated_progress = (project.get('estimatedProgress') or '').strip()
            phase = (project.get('phase') or '').strip()
            
            if current_progress or estimated_progress or phase:
                lines.append("📊 **PROJECT STATUS**")
                if current_progress:
                    lines.append(f"- Current Progress: {current_progress}%")
                if estimated_progress:
                    lines.append(f"- Estimated Next Progress: {estimated_progress}%")
                if phase:
                    lines.append(f"- Phase: {phase}")
            
            completed = normalize_task_list(project.get('completedTasks'))
            planned = normalize_task_list(project.get('plannedTasks'))
            notes_list = normalize_task_list(project.get('notes'))
            
            ontime_percentage = project.get('ontimePercentage')
            ontime_header = f"\t**1/ ONTIME ({len(completed)})"
            if ontime_percentage:
                ontime_header += f" - {ontime_percentage}% % thực tế đã xong"
            ontime_header += ":**"
            lines.append(ontime_header)
            completed_formatted = format_bullet_lines(completed)
            completed_indented = "\n".join(f"\t{line}" for line in completed_formatted.split("\n") if line.strip())
            lines.append(completed_indented)
            
            next_target_percentage = project.get('nextTargetPercentage')
            next_header = f"\t**2/ NEXT TARGET ({len(planned)})"
            if next_target_percentage:
                next_header += f" - {next_target_percentage}% % dự định hoàn thành"
            next_header += ":**"
            lines.append(next_header)
            planned_formatted = format_bullet_lines(planned)
            planned_indented = "\n".join(f"\t{line}" for line in planned_formatted.split("\n") if line.strip())
            lines.append(planned_indented)
            
            notes_header = f"\t**3/ NOTE ({len(notes_list)}):**"
            lines.append(notes_header)
            notes_formatted = format_bullet_lines(notes_list)
            notes_indented = "\n".join(f"\t{line}" for line in notes_formatted.split("\n") if line.strip())
            lines.append(notes_indented)
    else:
        lines.append("Chưa có dự án nào.")
    
    return "\n".join(lines).strip()


def send_to_discord(webhook_url: str, message: str, username: str = "Weekly Report Bot") -> bool:
    """Gửi message lên Discord qua webhook"""
    
    # Discord có giới hạn 2000 ký tự cho message
    # Nếu vượt quá, chia thành nhiều message
    max_length = 1900  # Để an toàn, để lại margin
    
    if len(message) <= max_length:
        # Gửi một lần
        payload = {
            "content": message,
            "username": username
        }
    else:
        # Chia thành nhiều phần
        parts = []
        lines = message.split('\n')
        current_part = ""
        
        for line in lines:
            if len(current_part) + len(line) + 1 > max_length:
                if current_part:
                    parts.append(current_part)
                current_part = line + "\n"
            else:
                current_part += line + "\n"
        
        if current_part:
            parts.append(current_part)
        
        # Gửi từng phần
        for i, part in enumerate(parts):
            if i == 0:
                payload = {
                    "content": part,
                    "username": username
                }
            else:
                payload = {
                    "content": part
                }
            
            response = requests.post(webhook_url, json=payload)
            if response.status_code != 204:
                print(f"❌ Lỗi gửi phần {i+1}: {response.status_code} - {response.text}")
                return False
            
            # Đợi một chút giữa các message
            import time
            time.sleep(0.5)
        
        return True
    
    try:
        response = requests.post(webhook_url, json=payload, timeout=10)
        
        if response.status_code == 204:
            print("✅ Đã gửi report lên Discord thành công!")
            return True
        else:
            print(f"❌ Lỗi gửi Discord: {response.status_code} - {response.text}")
            return False
            
    except requests.exceptions.RequestException as e:
        print(f"❌ Lỗi kết nối: {e}")
        return False


def send_to_backend_api(api_base_url: str, message: str, report_type: str = 'weekly') -> bool:
    """Gửi message tới backend API để server xử lý (ẩn webhook ở server)."""
    api_path = os.getenv('REPORT_API_WEEKLY_PATH', '/api/weekly')
    url = api_base_url.rstrip('/') + api_path
    try:
        resp = requests.post(url, json={'message': message, 'type': report_type}, timeout=15)
        if resp.ok:
            print("✅ Đã gửi report qua backend API")
            return True
        print(f"❌ Backend API lỗi {resp.status_code}: {resp.text}")
        return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Lỗi gọi backend API: {e}")
        return False


def main():
    """Hàm main"""
    
    # Lấy đường dẫn file report từ argument hoặc environment variable
    if len(sys.argv) > 1:
        report_file = sys.argv[1]
    elif os.getenv('REPORT_FILE'):
        report_file = os.getenv('REPORT_FILE')
    else:
        # Mặc định là file trong thư mục reports
        report_file = 'reports/weekly-report.json'
    
    # Ưu tiên gửi qua backend API nếu có
    api_base_url = os.getenv('REPORT_API_BASE_URL')
    
    # Đọc report
    print(f"📖 Đang đọc report từ: {report_file}")
    report = load_report(report_file)
    
    # Format message
    print("📝 Đang format report...")
    message = format_report_for_discord(report)
    
    if api_base_url:
        print("🚀 Đang gửi qua Backend API...")
        success = send_to_backend_api(api_base_url, message, report_type='weekly')
    else:
        # Fallback: gửi trực tiếp webhook nếu chưa có backend
        # Ưu tiên biến mới WEEKLY_REPORT_WEBHOOK_URL; fallback DISCORD_WEBHOOK_URL để không phá vỡ cấu hình cũ
        webhook_url = os.getenv('WEEKLY_REPORT_WEBHOOK_URL') or os.getenv('DISCORD_WEBHOOK_URL')
        if not webhook_url:
            print("❌ Chưa cấu hình REPORT_API_BASE_URL hoặc WEEKLY_REPORT_WEBHOOK_URL/DISCORD_WEBHOOK_URL")
            print("   Khuyến nghị dùng REPORT_API_BASE_URL để ẩn webhook ở server.")
            sys.exit(1)
        print("🚀 Đang gửi trực tiếp lên Discord (fallback)...")
        success = send_to_discord(webhook_url, message)
    
    if success:
        print("\n✅ Hoàn thành!")
        sys.exit(0)
    else:
        print("\n❌ Có lỗi xảy ra!")
        sys.exit(1)


if __name__ == "__main__":
    main()
