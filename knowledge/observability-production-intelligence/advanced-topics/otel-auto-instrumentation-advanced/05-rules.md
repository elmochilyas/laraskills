# Phase 5: Behavioral Rules — OTel Auto-Instrumentation

## Always Install the OTel SDK Alongside the PHP Extension
---
## Architecture
---
Always install the OTel PHP Composer SDK packages via Composer alongside the PHP extension — the extension hooks into method calls but needs the SDK as the destination for generated spans.
---
The PHP extension hooks into function calls but has no built-in export capability. Without the SDK packages (tracer provider, span processor, exporter), the extension generates hooks that go nowhere — no telemetry is produced despite the extension being active.
```bash
# Bad: Extension without SDK — no telemetry
pecl install opentelemetry
echo "extension=opentelemetry.so" > php.d/opentelemetry.ini
# Extension loaded, but no SDK to process hooks → zero output
```
```bash
# Good: Extension + SDK
pecl install opentelemetry
echo "extension=opentelemetry.so" > php.d/opentelemetry.ini
composer require open-telemetry/sdk open-telemetry/exporter-otlp
# Extension hooks + SDK processes + Exporter sends = working telemetry
```
---
Development environments where manual instrumentation via SDK-only (without extension) is preferred.
---
Extension loaded but no telemetry produced; misleading sense of observability coverage.
---

## Always Set OTEL_PHP_AUTOLOAD_ENABLED=true for Zero-Code Configuration
---
## Reliability
---
Set `OTEL_PHP_AUTOLOAD_ENABLED=true` environment variable when using auto-instrumentation so the SDK auto-configures tracer provider, span processor, and exporter from environment variables.
---
Without `OTEL_PHP_AUTOLOAD_ENABLED=true`, the extension hooks fire but the SDK doesn't auto-configure — no `TracerProvider` is created, no exporter is set up, and no spans are exported. This is the most common cause of "I installed OTel but nothing happens."
```bash
# Bad: Missing autoload flag
OTEL_SERVICE_NAME=my-app
OTEL_TRACES_EXPORTER=otlp
# No OTEL_PHP_AUTOLOAD_ENABLED — SDK doesn't auto-configure
# Result: No telemetry exported
```
```bash
# Good: Autoload enabled
OTEL_PHP_AUTOLOAD_ENABLED=true
OTEL_SERVICE_NAME=my-app
OTEL_TRACES_EXPORTER=otlp
OTEL_EXPORTER_OTLP_ENDPOINT=http://collector:4318
# Result: Auto-configured tracer, auto-export of spans
```
---
Manual SDK initialization where you configure the TracerProvider explicitly in code.
---
No telemetry exported despite all components being installed; wasted debugging time.
---

## Match Instrumentation Packages to Installed Libraries, Not All Available Packages
---
## Performance
---
Install only the OTel instrumentation packages that match the actual libraries used by the application — not all available instrumentations.
---
Each instrumentation package registers hooks that fire on method calls. Installing unnecessary instrumentations (e.g., Symfony HTTP client if you use Guzzle, or Doctrine DBAL if you use Eloquent) adds overhead from hooks that never match real calls but still register at bootstrap.
```json
// Bad: Installing all available instrumentations
"require": {
    "open-telemetry/opentelemetry-auto-laravel": "*",
    "open-telemetry/opentelemetry-auto-symfony": "*",   // Not used
    "open-telemetry/opentelemetry-auto-doctrine": "*",  // Eloquent, not Doctrine
    "open-telemetry/opentelemetry-auto-guzzle": "*",    // Not used (uses Symfony HTTP)
}
```
```json
// Good: Only matching installed libraries
"require": {
    "open-telemetry/opentelemetry-auto-laravel": "^1.0",  // Yes, using Laravel
    "open-telemetry/opentelemetry-auto-pdo": "^1.0",      // Yes, using Eloquent
    "open-telemetry/opentelemetry-auto-guzzle": "^1.0",   // Yes, using Guzzle
}
```
---
No common exceptions.
---
Unnecessary bootstrap overhead; wasted memory from unused hooks.
---

## Never Run OTel Auto-Instrumentation Extension Alongside Vendor APM Agents
---
## Performance
---
Run either OTel auto-instrumentation OR a vendor-specific APM agent (New Relic, Datadog) — never both in the same PHP process.
---
Two instrumentation extensions hooking into the same PHP function calls can conflict, causing segfaults, crashes, or missing spans. Each extension modifies the same internal function handlers, and the interaction is undefined.
```ini
# Bad: Two instrumentation extensions
; php.ini
extension=opentelemetry.so
extension=ddtrace.so      # Datadog agent — CONFLICT
```
```ini
# Good: Choose one instrumentation layer
; php.ini — OTel only
extension=opentelemetry.so
# Or: php.ini — vendor only (choose one)
extension=ddtrace.so
```
---
Migration periods where both run briefly during tool transition with documented risks and rollback plan.
---
PHP segfaults; missing spans; application crashes under load; unpredictable behavior.
---

## Verify Extension Is Loaded After Every PHP or Deployment Update
---
## Testing
---
After every PHP version upgrade or deployment, verify the OTel extension is loaded with `php -m | grep opentelemetry` before promoting to production.
---
PHP version upgrades, extension version bumps, or deployment script changes can silently disable or misconfigure the OTel extension. Without verification, auto-instrumentation stops working and no telemetry is generated — discoverable only when an incident requires trace data.
```bash
# Bad: No verification after upgrade
# PHP 8.3 → 8.4 upgrade: OTel extension needs recompilation
# No error message — just no telemetry
```
```bash
# Good: Post-upgrade verification
# In CI/CD deploy script:
php -m | grep opentelemetry || {
    echo "ERROR: OTel extension not loaded"
    exit 1
}
# Verify SDK packages:
composer show open-telemetry/sdk || {
    echo "ERROR: OTel SDK not installed"
    exit 1
}
```
---
No common exceptions.
---
Silent instrumentation failure; no observability data after infrastructure changes.
