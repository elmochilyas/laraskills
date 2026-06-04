# Decomposition: Community Packages

## Topic Overview
The OTel PHP ecosystem includes community packages that simplify Laravel integration. `keepsuit/laravel-opentelemetry` and `overtrue/laravel-open-telemetry` provide Laravel-specific convenience layers over the raw OTel SDK â€” service provider registration, configuration via `config/opentelemetry.php`, automatic tracer setup, and facade access. These packages reduce the boilerplate of SDK initialization, making OTel adoption faster for Laravel teams.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
opentelemetry-ecosystem/community-packages/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Community Packages
- **Purpose:** The OTel PHP ecosystem includes community packages that simplify Laravel integration. `keepsuit/laravel-opentelemetry` and `overtrue/laravel-open-telemetry` provide Laravel-specific convenience layers over the raw OTel SDK â€” service provider registration, configuration via `config/opentelemetry.php`, automatic tracer setup, and facade access. These packages reduce the boilerplate of SDK initialization, making OTel adoption faster for Laravel teams.
- **Difficulty:** Intermediate
- **Dependencies:
  - OpenTelemetry PHP SDK (raw SDK usage, underlying these packages)
  - OTel Auto-Instrumentation (auto-instrumentation, complementary to convenience layer)
  - OTLP Exporter & Collector Configuration (exporter configuration via packages)

## Dependency Graph
**Depends on:**
  - OpenTelemetry PHP SDK (raw SDK usage, underlying these packages)
  - OTel Auto-Instrumentation (auto-instrumentation, complementary to convenience layer)
  - OTLP Exporter & Collector Configuration (exporter configuration via packages)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - Convenience layer
  - Auto-configuration
  - Laravel lifecycle hooks
  - Config file approach

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization