# Commit Message Cheat Sheet 😎

**Format cơ bản**
```
type(scope?): short description

[optional body]
```

| Type       | Dùng khi...                                      |
|------------|--------------------------------------------------|
| `feat`     | Thêm/chỉnh sửa tính năng                         |
| `fix`      | Sửa bug / lỗi logic                              |
| `docs`     | README, hướng dẫn, comment                       |
| `style`    | Định dạng, spacing, lint không đổi logic         |
| `refactor` | Tái cấu trúc giữ nguyên behavior                 |
| `test`     | Bổ sung/chỉnh automated tests                    |
| `chore`    | Việc meta: update deps, build script, CI config  |

**Quick rules**
1. Tiếng Anh, thì hiện tại, ≤ 72 ký tự
2. Không viết hoa chữ đầu sau `:` (trừ danh từ riêng)
3. Scope optional: `feat(report): ...`
4. Body nếu cần mô tả lý do/ảnh hưởng (mỗi dòng ≤ 72 ký tự)

**Ví dụ**
```
feat(report): support bold weekly headers

fix: handle empty planned tasks crash
docs: add commit guidelines section
```

**Vì sao phải chuẩn?**
- Người đọc log hiểu ngay commit làm gì
- Tools auto (changelog, release) phân loại chính xác
- Review/triage nhanh, CI dựa trên `type` dễ cấu hình

**Resources**
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Angular Commit Guide](https://github.com/angular/angular/blob/main/CONTRIBUTING.md#commit)
- [Semantic Release](https://semantic-release.gitbook.io/semantic-release/)

