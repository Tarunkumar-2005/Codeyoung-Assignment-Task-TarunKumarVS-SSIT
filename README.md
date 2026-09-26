# Codeyoung Trial-Class Appointment Booking System

A full-stack trial-class appointment booking platform engineered to coordinate parents across US and UK time zones with mentor educators in India (`Asia/Kolkata`), with precise Daylight Saving Time (DST) handling, automated mentor assignment, and mentor daily quota enforcement (max 2 demos/day).

---

## 🏗️ Architecture & Tech Stack

- **Frontend:** React, Vite, Tailwind CSS, Axios, React Router, Luxon
- **Backend:** Node.js, Express.js (Layered Architecture: routes, controllers, services, repositories, models, middleware, utils)
- **Database:** MongoDB & Mongoose with compound unique indexes for race condition prevention
- **Timezone Engine:** Luxon with canonical IANA timezone identifiers

---

## 📁 Repository Structure

```
codeyoung-trial-booking/
├── backend/
│   ├── src/
│   │   ├── config/          # Environment & MongoDB connection
│   │   ├── controllers/     # HTTP transport controllers
│   │   ├── middleware/      # Error handlers, rate limiters
│   │   ├── models/          # Mongoose schemas
│   │   ├── repositories/    # Data access layer
│   │   ├── routes/          # Express route definitions
│   │   ├── services/        # Domain business logic & timezone engine
│   │   ├── utils/           # Timezone & link helpers
│   │   ├── app.js           # Express app factory
│   │   └── server.js        # Server listener
│   ├── .env.example         # Backend environment template
│   ├── package.json
│   └── .gitignore
│
└── frontend/
    ├── src/
    │   ├── assets/          # Static assets & icons
    │   ├── components/      # UI components (booking, mentor, timezone)
    │   ├── services/        # Axios API client
    │   ├── App.jsx          # React Router & shell
    │   ├── main.jsx         # React DOM root
    │   └── index.css        # Tailwind CSS directives
    ├── .env.example         # Frontend environment template
    ├── tailwind.config.js   # Tailwind theme configuration
    ├── vite.config.js       # Vite bundler configuration
    ├── package.json
    └── .gitignore
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally on `mongodb://127.0.0.1:27017/codeyoung_booking` (or remote MongoDB Atlas URI)

---

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the backend development server:
   ```bash
   npm run dev
   # or
   npm start
   ```
   *The API will be available at:* `http://localhost:5000`  
   *Health check:* `http://localhost:5000/api/health`

---

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   ```bash
   cp .env.example .env
   ```

4. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *The application will be available at:* `http://localhost:5173`
