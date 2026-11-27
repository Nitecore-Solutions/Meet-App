# PagalPagal

A playful dating app built with Expo and React Native, with a standalone
TypeScript backend. PagalPagal recreates the flow of a modern Indian dating app
— discovery, likes, chat, profile building, settings, safety tools, and a Plus
membership.

> The **mobile app is still a UI prototype driven by mock data** (any login,
> simulated OTP and payments). The **backend is implemented and tested** with
> real email/password auth, but the two are not wired together yet — see
> [Backend](#backend).

## Tech stack

- **Mobile:** Expo SDK 57 · React Native 0.86 · React 19 · TypeScript · React
  Navigation 7 · AsyncStorage · lucide-react-native · Expo web support
- **Backend:** TypeScript · Express 5 · raw `ws` WebSockets · PostgreSQL
  installed on the server · local-disk media storage · Brevo email delivery ·
  scrypt password hashing · JWT access + hashed refresh tokens · Razorpay REST
  & HMAC verification

## Run it

From the repository root:

```bash
npm --prefix mobile install    # first time only
npm run web                    # Expo web preview
npm start                      # Expo dev server (scan with Expo Go)
npm run android                # Android emulator / device
npm run ios                    # iOS simulator (macOS)
npm run typecheck              # mobile TypeScript validation

npm run backend                # start the API + WebSocket server (:4000)
npm run backend:typecheck      # backend TypeScript validation
npm run backend:build          # compile the backend to backend/dist
npm run backend:smoke          # end-to-end backend integration test
```

The mobile project lives in `mobile/`; run `npm` scripts from the root so the
prefix is handled for you. The web preview normally opens at
`http://localhost:8081`.

## Demo access

Everything is intentionally frictionless:

- **Login:** any email or phone number and any password works.
- **OTP:** any 6 digits are accepted.
- **Facebook login:** a one-tap demo shortcut on the login screen.
- **Plus checkout:** choose a plan, pick UPI or card, and pay with the demo
  button. The purchase is simulated, activates Plus locally, and adds a mock
  order to the orders screen.

State is stored under the `@pagalpagal/*` keys in AsyncStorage. To reset the
demo on web, clear the site's local storage and reload; on a device, clear the
app's storage or reinstall it.

## What's included

### Discovery and connections

- **Matches** — swipe-style card deck with like, pass, super-like style actions,
  filters, profile details, report and block sheets.
- **Online** — members active now.
- **Likes You** — received likes with a Plus upsell.
- **Visitors** — profile visitors with a Plus upsell.
- **Messages** — inbox with unread badges and fresh relative timestamps.
- **Chat** — message thread with seeded conversation history, sending,
  timestamp grouping, profile access and report/block actions.

### Profile and preferences

- My Profile with strength meter, Plus upsell, matchmaker card, and progress
  prompts.
- Edit profile, basic info, photos, About Me, verification, and preference
  pickers.
- Profile detail view with photo pager and report/block flows.
- Match preferences and city search.

### Settings, Plus and safety

- Account settings, liked/skipped/blocked profile lists, distance units, social
  links, Help & Support with FAQ and contact form.
- Legal & Safety Centre (safety, terms, privacy, conduct).
- Orders/receipts and a complete simulated Plus flow: plan selection, payment
  method, processing state, success screen, and persisted membership.
- Notifications are intentionally omitted; only in-app count badges are shown.

## Project layout

```
Meet-app/
├─ package.json                 # root convenience scripts (mobile + backend)
├─ mobile/
│  ├─ App.tsx                   # providers + navigation container
│  ├─ app.config.ts             # Expo app configuration
│  ├─ assets/                   # app icons and demo portraits
│  └─ src/
│     ├─ components/            # shared UI kit (buttons, forms, cards, dialogs)
│     ├─ constants/             # theme, app config, plans/catalog
│     ├─ context/               # Auth, Dating (likes/chats/visitors), Toast
│     ├─ data/                  # mock profiles, chats, couples, image map
│     ├─ navigation/            # auth stack, app stack, tabs, route types
│     ├─ screens/               # auth, main, profile, premium, settings
│     ├─ types/                 # shared domain types
│     └─ utils/                 # formatting helpers
└─ backend/
   ├─ src/                      # Express app, routes, services, WS hub, DB layer
   ├─ scripts/                  # smoke test + PostgreSQL setup/deploy scripts
   ├─ ecosystem.config.cjs      # PM2 process definition
   ├─ .env.example              # all configuration options
   └─ README.md                 # setup, API reference, deployment notes
```

## Backend

The backend is a standalone project in [`backend/`](backend/README.md). For
local development it needs no external services: an embedded PGlite database
(dev-only), local media storage, a console email provider that returns links as
`devToken`/`devLink`, and mock Razorpay checkout. On the VPS it uses **PostgreSQL
installed on that server** and stores all media on the server disk. There is no
Supabase, no R2/S3, and no seeded demo accounts or messages.

Key features:

- Email/password signup with Brevo verification, sign-in gating, resend and
  forgot/reset password; scrypt password hashing
- JWT access tokens + SHA-256 hashed, rotating refresh tokens
- Profiles, discovery filters, likes/passes/blocks and automatic mutual matching
- Real-time chat over raw WebSockets at `/ws`, with REST history fallback
- Local-disk media uploads, images and 60-second videos; videos expire and are
  deleted after 8 hours
- Razorpay one-time orders (1/6/12 months Plus), optional recurring plans,
  HMAC-verified callback and webhooks; mock checkout in development
- Idempotent PostgreSQL schema applied on startup, cleanup jobs and graceful shutdown

Start it with `npm run backend` and check `http://127.0.0.1:4000/health`.
`npm run backend:smoke` exercises the complete flow end to end. On the VPS,
`npm run db:setup` installs/configures PostgreSQL and `npm run deploy` builds and
starts the API with PM2.

The UI is structured so these APIs can replace the mock layer without rewriting
screens: `src/data/*` holds seed content, contexts own persisted state, and
screens call context actions. Set `EXPO_PUBLIC_API_BASE_URL` in `mobile/.env`
to switch the login/signup/OTP screens from preview mode to the real API; the
AuthContext then calls `/api/auth/*` and stores tokens. The remaining step is
to connect chat, media and billing screens to `/api/chats`, `/api/media` and
`/api/billing`.

## Notes

- Demo images are remote Unsplash assets bundled locally under
  `mobile/assets/profiles` for a stable offline-ish preview.
- The app is portrait-first and tuned for a 430 × 932 preview viewport; layouts
  remain responsive on other phone sizes.

# Meet-App
