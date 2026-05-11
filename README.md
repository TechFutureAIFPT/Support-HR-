# Support HR Frontend

Frontend hiện gọi trực tiếp Render backend cố định tại `https://backendsupporthr.onrender.com`.

## Cấu trúc chính

- `src/app/`: entrypoint, app shell, global styles
- `src/pages/`: page-level screens
- `src/features/`: feature modules
- `src/shared/`: UI dùng chung, layout, types, config
- `src/lib/services/`: auth, Render API client, screening, data-sync, Google Drive
- `public/`: static assets

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
- Nếu đổi domain backend, sửa trực tiếp [renderClient.ts](/D:/tin%20h%E1%BB%8Dc%20tr%E1%BA%BB%202026/website/main/src/lib/services/api/renderClient.ts).
