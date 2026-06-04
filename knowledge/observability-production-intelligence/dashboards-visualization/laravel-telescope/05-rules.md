# Rule 1: Only Use Telescope in Non-Production

**Condition:** Installing Telescope in any environment.

**Action:** Ensure Telescope is enabled only in `local` and `development` environments. Use `TelescopeServiceProvider` registration with environment check. Never set `TELESCOPE_ENABLED=true` in production `.env`.

**Consequence:** Telescope in production would store every query, request, and event in the database, significantly increasing write load, database size, and request latency. It reveals all application internals in the dashboard.

# Rule 2: Disable Unused Watchers

**Condition:** Configuring Telescope watchers.

**Action:** Review the watchers list in `config/telescope.php`. Disable watchers for features the application does not use (Horizon, Octane, Mail, Notifications, Cache). Keep watchers for actively-debugged features only.

**Consequence:** Fewer watchers mean fewer database writes per request and less clutter in the Telescope dashboard. Disabling a watcher removes all overhead for that feature.

# Rule 3: Configure Appropriate Pruning

**Condition:** Telescope is running in any non-production environment that persists beyond a single developer session (shared staging, CI).

**Action:** Set `TELESCOPE_PRUNING_INTERVAL` to run pruning via the Laravel scheduler. Default 24-hour retention is sufficient. For shared staging, extend to 7 days max. Ensure pruning schedule is registered.

**Consequence:** Automatic pruning prevents the telescope_entries table from growing unbounded. Without pruning, the table grows indefinitely and degrades dashboard performance.

# Rule 4: Restrict Dashboard Access

**Condition:** Telescope is deployed to a shared staging or development environment.

**Action:** Configure gate authorization for Telescope dashboard access. Restrict to developer roles. Do not expose Telescope to non-developer stakeholders.

**Consequence:** Authorized access prevents non-developers from seeing internal application details (query plans, stack traces, email contents). Telescope data is sensitive by nature.

# Rule 5: Do Not Use Telescope for Performance Benchmarking

**Condition:** Measuring application performance.

**Action:** Use dedicated profiling tools (Blackfire, Xdebug, Laravel Debugbar) for performance benchmarking. Telescope adds overhead and skews performance measurements. Do not draw conclusions from Telescope timing data.

**Consequence:** Telescope is a debugging tool, not a profiling tool. Its timing data includes its own instrumentation overhead. Profile with tools designed for profiling.

# Rule 6: Tag Entries for Team Organization

**Condition:** Multiple developers working on the same application.

**Action:** Add custom Telescope tags to entries for feature grouping: `Telescope::tag('feature:checkout')`. Use consistent tag naming conventions across the team.

**Consequence:** Tags enable filtering and searching in the Telescope dashboard. Developers can find entries related to their feature without scrolling through all entries.

# Rule 7: Monitor Telescope Storage in CI

**Condition:** Telescope is used in CI/CD pipelines for debugging test failures.

**Action:** Configure Telescope in CI with SQLite storage and limit entry retention per test run. Use `Telescope::record()` conditionally to avoid storing every CI interaction.

**Consequence:** Telescope in CI provides debugging for intermittent test failures. Without storage limits, CI Telescope storage grows across test runs and slows down the pipeline.

# Rule 8: Use Telescope::dump() Instead of dd()

**Condition:** Debugging application behavior during development.

**Action:** Use `Telescope::dump($variable)` instead of `dd($variable)`. `dump()` records the variable in the Telescope dashboard without halting request execution.

**Consequence:** Non-blocking debugging allows the request to complete normally. `dd()` halts execution, preventing downstream code from running and potentially causing incomplete Telescope entries.
