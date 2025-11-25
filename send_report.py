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
from typing import Dict, Any, Optional


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
    
    message += f"==== {team_name} DAILY REPORT ====\n\n"
    
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


def parse_task_with_timeline(task: str) -> tuple:
    """Parse task để tách task name và timeline (nếu có)
    Returns: (task_name, timeline, is_done, late_info)
    """
    task = task.strip()
    if not task:
        return (task, None, False, None)
    
    # Kiểm tra format "Task ---> T2 Done" hoặc "Task ---> T2"
    if '--->' in task:
        parts = task.split('--->')
        task_name = parts[0].strip()
        timeline_part = parts[1].strip() if len(parts) > 1 else ''
        
        # Kiểm tra late info trước: "Task ---> T3 (Late: 20% - Do thiếu asset)"
        late_info = None
        timeline = timeline_part
        if '(' in timeline_part and 'Late:' in timeline_part:
            # Tách late info
            late_start = timeline_part.find('(')
            late_end = timeline_part.find(')', late_start)
            if late_end > late_start:
                late_info = timeline_part[late_start+1:late_end]
                timeline = timeline_part[:late_start].strip()
        
        # Kiểm tra Done sau khi đã tách late info
        is_done = 'Done' in timeline or 'done' in timeline
        if is_done:
            timeline = timeline.replace('Done', '').replace('done', '').strip()
        
        return (task_name, timeline, is_done, late_info)
    
    return (task, None, False, None)


def format_weekly_report_for_discord(report: Dict[str, Any]) -> str:
    """Format weekly report thành message Discord với markdown"""
    
    week_number = report.get('weekNumber', 'N/A')
    year = report.get('year', datetime.now().year)
    start_date = format_date(report.get('startDate', ''))
    end_date = format_date(report.get('endDate', ''))
    
    # Build message header
    message = f"# 📊 WEEKLY REPORT - WEEK {week_number}/{year}\n\n"
    
    # Hiển thị Team Name nếu có
    team_name = report.get('teamName', '')
    if team_name and team_name.strip():
        message += f"**👥 Team:** {team_name.strip()}\n\n"
    
    message += f"**📅 Period:** {start_date} - {end_date}\n\n"
    
    # Format theo từng dự án (format mới)
    projects = report.get('projects', [])
    
    if projects and len(projects) > 0:
        # Format mới: theo từng dự án
        for index, project in enumerate(projects, start=1):
            # Lấy project ID và Name riêng, format lại như cũ
            project_id = project.get('projectId', '')
            project_name = project.get('projectName', '')
            
            # Nếu có cả ID và Name, format "ID - Name"
            if project_id and project_name:
                display_name = f"{project_id} - {project_name}"
            elif project_id:
                display_name = project_id
            elif project_name:
                display_name = project_name
            else:
                # Fallback về name cũ (backward compatibility)
                display_name = project.get('name', 'Unnamed Project')
            
            # Format mới: 🎮 Project name
            message += f"🎮 {display_name}\n\n"
            message += f"== Scope of work ==\n\n"
            
            # 1/ ONTIME - từ completedTasks
            completed = project.get('completedTasks', [])
            if isinstance(completed, str):
                completed = [t.strip() for t in completed.split('\n') if t.strip()]
            
            # Lấy phần trăm ONTIME từ project hoặc tính toán
            ontime_percentage = project.get('ontimePercentage', '')
            if not ontime_percentage and completed:
                # Nếu không có phần trăm, có thể để trống hoặc tính toán
                ontime_percentage = ''
            
            if completed:
                message += f"1/ ONTIME ({ontime_percentage}%):\n\n" if ontime_percentage else "1/ ONTIME:\n\n"
                for task in completed:
                    if task:
                        task_name, timeline, is_done, _ = parse_task_with_timeline(task)
                        # Nếu task đã có format "Task ---> T2", giữ nguyên format
                        if '--->' in task:
                            if timeline:
                                if is_done:
                                    formatted_task = f"{task_name} ---> {timeline} Done"
                                else:
                                    formatted_task = f"{task_name} ---> {timeline}"
                            else:
                                formatted_task = f"{task_name} ---> Done" if is_done else task_name
                        else:
                            # Nếu task không có format timeline, hiển thị nguyên task
                            formatted_task = task
                        message += f"   - {formatted_task}\n"
                message += "\n"
            else:
                message += f"1/ ONTIME ({ontime_percentage}%):\n\n" if ontime_percentage else "1/ ONTIME:\n\n"
            
            # 2/ NEXT TARGET - từ plannedTasks
            planned = project.get('plannedTasks', [])
            if isinstance(planned, str):
                planned = [t.strip() for t in planned.split('\n') if t.strip()]
            
            # Lấy phần trăm NEXT TARGET từ project
            next_target_percentage = project.get('nextTargetPercentage', '')
            if not next_target_percentage and planned:
                next_target_percentage = ''
            
            if planned:
                message += f"2/ NEXT TARGET ({next_target_percentage}%):\n\n" if next_target_percentage else "2/ NEXT TARGET:\n\n"
                for task in planned:
                    if task:
                        task_name, timeline, _, _ = parse_task_with_timeline(task)
                        # Nếu task đã có format "Task ---> T2", giữ nguyên format
                        if '--->' in task:
                            if timeline:
                                formatted_task = f"{task_name} ---> {timeline}"
                            else:
                                formatted_task = task_name
                        else:
                            # Nếu task không có format timeline, hiển thị nguyên task
                            formatted_task = task
                        message += f"   - {formatted_task}\n"
                message += "\n"
            else:
                message += f"2/ NEXT TARGET ({next_target_percentage}%):\n\n" if next_target_percentage else "2/ NEXT TARGET:\n\n"
            
            # 3/ NOTE / ISSUES - từ notes
            notes = project.get('notes', '')
            if notes and notes.strip():
                message += "3/ NOTE / ISSUES:\n\n"
                # Format notes, giữ nguyên format nếu có timeline
                note_lines = notes.strip().split('\n')
                for note_line in note_lines:
                    if note_line.strip():
                        message += f"   - {note_line.strip()}\n"
                message += "\n"
            else:
                message += "3/ NOTE / ISSUES:\n\n"
            
            # 4/ LATED - từ inProgressTasks hoặc latedTasks
            lated = project.get('latedTasks', [])
            if not lated:
                # Fallback: kiểm tra inProgressTasks có chứa late info không
                in_progress = project.get('inProgressTasks', [])
                if isinstance(in_progress, str):
                    in_progress = [t.strip() for t in in_progress.split('\n') if t.strip()]
                
                # Lọc các task có late info
                lated = []
                for task in in_progress:
                    _, _, _, late_info = parse_task_with_timeline(task)
                    if late_info:
                        lated.append(task)
            
            if isinstance(lated, str):
                lated = [t.strip() for t in lated.split('\n') if t.strip()]
            
            if lated:
                message += "4/ LATED:\n\n"
                for task in lated:
                    if task:
                        task_name, timeline, _, late_info = parse_task_with_timeline(task)
                        # Nếu task đã có format "Task ---> T3 (Late: ...)", giữ nguyên format
                        if '--->' in task:
                            if timeline and late_info:
                                formatted_task = f"{task_name} ---> {timeline} ({late_info})"
                            elif timeline:
                                formatted_task = f"{task_name} ---> {timeline}"
                            else:
                                formatted_task = task_name
                        else:
                            # Nếu task không có format timeline, hiển thị nguyên task
                            formatted_task = task
                        message += f"   - {formatted_task}\n"
                message += "\n"
            else:
                message += "4/ LATED:\n\n"
    else:
        # Backward compatibility với format cũ
        completed = report.get('completedTasks', [])
        if isinstance(completed, str):
            completed = [t.strip() for t in completed.split('\n') if t.strip()]
        
        if completed:
            message += "## ✅ COMPLETED:\n"
            for task in completed:
                if task:
                    message += f"- {task}\n"
            message += "\n"
        else:
            message += "## ✅ COMPLETED: N/A\n\n"
        
        in_progress = report.get('inProgressTasks', [])
        if isinstance(in_progress, str):
            in_progress = [t.strip() for t in in_progress.split('\n') if t.strip()]
        
        if in_progress:
            message += "## 🔄 IN PROGRESS:\n"
            for task in in_progress:
                if task:
                    message += f"- {task}\n"
            message += "\n"
        else:
            message += "## 🔄 IN PROGRESS: N/A\n\n"
        
        planned = report.get('plannedTasks', [])
        if isinstance(planned, str):
            planned = [t.strip() for t in planned.split('\n') if t.strip()]
        
        if planned:
            message += "## 📋 PLANNED:\n"
            for task in planned:
                if task:
                    message += f"- {task}\n"
            message += "\n"
        else:
            message += "## 📋 PLANNED: N/A\n\n"
        
        notes = report.get('notes', '')
        if notes and notes.strip():
            message += f"## 📝 NOTES / BLOCKERS:\n{notes.strip()}\n"
        else:
            message += "## 📝 NOTES / BLOCKERS: N/A\n"
    
    return message


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
