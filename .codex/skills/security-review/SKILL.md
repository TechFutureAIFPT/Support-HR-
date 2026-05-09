# Security Review

Use when a change touches auth, CV files, API keys, or external services.

Checklist:
- secrets stay server-side
- user data is not exposed unnecessarily
- inputs are validated
- errors do not leak sensitive details
- dependencies and API calls are justified
