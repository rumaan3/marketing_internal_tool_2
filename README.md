# Marketing Internal Tool 2 - Admin Panel

A comprehensive MERN stack admin panel designed for managing clients, projects, staff, social media content, and calendars.

## 🚀 Features

*   **Role-Based Access Control (RBAC)**:
    *   **Superuser**: Full access (Create Staff, Clients, Projects, Activate/Deactivate).
    *   **Admin**: Manage Clients, Projects, and Activation status.
    *   **Staff**: Create Clients and Projects only.
*   **Client & Project Management**: Track client details and associated projects.
*   **Social Media Management**: Plan and organzie social media content with platform specifics and image uploads.
*   **Calendar**: Visual schedule for project deadlines and social media posts.
*   **Secure Authentication**: JWT-based auth with auto-logout after 72 hours.
*   **Responsive Design**: Mobile-friendly UI with modern styling (Tailwind CSS).

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 19
- **Build Tool**: Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Routing**: React Router 7

### Backend
- **Runtime**: Node.js
- **Framework**: Express
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT & bcryptjs
- **File Handling**: Multer (Local storage)

## 📦 Installation & Setup

### Prerequisites
- Node.js (v18+)
- MongoDB (running locally or Atlas URI)

### 1. Clone the repository
```bash
git clone <repository-url>
cd marketing_tool_2
```

### 2. Backend Setup
Navigate to the server directory and install dependencies:
```bash
cd server
npm install
```

Create a `.env` file in the `server` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/marketing_tool_2
JWT_SECRET=your_super_secret_key
JWT_EXPIRE=72h
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the client directory, and install dependencies:
```bash
cd client
npm install
```

Start the frontend development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5173`.

## 🛡️ User Roles & Permissions Matrix

| Role | Create Staff | Create Clients | Create Projects | Activate/Deactivate |
|------|-------------|----------------|-----------------|---------------------|
| Superuser | ✓ | ✓ | ✓ | ✓ |
| Admin | ✗ | ✓ | ✓ | ✓ |
| Staff | ✗ | ✓ | ✓ | ✗ |


