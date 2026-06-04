# Rules: Environment & Secret Management

## ENV-001: .env Never Committed
**Condition:** Laravel project in version control
**Action:** Add `.env` to `.gitignore`; only commit `.env.example`
**Rationale:** Committed `.env` exposes production credentials to all users with repository access
**Consequences:** Violation leaks production secrets in version control history

## ENV-002: config:cache in Production
**Condition:** Production Laravel deployment
**Action:** Run `php artisan config:cache` as part of deployment
**Rationale:** Uncached config parses all files on every request, degrading performance
**Consequences:** Violation causes unnecessary performance overhead on each request

## ENV-003: Separate .env Per Environment
**Condition:** Multiple Laravel environments
**Action:** Maintain separate `.env` files for each environment
**Rationale:** Shared `.env` across environments causes accidental cross-environment operations
**Consequences:** Violation enables accidental staging-to-production credential crossover

## ENV-004: APP_KEY Rotation
**Condition:** Security incident or team member departure
**Action:** Rotate `APP_KEY` immediately
**Rationale:** APP_KEY encrypts cookies, session data, and encrypted database values
**Consequences:** Violation leaves encrypted data accessible to former team members

## ENV-005: Audit Secret Access
**Condition:** Production secrets in use
**Action:** Review secret access list quarterly
**Rationale:** Stale access accumulates; former team members retain secret access indefinitely
**Consequences:** Violation leaves former employees with access to production credentials
