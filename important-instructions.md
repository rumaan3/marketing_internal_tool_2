# Important Instructions - Admin Panel Project

## Project Overview
MERN stack admin panel for client/project/staff tracking.

---

## Technology Stack

### Frontend
- React: ^19.0.0
- React Router: ^7.1.5
- TypeScript: ~5.7.2
- Tailwind CSS: ^4.0.8
- Vite: ^6.1.0

### Backend
- Node.js with Express ^4.18.2
- MongoDB with Mongoose ^8.0.0
- JWT for authentication (72-hour session expiry)
- bcryptjs for password hashing

---

## Guardrails - DO NOT

- ❌ Use Angular, Vue, or Next.js
- ❌ Create additional features beyond scope
- ❌ Modify template folder structure
- ❌ Implement user registration or signup
- ❌ Implement forgot/reset password flows
- ❌ Implement OTP, email verification, or social login
- ❌ Delete any records (only activate/deactivate)
- ❌ Introduce a second UI template
- ❌ Do UI/UX research or redesign

---

## User Roles & Permissions

| Role | Create Staff | Create Clients | Create Projects | Activate/Deactivate |
|------|-------------|----------------|-----------------|---------------------|
| Superuser | ✓ | ✓ | ✓ | ✓ |
| Admin | ✗ | ✓ | ✓ | ✓ |
| Staff | ✗ | ✓ | ✓ | ✗ |

---

## Pagination Logic
1. Initial load: 10 records
2. "Show more" button: loads up to 50 records
3. Page navigation for larger datasets
4. Must work fluidly on mobile

---

## Development Workflow
Module-by-module execution with GitHub push after each module completion.
