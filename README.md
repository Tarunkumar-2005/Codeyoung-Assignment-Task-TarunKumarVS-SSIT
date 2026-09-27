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

4. Seed the 10 demo mentors:
   ```bash
   npm run seed
   ```

5. Start the backend development server:
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

---

## 🧪 Automated Testing Suite

The project includes an end-to-end and unit testing suite covering **all 17 functional & resilience requirements**:

1. **Normal booking:** Validates end-to-end appointment creation with dual projections and meeting link.
2. **Invalid email:** Rejects malformed email inputs with `400 INVALID_EMAIL`.
3. **Invalid timezone:** Rejects non-IANA timezones with `400 INVALID_TIMEZONE`.
4. **Past appointment:** Rejects appointment timestamps in the past with `400 PAST_APPOINTMENT_TIME`.
5. **Mentor working hours:** Evaluates mentor working hours strictly within `Asia/Kolkata`.
6. **Mentor already booked:** Detects direct and partial UTC schedule overlaps.
7. **Mentor reaches 2 classes/day:** Enforces daily demo cap strictly on the mentor's IST calendar date.
8. **Multiple mentors available:** Load balances and prioritizes the least loaded mentor.
9. **No mentors available:** Returns `409 NO_MENTOR_AVAILABLE` with same-day alternative slot recommendations.
10. **Parent in America/New_York:** Handles EDT (UTC-4) and EST (UTC-5) conversions.
11. **Parent in Europe/London:** Handles BST (UTC+1) and GMT (UTC+0) conversions.
12. **Mentor in Asia/Kolkata:** Handles midnight boundary drift where parent evening is mentor next-day morning.
13. **DST transition dates:** Accurate conversions across US & UK spring/fall clock changes.
14. **Same-time concurrent bookings:** Compound unique database index and atomic retry candidate loop.
15. **Meeting link generation:** Secure UUID-based room links without PII leakage (`https://demo.codeyoung.local/class/<uuid>`).
16. **API validation:** HTTP-level payload validation, NoSQL injection stripping, and malformed ID handling.
17. **Slot generation:** Dynamic 45-minute daytime slot availability matrix with capacity badges.

### Running the Tests

```bash
cd backend
npm test
```
*(All 51 unit, integration, concurrency, and timezone tests run against Node's built-in test runner).*

---

## 🔒 Concurrency & Double-Booking Strategy

When multiple parents submit booking requests for the same time slot at the exact same millisecond, the system prevents double-booking through a two-tier mechanism:

1. **Database-Level Compound Unique Index:**
   ```javascript
   BookingSchema.index(
     { mentorId: 1, startTimeUTC: 1 },
     { unique: true, partialFilterExpression: { status: 'CONFIRMED' } }
   );
   ```
   This guarantees that MongoDB will reject duplicate write attempts on `{ mentorId, startTimeUTC }` with error code `11000`.

2. **Candidate Fallback Allocation Loop:**
   If a mentor candidate suffers an atomic `11000` write conflict due to a simultaneous competing request, the booking service automatically catches the collision and allocates the next available candidate mentor in the fleet rather than failing the parent's booking request.

---

## 📌 Known Limitations & Trade-Offs

- **No Multi-Document Distributed Transactions:** Multi-document ACID transactions in MongoDB require a replica set topology. The standalone database index + fallback loop approach was chosen to ensure zero external replica-set configuration requirements during local evaluation while guaranteeing single-mentor uniqueness.
- **In-Memory Candidate Evaluation:** Daily quotas and availability are evaluated against MongoDB indexed queries. For ultra-high scale (10,000+ bookings/sec), a distributed Redis lock or distributed queue would be the next evolutionary step.
- **Dummy Video Provider:** Meeting links use `https://demo.codeyoung.local/class/<uuid>` without integrating external Zoom/Daily.co APIs, matching assignment requirements.

