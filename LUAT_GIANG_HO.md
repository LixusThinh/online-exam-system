# 📜 BỘ LUẬT GIANG HỒ: ĐẠO ĐỨC NGHỀ CODE (SKY-EXAM)

Dự án này là tâm huyết, anh em code chung thì vui lòng đọc kỹ luật trước khi đụng vào bàn phím. Thằng nào vi phạm làm sập server, phạt bao chầu nhậu!

## ⛔ Điều 1: Bàn Thờ Tổ Tiên (`main`)
- **Luật:** Cấm tuyệt đối `git push` thẳng lên nhánh `main`.
- **Lý do:** Nhánh `main` chứa code chạy thật. Đẩy code rác lên làm sập là mang tội.

## 🔀 Điều 2: Đất ai nấy ở (Branching)
- **Luật:** Nhận việc gì thì tự tách nhánh ra mà làm.
- **Cách làm:** `git checkout -b <tên-nhánh>`
- **Chuẩn đặt tên:** - Thêm tính năng: `feat/ten-tinh-nang` (VD: `feat/login-ui`)
  - Sửa lỗi: `bugfix/ten-loi` (VD: `bugfix/fix-font`)
  - *Cấm đặt tên trẻ trâu kiểu `nhanh-cua-tao`, `test1`.*

## 🧹 Điều 3: Sáng ra phải "Quét nhà"
- **Luật:** Trước khi gõ code, BẮT BUỘC phải kéo code mới nhất về.
- **Cách làm:** `git pull origin main`

## 📦 Điều 4: Gói hàng phải dán nhãn (Commit)
- **Luật:** Code xong logic nào là phải commit ngay. Lời nhắn phải rõ ràng.
- **Chuẩn:** `git commit -m "Thêm API đăng nhập JWT"`
- **Cấm:** Cấm dùng mấy cái lời nhắn vô học như: `update`, `fix`, `asdasd`.

## 🤝 Điều 5: Chốt đơn qua cò mồi (Pull Request)
- **Luật:** Đẩy nhánh lên mạng xong phải tạo **Pull Request (PR)**.
- **Quy trình:** Thằng code không được tự bấm duyệt. Phải gọi thằng kia vào review code, thấy code ngon, không có bug thì thằng kia mới được phép bấm `Merge pull request`.

## 🗑️ Điều 6: Dọn rác
- Nhánh nào đã merge xong vào `main` thì xóa đi cho sạch kho.