# Đóng gói Support HR lên Microsoft Store

Support HR hiện là React/Vite web app có PWA manifest và service worker. Cách đóng gói gọn nhất để đưa lên Microsoft Store là tạo gói Windows PWA bằng PWABuilder, sau đó nộp qua Microsoft Partner Center.

## Trạng thái đã chuẩn bị trong repo

- `public/pwa/manifest.json` đã có tên ứng dụng, mô tả, icon, shortcut và `start_url` vào thẳng quy trình app: `/jd?source=pwa`.
- `public/service-worker.js` và `public/pwa/offline.html` đã có fallback offline.
- Icon hiện có: `public/icons/icon-192.png`, `public/icons/icon-256.png`, `public/icons/icon-512.png`.
- Build web dùng lệnh:

```bash
npm run build
```

## Thông tin cần có từ Microsoft Partner Center

Bạn cần tạo hoặc dùng tài khoản Microsoft Partner Center, reserve tên app, rồi lấy các thông tin sau:

- Package ID
- Publisher ID
- Publisher display name
- Store app name đã reserve
- URL production HTTPS của web app

Không nên dùng thông tin giả cho các trường này vì gói Store phải khớp với tài khoản phát hành.

## Quy trình tạo gói bằng PWABuilder

1. Deploy frontend lên domain HTTPS production.
2. Mở PWABuilder và nhập URL production.
3. Chọn nền tảng Windows.
4. Nhập đúng Package ID, Publisher ID và Publisher display name từ Partner Center.
5. Tải gói `.msixbundle` hoặc `.appxbundle` do PWABuilder tạo.
6. Test gói cài đặt trên Windows trước khi nộp Store.
7. Upload gói vào Microsoft Partner Center submission.

## Checklist trước khi submit Store

- Manifest không còn lỗi tiếng Việt hoặc mô tả sai.
- App mở trực tiếp vào quy trình chức năng, không mở landing page.
- Trang offline có giao diện sáng, đúng nhận diện Support HR.
- Tất cả icon hiển thị rõ ở Start Menu/taskbar.
- Backend production hoạt động ổn định qua HTTPS.
- Các route chính trả `200`: `/jd`, `/weights`, `/analysis`, `/dashboard`, `/records`, `/jd-standardizer`.
- Chính sách quyền riêng tư và điều khoản có URL công khai.

## Ghi chú quan trọng

Nếu muốn app có tính năng native sâu hơn như tự động cập nhật riêng, file system nâng cao hoặc chạy nền, lúc đó mới nên cân nhắc Electron/Tauri. Với nhu cầu lên Microsoft Store hiện tại, PWA package nhẹ hơn, ít rủi ro hơn và phù hợp với kiến trúc web đang có.
