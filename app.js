// Lưu reports vào localStorage
const REPORTS_KEY = 'weekly_reports';
const TEAM_ID_KEY = 'selected_team_id';
const USER_PROJECTS_KEY = 'user_projects'; // Lưu projects của user trong localStorage
let projectCounter = 0;
let dailyProjectCounter = 0;

// Teams configuration
const TEAMS = [
    { id: 'FE', name: 'Frontend' },
    { id: 'ART', name: 'Art' },
    { id: 'ANIM', name: 'Animation' },
    { id: 'GD', name: 'Game Design' },
    { id: 'DESIGN', name: 'Design' }
];

// ==================== TOAST UTILS ====================
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return alert(message); // Fallback nếu thiếu container

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    const icon = type === 'success' ? '✅' : (type === 'error' ? '❌' : 'ℹ️');
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${message}</span>`;

    container.appendChild(toast);

    // Auto dismiss
    const remove = () => {
        toast.style.animation = 'toast-out 180ms ease-in forwards';
        setTimeout(() => toast.remove(), 200);
    };
    setTimeout(remove, 2500);

    // Dismiss on click
    toast.addEventListener('click', remove);
}

// ==================== CONFIG & DROPDOWN MANAGEMENT ====================

// Populate team dropdown
function populateTeamDropdowns() {
    if (!TEAMS || TEAMS.length === 0) return;
    
    const teamSelects = [
        document.getElementById('teamName'),
        document.getElementById('dailyTeamName'),
        document.getElementById('leaveTeam')
    ];
    
    teamSelects.forEach(select => {
        if (!select) return;
        
        // Clear existing options (giữ lại option đầu tiên)
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add teams
        TEAMS.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = `${team.id} - ${team.name}`;
            select.appendChild(option);
        });
    });
}

// Lấy tất cả projects (chỉ từ localStorage)
function getAllProjects(teamId) {
    const userProjects = getUserProjects();
    if (!userProjects || userProjects.length === 0) {
        return [];
    }
    
    // Nếu có teamId, chỉ lấy projects của team đó hoặc không có teamId
    if (teamId) {
        return userProjects.filter(p => !p.teamId || p.teamId === teamId);
    }
    
    return userProjects;
}

// Populate project dropdown dựa trên team đã chọn
function populateProjectDropdown(projectSelect, teamId) {
    if (!projectSelect) return;
    
    // Clear existing options (giữ lại option đầu tiên)
    while (projectSelect.options.length > 1) {
        projectSelect.remove(1);
    }
    
    // Lấy tất cả projects (từ config + localStorage)
    const projects = getAllProjects(teamId);
    
    // Add projects
    projects.forEach(project => {
        const option = document.createElement('option');
        option.value = project.id;
        option.textContent = `${project.id} - ${project.name}`;
        projectSelect.appendChild(option);
    });
}

// Populate tất cả project dropdowns dựa trên team hiện tại
function populateAllProjectDropdowns(teamId) {
    const teamSelect = document.getElementById('teamName');
    const dailyTeamSelect = document.getElementById('dailyTeamName');
    
    // Weekly projects
    if (teamSelect && teamSelect.value) {
        const projectSelects = document.querySelectorAll('.project-id:not(.daily-project-id)');
        projectSelects.forEach(select => {
            populateProjectDropdown(select, teamSelect.value);
        });
    }
    
    // Daily projects
    if (dailyTeamSelect && dailyTeamSelect.value) {
        const dailyProjectSelects = document.querySelectorAll('.daily-project-id');
        dailyProjectSelects.forEach(select => {
            populateProjectDropdown(select, dailyTeamSelect.value);
        });
    }
}

// Auto-fill project name khi chọn project ID
function setupProjectIdChangeListeners() {
    // Weekly projects
    document.addEventListener('change', function(e) {
        if (e.target.classList.contains('project-id')) {
            const projectId = e.target.value;
            const projectCard = e.target.closest('.project-card');
            const projectNameInput = projectCard.querySelector('.project-name');
            
            if (projectNameInput && projectId) {
                const projectName = getProjectNameById(projectId);
                projectNameInput.value = projectName || '';
            } else if (projectNameInput) {
                projectNameInput.value = '';
            }
        }
        
        // Daily projects
        if (e.target.classList.contains('daily-project-id')) {
            const projectId = e.target.value;
            const projectCard = e.target.closest('.project-card');
            const projectNameInput = projectCard.querySelector('.daily-project-name');
            
            if (projectNameInput && projectId) {
                const projectName = getProjectNameById(projectId);
                projectNameInput.value = projectName || '';
            } else if (projectNameInput) {
                projectNameInput.value = '';
            }
        }
    });
}

// Setup team change listeners để cập nhật project dropdowns
function setupTeamChangeListeners() {
    const teamSelect = document.getElementById('teamName');
    const dailyTeamSelect = document.getElementById('dailyTeamName');
    
    if (teamSelect) {
        teamSelect.addEventListener('change', function() {
            const teamId = this.value;
            localStorage.setItem(TEAM_ID_KEY, teamId);
            populateAllProjectDropdowns(teamId);
        });
    }
    
    if (dailyTeamSelect) {
        dailyTeamSelect.addEventListener('change', function() {
            const teamId = this.value;
            localStorage.setItem(TEAM_ID_KEY, teamId);
            populateAllProjectDropdowns(teamId);
        });
    }
    
    // Leave team cũng lưu vào localStorage
    const leaveTeamSelect = document.getElementById('leaveTeam');
    if (leaveTeamSelect) {
        leaveTeamSelect.addEventListener('change', function() {
            localStorage.setItem(TEAM_ID_KEY, this.value);
        });
    }
}

// Load saved team ID từ localStorage
function loadSavedTeamId() {
    const savedTeamId = localStorage.getItem(TEAM_ID_KEY);
    if (!savedTeamId) return;
    
    const teamSelects = [
        document.getElementById('teamName'),
        document.getElementById('dailyTeamName'),
        document.getElementById('leaveTeam')
    ];
    
    // Hàm helper để set value cho một select
    const setTeamValue = (select) => {
        if (!select || !savedTeamId) return;
        
        // Kiểm tra xem option có tồn tại không
        const optionExists = Array.from(select.options).some(opt => opt.value === savedTeamId);
        
        if (optionExists) {
            select.value = savedTeamId;
            // Trigger change event để populate projects
            select.dispatchEvent(new Event('change', { bubbles: true }));
            
            return true;
        }
        return false;
    };
    
    // Thử set value ngay lập tức
    teamSelects.forEach(select => {
        if (select) {
            if (!setTeamValue(select)) {
                // Nếu chưa có option, đợi một chút rồi thử lại
                setTimeout(() => {
                    if (!setTeamValue(select)) {
                        // Thử lại lần nữa sau 200ms
                        setTimeout(() => {
                            setTeamValue(select);
                        }, 200);
                    }
                }, 100);
            }
        }
    });
}

// Initialize config và dropdowns
function initializeConfig() {
    // Override getProjectNameById để tìm cả trong user projects
    overrideGetProjectNameById();
    
    // Populate team dropdowns
    populateTeamDropdowns();
    
    // Setup event listeners
    setupTeamChangeListeners();
    setupProjectIdChangeListeners();
    
    // Load saved team ID - đợi một chút để đảm bảo DOM đã sẵn sàng
    setTimeout(() => {
        loadSavedTeamId();
    }, 50);
}

// Override getProjectNameById để chỉ tìm trong localStorage
function overrideGetProjectNameById() {
    window.getProjectNameById = function(projectId) {
        // Tìm trong user projects
        const userProjects = getUserProjects();
        if (userProjects && userProjects.length > 0) {
            const userProject = userProjects.find(p => p.id === projectId);
            if (userProject) return userProject.name;
        }
        
        return '';
    };
}

// ==================== USER PROJECTS MANAGEMENT ====================

// Lấy user projects từ localStorage
function getUserProjects() {
    const data = localStorage.getItem(USER_PROJECTS_KEY);
    return data ? JSON.parse(data) : [];
}

// Lưu user projects vào localStorage
function saveUserProjects(projects) {
    localStorage.setItem(USER_PROJECTS_KEY, JSON.stringify(projects));
}

// Thêm project mới
function addUserProject(project) {
    const projects = getUserProjects();
    // Kiểm tra trùng ID
    if (projects.find(p => p.id === project.id)) {
        return false; // ID đã tồn tại
    }
    projects.push(project);
    saveUserProjects(projects);
    return true;
}

// Cập nhật project
function updateUserProject(projectId, updatedProject) {
    const projects = getUserProjects();
    const index = projects.findIndex(p => p.id === projectId);
    if (index === -1) return false;
    
    // Nếu đổi ID, kiểm tra ID mới có trùng không
    if (updatedProject.id !== projectId) {
        if (projects.find(p => p.id === updatedProject.id && p.id !== projectId)) {
            return false; // ID mới đã tồn tại
        }
    }
    
    projects[index] = updatedProject;
    saveUserProjects(projects);
    return true;
}

// Xóa project
function deleteUserProject(projectId) {
    const projects = getUserProjects();
    const filtered = projects.filter(p => p.id !== projectId);
    if (filtered.length === projects.length) return false; // Không tìm thấy
    saveUserProjects(filtered);
    return true;
}

// Helper: lấy team mặc định cho form thêm dự án mới
function getDefaultTeamIdForNewProject() {
    // Ưu tiên theo chế độ hiện tại
    const dailyTeamSelect = document.getElementById('dailyTeamName');
    const weeklyTeamSelect = document.getElementById('teamName');
    if (currentReportMode === 'daily' && dailyTeamSelect && dailyTeamSelect.value) {
        return dailyTeamSelect.value;
    }
    if (currentReportMode === 'weekly' && weeklyTeamSelect && weeklyTeamSelect.value) {
        return weeklyTeamSelect.value;
    }
    // Fallback từ localStorage
    const saved = localStorage.getItem(TEAM_ID_KEY);
    if (saved) return saved;
    return '';
}

// Mở modal settings
function openProjectSettingsModal() {
    const modal = document.getElementById('projectSettingsModal');
    modal.style.display = 'block';
    renderProjectSettingsList();
    renderNewProjectsForm();
}

// Render form thêm project mới
function renderNewProjectsForm() {
    const container = document.getElementById('newProjectsList');
    const defaultTeamId = getDefaultTeamIdForNewProject();

    // Build options cho team select
    let teamOptions = '<option value="">Chọn team (tùy chọn)</option>';
    if (TEAMS && Array.isArray(TEAMS)) {
        teamOptions += TEAMS.map(t => 
            `<option value="${t.id}" ${defaultTeamId && t.id === defaultTeamId ? 'selected' : ''}>${t.id} - ${t.name}</option>`
        ).join('');
    }

    container.innerHTML = `
        <div class="new-project-row" style="
            display: grid;
            grid-template-columns: 1.5fr 2fr 2.5fr auto;
            gap: 12px;
            align-items: center;
            margin-bottom: 10px;
        ">
            <input type="text" class="new-project-id" placeholder="Project ID" style="
                padding: 10px 12px;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-size: 0.95em;
            ">
            <input type="text" class="new-project-name" placeholder="Project Name" style="
                padding: 10px 12px;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-size: 0.95em;
            ">
            <select class="new-project-team" style="
                padding: 10px 12px;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-size: 0.95em;
            ">${teamOptions}</select>
            <button type="button" class="btn-remove-new-project" style="
                padding: 10px 12px;
                background: #dc3545;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1em;
            " title="Xóa dòng">🗑️</button>
        </div>
    `;
    
    // Event listener cho nút xóa
    container.querySelector('.btn-remove-new-project').addEventListener('click', function() {
        if (container.querySelectorAll('.new-project-row').length > 1) {
            this.closest('.new-project-row').remove();
        }
    });
}

// Thêm dòng mới vào form
function addNewProjectRow() {
    const container = document.getElementById('newProjectsList');
    const newRow = document.createElement('div');
    newRow.className = 'new-project-row';
    newRow.style.cssText = `
        display: grid;
        grid-template-columns: 1.5fr 2fr 2.5fr auto;
        gap: 12px;
        align-items: center;
        margin-bottom: 10px;
    `;
    // Build options với selected = team hiện tại
    const defaultTeamId = getDefaultTeamIdForNewProject();
    let teamOptions = '<option value="">Chọn team (tùy chọn)</option>';
    if (TEAMS && Array.isArray(TEAMS)) {
        teamOptions += TEAMS.map(t => 
            `<option value="${t.id}" ${defaultTeamId && t.id === defaultTeamId ? 'selected' : ''}>${t.id} - ${t.name}</option>`
        ).join('');
    }

    newRow.innerHTML = `
            <input type="text" class="new-project-id" placeholder="Project ID" style="
                padding: 10px 12px;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-size: 0.95em;
            ">
            <input type="text" class="new-project-name" placeholder="Project Name" style="
                padding: 10px 12px;
                border: 2px solid var(--border-color);
                border-radius: 8px;
                background: var(--bg-secondary);
                color: var(--text-primary);
                font-size: 0.95em;
            ">
        <select class="new-project-team" style="
            padding: 10px 12px;
            border: 2px solid var(--border-color);
            border-radius: 8px;
            background: var(--bg-secondary);
            color: var(--text-primary);
            font-size: 0.95em;
        ">${teamOptions}</select>
        <button type="button" class="btn-remove-new-project" style="
            padding: 10px 12px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1em;
        " title="Xóa dòng">🗑️</button>
    `;
    
    container.appendChild(newRow);
    
    // Event listener cho nút xóa
    newRow.querySelector('.btn-remove-new-project').addEventListener('click', function() {
        if (container.querySelectorAll('.new-project-row').length > 1) {
            newRow.remove();
        }
    });
}

// Lưu các project mới
function saveNewProjects() {
    const rows = document.querySelectorAll('#newProjectsList .new-project-row');
    const newProjects = [];
    const errors = [];
    
    rows.forEach((row, index) => {
        const projectId = row.querySelector('.new-project-id').value.trim();
        const projectName = row.querySelector('.new-project-name').value.trim();
        const teamId = row.querySelector('.new-project-team').value.trim() || null;
        
        // Bỏ qua dòng trống
        if (!projectId && !projectName) return;
        
        // Validate
        if (!projectId) {
            errors.push(`Dòng ${index + 1}: Thiếu Project ID`);
            return;
        }
        if (!projectName) {
            errors.push(`Dòng ${index + 1}: Thiếu Project Name`);
            return;
        }
        
        // Kiểm tra trùng ID trong danh sách mới
        if (newProjects.find(p => p.id === projectId)) {
            errors.push(`Dòng ${index + 1}: Project ID "${projectId}" đã tồn tại trong danh sách mới`);
            return;
        }
        
        // Kiểm tra trùng ID với projects đã lưu
        const existingProjects = getUserProjects();
        if (existingProjects.find(p => p.id === projectId)) {
            errors.push(`Dòng ${index + 1}: Project ID "${projectId}" đã tồn tại trong danh sách đã lưu`);
            return;
        }
        
        newProjects.push({
            id: projectId,
            name: projectName,
            teamId: teamId
        });
    });
    
    if (errors.length > 0) {
        showToast(errors[0], 'error');
        return;
    }
    
    if (newProjects.length === 0) {
        alert('⚠️ Không có dự án nào để lưu. Vui lòng điền thông tin.');
        return;
    }
    
    // Lưu tất cả projects mới
    const existingProjects = getUserProjects();
    existingProjects.push(...newProjects);
    saveUserProjects(existingProjects);
    
    showToast(`Đã thêm ${newProjects.length} dự án thành công!`, 'success');
    
    // Clear form và reload
    renderNewProjectsForm();
    renderProjectSettingsList();
    reloadAllProjectDropdowns();
}

// Đóng modal settings
function closeProjectSettingsModal() {
    const modal = document.getElementById('projectSettingsModal');
    modal.style.display = 'none';
}

// Render danh sách projects trong settings
function renderProjectSettingsList() {
    const container = document.getElementById('projectSettingsList');
    const projects = getUserProjects();
    
    if (projects.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: var(--text-secondary);">Chưa có dự án nào. Thêm dự án mới ở trên.</div>';
        return;
    }
    
    container.innerHTML = projects.map((project, index) => `
        <div class="project-setting-item" data-project-id="${project.id}" style="
            background: var(--bg-tertiary);
            border: 2px solid var(--border-color);
            border-radius: 12px;
            padding: 16px;
            margin-bottom: 12px;
        ">
            <div style="display: grid; grid-template-columns: 1.5fr 3fr 1.5fr 160px; gap: 12px; align-items: center;">
                <input type="text" class="edit-project-id" value="${project.id}" data-original-id="${project.id}" style="
                    padding: 10px 12px;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-weight: 600;
                    font-size: 0.95em;
                ">
                <input type="text" class="edit-project-name" value="${project.name || ''}" style="
                    padding: 10px 12px;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-size: 0.95em;
                ">
                <input type="text" class="edit-project-team" value="${project.teamId || ''}" placeholder="Team ID (tùy chọn)" style="
                    padding: 10px 12px;
                    border: 2px solid var(--border-color);
                    border-radius: 8px;
                    background: var(--bg-secondary);
                    color: var(--text-primary);
                    font-size: 0.95em;
                ">
                <div style="display: flex; gap: 8px; flex-shrink: 0; min-width: 160px; justify-content: flex-end;">
                    <button type="button" class="btn-save-project" data-project-id="${project.id}" style="
                        padding: 10px 16px;
                        background: #28a745;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 0.9em;
                        white-space: nowrap;
                        min-width: 70px;
                        transition: all 0.3s ease;
                    " title="Lưu thay đổi">💾</button>
                    <button type="button" class="btn-delete-project" data-project-id="${project.id}" style="
                        padding: 10px 16px;
                        background: #dc3545;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-size: 0.9em;
                        white-space: nowrap;
                        min-width: 70px;
                        transition: all 0.3s ease;
                    " title="Xóa dự án">🗑️</button>
                </div>
            </div>
        </div>
    `).join('');
    
    // Event listeners cho các nút
    container.querySelectorAll('.btn-save-project').forEach(btn => {
        btn.addEventListener('click', () => saveEditedProject(btn.dataset.projectId));
    });
    
    container.querySelectorAll('.btn-delete-project').forEach(btn => {
        btn.addEventListener('click', () => deleteUserProjectHandler(btn.dataset.projectId));
    });
}

// Lưu project đã chỉnh sửa
function saveEditedProject(projectId) {
    const item = document.querySelector(`.project-setting-item[data-project-id="${projectId}"]`);
    if (!item) return;
    
    const originalId = item.querySelector('.edit-project-id').dataset.originalId;
    const newId = item.querySelector('.edit-project-id').value.trim();
    const newName = item.querySelector('.edit-project-name').value.trim();
    const newTeamId = item.querySelector('.edit-project-team').value.trim() || null;
    
    // Validate
    if (!newId) { showToast('Project ID không được để trống!', 'error'); return; }
    if (!newName) { showToast('Project Name không được để trống!', 'error'); return; }
    
    const updatedProject = {
        id: newId,
        name: newName,
        teamId: newTeamId
    };
    
    if (updateUserProject(originalId, updatedProject)) {
        showToast('Đã cập nhật dự án thành công!', 'success');
        renderProjectSettingsList();
        // Reload project dropdowns
        reloadAllProjectDropdowns();
    } else {
        showToast('Không thể cập nhật. Project ID mới đã tồn tại!', 'error');
    }
}

// Xử lý xóa project
function deleteUserProjectHandler(projectId) {
    if (!confirm(`Bạn có chắc muốn xóa dự án "${projectId}"?`)) return;
    
    if (deleteUserProject(projectId)) {
        showToast('Đã xóa dự án thành công!', 'success');
        renderProjectSettingsList();
        // Reload project dropdowns
        reloadAllProjectDropdowns();
    } else {
        showToast('Không tìm thấy dự án để xóa!', 'error');
    }
}

// Reload tất cả project dropdowns
function reloadAllProjectDropdowns() {
    const teamSelect = document.getElementById('teamName');
    const dailyTeamSelect = document.getElementById('dailyTeamName');
    
    if (teamSelect && teamSelect.value) {
        populateAllProjectDropdowns(teamSelect.value);
    }
    if (dailyTeamSelect && dailyTeamSelect.value) {
        populateAllProjectDropdowns(dailyTeamSelect.value);
    }
}

// ==================== END USER PROJECTS MANAGEMENT ====================

// ==================== END CONFIG & DROPDOWN MANAGEMENT ====================

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
            
            // Populate project dropdown nếu đã chọn team
            const teamSelect = document.getElementById('teamName');
            if (teamSelect && teamSelect.value && projectIdInput && projectIdInput.tagName === 'SELECT') {
                populateProjectDropdown(projectIdInput, teamSelect.value);
            }
            
            // Set values sau khi populate
            if (projectIdInput) {
                if (projectIdInput.tagName === 'SELECT') {
                    projectIdInput.value = projectIdValue;
                    // Trigger change để auto-fill project name
                    projectIdInput.dispatchEvent(new Event('change'));
                } else {
                    projectIdInput.value = projectIdValue;
                }
            }
            if (projectNameInput) projectNameInput.value = projectNameValue;
            
            cardElement.querySelector('.project-scope').value = project.scopeOfWork || '';
            cardElement.querySelector('.project-wbs').value = project.wbs || '';
            cardElement.querySelector('.project-current-progress').value = project.currentProgress || '';
            cardElement.querySelector('.project-estimated-progress').value = project.estimatedProgress || '';
            cardElement.querySelector('.project-phase').value = project.phase || '';
            cardElement.querySelector('.project-completed').value = Array.isArray(project.completedTasks) 
                ? project.completedTasks.join('\n') 
                : (project.completedTasks || '');
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
    // Re-apply saved team ID after reset to avoid losing selection
    const savedTeamId = localStorage.getItem(TEAM_ID_KEY);
    const weeklyTeamSelect = document.getElementById('teamName');
    if (weeklyTeamSelect && savedTeamId) {
        weeklyTeamSelect.value = savedTeamId;
        weeklyTeamSelect.dispatchEvent(new Event('change'));
    }
    
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
    
    // Populate project dropdown nếu đã chọn team
    const teamSelect = document.getElementById('teamName');
    const projectSelect = cardElement.querySelector('.project-id');
    if (teamSelect && teamSelect.value && projectSelect) {
        populateProjectDropdown(projectSelect, teamSelect.value);
    }
    
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
    const projectCards = document.querySelectorAll('.project-card:not([data-daily-project-id])');
    
    projectCards.forEach(card => {
        const projectIdEl = card.querySelector('.project-id');
        const projectId = projectIdEl ? (projectIdEl.tagName === 'SELECT' ? projectIdEl.value.trim() : projectIdEl.value.trim()) : '';
        const projectNameEl = card.querySelector('.project-name');
        const projectName = projectNameEl ? projectNameEl.value.trim() : '';
        
        // Bỏ qua project chưa có cả ID và Name
        if (!projectId && !projectName) return;
        
        const scopeOfWork = card.querySelector('.project-scope').value.trim();
        const wbs = card.querySelector('.project-wbs').value.trim();
        const currentProgress = card.querySelector('.project-current-progress').value.trim();
        const estimatedProgress = card.querySelector('.project-estimated-progress').value.trim();
        const phase = card.querySelector('.project-phase').value.trim();
        const completed = card.querySelector('.project-completed').value
            .split('\n').filter(t => t.trim());
        const planned = card.querySelector('.project-planned').value
            .split('\n').filter(t => t.trim());
        const notes = card.querySelector('.project-notes').value.trim();
        
        projects.push({
            projectId: projectId,
            projectName: projectName,
            name: formatProjectDisplayName(projectId, projectName), // Giữ tương thích với format cũ
            scopeOfWork: scopeOfWork,
            wbs: wbs,
            currentProgress: currentProgress,
            estimatedProgress: estimatedProgress,
            phase: phase,
            completedTasks: completed,
            plannedTasks: planned,
            notes: notes
        });
    });
    
    return projects;
}

function normalizeTaskList(raw) {
    if (!raw) return [];
    if (Array.isArray(raw)) {
        return raw
            .map(item => (typeof item === 'string' ? item.trim() : item))
            .filter(item => typeof item === 'string' ? item.length > 0 : !!item);
    }
    if (typeof raw === 'string') {
        return raw
            .split('\n')
            .map(item => item.trim())
            .filter(item => item.length > 0);
    }
    return [];
}

function formatWeeklyBulletList(items) {
    const normalized = normalizeTaskList(items);
    if (normalized.length === 0) {
        return '• N/A';
    }
    return normalized.map(item => `• ${item}`).join('\n');
}

// Format report để hiển thị (theo format mới)
function formatReport(report) {
    const teamLabel = report.teamName && report.teamName.trim()
        ? `${report.teamName.trim()} - WEEKLY REPORT`
        : 'TEAM - WEEKLY REPORT';
    const periodShort = `${formatDateDM(report.startDate)} - ${formatDateDM(report.endDate)}`;
    
    let formatted = `${teamLabel}\n${periodShort}\n\n`;
    
    if (report.projects && report.projects.length > 0) {
        report.projects.forEach((project, index) => {
            if (index > 0) formatted += '\n';
            
            const projectId = project.projectId || '';
            const projectName = project.projectName || '';
            let displayName = '';
            
            if (projectId && projectName) {
                displayName = `${projectId} - ${projectName}`;
            } else if (projectId) {
                displayName = projectId;
            } else if (projectName) {
                displayName = projectName;
            } else {
                displayName = project.name || 'Unnamed Project';
            }
            
            formatted += `🎮 **${displayName}**\n`;
            
            const scope = project.scopeOfWork && project.scopeOfWork.trim();
            if (scope) {
                formatted += `*Scope:* ${scope}\n`;
            }
            
            const wbs = project.wbs && project.wbs.trim();
            if (wbs) {
                formatted += `*WBS:* ${wbs}\n`;
            }
            
            // PROJECT STATUS block
            const currentProgress = project.currentProgress && project.currentProgress.trim();
            const estimatedProgress = project.estimatedProgress && project.estimatedProgress.trim();
            const phase = project.phase && project.phase.trim();
            
            if (currentProgress || estimatedProgress || phase) {
                formatted += '\n📊 **PROJECT STATUS**\n';
                if (currentProgress) {
                    formatted += `   • Current Progress: ${currentProgress}%\n`;
                }
                if (estimatedProgress) {
                    formatted += `   • Estimated Next Progress: ${estimatedProgress}%\n`;
                }
                if (phase) {
                    formatted += `   • Phase: ${phase}\n`;
                }
                formatted += '\n';
            } else if (scope || wbs) {
                formatted += '\n';
            }
            
            const completed = normalizeTaskList(project.completedTasks);
            const planned = normalizeTaskList(project.plannedTasks);
            const notesList = normalizeTaskList(project.notes);
            
            const ontimePercentage = project.ontimePercentage ? ` - ${project.ontimePercentage}% % thực tế đã xong` : '';
            const nextTargetPercentage = project.nextTargetPercentage ? ` - ${project.nextTargetPercentage}% % dự định hoàn thành` : '';
            
            formatted += `**1/ ONTIME (${completed.length})${ontimePercentage}:**\n`;
            const completedIndented = formatWeeklyBulletList(completed).split('\n').map(line => `   ${line}`).join('\n');
            formatted += `${completedIndented}\n`;
            
            formatted += `**2/ NEXT TARGET (${planned.length})${nextTargetPercentage}:**\n`;
            const plannedIndented = formatWeeklyBulletList(planned).split('\n').map(line => `   ${line}`).join('\n');
            formatted += `${plannedIndented}\n`;
            
            formatted += `**3/ NOTE (${notesList.length}):**\n`;
            const notesIndented = formatWeeklyBulletList(notesList).split('\n').map(line => `   ${line}`).join('\n');
            formatted += `${notesIndented}\n`;
        });
    } else {
        formatted += 'Chưa có dự án nào.\n';
    }
    
    return formatted.trim();
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

// Chuẩn hóa về 00:00 theo giờ địa phương (tránh lệch ngày khi dùng toISOString)
function startOfLocalDay(date) {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
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

// Lấy ngày Thứ 2 của tuần chứa date
function getMondayOfWeek(date) {
    const d = startOfLocalDay(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Điều chỉnh: Thứ 2 = 1, CN = 0 -> -6
    d.setDate(diff);
    return d;
}

// Lấy ngày Thứ 6 (cuối tuần làm việc) của tuần chứa date
function getFridayOfWeek(date) {
    const monday = getMondayOfWeek(date);
    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);
    return friday;
}

// Lấy khoảng Thứ 2 → Thứ 6 từ số tuần ISO và năm
function getDatesForISOWeek(year, weekNumber) {
    const jan4 = new Date(year, 0, 4);
    let jan4DayOfWeek = jan4.getDay();
    if (jan4DayOfWeek === 0) jan4DayOfWeek = 7;

    const firstMonday = new Date(year, 0, 4 - jan4DayOfWeek + 1);
    const monday = new Date(firstMonday);
    monday.setDate(firstMonday.getDate() + (weekNumber - 1) * 7);

    const friday = new Date(monday);
    friday.setDate(monday.getDate() + 4);

    return { startDate: monday, endDate: friday };
}

// Đồng bộ ngày bắt đầu/kết thúc khi đổi số tuần hoặc năm
function syncWeeklyDatesFromWeekYear() {
    const weekNumber = parseInt(document.getElementById('weekNumber').value, 10);
    const year = parseInt(document.getElementById('year').value, 10);
    if (!weekNumber || !year) return;

    const { startDate, endDate } = getDatesForISOWeek(year, weekNumber);
    document.getElementById('startDate').value = toLocalDateInput(startDate);
    document.getElementById('endDate').value = toLocalDateInput(endDate);
}

// Set default dates (tuần này: Thứ 2 → Thứ 6)
function setDefaultDates() {
    const today = new Date();
    const currentYear = today.getFullYear();
    
    // Tính số tuần ISO
    const weekNumber = getISOWeekNumber(today);
    
    const startDate = getMondayOfWeek(today);
    const endDate = getFridayOfWeek(today);
    
    // Kiểm tra xem tuần có rơi vào năm khác không (cuối tháng 12 có thể rơi vào tuần 1 năm sau)
    let displayYear = currentYear;
    if (startDate.getMonth() === 11 && startDate.getDate() >= 29 && weekNumber === 1) {
        displayYear = currentYear + 1;
    }
    
    document.getElementById('year').value = displayYear;
    document.getElementById('weekNumber').value = weekNumber;
    document.getElementById('startDate').value = toLocalDateInput(startDate);
    document.getElementById('endDate').value = toLocalDateInput(endDate);
}

// ==================== DAILY REPORT FUNCTIONS ====================

// Set default date (hôm nay)
function setDefaultDailyDate() {
    const today = new Date();
    document.getElementById('dailyDate').value = toLocalDateInput(today);
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
    
    // Populate project dropdown nếu đã chọn team
    const teamSelect = document.getElementById('dailyTeamName');
    const projectSelect = cardElement.querySelector('.daily-project-id');
    if (teamSelect && teamSelect.value && projectSelect) {
        populateProjectDropdown(projectSelect, teamSelect.value);
    }
    
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
        const projectIdEl = card.querySelector('.daily-project-id');
        const projectId = projectIdEl ? (projectIdEl.tagName === 'SELECT' ? projectIdEl.value.trim() : projectIdEl.value.trim()) : '';
        const projectNameEl = card.querySelector('.daily-project-name');
        const projectName = projectNameEl ? projectNameEl.value.trim() : '';
        
        // Bỏ qua project chưa có cả ID và Name
        if (!projectId && !projectName) return;
        
        const done = card.querySelector('.daily-project-done').value
            .split('\n').filter(t => t.trim());
        const inProgress = card.querySelector('.daily-project-in-progress').value
            .split('\n').filter(t => t.trim());
        const remaining = card.querySelector('.daily-project-remaining').value
            .split('\n').filter(t => t.trim());
        const note = card.querySelector('.daily-project-note').value.trim();
        const overallProgress = card.querySelector('.daily-overall-progress').value.trim();
        const todayProgress = card.querySelector('.daily-today-progress').value.trim();
        const phase = card.querySelector('.daily-phase').value.trim();
        
        projects.push({
            projectId: projectId,
            projectName: projectName,
            done: done,
            inProgress: inProgress,
            remaining: remaining,
            note: note,
            overallProgress: overallProgress,
            todayProgress: todayProgress,
            phase: phase
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
            
            const overallProgress = project.overallProgress && project.overallProgress.trim();
            const todayProgress = project.todayProgress && project.todayProgress.trim();
            const phase = project.phase && project.phase.trim();
            
            if (overallProgress || todayProgress || phase) {
                formatted += `📊 STATUS:\n`;
                if (overallProgress) {
                    const overallDisplay = overallProgress.endsWith('%') ? overallProgress : `${overallProgress}%`;
                    formatted += `   • Overall Progress: ${overallDisplay}\n`;
                }
                if (todayProgress) {
                    const todayDisplay = todayProgress.endsWith('%') ? todayProgress : `${todayProgress}%`;
                    formatted += `   • Today Progress: ${todayDisplay}\n`;
                }
                if (phase) {
                    formatted += `   • Phase: ${phase}\n`;
                }
                formatted += '\n';
            }
            
            // DONE
            const doneCount = project.done ? project.done.length : 0;
            formatted += `✅ DONE: (${doneCount})\n`;
            if (doneCount > 0) {
                project.done.forEach(task => {
                    if (task) formatted += `   • ${task}\n`;
                });
            }
            formatted += '\n';
            
            // IN-PROGRESS
            const inProgressCount = project.inProgress ? project.inProgress.length : 0;
            formatted += `🔄 IN-PROGRESS: (${inProgressCount})\n`;
            if (inProgressCount > 0) {
                project.inProgress.forEach(task => {
                    if (task) formatted += `   • ${task}\n`;
                });
            }
            formatted += '\n';
            
            // REMAINING
            const remainingCount = project.remaining ? project.remaining.length : 0;
            formatted += `📋 REMAINING: (${remainingCount})\n`;
            if (remainingCount > 0) {
                project.remaining.forEach(task => {
                    if (task) formatted += `   • ${task}\n`;
                });
            }
            formatted += '\n';
            
            // NOTE
            const notesList = normalizeTaskList(project.note);
            const noteCount = notesList.length;
            formatted += `📝 NOTE: (${noteCount})\n`;
            if (noteCount > 0) {
                notesList.forEach(note => {
                    if (note) formatted += `   • ${note}\n`;
                });
            }
            formatted += '\n';
        });
    }
    
    return formatted;
}

// Reset daily form về trạng thái mới
function resetDailyFormToNew() {
    const form = document.getElementById('dailyReportForm');
    form.reset();
    // Re-apply saved team ID after reset so daily project dropdown populates correctly
    const savedTeamId = localStorage.getItem(TEAM_ID_KEY);
    const dailyTeamSelect = document.getElementById('dailyTeamName');
    if (dailyTeamSelect && savedTeamId) {
        dailyTeamSelect.value = savedTeamId;
        dailyTeamSelect.dispatchEvent(new Event('change'));
    }
    
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
    
    // Reset form (bên trong sẽ tự re-apply team ID từ localStorage)
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
    
    // Reset form (bên trong sẽ tự re-apply team ID từ localStorage)
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
    // Prefill defaults - ưu tiên teamID từ localStorage
    const savedTeamId = localStorage.getItem(TEAM_ID_KEY) || localStorage.getItem(LEAVE_TEAM_KEY) || '';
    const leaveTeamSelect = document.getElementById('leaveTeam');
    if (leaveTeamSelect && savedTeamId) {
        leaveTeamSelect.value = savedTeamId;
    }
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
    // Kiểm tra authentication trước
    if (typeof isAuthenticated === 'function' && !isAuthenticated()) {
        // Chờ authentication hoàn tất
        const checkAuth = setInterval(() => {
            if (typeof isAuthenticated === 'function' && isAuthenticated()) {
                clearInterval(checkAuth);
                initializeApp();
            }
        }, 100);
        return;
    }
    
    initializeApp();
});

function initializeApp() {
    // Initialize config và dropdowns trước
    initializeConfig();
    
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
    
    // Load lại team ID sau khi đã switch mode (đảm bảo dropdown đã sẵn sàng)
    setTimeout(() => {
        loadSavedTeamId();
    }, 200);
    
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
    document.getElementById('weekNumber').addEventListener('change', syncWeeklyDatesFromWeekYear);
    document.getElementById('year').addEventListener('change', syncWeeklyDatesFromWeekYear);
    document.getElementById('addProjectBtn').addEventListener('click', addProject);
    document.getElementById('projectSettingsBtn').addEventListener('click', openProjectSettingsModal);
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

    // Project settings modal events
    const projectSettingsModal = document.getElementById('projectSettingsModal');
    if (projectSettingsModal) {
        document.getElementById('projectSettingsBackdrop').addEventListener('click', closeProjectSettingsModal);
        document.getElementById('projectSettingsCloseBtn').addEventListener('click', closeProjectSettingsModal);
        document.getElementById('addNewProjectRowBtn').addEventListener('click', addNewProjectRow);
        document.getElementById('saveNewProjectsBtn').addEventListener('click', saveNewProjects);
        const dailyProjectSettingsBtn = document.getElementById('dailyProjectSettingsBtn');
        if (dailyProjectSettingsBtn) {
            dailyProjectSettingsBtn.addEventListener('click', openProjectSettingsModal);
        }
    }
    
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
}

// Thêm nút logout vào menu
function addLogoutButton() {
    const menuDropdown = document.getElementById('menuDropdown');
    if (!menuDropdown) return;
    
    // Kiểm tra xem đã có nút logout chưa
    if (document.getElementById('logoutBtn')) return;
    
    // Tạo divider và logout button
    const divider = document.createElement('div');
    divider.className = 'menu-divider';
    
    const logoutItem = document.createElement('div');
    logoutItem.className = 'menu-item';
    logoutItem.id = 'logoutBtn';
    logoutItem.innerHTML = '<span class="menu-icon">🚪</span><span class="menu-text">Logout</span>';
    logoutItem.addEventListener('click', function() {
        if (typeof logout === 'function') {
            if (confirm('Bạn có chắc muốn đăng xuất?')) {
                logout();
            }
        }
        document.getElementById('menuDropdown').style.display = 'none';
    });
    
    menuDropdown.appendChild(divider);
    menuDropdown.appendChild(logoutItem);
}

// Export function để dùng trong HTML
window.viewReport = viewReport;
window.editReport = editReport;
window.deleteReport = deleteReport;