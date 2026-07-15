# Support HR Frontend

Frontend hiện gọi trực tiếp Render backend cố định tại `https://backendsupporthr.onrender.com`.

## Cấu trúc chính

- `src/app/`: entrypoint, app shell, global styles
- `src/pages/`: page-level screens
- `src/features/`: feature modules
- `src/components/`: UI dùng chung và layout
- `src/services/`: auth, Render API client, screening, data-sync, Firebase và Google Drive
- `src/config/` và `src/types/`: cấu hình và type dùng chung
- `public/`: static assets

## Tài liệu liên quan

- [Bản đồ dự án](../../../Document/01-Tai-Lieu-Du-An/00-BAN-DO-DU-AN.md)
- [Frontend từ A-Z](../../../Document/01-Tai-Lieu-Du-An/05-frontend-fe-tu-a-z.md)
- [Ma trận truy vết tài liệu-code](../../../Document/01-Tai-Lieu-Du-An/11-MA-TRAN-TRUY-VET.md)

## Chạy local

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
npm run preview
```

## Ghi chú

- Frontend hiện không cần `.env` để biết API URL.
- Nếu đổi domain backend, sửa trực tiếp [renderClient.ts](src/services/api/renderClient.ts) và cập nhật tài liệu triển khai liên quan.
