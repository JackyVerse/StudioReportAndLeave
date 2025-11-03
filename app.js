// Lưu reports vào localStorage
const REPORTS_KEY = 'weekly_reports';
let projectCounter = 0;
let dailyProjectCounter = 0;

// Lấy danh sách reports từ localStorage
function getReports() {
    const reports = localStorage.getItem(REPORTS_KEY);
    return reports ? JSON.parse(reports) : [];
}

// Lưu reports vào localStorage
function saveReports(reports) {
    localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
}

// Thêm report mới
function addReport(reportData) {
    const reports = getReports();
    const report = {
        id: Date.now(),
        ...reportData,
        createdAt: new Date().toISOString()
    };
    reports.unshift(report);
    saveReports(reports);
    return report;
}

// Lấy report theo ID
function getReportById(id) {
    const reports = getReports();
    return reports.find(r => r.id === id);
}

// Xóa report
function deleteReport(id) {
    if (!confirm('Bạn có chắc muốn xóa report này?')) {
        return;
    }
    
    const reports = getReports();
    const filtered = reports.filter(r => r.id !== id);
    saveReports(filtered);
    renderReports();
    
    // Đóng preview nếu đang xem report bị xóa
    const previewSection = document.getElementById('previewSection');
    const mainContent = document.querySelector('.main-content');
    previewSection.style.display = 'none';
    mainContent.classList.remove('grid-2-cols');
}

// Biến để lưu ID report đang edit
let editingReportId = null;

// Chỉnh sửa report
function editReport(id, event) {
    if (event) {
        event.stopPropagation(); // Ngăn click event bubble lên report card
    }
    
    const report = getReportById(id);
    if (!report) return;
    
    editingReportId = id;
    
    // Load data vào form
    document.getElementById('weekNumber').value = report.weekNumber;
    document.getElementById('year').value = report.year;
    document.getElementById('startDate').value = report.startDate;
    document.getElementById('endDate').value = report.endDate;
    document.getElementById('teamName').value = report.teamName || '';
    
    // Xóa tất cả projects hiện tại
    document.getElementById('projectsContainer').innerHTML = '';
    
    // Load projects
    if (report.projects && report.projects.length > 0) {
        report.projects.forEach(project => {
            const template = document.getElementById('projectTemplate');
            const container = document.getElementById('projectsContainer');
            const projectCard = template.content.cloneNode(true);
            
            const projectId = `project-${projectCounter++}`;
            const cardElement = projectCard.querySelector('.project-card');
            cardElement.setAttribute('data-project-id', projectId);
            
            // Điền dữ liệu - Parse từ name nếu là format cũ hoặc lấy trực tiếp
            let projectIdValue = project.projectId || '';
            let projectNameValue = project.projectName || '';
            
            // Nếu chưa có projectId/projectName nhưng có name (format cũ), parse từ name
            if (!projectIdValue && !projectNameValue && project.name) {
                const nameParts = project.name.split(' - ');
                if (nameParts.length === 2) {
                    projectIdValue = nameParts[0].trim();
                    projectNameValue = nameParts[1].trim();
                } else {
                    // Nếu không có dấu " - ", coi như là name
                    projectNameValue = project.name;
                }
            }
            
            const projectIdInput = cardElement.querySelector('.project-id');
            const projectNameInput = cardElement.querySelector('.project-name');
            if (projectIdInput) projectIdInput.value = projectIdValue;
            if (projectNameInput) projectNameInput.value = projectNameValue;
            
            cardElement.querySelector('.project-completed').value = Array.isArray(project.completedTasks) 
                ? project.completedTasks.join('\n') 
                : (project.completedTasks || '');
            cardElement.querySelector('.project-in-progress').value = Array.isArray(project.inProgressTasks) 
                ? project.inProgressTasks.join('\n') 
                : (project.inProgressTasks || '');
            cardElement.querySelector('.project-planned').value = Array.isArray(project.plannedTasks) 
                ? project.plannedTasks.join('\n') 
                : (project.plannedTasks || '');
            cardElement.querySelector('.project-notes').value = project.notes || '';
            
            // Event listener cho nút xóa
            const removeBtn = projectCard.querySelector('.btn-remove-project');
            removeBtn.addEventListener('click', function() {
                if (confirm('Bạn có chắc muốn xóa dự án này?')) {
                    cardElement.remove();
                    updateProjectNumbers(); // Cập nhật số thứ tự sau khi xóa
                }
            });
            
            container.appendChild(projectCard);
        });
        
        // Cập nhật số thứ tự sau khi load tất cả projects
        updateProjectNumbers();
    } else {
        // Nếu không có projects, thêm một project trống
        addProject();
    }
    
    // Scroll đến form
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    
    // Đổi text nút Save và hiện nút New Report
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerHTML = '<span>💾</span><span>Update Report</span>';
    
    const newReportBtn = document.getElementById('newReportBtn');
    newReportBtn.style.display = 'inline-flex';
}

// Hàm để reset form về trạng thái tạo mới
function resetFormToNew() {
    editingReportId = null;
    const form = document.getElementById('reportForm');
    form.reset();
    
    // Xóa tất cả projects và thêm lại project đầu tiên
    document.getElementById('projectsContainer').innerHTML = '';
    addProject();
    
    // Reset nút Save
    const saveBtn = document.getElementById('saveBtn');
    saveBtn.innerHTML = '<span>💾</span><span>Lưu Report</span>';
    
    // Ẩn nút New Report
    const newReportBtn = document.getElementById('newReportBtn');
    newReportBtn.style.display = 'none';
    
    // Set lại default dates (chỉ áp dụng cho weekly)
    if (currentReportMode === 'weekly') {
        setDefaultDates();
    }
}

// Cập nhật số thứ tự cho tất cả projects
function updateProjectNumbers() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        const badge = card.querySelector('.project-number-badge');
        if (badge) {
            badge.textContent = index + 1;
        }
    });
}

// Thêm project mới
function addProject() {
    const template = document.getElementById('projectTemplate');
    const container = document.getElementById('projectsContainer');
    const projectCard = template.content.cloneNode(true);
    
    const projectId = `project-${projectCounter++}`;
    const cardElement = projectCard.querySelector('.project-card');
    cardElement.setAttribute('data-project-id', projectId);
    
    // Event listener cho nút xóa
    const removeBtn = projectCard.querySelector('.btn-remove-project');
    removeBtn.addEventListener('click', function() {
        if (confirm('Bạn có chắc muốn xóa dự án này?')) {
            cardElement.remove();
            updateProjectNumbers(); // Cập nhật số thứ tự sau khi xóa
        }
    });
    
    container.appendChild(projectCard);
    
    // Cập nhật số thứ tự cho tất cả projects
    updateProjectNumbers();
    
    // Scroll đến project mới
    cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Format display name từ ID và Name (giữ format cũ)
function formatProjectDisplayName(projectId, projectName) {
    if (!projectId && !projectName) return '';
    if (!projectId) return projectName;
    if (!projectName) return projectId;
    return `${projectId} - ${projectName}`;
}

// Lấy dữ liệu từ các projects
function getProjectsData() {
    const projects = [];
    const projectCards = document.querySelectorAll('.project-card');
    
    projectCards.forEach(card => {
        const projectId = card.querySelector('.project-id')?.value.trim() || '';
        const projectName = card.querySelector('.project-name')?.value.trim() || '';
        
        // Bỏ qua project chưa có cả ID và Name
        if (!projectId && !projectName) return;
        
        const completed = card.querySelector('.project-completed').value
            .split('\n').filter(t => t.trim());
        const inProgress = card.querySelector('.project-in-progress').value
            .split('\n').filter(t => t.trim());
        const planned = card.querySelector('.project-planned').value
            .split('\n').filter(t => t.trim());
        const notes = card.querySelector('.project-notes').value.trim();
        
        projects.push({
            projectId: projectId,
            projectName: projectName,
            name: formatProjectDisplayName(projectId, projectName), // Giữ tương thích với format cũ
            completedTasks: completed,
            inProgressTasks: inProgress,
            plannedTasks: planned,
            notes: notes
        });
    });
    
    return projects;
}

// Format report để hiển thị (theo từng dự án)
function formatReport(report) {
    let formatted = `📊 **WEEKLY REPORT - WEEK ${report.weekNumber}/${report.year}**\n\n`;
    
    // Hiển thị Team Name nếu có
    if (report.teamName && report.teamName.trim()) {
        formatted += `👥 **Team:** ${report.teamName.trim()}\n\n`;
    }
    
    formatted += `📅 **Period:** ${formatDate(report.startDate)} - ${formatDate(report.endDate)}\n\n`;
    
    // Format theo từng dự án
    if (report.projects && report.projects.length > 0) {
        report.projects.forEach((project, index) => {
            formatted += `---\n\n`;
            formatted += `## 📁 ${index + 1}. ${project.name}\n\n`;
            
            // Completed tasks
            if (project.completedTasks && project.completedTasks.length > 0) {
                formatted += `✅ **COMPLETED:**\n`;
                project.completedTasks.forEach(task => {
                    if (task) formatted += `  • ${task}\n`;
                });
                formatted += `\n`;
            } else {
                formatted += `✅ **COMPLETED:** N/A\n\n`;
            }
            
            // In progress tasks
            if (project.inProgressTasks && project.inProgressTasks.length > 0) {
                formatted += `🔄 **IN PROGRESS:**\n`;
                project.inProgressTasks.forEach(task => {
                    if (task) formatted += `  • ${task}\n`;
                });
                formatted += `\n`;
            } else {
                formatted += `🔄 **IN PROGRESS:** N/A\n\n`;
            }
            
            // Planned tasks
            if (project.plannedTasks && project.plannedTasks.length > 0) {
                formatted += `📋 **PLANNED:**\n`;
                project.plannedTasks.forEach(task => {
                    if (task) formatted += `  • ${task}\n`;
                });
                formatted += `\n`;
            } else {
                formatted += `📋 **PLANNED:** N/A\n\n`;
            }
            
            // Notes
            if (project.notes && project.notes.trim()) {
                formatted += `📝 **NOTES / BLOCKERS:**\n`;
                formatted += `${project.notes.trim()}\n\n`;
            } else {
                formatted += `📝 **NOTES / BLOCKERS:** N/A\n\n`;
            }
        });
    } else {
        // Backward compatibility với format cũ
        const completed = report.completedTasks || [];
        const inProgress = report.inProgressTasks || [];
        const planned = report.plannedTasks || [];
        
        if (completed.length > 0) {
            formatted += `✅ **COMPLETED:**\n`;
            completed.forEach(task => formatted += `  • ${task}\n`);
            formatted += `\n`;
        } else {
            formatted += `✅ **COMPLETED:** N/A\n\n`;
        }
        
        if (inProgress.length > 0) {
            formatted += `🔄 **IN PROGRESS:**\n`;
            inProgress.forEach(task => formatted += `  • ${task}\n`);
            formatted += `\n`;
        } else {
            formatted += `🔄 **IN PROGRESS:** N/A\n\n`;
        }
        
        if (planned.length > 0) {
            formatted += `📋 **PLANNED:**\n`;
            planned.forEach(task => formatted += `  • ${task}\n`);
            formatted += `\n`;
        } else {
            formatted += `📋 **PLANNED:** N/A\n\n`;
        }
        
        if (report.notes && report.notes.trim()) {
            formatted += `📝 **NOTES / BLOCKERS:**\n${report.notes.trim()}\n`;
        } else {
            formatted += `📝 **NOTES / BLOCKERS:** N/A\n`;
        }
    }
    
    return formatted;
}

// Format date từ YYYY-MM-DD sang DD/MM/YYYY
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Render danh sách reports
function renderReports() {
    const reports = getReports();
    const reportsList = document.getElementById('reportsList');
    
    if (reports.length === 0) {
        reportsList.innerHTML = '<div class="empty-state">Chưa có report nào. Hãy tạo report đầu tiên!</div>';
        return;
    }
    
    reportsList.innerHTML = reports.map(report => {
        const isDaily = report.type === 'daily';
        const teamName = report.teamName ? report.teamName.trim() : '';
        const projectCount = report.projects ? report.projects.length : 0;
        
        let title = '';
        let subline = '';
        if (isDaily) {
            const dateStr = report.date ? formatDate(report.date) : '';
            title = `${dateStr}${teamName ? ` - ${teamName}` : ''}`;
            subline = `Daily Report`;
        } else {
            const dateRange = `${formatDate(report.startDate)} - ${formatDate(report.endDate)}`;
            title = `Week ${report.weekNumber}/${report.year}${teamName ? ` - ${teamName}` : ''}`;
            subline = dateRange;
        }
        
        const projectNames = report.projects ? report.projects.map(p => {
            if (p.projectId && p.projectName) {
                return formatProjectDisplayName(p.projectId, p.projectName);
            }
            return p.name || formatProjectDisplayName(p.projectId || '', p.projectName || '');
        }).join(', ') : 'No projects';
        
        return `
            <div class="report-card">
                <div class="report-card-content" onclick="viewReport(${report.id})">
                    <h3>${title}</h3>
                    <div class="report-date">${subline}</div>
                    ${teamName ? `<div class="report-team">👥 Team: ${teamName}</div>` : ''}
                    <div class="report-projects">📁 ${projectCount} project(s): ${projectNames}</div>
                    <div class="report-summary">Click to view details</div>
                </div>
                <div class="report-card-actions">
                    ${isDaily ? '' : `<button class="btn-edit" onclick="editReport(${report.id}, event)" title="Edit report">✏️ Edit</button>`}
                    <button class="btn-delete" onclick="deleteReport(${report.id}); event.stopPropagation();" title="Delete report">🗑️ Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Xem report
function viewReport(id) {
    const report = getReportById(id);
    if (!report) return;
    
    const previewContent = document.getElementById('previewContent');
    previewContent.textContent = (report.type === 'daily') ? formatDailyReport(report) : formatReport(report);
    
    const previewSection = document.getElementById('previewSection');
    const mainContent = document.querySelector('.main-content');
    previewSection.style.display = 'block';
    mainContent.classList.add('grid-2-cols');
    
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Copy report text vào clipboard
async function copyReportToClipboard() {
    // Lấy report data từ form
    const reportData = {
        weekNumber: parseInt(document.getElementById('weekNumber').value),
        year: parseInt(document.getElementById('year').value),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        teamName: document.getElementById('teamName').value.trim(),
        projects: getProjectsData()
    };
    
    // Validate
    if (!reportData.weekNumber || !reportData.startDate || !reportData.endDate) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }
    
    if (reportData.projects.length === 0) {
        alert('Vui lòng thêm ít nhất một dự án!');
        return;
    }
    
    // Format report text
    const reportText = formatReport(reportData);
    
    try {
        // Copy vào clipboard
        await navigator.clipboard.writeText(reportText);
        
        // Hiển thị thông báo thành công
        const originalText = document.getElementById('copyTextBtn').innerHTML;
        document.getElementById('copyTextBtn').innerHTML = '<span>✅</span><span>Copied!</span>';
        document.getElementById('copyTextBtn').disabled = true;
        
        setTimeout(() => {
            document.getElementById('copyTextBtn').innerHTML = originalText;
            document.getElementById('copyTextBtn').disabled = false;
        }, 2000);
    } catch (err) {
        // Fallback cho trình duyệt cũ
        const textArea = document.createElement('textarea');
        textArea.value = reportText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('✅ Đã copy vào clipboard!');
        } catch (err) {
            alert('❌ Không thể copy. Vui lòng copy thủ công từ preview.');
        }
        document.body.removeChild(textArea);
    }
}

// Copy từ preview section
async function copyPreviewToClipboard() {
    const previewContent = document.getElementById('previewContent');
    const reportText = previewContent.textContent;
    
    if (!reportText || reportText.trim() === '') {
        alert('Không có nội dung để copy!');
        return;
    }
    
    try {
        // Copy vào clipboard
        await navigator.clipboard.writeText(reportText);
        
        // Hiển thị thông báo thành công
        const originalText = document.getElementById('copyPreviewBtn').innerHTML;
        document.getElementById('copyPreviewBtn').innerHTML = '<span>✅</span><span>Copied!</span>';
        document.getElementById('copyPreviewBtn').disabled = true;
        
        setTimeout(() => {
            document.getElementById('copyPreviewBtn').innerHTML = originalText;
            document.getElementById('copyPreviewBtn').disabled = false;
        }, 2000);
    } catch (err) {
        // Fallback cho trình duyệt cũ
        const textArea = document.createElement('textarea');
        textArea.value = reportText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('✅ Đã copy vào clipboard!');
        } catch (err) {
            alert('❌ Không thể copy. Vui lòng copy thủ công.');
        }
        document.body.removeChild(textArea);
    }
}

// Xem trước report
function previewReport() {
    const form = document.getElementById('reportForm');
    
    const reportData = {
        weekNumber: document.getElementById('weekNumber').value,
        year: document.getElementById('year').value,
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        teamName: document.getElementById('teamName').value.trim(),
        projects: getProjectsData()
    };
    
    // Validate
    if (!reportData.weekNumber || !reportData.startDate || !reportData.endDate) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }
    
    if (reportData.projects.length === 0) {
        alert('Vui lòng thêm ít nhất một dự án!');
        return;
    }
    
    const previewContent = document.getElementById('previewContent');
    previewContent.textContent = formatReport(reportData);
    
    const previewSection = document.getElementById('previewSection');
    const mainContent = document.querySelector('.main-content');
    previewSection.style.display = 'block';
    mainContent.classList.add('grid-2-cols');
    
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Lưu report
function saveReport() {
    const form = document.getElementById('reportForm');
    
    const reportData = {
        weekNumber: parseInt(document.getElementById('weekNumber').value),
        year: parseInt(document.getElementById('year').value),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        teamName: document.getElementById('teamName').value.trim(),
        projects: getProjectsData()
    };
    
    // Validate
    if (!reportData.weekNumber || !reportData.startDate || !reportData.endDate) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }
    
    if (reportData.projects.length === 0) {
        alert('Vui lòng thêm ít nhất một dự án!');
        return;
    }
    
    // Nếu đang edit report cũ
    if (editingReportId) {
        const reports = getReports();
        const reportIndex = reports.findIndex(r => r.id === editingReportId);
        
        if (reportIndex !== -1) {
            // Update report
            reports[reportIndex] = {
                ...reports[reportIndex],
                ...reportData,
                id: editingReportId, // Giữ nguyên ID
                updatedAt: new Date().toISOString()
            };
            saveReports(reports);
            alert('✅ Đã cập nhật report thành công!');
        }
        
        // Reset editing state
        editingReportId = null;
        resetFormToNew();
    } else {
        // Tạo report mới
        addReport(reportData);
        alert('✅ Đã lưu report thành công!');
        resetFormToNew();
    }
    
    // Render lại danh sách
    renderReports();
}

// Tải file JSON
function downloadReport() {
    const reportData = {
        weekNumber: parseInt(document.getElementById('weekNumber').value),
        year: parseInt(document.getElementById('year').value),
        startDate: document.getElementById('startDate').value,
        endDate: document.getElementById('endDate').value,
        teamName: document.getElementById('teamName').value.trim(),
        projects: getProjectsData()
    };
    
    // Validate
    if (!reportData.weekNumber || !reportData.startDate || !reportData.endDate) {
        alert('Vui lòng điền đầy đủ thông tin bắt buộc!');
        return;
    }
    
    if (reportData.projects.length === 0) {
        alert('Vui lòng thêm ít nhất một dự án!');
        return;
    }
    
    const json = JSON.stringify(reportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weekly-report-${reportData.weekNumber}-${reportData.year}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Tính số tuần ISO 8601 (tuần bắt đầu từ Thứ 2, tuần 1 là tuần có ngày 4/1)
// Thuật toán chuẩn ISO 8601
function getISOWeekNumber(date) {
    const d = new Date(date.getTime());
    
    // Lấy ngày trong tuần (1 = Thứ 2, ..., 7 = Chủ nhật theo ISO)
    let dayOfWeek = d.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
    if (dayOfWeek === 0) dayOfWeek = 7; // Chuyển CN từ 0 thành 7
    
    // Tìm Thứ 2 của tuần chứa ngày này
    const monday = new Date(d);
    monday.setDate(d.getDate() - dayOfWeek + 1);
    
    // Tìm Thứ 2 của tuần 1 trong năm (tuần có ngày 4/1)
    const jan4 = new Date(monday.getFullYear(), 0, 4);
    let jan4DayOfWeek = jan4.getDay();
    if (jan4DayOfWeek === 0) jan4DayOfWeek = 7;
    
    const firstMonday = new Date(jan4);
    firstMonday.setDate(4 - jan4DayOfWeek + 1);
    
    // Tính số tuần
    const daysDiff = Math.floor((monday - firstMonday) / (24 * 60 * 60 * 1000));
    let weekNumber = Math.floor(daysDiff / 7) + 1;
    
    // Xử lý trường hợp tuần cuối năm rơi vào năm sau
    if (weekNumber < 1) {
        // Tính lại với năm trước
        const prevYear = monday.getFullYear() - 1;
        const prevJan4 = new Date(prevYear, 0, 4);
        let prevJan4DayOfWeek = prevJan4.getDay();
        if (prevJan4DayOfWeek === 0) prevJan4DayOfWeek = 7;
        
        const prevFirstMonday = new Date(prevJan4);
        prevFirstMonday.setDate(4 - prevJan4DayOfWeek + 1);
        
        const prevDaysDiff = Math.floor((monday - prevFirstMonday) / (24 * 60 * 60 * 1000));
        weekNumber = Math.floor(prevDaysDiff / 7) + 1;
    }
    
    return weekNumber;
}

// Lấy ngày Thứ 2 của tuần hiện tại
function getMondayOfWeek(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh: Thứ 2 = 1, CN = 0 -> -6
    return new Date(d.setDate(diff));
}

// Set default dates (tuần này)
function setDefaultDates() {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Tính số tuần ISO
    const weekNumber = getISOWeekNumber(today);
    
    // Lấy Thứ 2 của tuần hiện tại (tuần bắt đầu từ Thứ 2)
    const startDate = getMondayOfWeek(today);
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6); // Thêm 6 ngày để có Chủ nhật
    
    // Kiểm tra xem tuần có rơi vào năm khác không (cuối tháng 12 có thể rơi vào tuần 1 năm sau)
    let displayYear = currentYear;
    if (startDate.getMonth() === 11 && startDate.getDate() >= 29 && weekNumber === 1) {
        displayYear = currentYear + 1;
    }
    
    document.getElementById('year').value = displayYear;
    document.getElementById('weekNumber').value = weekNumber;
    document.getElementById('startDate').value = startDate.toISOString().split('T')[0];
    document.getElementById('endDate').value = endDate.toISOString().split('T')[0];
}

// ==================== DAILY REPORT FUNCTIONS ====================

// Set default date (hôm nay)
function setDefaultDailyDate() {
    const today = new Date();
    document.getElementById('dailyDate').value = today.toISOString().split('T')[0];
}

// Format date cho daily report (DayTimeFormat: DD/MM/YYYY)
function formatDailyDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Cập nhật số thứ tự cho daily projects
function updateDailyProjectNumbers() {
    const projectCards = document.querySelectorAll('#dailyProjectsContainer .project-card');
    projectCards.forEach((card, index) => {
        const badge = card.querySelector('.project-number-badge');
        if (badge) {
            badge.textContent = index + 1;
        }
    });
}

// Thêm daily project mới
function addDailyProject() {
    const template = document.getElementById('dailyProjectTemplate');
    const container = document.getElementById('dailyProjectsContainer');
    // Enforce single project for daily report
    const existing = container.querySelector('.project-card');
    if (existing) {
        existing.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
    }
    const projectCard = template.content.cloneNode(true);
    
    const projectId = `daily-project-${dailyProjectCounter++}`;
    const cardElement = projectCard.querySelector('.project-card');
    cardElement.setAttribute('data-daily-project-id', projectId);
    
    // Event listener cho nút xóa
    const removeBtn = projectCard.querySelector('.btn-remove-project');
    // Hide remove button in daily (single-project) mode
    if (removeBtn) removeBtn.style.display = 'none';
    
    container.appendChild(projectCard);
    
    // Cập nhật số thứ tự
    updateDailyProjectNumbers();
    
    // Scroll đến project mới
    cardElement.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// Lấy dữ liệu từ daily projects
function getDailyProjectsData() {
    const projects = [];
    const projectCards = document.querySelectorAll('#dailyProjectsContainer .project-card');
    
    projectCards.forEach(card => {
        const projectId = card.querySelector('.daily-project-id')?.value.trim() || '';
        const projectName = card.querySelector('.daily-project-name')?.value.trim() || '';
        
        // Bỏ qua project chưa có cả ID và Name
        if (!projectId && !projectName) return;
        
        const done = card.querySelector('.daily-project-done').value
            .split('\n').filter(t => t.trim());
        const inProgress = card.querySelector('.daily-project-in-progress').value
            .split('\n').filter(t => t.trim());
        const remaining = card.querySelector('.daily-project-remaining').value
            .split('\n').filter(t => t.trim());
        const note = card.querySelector('.daily-project-note').value.trim();
        
        projects.push({
            projectId: projectId,
            projectName: projectName,
            done: done,
            inProgress: inProgress,
            remaining: remaining,
            note: note
        });
    });
    
    return projects;
}

// Format daily report
function formatDailyReport(report) {
    let formatted = '';
    
    // Header: Team Name + DAILY REPORT
    const teamName = report.teamName && report.teamName.trim() ? report.teamName.trim() : 'N/A';
    formatted += `==== ${teamName} DAILY REPORT ====\n\n`;
    
    // Pre-compute date (used per-project below)
    const dateFormatted = formatDailyDate(report.date);
    
    // Projects
    if (report.projects && report.projects.length > 0) {
        report.projects.forEach((project, index) => {
            if (index > 0) formatted += '\n';
            
            const projectDisplay = formatProjectDisplayName(project.projectId, project.projectName);
            // Project header with improved format - cleaner and easier to read
            formatted += `📁 **PROJECT:** ${projectDisplay}\n`;
            formatted += `📅 **DATE:** ${dateFormatted}\n\n`;
            
            // DONE
            const doneCount = project.done ? project.done.length : 0;
            formatted += `✅ DONE: (${doneCount})\n`;
            if (doneCount > 0) {
                project.done.forEach(task => {
                    if (task) formatted += `- ${task}\n`;
                });
            }
            formatted += '\n';
            
            // IN-PROGRESS
            const inProgressCount = project.inProgress ? project.inProgress.length : 0;
            formatted += `🔄 IN-PROGRESS: (${inProgressCount})\n`;
            if (inProgressCount > 0) {
                project.inProgress.forEach(task => {
                    if (task) formatted += `- ${task}\n`;
                });
            }
            formatted += '\n';
            
            // REMAINING
            const remainingCount = project.remaining ? project.remaining.length : 0;
            formatted += `📋 REMAINING: (${remainingCount})\n`;
            if (remainingCount > 0) {
                project.remaining.forEach(task => {
                    if (task) formatted += `- ${task}\n`;
                });
            }
            formatted += '\n';
            
            // NOTE
            const noteCount = project.note && project.note.trim() ? 1 : 0;
            formatted += `📝 NOTE: (${noteCount})\n`;
            if (noteCount > 0 && project.note && project.note.trim()) {
                formatted += `${project.note.trim()}\n`;
            }
        });
    }
    
    return formatted;
}

// Reset daily form về trạng thái mới
function resetDailyFormToNew() {
    const form = document.getElementById('dailyReportForm');
    form.reset();
    
    // Xóa tất cả projects
    document.getElementById('dailyProjectsContainer').innerHTML = '';
    addDailyProject();
    
    // Reset nút Save
    const saveBtn = document.getElementById('dailySaveBtn');
    saveBtn.innerHTML = '<span>💾</span><span>Lưu Report</span>';
    
    // Ẩn nút New Report
    const newReportBtn = document.getElementById('dailyNewReportBtn');
    newReportBtn.style.display = 'none';
    
    // Set default date
    setDefaultDailyDate();
}

// Preview daily report
function previewDailyReport() {
    const reportData = {
        date: document.getElementById('dailyDate').value,
        teamName: document.getElementById('dailyTeamName').value.trim(),
        projects: getDailyProjectsData()
    };
    
    // Validate
    if (!reportData.date) {
        alert('Vui lòng chọn ngày!');
        return;
    }
    
    if (reportData.projects.length === 0) {
        alert('Vui lòng thêm ít nhất một dự án!');
        return;
    }
    
    const previewContent = document.getElementById('previewContent');
    previewContent.textContent = formatDailyReport(reportData);
    
    const previewSection = document.getElementById('previewSection');
    const mainContent = document.querySelector('.main-content');
    previewSection.style.display = 'block';
    mainContent.classList.add('grid-2-cols');
    
    previewSection.scrollIntoView({ behavior: 'smooth' });
}

// Copy daily report text vào clipboard
async function copyDailyReportToClipboard() {
    const reportData = {
        date: document.getElementById('dailyDate').value,
        teamName: document.getElementById('dailyTeamName').value.trim(),
        projects: getDailyProjectsData()
    };
    
    // Validate
    if (!reportData.date) {
        alert('Vui lòng chọn ngày!');
        return;
    }
    
    if (reportData.projects.length === 0) {
        alert('Vui lòng thêm ít nhất một dự án!');
        return;
    }
    
    // Format report text
    const reportText = formatDailyReport(reportData);
    
    try {
        await navigator.clipboard.writeText(reportText);
        
        const originalText = document.getElementById('dailyCopyTextBtn').innerHTML;
        document.getElementById('dailyCopyTextBtn').innerHTML = '<span>✅</span><span>Copied!</span>';
        document.getElementById('dailyCopyTextBtn').disabled = true;
        
        setTimeout(() => {
            document.getElementById('dailyCopyTextBtn').innerHTML = originalText;
            document.getElementById('dailyCopyTextBtn').disabled = false;
        }, 2000);
    } catch (err) {
        const textArea = document.createElement('textarea');
        textArea.value = reportText;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('✅ Đã copy vào clipboard!');
        } catch (err) {
            alert('❌ Không thể copy. Vui lòng copy thủ công từ preview.');
        }
        document.body.removeChild(textArea);
    }
}

// Lưu daily report
function saveDailyReport() {
    const reportData = {
        type: 'daily',
        date: document.getElementById('dailyDate').value,
        teamName: document.getElementById('dailyTeamName').value.trim(),
        projects: getDailyProjectsData()
    };
    
    // Validate
    if (!reportData.date) {
        alert('Vui lòng chọn ngày!');
        return;
    }
    
    if (reportData.projects.length === 0) {
        alert('Vui lòng thêm ít nhất một dự án!');
        return;
    }
    
    // Tạo report mới
    addReport(reportData);
    alert('✅ Đã lưu daily report thành công!');
    resetDailyFormToNew();
    
    // Render lại danh sách
    renderReports();
}

// Tải daily report file JSON
function downloadDailyReport() {
    const reportData = {
        type: 'daily',
        date: document.getElementById('dailyDate').value,
        teamName: document.getElementById('dailyTeamName').value.trim(),
        projects: getDailyProjectsData()
    };
    
    // Validate
    if (!reportData.date) {
        alert('Vui lòng chọn ngày!');
        return;
    }
    
    if (reportData.projects.length === 0) {
        alert('Vui lòng thêm ít nhất một dự án!');
        return;
    }
    
    const json = JSON.stringify(reportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const dateStr = formatDailyDate(reportData.date).replace(/\//g, '-');
    a.download = `daily-report-${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// ==================== END DAILY REPORT FUNCTIONS ====================

// ==================== MENU & THEME MANAGEMENT ====================

// Report Mode State (weekly/daily)
// Default to 'daily' on first visit; subsequently use saved preference
let currentReportMode = localStorage.getItem('reportMode') || 'daily';

// Initialize theme
function initTheme() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        // In dark mode now; button should show action to switch to Light
        updateThemeButton('light');
    } else {
        document.body.classList.remove('dark-mode');
        // In light mode now; button should show action to switch to Dark
        updateThemeButton('dark');
    }
}

// Update theme button text
function updateThemeButton(mode) {
    const toggleBtn = document.getElementById('toggleThemeBtn');
    const icon = toggleBtn.querySelector('.menu-icon');
    const text = toggleBtn.querySelector('.menu-text');
    
    if (mode === 'dark') {
        icon.textContent = '🌙';
        text.textContent = 'Dark Mode';
    } else {
        icon.textContent = '☀️';
        text.textContent = 'Light Mode';
    }
}

// Toggle dark mode
function toggleDarkMode() {
    const isDarkMode = document.body.classList.contains('dark-mode');
    
    if (isDarkMode) {
        document.body.classList.remove('dark-mode');
        localStorage.setItem('darkMode', 'false');
        // Now in light mode; button should offer Dark mode
        updateThemeButton('dark');
    } else {
        document.body.classList.add('dark-mode');
        localStorage.setItem('darkMode', 'true');
        // Now in dark mode; button should offer Light mode
        updateThemeButton('light');
    }
}

// Update report mode buttons
function updateReportModeButtons() {
    const dailyBtn = document.getElementById('dailyReportBtn');
    const weeklyBtn = document.getElementById('weeklyReportBtn');
    
    // Disable the CURRENT mode (can't switch to the same mode)
    if (currentReportMode === 'weekly') {
        weeklyBtn.classList.add('menu-item-disabled');
        dailyBtn.classList.remove('menu-item-disabled');
    } else {
        dailyBtn.classList.add('menu-item-disabled');
        weeklyBtn.classList.remove('menu-item-disabled');
    }
}

// Switch to daily report mode
function switchToDailyMode() {
    // Update mode state only if changed
    if (currentReportMode !== 'daily') {
        currentReportMode = 'daily';
        localStorage.setItem('reportMode', 'daily');
        document.body.dataset.reportMode = 'daily';
    }
    updateReportModeButtons();
    
    // Show daily form, hide weekly form
    document.getElementById('weeklyFormSection').style.display = 'none';
    document.getElementById('dailyFormSection').style.display = 'block';
    
    // Update header
    document.querySelector('header h1').textContent = '📅 Daily Report Generator';
    document.querySelector('header p').textContent = 'Tạo báo cáo ngày theo dự án và gửi tự động lên Discord Channel';
    
    // Set default date to today
    setDefaultDailyDate();
    
    // Reset form
    resetDailyFormToNew();
}

// Switch to weekly report mode
function switchToWeeklyMode() {
    // Update mode state only if changed
    if (currentReportMode !== 'weekly') {
        currentReportMode = 'weekly';
        localStorage.setItem('reportMode', 'weekly');
        document.body.dataset.reportMode = 'weekly';
    }
    updateReportModeButtons();
    
    // Show weekly form, hide daily form
    document.getElementById('dailyFormSection').style.display = 'none';
    document.getElementById('weeklyFormSection').style.display = 'block';
    
    // Update header
    document.querySelector('header h1').textContent = '📊 Weekly Report Generator';
    document.querySelector('header p').textContent = 'Tạo báo cáo tuần theo dự án và gửi tự động lên Discord Channel';
    
    // Reset form
    resetFormToNew();
}

// Menu toggle
function toggleMenu() {
    const menu = document.getElementById('menuDropdown');
    if (menu.style.display === 'none' || menu.style.display === '') {
        menu.style.display = 'block';
    } else {
        menu.style.display = 'none';
    }
}

// Close menu when clicking outside
document.addEventListener('click', function(event) {
    const menuButton = document.getElementById('menuButton');
    const menuDropdown = document.getElementById('menuDropdown');
    
    if (!menuButton.contains(event.target) && !menuDropdown.contains(event.target)) {
        menuDropdown.style.display = 'none';
    }
});

// ==================== END MENU & THEME MANAGEMENT ====================

// ==================== LEAVE REQUEST ====================
// Gửi trực tiếp tới Discord Webhook cho Leave (theo yêu cầu)
// Cập nhật URL webhook bên dưới bằng webhook của Leave channel (sử dụng secrets)

const LEAVE_TEAM_KEY = 'leave_team_default';

function openLeaveModal() {
    const modal = document.getElementById('leaveModal');
    modal.style.display = 'block';
    // Prefill defaults
    const savedTeam = localStorage.getItem(LEAVE_TEAM_KEY) || (document.getElementById('teamName')?.value || '');
    document.getElementById('leaveTeam').value = savedTeam;
    // Default date = today
    const today = new Date();
    document.getElementById('leaveDate').value = toLocalDateInput(today);
    // Reset multi-day controls
    const multiToggle = document.getElementById('leaveMultiToggle');
    const startEl = document.getElementById('leaveStartDate');
    const endEl = document.getElementById('leaveEndDate');
    const multiRow = document.getElementById('leaveMultiRow');
    const singleRow = document.getElementById('leaveSingleRow');
    if (multiToggle) multiToggle.checked = false;
    if (startEl) startEl.value = toLocalDateInput(today);
    if (endEl) endEl.value = toLocalDateInput(today);
    if (multiRow) multiRow.style.display = 'none';
    if (singleRow) singleRow.style.display = 'grid';
    document.getElementById('leaveAmount').value = '1';
    document.getElementById('leaveSessionGroup').style.display = 'none';
}

function closeLeaveModal() {
    const modal = document.getElementById('leaveModal');
    modal.style.display = 'none';
}

function toLocalDateInput(d) {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
}

function formatDateDM(dateString) {
    if (!dateString) return '';
    const d = new Date(dateString + 'T00:00:00');
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    return `${dd}/${mm}`;
}

function onLeaveAmountChange() {
    const amount = parseFloat(document.getElementById('leaveAmount').value || '1');
    const group = document.getElementById('leaveSessionGroup');
    group.style.display = amount < 1 ? 'block' : 'none';
    if (amount < 1) {
        // default session if none selected
        const sessionEl = document.getElementById('leaveSession');
        if (!sessionEl.value) sessionEl.value = 'Morning';
    }
}

function formatLeaveMessage(payload) {
    const isMulti = !!payload.isMultiDay;
    const dateText = isMulti
        ? `${formatDateDM(payload.startDate)} → ${formatDateDM(payload.endDate)}`
        : formatDateDM(payload.date);
    const isFullDay = payload.amount >= 1;
    const durationText = isMulti
        ? `từ ${formatDateDM(payload.startDate)} tới ${formatDateDM(payload.endDate)}`
        : (isFullDay ? `${payload.amount.toFixed(1)} ngày` : `${payload.amount} (${payload.session})`);
    const notifyPrefix = payload.notify ? `${payload.notify} ` : '';
    
    // Header
    let msg = `${notifyPrefix}Em xin nghỉ (${durationText}).\n\n`;
    
    // Body (rich, easy to scan)
    msg += `------\n\n`;
    msg += `🧑‍💻 **Tên**: ${payload.employee}\n\n`;
    msg += `👥 **Team**: ${payload.team}\n\n`;
    msg += `📅 **Ngày**: ${dateText}\n\n`;
    msg += `⏱️ **Thời lượng**: ${durationText}\n\n`;
    msg += `📝 **Lý do**: ${payload.reason || 'N/A'}\n`;
    return msg;
}

async function sendLeaveToDiscord() {
    const employee = document.getElementById('leaveEmployee').value.trim();
    const team = document.getElementById('leaveTeam').value.trim();
    const isMultiDay = document.getElementById('leaveMultiToggle').checked;
    const date = document.getElementById('leaveDate').value;
    const startDate = document.getElementById('leaveStartDate').value;
    const endDate = document.getElementById('leaveEndDate').value;
    const amount = parseFloat(document.getElementById('leaveAmount').value || '1');
    const session = document.getElementById('leaveSession').value;
    const reason = document.getElementById('leaveReason').value.trim();
    const notify = document.getElementById('leaveNotify').value.trim();
    
    if (!employee || !team || (!isMultiDay && !date) || (isMultiDay && (!startDate || !endDate))) {
        alert('Vui lòng điền đầy đủ: Tên, Team, Ngày nghỉ');
        return;
    }
    
    // Save team to localStorage for next time
    localStorage.setItem(LEAVE_TEAM_KEY, team);
    
    const payload = isMultiDay
        ? { employee, team, isMultiDay: true, startDate, endDate, amount: 1, session: 'Full', reason, notify }
        : { employee, team, date, amount, session, reason, notify };
    const message = formatLeaveMessage(payload);
    try {
        if (!secrets.LEAVE_WEBHOOK_URL) {
            alert('❌ LEAVE_WEBHOOK_URL chưa được cấu hình trong app.js');
            return;
        }
        const res = await fetch(secrets.LEAVE_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: message, username: 'Leave Bot' })
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        alert('✅ Đã gửi yêu cầu nghỉ phép!');
        closeLeaveModal();
    } catch (e) {
        alert('❌ Gửi thất bại. Vui lòng kiểm tra LEAVE_WEBHOOK_URL và thử lại.');
    }
}

async function copyLeaveToClipboard() {
    const employee = document.getElementById('leaveEmployee').value.trim();
    const team = document.getElementById('leaveTeam').value.trim();
    const isMultiDay = document.getElementById('leaveMultiToggle').checked;
    const date = document.getElementById('leaveDate').value;
    const startDate = document.getElementById('leaveStartDate').value;
    const endDate = document.getElementById('leaveEndDate').value;
    const amount = parseFloat(document.getElementById('leaveAmount').value || '1');
    const session = document.getElementById('leaveSession').value;
    const reason = document.getElementById('leaveReason').value.trim();
    const notify = document.getElementById('leaveNotify').value.trim();
    
    if (!employee || !team || (!isMultiDay && !date) || (isMultiDay && (!startDate || !endDate))) {
        alert('Vui lòng điền đầy đủ: Tên, Team, Ngày nghỉ');
        return;
    }
    const payload = isMultiDay
        ? { employee, team, isMultiDay: true, startDate, endDate, amount: 1, session: 'Full', reason, notify }
        : { employee, team, date, amount, session, reason, notify };
    const message = formatLeaveMessage(payload);
    try {
        await navigator.clipboard.writeText(message);
        alert('✅ Đã copy nội dung xin nghỉ!');
    } catch {
        alert('❌ Không thể copy.');
    }
}

// ==================== END LEAVE REQUEST ====================

// Event listeners
document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme and report mode
    initTheme();
    // Initialize based on saved mode (also sets buttons and toggles forms)
    const savedMode = localStorage.getItem('reportMode') || 'daily';
    currentReportMode = savedMode;
    document.body.dataset.reportMode = savedMode;
    if (savedMode === 'daily') {
        switchToDailyMode();
    } else {
        switchToWeeklyMode();
    }
    
    setDefaultDates();
    renderReports();
    
    // Menu event listeners
    document.getElementById('menuButton').addEventListener('click', toggleMenu);
    document.getElementById('toggleThemeBtn').addEventListener('click', function() {
        toggleDarkMode();
        document.getElementById('menuDropdown').style.display = 'none';
    });
    document.getElementById('dailyReportBtn').addEventListener('click', function() {
        switchToDailyMode();
        document.getElementById('menuDropdown').style.display = 'none';
    });
    document.getElementById('weeklyReportBtn').addEventListener('click', function() {
        switchToWeeklyMode();
        document.getElementById('menuDropdown').style.display = 'none';
    });
    document.getElementById('requestLeaveBtn').addEventListener('click', function() {
        openLeaveModal();
        document.getElementById('menuDropdown').style.display = 'none';
    });
    
    // Weekly form event listeners
    document.getElementById('addProjectBtn').addEventListener('click', addProject);
    document.getElementById('previewBtn').addEventListener('click', previewReport);
    document.getElementById('copyTextBtn').addEventListener('click', copyReportToClipboard);
    document.getElementById('copyPreviewBtn').addEventListener('click', copyPreviewToClipboard);
    document.getElementById('saveBtn').addEventListener('click', saveReport);
    document.getElementById('downloadBtn').addEventListener('click', downloadReport);
    document.getElementById('newReportBtn').addEventListener('click', resetFormToNew);
    
    // Daily form event listeners
    // addDailyProject is invoked by resetDailyFormToNew() to ensure one project exists
    document.getElementById('dailyPreviewBtn').addEventListener('click', previewDailyReport);
    document.getElementById('dailyCopyTextBtn').addEventListener('click', copyDailyReportToClipboard);
    document.getElementById('dailySaveBtn').addEventListener('click', saveDailyReport);
    document.getElementById('dailyDownloadBtn').addEventListener('click', downloadDailyReport);
    document.getElementById('dailyNewReportBtn').addEventListener('click', resetDailyFormToNew);
    
    // Preview close
    document.getElementById('closePreview').addEventListener('click', function() {
        const previewSection = document.getElementById('previewSection');
        const mainContent = document.querySelector('.main-content');
        previewSection.style.display = 'none';
        mainContent.classList.remove('grid-2-cols');
    });

    // Leave modal events
    document.getElementById('leaveModalBackdrop').addEventListener('click', closeLeaveModal);
    document.getElementById('leaveCloseBtn').addEventListener('click', closeLeaveModal);
    document.getElementById('leaveAmount').addEventListener('change', onLeaveAmountChange);
    // Không bind nút gửi Discord (đã ẩn/bỏ)
    document.getElementById('leaveCopyBtn').addEventListener('click', copyLeaveToClipboard);
    // Toggle nghỉ nhiều ngày
    const leaveMultiToggle = document.getElementById('leaveMultiToggle');
    if (leaveMultiToggle) {
        leaveMultiToggle.addEventListener('change', function() {
            const isMulti = this.checked;
            const multiRow = document.getElementById('leaveMultiRow');
            const singleRow = document.getElementById('leaveSingleRow');
            const sessionGroup = document.getElementById('leaveSessionGroup');
            const amountEl = document.getElementById('leaveAmount');
            
            // Toggle giữa single row và multi row
            if (singleRow) singleRow.style.display = isMulti ? 'none' : 'grid';
            if (multiRow) multiRow.style.display = isMulti ? 'grid' : 'none';
            
            // Xử lý session group cho single mode
            if (!isMulti && sessionGroup) {
                sessionGroup.style.display = (parseFloat((amountEl?.value)||'1') < 1) ? 'block' : 'none';
            } else if (sessionGroup) {
                sessionGroup.style.display = 'none';
            }
        });
    }
});

// Export function để dùng trong HTML
window.viewReport = viewReport;
window.editReport = editReport;
window.deleteReport = deleteReport;