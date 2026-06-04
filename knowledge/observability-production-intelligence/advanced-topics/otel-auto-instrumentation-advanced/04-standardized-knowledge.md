# Standardized Knowledge: OTel Auto-Instrumentation

## Metadata
| Attribute | Value |
|---|---|
| Domain | Observability & Production Intelligence |
| Subdomain | OpenTelemetry Ecosystem |
| Knowledge Unit | OTel Auto-Instrumentation |
| Difficulty | Advanced |
| Maturity | Stable |
| Last Updated | 2026-06-02 |

## Overview
OpenTelemetry auto-instrumentation for PHP enables zero-code observability — install the PHP extension, add Composer instrumentation packages, set environment variables, and get traces, metrics, and logs without modifying application code. The PHP extension hooks into internal function calls; instrumentation libraries decode framework-specific semantics. This is the most significant advantage of OTel over vendor-specific SDKs, which require per-installation configuration.

## Core Concepts
- **PHP extension**: C-extension (`opentelemetry.so`) loaded via `php.ini`; hooks into `zend_execute_ex` and `zend_execute_internal`
- **Hook registration**: Extension registers pre/post hooks on class methods; hooks defined in PHP instrumentation library code
- **Instrumentation library**: Composer package providing hook definitions for a specific framework
- **Zero-code vs code-based**: Zero-code requires only extension + packages + env vars; code-based additionally uses SDK API
- **OTel PHP Distro**: Production-focused OS packages bundling extension + SDK + common instrumentations
- **PHP auto-instrumentation vs eBPF**: Current approach hooks at PHP VM level; future eBPF will hook at kernel level

## When To Use
- Laravel applications wanting observability without modifying application code
- Teams deploying multiple services wanting consistent instrumentation across all
- Greenfield projects where zero-code instrumentation reduces setup friction
- Docker/Kubernetes environments where extension installation is straightforward
- Production deployments where OTel PHP Distro simplifies package management

## When NOT To Use
- Shared hosting environments where PHP extension installation is not possible
- Applications needing only basic monitoring (Pulse or Nightwatch may be simpler)
- Teams already committed to a vendor-specific agent (New Relic, Datadog)
- Applications where only specific business logic needs instrumentation (use manual SDK)

## Best Practices
- Install extension + SDK + env vars for full zero-code observability
- Match instrumentation packages to the specific libraries used by each service
- Use auto-instrumentation for standard operations (HTTP, DB, cache) and manual spans for business logic
- Build Docker images with pre-installed OTel extension; set env vars at container runtime
- Use OTel PHP Distro for production deployments over manual Composer + PECL setup
- Pin the extension version in Docker image or server provisioning scripts
- Test auto-instrumentation in staging with production traffic patterns before production

## Architecture Guidelines
- Use `OTEL_PHP_EXCLUDED_URLS` to disable instrumentation for health check and metrics endpoints
- For Octane, ensure the extension is fiber-compatible (OTel extension v1.0+)
- Fall back to SDK-only manual instrumentation if extension installation is not possible
- Choose between Composer packages (standard) and OTel PHP Distro (OS-native) based on deployment model
- Monitor extension stability after PHP version upgrades — hooks are sensitive to internal PHP changes

## Performance Considerations
- Extension overhead: ~2-4% per request with standard instrumentation; lower than vendor-specific agents
- Hook execution is in C (fast); PHP callback code in instrumentation libraries is minimal
- Uninstrumented methods have zero overhead — extension only fires hooks for registered classes
- Batch span processing offloads export overhead; configure `OTEL_BSP_SCHEDULE_DELAY` appropriately
- Auto-instrumentation captures ~80% of useful spans without code changes

## Security Considerations
- Auto-instrumentation may capture sensitive data in span attributes; configure redaction
- Extension requires `pecl` installation with build dependencies; manage in deployment pipeline
- OTel extension loaded before application code; verify `php -m | grep opentelemetry`
- Running OTel extension alongside vendor agents (New Relic, Datadog) can cause conflicts
- Extension version must match PHP version; upgrade both together

## Common Mistakes
| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Installing extension without SDK | Extension hooks need SDK destination | No telemetry generated | Always install SDK alongside extension |
| Incorrect extension loading order | Extension loaded after app code | Hooks don't fire | Verify with `php -m` |
| Missing PSR-18 HTTP client | OTLP exporter needs HTTP client | Exporter fails silently | Install guzzlehttp/guzzle |
| Not setting OTEL_PHP_AUTOLOAD_ENABLED | Missing env var | No auto-configuration, no telemetry | Set env var to true |
| Extension conflict with vendor agents | Running multiple agents | Crashes or missing spans | Choose one instrumentation layer |

## Anti-Patterns
- **Extension without SDK**: The extension hooks into method calls but has nowhere to send span data. Always install the SDK via Composer.
- **Not setting environment variables**: Extension + SDK + packages installed but `OTEL_PHP_AUTOLOAD_ENABLED` not set — no telemetry generated.
- **Extension + vendor agent conflict**: OTel extension alongside New Relic or Datadog extensions can cause segfaults. Choose one.
- **Manual instrumentation when auto suffices**: Auto-instrumentation covers 80% of needs; manual instrumentation increases maintenance burden.

## Examples
```bash
# Method 1: PECL
pecl install opentelemetry
echo "extension=opentelemetry.so" > /usr/local/etc/php/conf.d/opentelemetry.ini

# Method 2: Composer packages
composer require open-telemetry/sdk open-telemetry/exporter-otlp
composer require open-telemetry/opentelemetry-auto-laravel
composer require open-telemetry/opentelemetry-auto-pdo

# Method 3: OTel PHP Distro (production)
apt-get install otelphp  # Debian/Ubuntu
```

## Related Topics
- OpenTelemetry PHP SDK (SDK configuration for auto-instrumented traces)
- W3C Trace Context Propagation (auto-injection of traceparent by PSR-18 instrumentation)
- Community Packages (Laravel-specific convenience wrappers)
- OTel Collector Production Hardening (Collector receives auto-instrumented data)

## AI Agent Notes
- OTel PHP extension reached beta/stable status in early 2026 after years of development
- Auto-instrumentation for Laravel captures ~80% of useful spans without code changes
- OTel PHP Distro (OS packages) is the recommended production approach
- eBPF-based auto-instrumentation for PHP is in early research stages (2026)
- OTel PHP approach is unique — vendor agents provide similar capability but are proprietary

## Verification
- [ ] OTel PHP extension is installed and loaded (verify with `php -m`)
- [ ] SDK is installed via Composer alongside extension
- [ ] `OTEL_PHP_AUTOLOAD_ENABLED=true` is set in environment
- [ ] Instrumentation packages match installed libraries
- [ ] PSR-18 HTTP client is installed for OTLP exporter
- [ ] Health check URLs are excluded via `OTEL_PHP_EXCLUDED_URLS`
- [ ] Extension version is pinned and matches PHP version
- [ ] Octane fiber compatibility is verified (extension v1.0+)
- [ ] No conflicting vendor agents are active
- [ ] Auto-instrumentation is tested in staging before production
