# Eventify

Eventify is a MERN event management and ticket booking platform. This repository currently contains the Phase 1 foundation: a modular Express API, MongoDB models, JWT authentication plumbing, and a Vite React client shell.

## Project structure

```text
eventify/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── layouts/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── utils/
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.example
│   └── package.json
└── package.json
```

## Phase 1 setup (Windows)

1. Install Node.js 20 or newer and MongoDB locally, or create a MongoDB Atlas database.
2. Open a terminal in the project root and run:

   ```powershell
   npm install
   npm run install:all
   ```

3. Copy `backend\.env.example` to `backend\.env` and set `MONGODB_URI` and a long random `JWT_SECRET`.
4. Copy `frontend\.env.example` to `frontend\.env`.
5. Create the first administrator account. This is the only supported way to create an admin:

   ```powershell
   npm run seed:admin --prefix backend -- "Eventify Admin" admin@example.com "use-a-strong-password"
   ```

6. Start both applications:

   ```powershell
   npm run dev
   ```

The API health check is available at `http://localhost:5000/api/health`; the frontend runs at `http://localhost:5173`.

### Manual UPI payments

Paid bookings use the organization's GPay/UPI QR code. Add these values to `backend\.env`:

```env
ORGANIZATION_UPI_ID=your-organization@upi
ORGANIZATION_UPI_QR_URL=https://your-host.example/organization-gpay-qr.png
```

The attendee scans the QR code, pays the displayed amount, and submits the UPI transaction ID. An administrator verifies the transaction in **Admin → Bookings** and selects **Confirm payment**. Restart the backend after changing `.env`.

The API fails fast when MongoDB cannot be reached. No real credentials belong in this repository.

Use `/login` for attendees and `/admin/login` for administrators. The administrator account must be created with the backend seed command; a normal account created through `/register` cannot access the admin workspace.

The public `/register` page creates attendee accounts only. Admin accounts must be created or reset with the backend seed command below; public admin registration is intentionally disabled.


### Adding an event as an administrator

1. Open `http://localhost:5173/admin/login`.
2. Sign in with the account created by `npm run seed:admin`.
3. Complete the **Create event** form:
   - Event title and description
   - Category, venue, address, and city
   - Optional poster image URL
   - Event start and end date/time
   - Ticket sales start and end date/time
   - Total capacity
   - Ticket name, price, quantity, and per-user limit
4. Select **Publish event**.
5. The event becomes available at `http://localhost:5173/events` when its start date is upcoming and its sales window is active.

The backend validates all event details again. Ticket quantity must cover total capacity, the end date must be after the start date, and the sales window must be valid.

### Troubleshooting startup

Run commands from `D:\SPM-PROJECT`, not from inside `frontend` or `backend`:

```powershell
npm run dev
```

Do not run `node server.js` from the project root. The backend entry point is `backend\src\server.js`, and the supported backend command is:

```powershell
npm run dev:backend
```

If the API reports `MONGODB_URI is not configured`, create `backend\.env` from `backend\.env.example`, configure the MongoDB connection string and `JWT_SECRET`, then restart the backend. The frontend can still be started independently with `npm run dev:frontend`.

## Current checkpoint

Phase 1 provides:

- Express server with controlled CORS, Helmet, rate limiting, JSON error responses, and a database health check.
- Mongoose `User`, `Event`, and `Booking` models with indexes and validation.
- Register, login, logout, and current-user endpoints using bcrypt password hashing and JWT bearer tokens.
- React routing shell, authentication context, API client, and responsive landing page.
- Separate attendee and administrator login flows, protected admin event workspace, ticket booking, cancellation, and booking history.

The next phase will add protected event management and discovery flows.
