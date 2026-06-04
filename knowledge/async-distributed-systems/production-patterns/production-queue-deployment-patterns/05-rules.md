# Rule Card: K080 — Production Queue Deployment Patterns

---

## Rule 1

**Rule Name:** always-terminate-horizon-on-deploy

**Category:** Always

**Rule:** Always run `php artisan horizon:terminate` during every deployment.

**Reason:** Workers continue running old code until restarted — without termination, the deploy has no effect on queue processing.

**Bad Example:**
```bash
# Deploy script — no horizon restart
git pull
composer install --no-dev
```

**Good Example:**
```bash
git pull
composer install --no-dev
php artisan horizon:terminate  # Graceful restart — workers finish current job
```

**Exceptions:** Zero-downtime deployments where old workers complete before new workers start.

**Consequences Of ViolATION:** A critical bug fix is deployed for `ProcessOrder` — but all existing workers run the old code. Orders continue processing with the buggy logic for hours until a manual restart.

---

## Rule 2

**Rule Name:** test-queue-jobs-in-staging

**Category:** Always

**Rule:** Always test queue job execution in a staging environment before production.

**Reason:** Queue jobs have different runtime context (no request, different environment variables, different PHP config).

**Bad Example:**
```php
// Changed queue job logic — tested via HTTP only, not actual job execution
// Job uses an env variable only set in web SAPI → null in CLI
```

**Good Example:**
```bash
# Staging: dispatch and verify
php artisan tinker
>>> ProcessOrder::dispatch($testOrder);
# Check horizon dashboard or logs for successful processing
```

**Exceptions:** Trivial job changes (log message, comment) that don't affect execution.

**Consequences Of ViolATION:** A merge request changes the `ProcessOrder` job to use `$_ENV['SECRET_KEY']` — the variable is available in web context but not in CLI via `php artisan queue:work`. All production orders fail with `Undefined array key SECRET_KEY`.

---

## Rule 3

**Rule Name:** use-canary-deploy-for-destructive-jobs

**Category:** Prefer

**Rule:** Prefer canary deployments for destructive job changes.

**Reason:** A buggy job can corrupt data at scale — limit blast radius to one server first.

**Bad Example:**
```php
// Deploy changed CancelSubscription job to ALL workers at once
// Job has a bug — cancels wrong subscriptions for 10,000 users in 2 minutes
```

**Good Example:**
```php
// Canary: terminate Horizon on one server only
ssh server-a "php artisan horizon:terminate"  // Server A runs new code
// Monitor for 10 minutes — if no issues, terminate remaining servers
```

**Exceptions:** Emergency fixes for critical production issues.

**Consequences Of ViolATION:** A bug in `CancelSubscription` causes it to cancel the user after instead of the subscription. Within 3 minutes, all 50 workers process 1500 jobs — 1500 users lose access to their accounts before the deploy is rolled back.

---

## Rule 4

**Rule Name:** monitor-failed-jobs-after-deploy

**Category:** Always

**Rule:** Always monitor the failed jobs count intensively for 30 minutes after each deploy.

**Reason:** Most queue-related bugs manifest as job failures within the first 30 minutes after deployment.

**Bad Example:**
```php
// No post-deploy monitoring — "deploy looks fine from HTTP side"
```

**Good Example:**
```php
// Post-deploy checklist:
// 1. Check Pulse for slow jobs spike
// 2. Check Horizon for failed jobs
// 3. Check failed_jobs table for new entries
// 4. Verify a test job processes successfully
```

**Exceptions:** Trivial infrastructure-only changes.

**Consequences Of ViolATION:** A schema migration renames a column — all `ProcessOrder` jobs fail with `Column not found`. The deploy website works fine (no HTTP endpoints affected), but orders silently stop processing. By the time anyone notices, 3,000 orders are stuck.
