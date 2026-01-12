// ==================== GOOGLE AUTHENTICATION ====================

const AUTH_KEY = 'user_auth';
const ALLOWED_DOMAINS = ['seatudio.com', 'enotion.io'];
const GOOGLE_CLIENT_ID = '313545200072-s64bksofr4a8j7kkum9i3lmvb5jva5su.apps.googleusercontent.com'; // Người dùng cần điền Google Client ID của mình

// Kiểm tra user đã đăng nhập chưa
function isAuthenticated() {
    const authData = localStorage.getItem(AUTH_KEY);
    if (!authData) return false;
    
    try {
        const user = JSON.parse(authData);
        // Kiểm tra email domain
        if (user.email && ALLOWED_DOMAINS.some(domain => user.email.endsWith(`@${domain}`))) {
            return true;
        }
    } catch (e) {}
    
    return false;
}

// Lấy thông tin user hiện tại
function getCurrentUser() {
    const authData = localStorage.getItem(AUTH_KEY);
    if (!authData) return null;
    
    try {
        return JSON.parse(authData);
    } catch (e) {
        return null;
    }
}

// Xử lý response từ Google Sign-In
function handleCredentialResponse(response) {
    
    // Decode JWT token từ Google
    try {
        // Decode JWT (không verify, chỉ decode để lấy thông tin)
        const base64Url = response.credential.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const credential = JSON.parse(jsonPayload);
        
        // Kiểm tra email domain
        if (!credential.email || !ALLOWED_DOMAINS.some(domain => credential.email.endsWith(`@${domain}`))) {
            showLoginError(`❌ Chỉ cho phép email có đuôi @seatudio.com hoặc @enotion.io`);
            return;
        }
        
        // Lưu thông tin user
        const userData = {
            email: credential.email,
            name: credential.name || credential.given_name || 'User',
            picture: credential.picture || '',
            sub: credential.sub,
            loginTime: new Date().toISOString()
        };
        
        localStorage.setItem(AUTH_KEY, JSON.stringify(userData));
        
        // Ẩn login screen và hiện main app
        showMainApp();
        
    } catch (error) { showLoginError('❌ Lỗi xác thực. Vui lòng thử lại.'); }
}

// Hiển thị main app
function showMainApp() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) loginScreen.style.display = 'none';
    if (mainApp) mainApp.style.display = 'block';
}

// Hiển thị login screen
function showLoginScreen() {
    const loginScreen = document.getElementById('loginScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loginScreen) loginScreen.style.display = 'block';
    if (mainApp) mainApp.style.display = 'none';
}

// Hiển thị lỗi login
function showLoginError(message) {
    const errorDiv = document.getElementById('loginError');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // Tự động ẩn sau 5 giây
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
}

// Đăng xuất
function logout() {
    localStorage.removeItem(AUTH_KEY);
    showLoginScreen();
    
    // Reset Google Sign-In
    if (window.google && window.google.accounts) {
        window.google.accounts.id.disableAutoSelect();
    }
}

// Khởi tạo authentication
function initializeAuth() {
    // TẠM THỜI: Bỏ qua authentication, cho phép vào thẳng trang chính
    // TODO: Bật lại authentication khi cần
    showMainApp();
    return;
    
    // ========== CODE CŨ (ĐÃ TẮT TẠM THỜI) ==========
    // Kiểm tra nếu đã đăng nhập
    // if (isAuthenticated()) {
    //     showMainApp();
    //     return;
    // }
    // 
    // // Hiển thị login screen
    // showLoginScreen();
    // 
    // // Kiểm tra và cấu hình Google Sign-In
    // if (!GOOGLE_CLIENT_ID || GOOGLE_CLIENT_ID.trim() === '') {
    //     // Hiển thị thông báo nếu chưa có Client ID
    //     const errorDiv = document.getElementById('loginError');
    //     if (errorDiv) {
    //         errorDiv.innerHTML = '⚠️ Vui lòng cấu hình Google Client ID trong file auth.js (dòng 5)<br><br>Xem hướng dẫn trong file AUTH_SETUP.md';
    //         errorDiv.style.display = 'block';
    //     }
    //     return;
    // }
    // 
    // // Không dùng g_id_onload để tránh SDK đọc data-client_id trước khi JS thiết lập
    // 
    // // Khởi tạo Google Sign-In bằng JavaScript
    // if (window.google && window.google.accounts) {
    //     try {
    //         
    //         
    //         // Khởi tạo với callback
    //         window.google.accounts.id.initialize({
    //             client_id: GOOGLE_CLIENT_ID,
    //             callback: handleCredentialResponse,
    //             auto_select: false,
    //             cancel_on_tap_outside: true
    //         });
    //         
    //         // Render button
    //         const signInContainer = document.getElementById('g_id_signin');
    //         if (signInContainer) {
    //             // Clear container trước
    //             signInContainer.innerHTML = '';
    //             window.google.accounts.id.renderButton(
    //                 signInContainer,
    //                 {
    //                     theme: 'outline',
    //                     size: 'large',
    //                     text: 'sign_in_with',
    //                     shape: 'rectangular',
    //                     logo_alignment: 'left',
    //                     type: 'standard'
    //                 }
    //             );
    //             
    //         }
    //     } catch (error) {
    //         const errorDiv = document.getElementById('loginError');
    //         if (errorDiv) {
    //             errorDiv.innerHTML = `❌ Lỗi khởi tạo Google Sign-In: ${error.message}<br><br>Vui lòng kiểm tra:<br>1. Client ID đã đúng chưa<br>2. Đã enable Google Identity Services API chưa<br>3. Đã cấu hình OAuth consent screen chưa<br>4. Đã thêm test users chưa (nếu dùng External app)<br>5. Đã thêm authorized origins chưa`;
    //             errorDiv.style.display = 'block';
    //         }
    //     }
    // } else {
    //     const errorDiv = document.getElementById('loginError');
    //     if (errorDiv) {
    //         errorDiv.innerHTML = '⚠️ Google Sign-In SDK chưa load. Vui lòng refresh trang.';
    //         errorDiv.style.display = 'block';
    //     }
    // }
}

// Khởi tạo khi DOM ready (không cần đợi Google SDK vì đã tắt authentication)
function waitForGoogleSDK() {
    // TẠM THỜI: Không cần đợi Google SDK, gọi initializeAuth() ngay
    initializeAuth();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', waitForGoogleSDK);
} else {
    waitForGoogleSDK();
}

// Export functions để dùng trong app.js
window.logout = logout;
window.getCurrentUser = getCurrentUser;
window.isAuthenticated = isAuthenticated;

