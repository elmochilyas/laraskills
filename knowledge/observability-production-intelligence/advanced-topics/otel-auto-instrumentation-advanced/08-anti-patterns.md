# ECC Anti-Patterns — OTel Auto-Instrumentation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Observability & Production Intelligence |
| **Subdomain** | OpenTelemetry Ecosystem |
| **Knowledge Unit** | OTel Auto-Instrumentation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Extension Without SDK Installed
2. Missing OTEL_PHP_AUTOLOAD_ENABLED Environment Variable
3. Running OTel Extension Alongside Vendor APM Agent
4. Installing Unused Instrumentation Packages
5. Not Verifying Extension After PHP Upgrade

---

## Repository-Wide Anti-Patterns

- Massive Configuration Files
- Hardcoded Configuration

---

## Anti-Pattern 1: Extension Without SDK Installed

### Category
Architecture

### Description
Installing the OTel PHP extension via PECL without also installing the OTel SDK packages via Composer, resulting in a loaded extension that produces no telemetry.

### Warning Signs
- `php -m` shows `opentelemetry` but no spans are generated
- Extension installed via PECL but `composer require open-telemetry/sdk` not run
- No SDK packages in `composer.json`
- Team thinks OTel is working but no data appears

### Why It Is Harmful
The PHP extension hooks into method calls but has no built-in export capability. Without the SDK packages (tracer provider, span processor, exporter), the extension generates hooks that go nowhere — no telemetry is produced despite the extension appearing active.

### Real-World Consequences
A team follows a tutorial that installs the extension but misses the SDK step. `php -m` shows the extension is loaded. They deploy to production confident that OTel is working. 2 weeks later during an incident, they open the dashboard and find no data at all.

### Preferred Alternative
Always install both the extension and the SDK packages together. The extension hooks into methods; the SDK processes and exports the resulting spans.

### Refactoring Strategy
1. Run `composer require open-telemetry/sdk open-telemetry/exporter-otlp`
2. Install instrumentation packages for matching libraries
3. Set required environment variables
4. Verify spans appear in the OTel backend

### Detection Checklist
- [ ] `php -m` shows extension but no SDK packages installed
- [ ] No spans appearing in OTel backend
- [ ] OTel extension listed but no telemetry

### Related Rules
- (Rule: Always install the OTel SDK alongside the PHP extension)

### Related Skills
- (Related: Configure OpenTelemetry Auto-Instrumentation for PHP)

---

## Anti-Pattern 2: Missing OTEL_PHP_AUTOLOAD_ENABLED Environment Variable

### Category
Reliability

### Description
Setting up the OTel extension and SDK but not setting `OTEL_PHP_AUTOLOAD_ENABLED=true`, causing the SDK to not auto-configure and produce no spans.

### Warning Signs
- OTel extension and SDK both installed
- Environment variables set for service name and exporter
- No spans appear in any backend
- Debugging reveals TracerProvider never initialized

### Why It Is Harmful
Without `OTEL_PHP_AUTOLOAD_ENABLED=true`, the extension hooks fire but the SDK does not auto-configure — no `TracerProvider` is created, no exporter is set up, and no spans are exported. This is the single most common cause of "I installed OTel but nothing happens."

### Real-World Consequences
A team carefully installs the extension, SDK packages, and instrumentation packages. They set `OTEL_SERVICE_NAME` and `OTEL_EXPORTER_OTLP_ENDPOINT`. But they missed `OTEL_PHP_AUTOLOAD_ENABLED=true`. 2 days of debugging before someone discovers the missing env var.

### Preferred Alternative
Always set `OTEL_PHP_AUTOLOAD_ENABLED=true` when using auto-instrumentation with environment variable configuration.

### Refactoring Strategy
1. Add `OTEL_PHP_AUTOLOAD_ENABLED=true` to `.env` and deployment env config
2. Verify with a test script that spans are generated
3. Document required env vars in deployment checklist

### Detection Checklist
- [ ] OTel installed but no spans
- [ ] `OTEL_PHP_AUTOLOAD_ENABLED` not set to `true`
- [ ] SDK not auto-configuring

### Related Rules
- (Rule: Always set OTEL_PHP_AUTOLOAD_ENABLED=true for zero-code configuration)

### Related Skills
- (Related: Configure OpenTelemetry Auto-Instrumentation — env var setup)

---

## Anti-Pattern 3: Running OTel Extension Alongside Vendor APM Agent

### Category
Performance

### Description
Running the OTel PHP extension simultaneously with a vendor-specific APM agent (New Relic, Datadog), causing PHP segfaults, application crashes, and missing spans from the conflict between two instrumentation frameworks.

### Warning Signs
- Both `extension=opentelemetry.so` and `extension=ddtrace.so` in `php.ini`
- Intermittent PHP segmentation faults
- Sporadic application crashes under load
- Mixed span data or missing spans
- No stable instrumentation behavior

### Why It Is Harmful
Two instrumentation extensions hooking into the same PHP function calls (`zend_execute_ex`, `zend_execute_internal`) conflict. Each extension modifies the same internal function handlers, and the interaction is undefined — causing segfaults, crashes, and unpredictable behavior.

### Real-World Consequences
A migration from Datadog to OTel runs both agents for "monitoring continuity." Two weeks later, intermittent PHP segfaults start in production. Application crashes randomly under traffic spikes. Team spends 4 days debugging before finding the dual-extension conflict.

### Preferred Alternative
Run one instrumentation layer at a time. Choose either OTel or the vendor agent, not both.

### Refactoring Strategy
1. Choose one instrumentation platform for the migration
2. Remove the decommissioned agent's extension from `php.ini`
3. Restart PHP-FPM
4. Verify stability and instrumentation coverage
5. Document the migration timeline

### Detection Checklist
- [ ] Multiple instrumentation extensions loaded
- [ ] PHP segfaults or crashes under load
- [ ] Mixed or missing span data
- [ ] Unstable instrumentation behavior

### Related Rules
- (Rule: Never run OTel auto-instrumentation extension alongside vendor APM agents)

---

## Anti-Pattern 4: Installing Unused Instrumentation Packages

### Category
Performance

### Description
Installing all available OTel instrumentation packages regardless of the application's actual library usage, adding unnecessary bootstrap overhead from hooks that register but never fire.

### Warning Signs
- All OTel instrumentation packages in `composer.json` (`auto-symfony`, `auto-doctrine`, `auto-guzzle`, etc.)
- Application uses only Laravel and Guzzle but has 10 instrumentation packages
- Bootstrap time increasing with each instrumentation package
- Unused hooks registering at bootstrap

### Why It Is Harmful
Each instrumentation package registers hooks that fire on method calls. Even if the hook never matches a real method call, the registration happens at bootstrap, consuming memory and CPU. Multiple unused packages add cumulative overhead.

### Real-World Consequences
A Laravel app uses Guzzle for HTTP calls. The team installs `auto-symfony`, `auto-doctrine`, `auto-yii`, `auto-wordpress` alongside the needed packages. Bootstrap time increases by 30ms from 10 unnecessary hook registrations. Memory usage increases 5MB.

### Preferred Alternative
Install only instrumentation packages that match the actual libraries used by the application.

### Refactoring Strategy
1. Inventory application library usage: `composer show --installed`
2. Match instrumentation packages to actual libraries
3. Remove unused instrumentation packages
4. Verify all needed spans still appear

### Detection Checklist
- [ ] Instrumentation packages for unused libraries installed
- [ ] Bootstrap time or memory increasing
- [ ] Hook registrations for packages that never fire

### Related Rules
- (Rule: Match instrumentation packages to installed libraries, not all available packages)

### Related Skills
- (Related: Configure OpenTelemetry Auto-Instrumentation — instrumentation selection)

---

## Anti-Pattern 5: Not Verifying Extension After PHP Upgrade

### Category
Testing

### Description
Upgrading PHP version without verifying the OTel extension is still loaded and functional, causing silent instrumentation failure that goes undetected until trace data is needed during an incident.

### Warning Signs
- PHP upgrade performed without OTel extension verification
- No CI/CD check for `php -m | grep opentelemetry`
- Extension recompilation needed after PHP version change
- Traces disappear silently after infrastructure updates

### Why It Is Harmful
PHP version upgrades require the OTel extension to be recompiled. If the deployment script doesn't rebuild or reinstall the extension, it silently stops working. No error is raised — the extension simply doesn't load. Without verification, the team discovers the gap during an incident.

### Real-World Consequences
A PHP 8.3 to 8.4 upgrade is deployed. The OTel extension needs recompilation but the deployment script doesn't handle this. No telemetry is generated for 3 weeks. The team only discovers the issue during a postmortem after a production outage with no trace data.

### Preferred Alternative
Add post-upgrade verification to CI/CD that checks the OTel extension is loaded and spans are being generated.

### Refactoring Strategy
1. Add to CI/CD deploy script: `php -m | grep opentelemetry` — fail if not loaded
2. Add: `composer show open-telemetry/sdk` — verify SDK installed
3. Run a test span after deployment
4. Verify span appears in OTel backend within 60 seconds

### Detection Checklist
- [ ] No post-upgrade extension verification
- [ ] Extension not recompiled after PHP upgrade
- [ ] Traces disappeared after infrastructure update
- [ ] No CI/CD check for extension status

### Related Rules
- (Rule: Verify extension is loaded after every PHP or deployment update)
