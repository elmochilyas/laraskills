# Anti-Pattern 1: Telescope in Production

**Name:** Production telescope debugging

**Problem:** Enabling Telescope in production to debug an urgent issue. Telescope stores every database query, HTTP request, email, and job execution in the database. Under production traffic, the database write load increases by 10-50x. Application response times degrade immediately.

**Detection:** Database CPU spikes to 100%. Telescope entries table grows by millions of rows per hour. Application response time increases by 200-500ms. Developers "temporarily" enable Telescope and forget to disable it.

**Remediation:** Immediately disable Telescope in production: remove from providers array, clear `TELESCOPE_ENABLED`. Investigate production issues using structured logs and distributed tracing instead.

**Prevention:** Never install Telescope as a non-dev dependency. Use `composer require --dev` and rely on environment detection. Add CI check that prevents Telescope from being enabled in production environments.

# Anti-Pattern 2: Telescope Data as Documentation

**Name:** Telescope as API reference

**Problem:** Using Telescope's request log as the primary source of API documentation. When Telescope is pruned or reset, API documentation is lost. New team members cannot discover API behavior from Telescope data.

**Detection:** Team refers to Telescope entries for "how the API works." When entries are pruned, team cannot answer questions about API behavior.

**Remediation:** Create proper API documentation using OpenAPI/Swagger or Laravel API documentation tools. Telescope complements documentation but does not replace it.

**Prevention:** Telescope is a debugging tool with limited retention. It should never be the primary source of API documentation. Always maintain documentation outside of Telescope.

# Anti-Pattern 3: All Watchers Enabled

**Name:** Full watcher suite always on

**Problem:** Enabling all Telescope watchers at all times, even when debugging a specific issue (e.g., a queue job). Watchers for cache, notifications, events, and mail all record data for every request, creating noise and overhead.

**Detection:** Telescope dashboard shows entries for cache hits, notifications, and events that are not relevant to the current debugging session. Each request creates 20+ Telescope entries.

**Remediation:** Disable watchers that are not relevant to the current debugging task. Enable only RequestWatcher and JobWatcher when debugging queue jobs.

**Prevention:** Telescope watchers should be treated as tools — enable only what you need for the current debugging session. Make disabling watchers a habit when switching contexts.

# Anti-Pattern 4: No Pruning Configured

**Name:** Unbounded Telescope entry growth

**Problem:** Telescope installed without configuring pruning. The telescope_entries table is never cleaned. Over months of development, the table grows to millions of rows. Telescope dashboard queries become slow. Database disk fills.

**Detection:** telescope_entries table has millions of rows. Telescope dashboard takes >10 seconds to load. Database disk usage alerts trigger.

**Remediation:** Configure Telescope pruning with `php artisan telescope:prune --hours=24` in the scheduler. Run immediate prune to clean old entries. Reduce retention to 24 hours.

**Prevention:** Always configure Telescope pruning when installing. Default 24-hour retention is sufficient for local development. Use scheduler to run `telescope:prune` hourly.
