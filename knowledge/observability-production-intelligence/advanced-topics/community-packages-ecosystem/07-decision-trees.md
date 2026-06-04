# Decision Trees: Community Packages

## 1. Package Adoption Strategy

Is this a new OTel adoption or existing raw SDK usage?
├── New to OTel → Start with community package (keepsuit/overtrue)
│   ├── Faster setup: service provider, config file, facade
│   ├── Covers 80% of needs out of the box
│   └── Plan: use as starting point; plan migration path to raw SDK
├── Existing raw SDK, satisfied → Stay with raw SDK; no package needed
│   └── Community package abstraction is unnecessary overhead
└── Existing raw SDK, needs simplification → Evaluate package for config
    └── May only want the config file pattern; keep raw SDK for pipelines

## 2. Package Selection

What PHP version is the application running?
├── PHP 8.1+ → keepsuit/laravel-opentelemetry (broader auto-instrumentation coverage)
│   ├── Supports: requests, queries, jobs, cache, mail
│   └── More active maintenance as of 2026
├── PHP 8.0 → overtrue/laravel-open-telemetry (PHP 8.0 compatible)
│   └── Coverage: requests, queries, jobs
└── PHP 7.4 or need official support → Raw OTel SDK (no community package covers)

## 3. Version Management

Is instrumentation working correctly today?
├── Yes → Pin versions of both package and OTel SDK in composer.json
│   ├── "open-telemetry/sdk": "1.1.0" (not ^1.0)
│   ├── "keepsuit/laravel-opentelemetry": "2.3.0" (not ^2.0)
│   └── Upgrade: test both together in staging
├── No / not working → Check compatibility: SDK version vs package version
│   └── Upgrade one or both; test in staging first
└── Unsure → Run test in staging; verify spans appear in backend

## 4. Migration Decision

Has the team outgrown the community package?
├── Yes (need custom span processors, multiple exporters) → Migrate to raw SDK
│   ├── Keep config file structure (convenience)
│   ├── Replace service provider with manual Sdk::builder() setup
│   └── Test: all existing spans still appear after migration
├── Not yet (package meets all needs) → Continue using package
│   └── Monitor package health: last commit date, issue resolution
└── Package is unmaintained → Migrate to raw SDK as emergency priority
