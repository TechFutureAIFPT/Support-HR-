# API Conventions

- Validate input before calling AI services.
- Return structured JSON errors.
- Keep server logs useful but avoid leaking secrets.
- Use `/api/*` endpoints for server-side proxy work.
- Keep client calls consistent with existing service wrappers.
