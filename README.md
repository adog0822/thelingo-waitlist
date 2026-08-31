# TheLingo waitlist

A four-section Next.js landing page for TheLingo, a language learning e-sport built around blind judged matches, Elo rankings, avatar teaching, and interest-based micro-societies.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Waitlist behavior

The included route handler implements both launch states:

- Signups 1 through 9 receive a confirmation without a visible number.
- Signup 10 onward receives a queue position and moves up 10 places per successful referral.
- Every signup receives a deterministic referral code and a prefilled native share action.

Without environment variables, the route uses an in-memory preview store seeded at signup 8. This makes the two states easy to test locally: the first distinct email becomes signup 9 and the second becomes signup 10.

For durable production capture, create an Upstash Redis database and add:

```bash
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
WAITLIST_INITIAL_COUNT=0
```

The site remains in preview mode until those values are configured. Add bot protection and a transactional email provider before opening a high-volume public launch.

## Verification

```bash
npm run lint
npm run typecheck
npm run build
```
