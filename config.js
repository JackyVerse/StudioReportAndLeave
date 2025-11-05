// File cấu hình Teams và Projects
// Có thể chỉnh sửa file này để thêm/sửa teams và projects

const APP_CONFIG = {
    // Danh sách Teams
    teams: [
        { id: 'FE', name: 'Frontend' },
        { id: 'ART', name: 'Art' },
        { id: 'ANIM', name: 'Animation' },
        { id: 'GD', name: 'Game Design' },
        { id: 'DESIGN', name: 'Design' }
    ],
    
    // Danh sách Projects (có thể có nhiều projects cho mỗi team)
    projects: [
        { id: '9769', name: 'Crazy Hunter', teamId: 'FE' },
        { id: '9815', name: 'Fisher Men', teamId: 'FE' },
        { id: 'PROJ003', name: 'Project Gamma', teamId: 'ART' },
        { id: 'PROJ004', name: 'Project Delta', teamId: 'BACKEND' },
        { id: 'PROJ005', name: 'Project Epsilon', teamId: 'GD' },
        // Thêm projects khác tại đây...
    ]
};

// Helper function để lấy projects theo teamId
function getProjectsByTeamId(teamId) {
    if (!teamId) return APP_CONFIG.projects;
    return APP_CONFIG.projects.filter(p => p.teamId === teamId);
}

// Helper function để lấy project name theo project id
function getProjectNameById(projectId) {
    const project = APP_CONFIG.projects.find(p => p.id === projectId);
    return project ? project.name : '';
}

