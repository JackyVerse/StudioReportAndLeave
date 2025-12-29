# Hướng dẫn cấu hình Google Authentication

Để sử dụng tính năng đăng nhập bằng Google, bạn cần tạo Google OAuth Client ID và cấu hình vào file `auth.js`.

## Các bước thiết lập:

### 1. Tạo Google OAuth 2.0 Client ID

1. Truy cập [Google Cloud Console](https://console.cloud.google.com/)
2. Tạo project mới hoặc chọn project hiện có
3. Vào **APIs & Services** > **Credentials**
4. Click **Create Credentials** > **OAuth client ID**
5. **QUAN TRỌNG**: Tạo OAuth consent screen (BẮT BUỘC):
   - Vào **APIs & Services** > **OAuth consent screen**
   - Chọn **External** (hoặc Internal nếu dùng Google Workspace)
   - **User Type**: Chọn External
   - **App information**:
     - App name: Studio Report & Leave (hoặc tên bạn muốn)
     - User support email: Chọn email của bạn
     - App logo: (tùy chọn)
   - **App domain**: (tùy chọn, có thể bỏ qua)
   - **Developer contact information**: Điền email của bạn
   - Click **Save and Continue**
   - **Scopes** (BẮT BUỘC):
     - Click **Add or Remove Scopes**
     - Tìm và thêm:
       - `.../auth/userinfo.email`
       - `.../auth/userinfo.profile`
     - Click **Update** > **Save and Continue**
   - **Test users** (BẮT BUỘC nếu dùng External):
     - Click **Add Users**
     - Thêm email của bạn (email có đuôi @seatudio.com hoặc @enotion.io)
     - Click **Add**
     - Click **Save and Continue**
   - **Summary**: Review lại và click **Back to Dashboard**
6. Tạo OAuth Client ID:
   - Vào **APIs & Services** > **Credentials**
   - Click **Create Credentials** > **OAuth client ID**
   - **Application type**: Web application
   - **Name**: Studio Report & Leave (hoặc tên bạn muốn)
   - **Authorized JavaScript origins**: 
     - `http://localhost:8000` (cho local development) - **KHÔNG có dấu /** ở cuối
     - `https://yourdomain.com` (cho production nếu có)
   - **Authorized redirect URIs**: 
     - `http://localhost:8000` (cho local development)
     - `http://localhost:8000/` (có thể thêm cả 2)
     - `https://yourdomain.com` (cho production nếu có)
   - Click **Create**
7. Copy **Client ID** được tạo (chỉ copy Client ID, không copy Client Secret)

### 2. Cấu hình vào file auth.js

Mở file `auth.js` và điền Client ID vào dòng 5:

```javascript
const GOOGLE_CLIENT_ID = 'YOUR_CLIENT_ID_HERE.apps.googleusercontent.com';
```

### 3. Lưu ý

- **Domain restriction**: Hiện tại chỉ cho phép email có đuôi `@seatudio.com` hoặc `@enotion.io`
- Để thay đổi domain được phép, sửa biến `ALLOWED_DOMAINS` trong `auth.js`
- Nếu dùng localhost, cần thêm `http://localhost:8000` vào Authorized JavaScript origins
- Client ID là public, không cần giữ bí mật

### 4. Test

1. Khởi động server: `python3 server.py`
2. Mở trình duyệt: `http://localhost:8000`
3. Bạn sẽ thấy màn hình đăng nhập
4. Click "Sign in with Google"
5. Chọn tài khoản Google có đuôi `@seatudio.com` hoặc `@enotion.io`
6. Nếu đăng nhập thành công, bạn sẽ vào được ứng dụng

### 5. Enable Google Identity Services API

**QUAN TRỌNG**: Trước khi sử dụng, bạn cần enable Google Identity Services API:

1. Vào [Google Cloud Console](https://console.cloud.google.com/)
2. Chọn project của bạn
3. Vào **APIs & Services** > **Library**
4. Tìm "Google Identity Services API"
5. Click **Enable**

### 6. Troubleshooting

#### Lỗi "Error 400: invalid_request" với "flowName=GeneralOAuthFlow"

Lỗi này thường do **OAuth consent screen chưa được cấu hình đúng**:

1. **Kiểm tra OAuth consent screen**:
   - Vào APIs & Services > OAuth consent screen
   - Đảm bảo đã điền đầy đủ thông tin:
     - App name
     - User support email
     - Developer contact information
   - **QUAN TRỌNG**: Đảm bảo đã thêm scopes:
     - `.../auth/userinfo.email`
     - `.../auth/userinfo.profile`

2. **Nếu dùng External app, thêm Test Users**:
   - Vào OAuth consent screen > Test users
   - Click "Add Users"
   - Thêm email của bạn (phải có đuôi @seatudio.com hoặc @enotion.io)
   - Click "Add"

3. **Kiểm tra Publishing status**:
   - Nếu app chưa được publish, chỉ test users mới dùng được
   - Để publish: Vào OAuth consent screen > Publish App
   - Hoặc đảm bảo bạn đã thêm mình vào Test users

4. **Kiểm tra Redirect URIs**:
   - Vào Credentials > Click vào Client ID của bạn
   - Đảm bảo đã thêm `http://localhost:8000` vào Authorized redirect URIs

#### Lỗi "The given client ID is not found"

Lỗi này thường xảy ra vì:

1. **Client ID không tồn tại hoặc đã bị xóa**:
   - Kiểm tra lại trong Google Cloud Console > APIs & Services > Credentials
   - Đảm bảo Client ID vẫn còn trong danh sách
   - Nếu không thấy, tạo lại Client ID mới

2. **Đang xem sai project**:
   - Đảm bảo bạn đang ở đúng project trong Google Cloud Console
   - Client ID phải thuộc project hiện tại

3. **Chưa enable Google Identity Services API**:
   - Vào APIs & Services > Library
   - Tìm và enable "Google Identity Services API"

4. **Client ID format sai**:
   - Đảm bảo Client ID có format: `XXXXX.apps.googleusercontent.com`
   - Không có khoảng trắng hoặc ký tự lạ

5. **Kiểm tra lại trong Google Cloud Console**:
   - Vào APIs & Services > Credentials
   - Tìm OAuth 2.0 Client ID của bạn
   - Click vào để xem chi tiết
   - Copy lại Client ID chính xác (không copy Client Secret)

#### Lỗi "Origin mismatch"

- Đảm bảo đã thêm `http://localhost:8000` vào **Authorized JavaScript origins**
- Không có dấu `/` ở cuối URL
- Nếu dùng production, thêm domain production vào

#### Không hiển thị nút đăng nhập

- Mở Developer Console (F12) để xem lỗi
- Kiểm tra Google SDK đã load chưa
- Kiểm tra Client ID đã được set chưa

#### Email không hợp lệ

- Chỉ cho phép email có đuôi `@seatudio.com` hoặc `@enotion.io`
- Nếu cần thay đổi, sửa `ALLOWED_DOMAINS` trong `auth.js`

