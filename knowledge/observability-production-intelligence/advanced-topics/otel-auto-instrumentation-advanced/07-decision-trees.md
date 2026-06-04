# Decision Trees: OTel Auto-Instrumentation

## 1. Instrumentation Approach

Can the PHP extension be installed (root/server access)?
├── Yes → Use auto-instrumentation for zero-code observability
│   ├── Install PHP extension via PECL or OS package
│   ├── Install matching Composer instrumentation packages
│   ├── Set OTEL_PHP_AUTOLOAD_ENABLED=true
│   └── Covers ~80% of useful spans without code changes
├── No (shared hosting, no extension) → SDK-only manual instrumentation
│   └── Manual spans for request lifecycle, DB, cache, HTTP calls
└── Yes, but want control → Hybrid: auto-instrumentation for standard ops
    └── Manual spans for business-specific logic

## 2. Deployment Method

What is the deployment model (Docker or bare metal)?
├── Docker → Build OTel extension into base PHP Docker image
│   ├── apt-get install otelphp or pecl install in Dockerfile
│   ├── Runtime env vars: OTEL_PHP_AUTOLOAD_ENABLED=true
│   └── Pin extension version in Dockerfile
├── Bare metal / VM → Install via OS package manager or PECL
│   ├── OTel PHP Distro for Debian/Ubuntu: apt-get install otelphp
│   └── Manage via configuration management (Ansible, Chef)
└── Kubernetes → Same Docker approach; consider sidecar Collector

## 3. Instrumentation Package Selection

Does the application use Laravel/PHP libraries?
├── Yes → Install only matching instrumentation packages
│   ├── Laravel: open-telemetry/opentelemetry-auto-laravel
│   ├── Eloquent/PDO: open-telemetry/opentelemetry-auto-pdo
│   ├── Guzzle: open-telemetry/opentelemetry-auto-guzzle
│   └── Never install all packages (unnecessary overhead)
├── Unknown → run composer show to list installed libraries; match instrumentation
└── Custom framework → Auto-instrumentation may not cover custom code
    └── Add manual spans for uncovered operations

## 4. Compatibility Check

Is a vendor APM agent currently installed?
├── Yes (New Relic, Datadog) → Remove vendor agent before enabling OTel
│   ├── Two extensions hooking the same functions = segfaults
│   └── Migration: switch one agent at a time; test in staging first
├── No → Safe to install OTel extension
└── Yes, but can't remove (contract) → Use OTel SDK only (no extension)
    └── Manual spans only; no auto-instrumentation
