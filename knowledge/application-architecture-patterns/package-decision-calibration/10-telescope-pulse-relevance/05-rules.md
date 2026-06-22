# Rules for Telescope & Pulse Relevance

## Telescope Must Never Run in Production
---
## Category
Security | Performance
---
## Rule
Laravel Telescope must be disabled in production environments. It records every request, query, mail, cache operation, job, and log entry — adding significant overhead to every request and storing sensitive data (request payloads, email bodies, query bindings) in the database.
---
## Reason
Telescope records full request payloads, email bodies, session data, and database query bindings. In production, this means: (a) sensitive customer data stored in Telescope tables, (b) 10-30ms+ overhead per request, (c) database growth of 100MB-1GB per day, and (d) an unauthenticated dashboard exposing all this data. Telescope is a debugging tool, not a monitoring tool. Running it in production is equivalent to running `dd()` on every request.
---
## Bad Example
```php
// Telescope enabled in all environments
class TelescopeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
        // Runs in production — records every request, query, and email
    }
}
```
---
## Good Example
```php
// Telescope disabled in production
class TelescopeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        if ($this->app->environment('production')) {
            return; // Telescope never boots in production
        }

        $this->app->register(\Laravel\Telescope\TelescopeServiceProvider::class);
        // Only runs in local and staging
    }
}
```
---
## Exceptions
Telescope may run in production temporarily for emergency debugging (e.g., diagnosing a critical production bug) if: (a) it's gated behind authentication, (b) data pruning is aggressive (1-hour retention), and (c) it's disabled immediately after debugging. Never run Telescope continuously in production.
---
## Consequences Of Violation
Customer PII stored in Telescope tables. Database filled within days. Request latency increased by 10-30ms for every user. Telescope dashboard potentially publicly accessible. This is a data breach and performance incident combined.

## Pulse + Sentry/Datadog — Not Pulse Instead of Sentry/Datadog
---
## Category
Observability | Architecture
---
## Rule
Laravel Pulse is complementary to exception tracking (Sentry, Bugsnag) and APM (Datadog, New Relic) — it does not replace them. Pulse shows aggregate trends ("exception count spiked"); Sentry shows the exact stack traces, affected users, and release correlation needed to investigate.
---
## Reason
Pulse's aggregate view is the canary — it tells you something is wrong. But when something IS wrong, you need Sentry to see the stack traces, affected users, and release that introduced the bug. You need Datadog to see which database host is the bottleneck. Pulse alone gives you awareness without investigation capability. Conversely, Pulse is lighter-weight and Laravel-native, making it a better first line of defense than setting up full APM from day one.
---
## Bad Example
```php
// Pulse deployed as the only monitoring tool
"We have Pulse, so we have production monitoring covered."
// No Sentry, no Datadog.
// When exceptions spike, the team sees the count but cannot investigate.
```
---
## Good Example
```php
// Pulse + Sentry: layered observability
// Pulse: immediate awareness ("slow queries up 40% after deploy")
// Sentry: investigation ("stack trace shows N+1 in the new reporting feature")
// Datadog: root cause ("database read replica is at 95% CPU")

// Pulse is the dashboard you check proactively.
// Sentry is the alert that wakes you up at 2am.
// Datadog is the tool you use to find WHY Sentry woke you up.
```
---
## Exceptions
Very small projects with a single developer may rely on Pulse alone during early development. Add Sentry when the application has paying customers who will notice downtime.
---
## Consequences Of Violation
Alert fatigue without investigation capability. Team knows "exceptions are up" but cannot identify which exceptions, which users, or which release. Mean time to resolution (MTTR) increases because investigation starts from scratch for every incident.

## Configure Telescope Pruning Aggressively
---
## Category
Maintainability | Performance
---
## Rule
Telescope data pruning must be enabled and configured with a short retention period: 1 hour for local development, 24-48 hours for staging environments. Without pruning, Telescope tables grow unbounded — 100MB-1GB per day in active development environments.
---
## Reason
Telescope records 60+ entries per request (queries, cache operations, mail, logs). In an active development session, this accumulates rapidly. Unpruned Telescope tables will fill the development database disk within days. Aggressive pruning keeps Telescope useful without the overhead of managing its data growth.
---
## Bad Example
```php
// Telescope without pruning
TELESCOPE_DATA_PRUNE_ENABLED=false
// One week later: database disk full, 7GB of Telescope data
```
---
## Good Example
```php
// config/telescope.php
'enabled' => env('TELESCOPE_ENABLED', true),
'storage' => [
    'database' => [
        'connection' => env('DB_CONNECTION', 'mysql'),
    ],
],
'prune' => [
    'enabled' => env('TELESCOPE_DATA_PRUNE_ENABLED', true),
    'hours' => env('TELESCOPE_DATA_PRUNE_HOURS', 24), // Staging: 24h retention
],

// .env (local)
TELESCOPE_DATA_PRUNE_ENABLED=true
TELESCOPE_DATA_PRUNE_HOURS=1  // Local: 1h retention

// .env (staging)
TELESCOPE_DATA_PRUNE_ENABLED=true
TELESCOPE_DATA_PRUNE_HOURS=48 // Staging: 48h retention
```
---
## Exceptions
If Telescope is used for debugging a specific issue and data needs to be retained for longer analysis, temporarily extend the pruning window. Restore the short window after debugging is complete.
---
## Consequences Of Violation
Development database disk full. Telescope data dwarfs application data. CI environment disk exhaustion from accumulated Telescope records across test runs.

## Start Pulse with 3-4 Cards — Add More Only When the Team Acts on Them
---
## Category
Observability | Maintainability
---
## Rule
When configuring Pulse in production, start with 3-4 cards: slow queries, slow jobs, exception counts, and cache hit rates. Add more cards only when the team consistently acts on a new metric. A dashboard with 20 cards is noise; a dashboard with 4 actionable cards is signal.
---
## Reason
Dashboard clutter buries important signals. If the team sees 20 metrics on the Pulse dashboard, they learn to ignore all of them. When slow queries spike, nobody notices because it's one of 20 metrics, all moving independently. Starting with the four most actionable metrics and expanding only when the team builds a habit of responding to a new metric keeps the dashboard focused.
---
## Bad Example
```php
// Every recorder enabled — 15+ cards on the dashboard
'recorders' => [
    Pulse\Recorders\SlowQueries::class => ['threshold' => 100],
    Pulse\Recorders\SlowJobs::class => ['threshold' => 500],
    Pulse\Recorders\Exceptions::class,
    Pulse\Recorders\Server::class,
    Pulse\Recorders\SlowOutgoingRequests::class => ['threshold' => 200],
    Pulse\Recorders\PeriodicCallback::class,
    Pulse\Recorders\CacheInteractions::class,
    Pulse\Recorders\UserRequests::class,
    Pulse\Recorders\Queues::class,  // Separate from SlowJobs — adds more cards
],
// Dashboard has 15+ cards. Nobody knows which to pay attention to.
```
---
## Good Example
```php
// Start with 4 recorders — the ones the team actually acts on
'recorders' => [
    Pulse\Recorders\SlowQueries::class => ['threshold' => 100],
    Pulse\Recorders\SlowJobs::class => ['threshold' => 500],
    Pulse\Recorders\Exceptions::class => ['enabled' => true],
    Pulse\Recorders\CacheInteractions::class => ['enabled' => true],
],

// Add more only when:
// 1. The team consistently reviews the existing 4 cards
// 2. A specific metric repeatedly requires investigation that Pulse could surface
// 3. The team agrees on a response SLA for the new metric
```
---
## Exceptions
During a specific performance investigation or incident response, temporarily enable additional recorders for diagnostic purposes. Remove them after the investigation concludes.
---
## Consequences Of Violation
Dashboard ignored by the team. Important signals (slow queries spiking after deploy) buried among noise (server CPU at 12%). Pulse becomes a "checkmark" tool — it's deployed but nobody uses it.

## Add Telescope Filters to Scrub Sensitive Data
---
## Category
Security
---
## Rule
When Telescope is used in staging environments with production-like data, configure Telescope filters to scrub sensitive fields from recorded data. Request payloads, query bindings, and email bodies may contain passwords, tokens, or PII. Use `Telescope::filter()` and `Telescope::tag()` to exclude sensitive data.
---
## Reason
Telescope records everything by default. In staging, this may include real email addresses, password reset tokens, API keys, and customer PII if staging data mirrors production. Without filters, this sensitive data is stored in plaintext in Telescope database tables, visible to anyone with staging dashboard access.
---
## Bad Example
```php
// Telescope records everything — including password reset tokens in query bindings
// Telescope UI shows:
// UPDATE users SET password = '$2y$12$...' WHERE email = 'real.customer@example.com'
// Password reset email sent to: real.customer@example.com
```
---
## Good Example
```php
class TelescopeServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        Telescope::filter(function (IncomingEntry $entry) {
            if ($this->app->environment('production')) {
                return false; // Never record in production
            }
            return true;
        });

        Telescope::tag(function (IncomingEntry $entry) {
            // Scrub sensitive data from queries
            if ($entry->type === EntryType::QUERY) {
                $entry->content['bindings'] = collect($entry->content['bindings'])
                    ->map(fn ($binding) => is_string($binding) && strlen($binding) > 32
                        ? '[REDACTED]'
                        : $binding
                    )->toArray();
            }

            // Scrub email recipients
            if ($entry->type === EntryType::MAIL) {
                $entry->content['to'] = '[REDACTED]';
            }

            return $entry;
        });
    }
}
```
---
## Exceptions
Local development with entirely synthetic data does not need filtering. However, any environment with real or realistic data (staging, UAT, demo) should have filters configured.
---
## Consequences Of Violation
Sensitive data exposed in Telescope dashboard. Password reset tokens visible to developers who shouldn't see them. GDPR violation if staging contains EU customer data. Security incident from internal data exposure.
