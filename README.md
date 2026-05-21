
# TripMatch

Frontend application for a travel marketplace platform connecting travelers and travel agencies, with an admin area.

## Features

### 1) Authentication and roles
- Login/Register against backend APIs.
- Supported roles: `traveler`, `agency`, `admin`.
- Protected routes and automatic role-based dashboard redirects.

![Login](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092328.png)
![Register](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092345.png)

### 2) Role-based dashboards
- Traveler: trip summary, recent offers, CTA for new trip creation.
- Agency: active marketplace requests, sent/accepted offers, revenue summary.
- Admin: overview of users/agencies/admins and pending approvals.

![Traveler Dashboard](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092459.png)
![Agency Dashboard](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092739.png)
![Admin Overview](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092427.png)

### 3) Trip management (traveler)
- Manual trip creation.
- AI draft generation (`/api/trips/ai/generate`), day regeneration, save draft as trip.
- Trips list with filtering/search/status.

![My Trips](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092601.png)
![Trip Creation - AI Generator](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092613.png)

### 4) Trip Planner
- Destination management (create/update/delete).
- Activity management per destination (create/update/delete/duplicate).
- Drag-and-drop activity reordering.
- Save plan and navigate to budget/publish flows.

![Trip Planner](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092650.png)

### 5) Budget Planner
- Total budget + currency.
- Category allocations (`ACCOMMODATION`, `TRANSPORT`, `FOOD`, `ACTIVITIES`).
- Charts for allocated vs spent (pie + bar).

![Budget access from planner](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092650.png)

### 6) Marketplace request publishing
- Publish travel request from a trip (`publishTravelRequest`).
- Visibility controls for shared data.
- Own requests list + unpublish support.

![Publish Request](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092711.png)

### 7) Marketplace and offers
- Agency: browse published requests, filter them, create offers.
- Multi-step offer flow: price, accommodation, transport, itinerary, review.
- Traveler: accept/reject offer (with feedback on reject).

![Marketplace](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092746.png)
![Create Offer](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092800.png)
![Offer Details](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092829.png)
![Offers Inbox (Traveler)](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092623.png)

### 8) Notifications
- Automatic polling (~10 seconds) for unread count.
- Mark as read / mark all read.
- Notifications grouped by Today / Yesterday / Earlier.

![Notifications](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092629.png)

### 9) Profile and administration
- Profile: refresh from backend + update editable fields.
- Admin panel: account list, block/unblock, single/bulk agency approval.

![Admin Overview](tripmatch_frontend/docs/screenshots/Screenshot%202026-05-21%20092427.png)

```md
![Trip Planner](docs/screenshots/trip-planner.png)
```

Optional, if you want size control:

```html
<img src="docs/screenshots/trip-planner.png" alt="Trip Planner" width="900" />
```

## Tech stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Radix UI + local UI components
- Lucide icons
- Recharts (charts)

## Local run

```bash
npm install
npm run dev
```

## Environment variables

Copy `.env.example` to `.env` and set:

- `VITE_API_BASE_URL` (example: `http://localhost:8080`)
- `VITE_LOGIN_PATH` (default: `/api/auth/login`)
- `VITE_REGISTER_PATH` (default: `/api/auth/register`)

## Backend integration notes

- Authentication uses Basic Auth (`Authorization: Basic ...`), not JWT.
- After register, the user is redirected to login.
- `accountId` is read from the login response and used for profile/admin calls.
  
