# OTel Auto-Instrumentation

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** OpenTelemetry Ecosystem
- **Knowledge Unit:** OTel Auto-Instrumentation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

OpenTelemetry auto-instrumentation for PHP enables zero-code observability — install the PHP extension, add Composer instrumentation packages, set environment variables, and get traces, metrics, and logs without modifying application code. The PHP extension hooks into internal function calls; instrumentation libraries decode framework-specific semantics. This is the most significant advantage of OTel over vendor-specific SDKs, which require per-installation configuration.

---

## Core Concepts

- **PHP extension:** C-extension (`opentelemetry.so`) loaded via `php.ini`; hooks into `zend_execute_ex` and `zend_execute_internal`
- **Hook registration:** Extension registers pre/post hooks on class methods; hooks defined in PHP instrumentation library code
- **Instrumentation library:** Composer package providing hook definitions for a specific framework
- **Zero-code vs code-based:** Zero-code requires only extension + packages + env vars; code-based additionally uses SDK API
- **OTel PHP Distro:** Production-focused OS packages bundling extension + SDK + common instrumentations

---

## Mental Models

- **Dashcam for Code Model:** Auto-instrumentation is like a dashcam — it records everything that happens (HTTP, DB, cache) without any action from the driver (developer). You get the footage when you need it
- **Plug and Play Model:** Like plugging a USB device into a computer — install the driver (extension) and the device (instrumentation) works automatically. No configuration files needed
- **X-Ray Goggles Model:** Auto-instrumentation gives you X-ray goggles to see through your application. Every database query, HTTP call, and cache operation becomes visible without adding any code

---

## Internal Mechanics

The PHP extension hooks into the Zend Engine's function execution. When a registered class method is called, the extension executes pre-hook and post-hook callbacks defined in PHP instrumentation libraries. These callbacks create spans, extract attributes from the function context, and record timing. The SDK processes the spans through samplers and processors before exporting via OTLP.

---

## Patterns

- **Auto + Manual Combination:** Use auto-instrumentation for standard operations (HTTP, DB, cache) and manual spans for business logic. Benefit: comprehensive coverage with minimal code. Tradeoff: must understand what auto covers vs what needs manual.
- **Health Check Exclusion:** Use `OTEL_PHP_EXCLUDED_URLS` to disable instrumentation for health check and metrics endpoints. Benefit: reduced noise and storage. Tradeoff: must maintain exclusion list.
- **Docker Image Bundling:** Build Docker images with pre-installed OTel extension; set env vars at container runtime. Benefit: consistent deployment. Tradeoff: extension version pinned to image.

---

## Architectural Decisions

**Install extension + SDK + env vars for full zero-code observability.** Extension hooks provide the instrumentation; SDK provides processing and export.

**Match instrumentation packages to the specific libraries used by each service.** Avoid unnecessary packages that add code size and surface area.

**Use OTel PHP Distro for production deployments over manual Composer + PECL setup.** Distro provides version-compatible bundles.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Zero-code observability for 80% of needs | Extension installation not possible on shared hosting | Use manual SDK as fallback |
| Consistent instrumentation across services | Extension version must match PHP version | Plan extension upgrades with PHP upgrades |
| Captures library-level spans automatically | Does not instrument business logic | Always combine with manual instrumentation |

---

## Performance Considerations

Extension overhead is ~2-4% per request with standard instrumentation — lower than vendor-specific agents. Hook execution is in C (fast); PHP callback code in instrumentation libraries is minimal. Uninstrumented methods have zero overhead — extension only fires hooks for registered classes. Batch span processing offloads export overhead.

---

## Production Considerations

Auto-instrumentation may capture sensitive data in span attributes; configure redaction. Extension requires `pecl` installation with build dependencies; manage in deployment pipeline. OTel extension loaded before application code; verify with `php -m | grep opentelemetry`. Running OTel extension alongside vendor agents (New Relic, Datadog) can cause conflicts.

---

## Common Mistakes

**Installing extension without SDK** — extension hooks have no destination for span data. Always install SDK alongside extension.

**Incorrect extension loading order** — extension loaded after app code means hooks don't fire. Verify with `php -m`.

**Missing PSR-18 HTTP client** — OTLP exporter needs HTTP client for export. Install guzzlehttp/guzzle.

**Not setting `OTEL_PHP_AUTOLOAD_ENABLED`** — no auto-configuration, no telemetry generated.

---

## Failure Modes

**Extension crash on PHP upgrade:** Extension compiled for specific PHP version crashes after upgrade. Detection: `php -m` shows errors; application fails to start. Mitigation: pin extension version; test upgrades in staging.

**Vendor agent conflict:** OTel extension and New Relic extension both hook into Zend Engine, causing segfaults. Detection: intermittent crashes under load. Mitigation: choose one instrumentation layer.

**Silent instrumentation failure:** Extension loads but instrumentation packages don't match library versions — no spans generated. Detection: tracing backend receives no data. Mitigation: test in staging before production.

---

## Ecosystem Usage

Auto-instrumentation is a core part of the OTel ecosystem for PHP. The extension provides the hook mechanism; instrumentation packages define hooks for specific libraries (Laravel, PDO, Guzzle, Redis). Data flows through the SDK to the Collector, enabling complete vendor-neutral observability without application code changes.

---

## Related Knowledge Units

### Prerequisites
- OpenTelemetry PHP SDK (SDK configuration for auto-instrumented traces)
- OpenTelemetry Ecosystem (where auto-instrumentation fits)

### Related Topics
- Community Packages (Laravel-specific convenience wrappers)
- OTel Collector Production Hardening (Collector receives auto-instrumented data)

### Advanced Follow-up Topics
- Writing custom instrumentation packages
- Performance profiling with auto-instrumentation

---

## Research Notes

OTel PHP extension reached beta/stable status in early 2026 after years of development. Auto-instrumentation for Laravel captures ~80% of useful spans without code changes. OTel PHP Distro (OS packages) is the recommended production approach. eBPF-based auto-instrumentation for PHP is in early research stages (2026). OTel PHP approach is unique — vendor agents provide similar capability but are proprietary.
