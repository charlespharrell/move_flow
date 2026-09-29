# AGENTS.md

## Stack
- Vite 8 + React 19 (JS/JSX, `type: module`) + React Router 7 + Tailwind CSS 4 via `@tailwindcss/vite`. No TypeScript, no tests, no CI workflows.

## Commands
- `npm install` — first-time setup.
- `npm run dev` — start Vite dev server (default `http://localhost:5173`).
- `npm run build` — production build to `dist/`.
- `npm run preview` — serve built `dist/`.
- `npm run lint` — `eslint .` using flat config in `eslint.config.js` (ignores `dist/`). No typecheck or formatter configured.

## Architecture
- Entrypoint: `index.html` → `src/main.jsx` → `src/App.jsx` (lazy `Dashboard`, `Shipments`, `ShipmentDetails`, `Customers`, `CustomerDetails`, `Drivers`, `DriverDetails`, `Payments`, `PaymentDetails`, `Users`, `UserDetails`, `Settings`, `Login`, `Unauthorized`, `NotFound` with `Suspense` + `ErrorBoundary` + `ToastProvider`).
- Routing: `BrowserRouter` + public `/login` (`PublicRoute` redirects if authenticated) + protected `DashboardLayout` wrapped in `ProtectedRoute` (checks `isAuthenticated` → `/login`, then role via `rolePermissions` → `/unauthorized`). Child routes `/`, `/shipments`, `/shipments/:id`, `/customers`, `/customers/:customerId`, `/drivers`, `/drivers/:driverId`, `/payments`, `/payments/:paymentId`, `/users`, `/users/:userId`, `/settings`, `/unauthorized`, `*` → `NotFound`. Preserve `min-w-0` on main.
- Layout: `src/components/Sidebar.jsx:3` (`navGroups` Overview/Operations/Network/Finance/System) with `FilteredNav` role-filtered via `rolePermissions` + `MobileSidebar` drawer (`aria-expanded`); `DashboardLayout` shows current user + role + Log out (toast) in top bar. Use `authService` (`moveflow_auth` + `moveflow_current_user_id`); default `USR-001` Administrator but requires login (`isAuthenticated: false` when no session).
- Pages: `Dashboard.jsx` (5 derived stat cards + status distribution + revenue trend + shipment activity — all derived from `shipments`/`payments`), `Shipments.jsx`/`Customers.jsx`/`Drivers.jsx`/`Payments.jsx`/`Users.jsx` (8/page, search+filter+pagination), details pages (derived stats + history), `Settings.jsx` (tabs Profile/Organization/Notifications/Security), `Login.jsx` (email/password=`password`, remember, demo accounts listed), `Unauthorized.jsx`.
- Data: `shipments.js` (24), `customers.js` (17), `drivers.js` (15), `payments.js` (22 `PAY-001..022`), `users.js` (12 `USR-001..012`), `activity.js`. IDs aligned.
- Services: `shipmentService.js` (stats/timeline), `customerService.js`/`driverService.js`/`userService.js` (localStorage + `subscribe` + add/update), `paymentService.js` (read-only derived), `authService.js` (`isAuthenticated`, `login`/`logout`, `getCurrentUser`, `subscribe`, keys `moveflow_auth`/`moveflow_current_user_id`), `settingsService.js` (`getProfile`/`saveProfile`, `getOrganization`, `getNotifications`). All `moveflow_*` with JSON try/catch fallback.
- Utils: `src/utils/format.js` (NGN/en-GB), `src/utils/validation.js` (`isEmail`, `isPhone`, `validateCustomer`/`validateDriver`/`validateProfile`/`validateOrganization`). Use consistently.
- UI primitives: `src/components/ui/` — `Button.jsx`, `Card.jsx`, `Input.jsx` (`Input`/`Select`/`SearchInput`), `Pagination.jsx`, `States.jsx` (`EmptyState`/`LoadingState`/`ErrorState`), `Modal.jsx` (Escape + backdrop), `Toast.jsx` (`ToastProvider`/`useToast`). Shared: `PageHeader.jsx`, `StatCard.jsx`, `StatusBadge.jsx` (dot+border), `DetailRow.jsx`, `RecentShipments.jsx`, `ProtectedRoute.jsx`, `ErrorBoundary.jsx` (class). All dark theme.
- Styling: dark-first — `bg-zinc-950`/`bg-zinc-900`/`border-zinc-800`, `zinc-50`/`zinc-400`, `blue-600`. No `tailwind.config.js`; `vite.config.js:7` plugins `[react(),tailwindcss()]`. `src/index.css:1` imports tailwind + `color-scheme: dark` + scrollbar.
- `src/hooks/` reserved; `src/data/dashboardData.js` legacy unused; `src/App.css` legacy unused.

## Conventions & Gotchas
- Files `.js`/`.jsx` only; ESLint `**/*.{js,jsx}` `globals.browser` (`eslint.config.js:10`). Keep JSX in `.jsx`.
- Path alias: none — relative imports.
- All list pages: case-insensitive search (fields per AGENTS spec), `All` filters, pagination resets in `handleSearchChange`/`handleStatusChange` (no `useEffect` setState), 8/page, `EmptyState` with clear action. Keep table `overflow-x-auto` + `min-w-[860px]` (Customers `980px`, Drivers `1040px`) inside `rounded-xl border`.
- Statuses: Shipment `Pending`/`Assigned`/`In Transit`/`Delivered`/`Cancelled`; Payment `Pending`/`Paid`/`Failed`/`Refunded`; User roles `Administrator`/`Operations`/`Finance`; badges via `StatusBadge.jsx:3` dot+border.
- Role permissions centrally in `userService.js:72` `rolePermissions`; `authService` `isAuthenticated` gates all routes; `ProtectedRoute.jsx:4` maps path prefix to label; `Sidebar` filters via `FilteredNav`. Operations sees Dashboard/Shipments/Customers/Drivers/Settings, Finance sees Dashboard/Payments/Settings, Administrator all.
- Forms use `validation.js` helpers; show inline `text-red-400` errors; `useToast` for success feedback (customer/driver/user/settings/login/logout). `CustomerForm`/`DriverForm` prefill via `useEffect` disabled lint.
- LocalStorage: guard `typeof window`, try/catch JSON parse, fallback to seed, `subscribe` to force re-render on `addCustomer`/`updateCustomer` etc. Keys `moveflow_customers`/`moveflow_drivers`/`moveflow_users`/`moveflow_auth`/`moveflow_settings_*`.
- Dashboard analytics derived: `paymentStats.totalRevenue` (paid), revenueBuckets/payment month totals, activityBuckets shipment counts — no hardcoded numbers.
- Verify with `npm run lint` and `npm run build`.
