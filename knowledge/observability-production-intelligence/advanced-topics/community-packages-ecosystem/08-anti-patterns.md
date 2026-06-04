# ECC Anti-Patterns — Community Packages

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Observability & Production Intelligence |
| **Subdomain** | OpenTelemetry Ecosystem |
| **Knowledge Unit** | Community Packages |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Community Package as Permanent Dependency
2. Not Pinning Package Version
3. Using Package When Customization Exceeds 20% of Needs
4. Not Testing Package Compatibility With SDK Upgrades
5. Sampler Configuration Hardcoded in Application Code

---

## Repository-Wide Anti-Patterns

- Overengineering
- Duplicate Business Logic

---

## Anti-Pattern 1: Community Package as Permanent Dependency

### Category
Architecture

### Description
Treating a community OTel package (`keepsuit/laravel-opentelemetry`, `overtrue/laravel-open-telemetry`) as a permanent production dependency without planning a migration path to the raw SDK as customization needs grow.

### Warning Signs
- Community package used for all OTel functionality
- No raw SDK initialization code exists alongside
- Team has outgrown the package but hasn't migrated
- Package doesn't support needed features but team works around it
- SDK upgrade blocked because package hasn't been updated

### Why It Is Harmful
Community packages may lag behind upstream OTel SDK releases, lack advanced features (custom span processors, multiple exporters), or become unmaintained. Treating them as permanent creates risk — when the package blocks an SDK upgrade, the team must migrate under pressure.

### Real-World Consequences
A team uses `keepsuit/laravel-opentelemetry` for 18 months. The OTel SDK releases v1.2 with critical security fixes. The package hasn't been updated in 6 months and is incompatible. The team is stuck — either stay on the vulnerable SDK or do an emergency migration to raw SDK.

### Preferred Alternative
Use community packages as a starting point for OTel adoption. Plan for migration to raw SDK as customization needs grow. Maintain a raw SDK fallback path.

### Refactoring Strategy
1. Document migration plan: Phase 1 (package) → Phase 2 (extend) → Phase 3 (raw SDK)
2. Keep raw SDK initialization code alongside package code
3. Test migration incrementally in staging
4. When customization needs exceed 20% of package features, migrate

### Detection Checklist
- [ ] Package dependency treated as permanent
- [ ] No raw SDK fallback path exists
- [ ] SDK upgrade blocked by package compatibility
- [ ] Package unmaintained or slow to update

### Related Rules
- (Rule: Never use community packages as permanent dependencies without a migration path)

### Related Skills
- (Related: Adopt Community OTel Packages for Laravel — migration section)

---

## Anti-Pattern 2: Not Pinning Package Version

### Category
Maintainability

### Description
Using caret version ranges (`^1.0`, `^2.0`) for community OTel packages without pinning to specific versions, allowing incompatible upgrades to silently break instrumentation.

### Warning Signs
- `composer.json` uses `^1.0` or `^2.0` for community package
- No explicit version pinning
- `composer update` occasionally breaks instrumentation
- Spans disappear after dependency updates

### Why It Is Harmful
The OTel PHP ecosystem evolves rapidly. An unpinned package may auto-update to a version incompatible with the installed SDK (or vice versa), causing silent instrumentation failures — no spans, no metrics, no errors.

### Real-World Consequences
A team runs `composer update` to install a security patch for a different package. Composer also updates `keepsuit/laravel-opentelemetry` from 2.3.0 to 2.4.0. The new version changed the exporter interface. All OTel traces silently stop working. Nobody notices for 3 days.

### Preferred Alternative
Pin both the community package version and the OTel SDK version in `composer.json`. Upgrade both together after testing.

### Refactoring Strategy
1. Pin package to specific version: `"keepsuit/laravel-opentelemetry": "2.3.0"`
2. Pin OTel SDK: `"open-telemetry/sdk": "1.1.0"`
3. Test upgrades in staging before production
4. Document the upgrade process

### Detection Checklist
- [ ] Unpinned package version in `composer.json`
- [ ] Span telemetry stopped after `composer update`
- [ ] No version testing before upgrade

### Related Rules
- (Rule: Always pin community package version alongside the OTel SDK version)

### Related Skills
- (Related: Adopt Community OTel Packages for Laravel — version management)

---

## Anti-Pattern 3: Using Package When Customization Exceeds 20% of Needs

### Category
Architecture

### Description
Continuing to use a community package for OTel setup even when application customization needs exceed 20% of the package's feature set, fighting against package abstractions instead of using the raw SDK.

### Warning Signs
- Multiple workarounds for package limitations
- Package extensions/providers require complex overrides
- Raw SDK features needed but inaccessible through package
- Team spends more time working around the package than using it

### Why It Is Harmful
Community packages are designed for 80% of use cases. When 20%+ of needs are unmet by the package, the team ends up fighting abstractions — writing complex overrides, extending service providers, or duplicating package internals. This creates fragile, hard-to-maintain instrumentation.

### Real-World Consequences
A team needs custom span processors, multiple exporters, and tail-based sampling. The community package supports none of these. They extend the service provider with 200 lines of override code. Every package update breaks their overrides. They spend more time fixing the package compatibility than on observability.

### Preferred Alternative
When customization needs exceed 20%, migrate to raw OTel SDK. Retain only the config file structure for convenience.

### Refactoring Strategy
1. Identify which package features are used vs workarounds
2. If workarounds dominate, plan migration to raw SDK
3. Keep config file pattern from the package
4. Replace service provider with manual `Sdk::builder()` setup
5. Test all existing spans still appear

### Detection Checklist
- [ ] Complex package overrides in codebase
- [ ] Multiple workarounds for missing features
- [ ] Raw SDK features inaccessible through package
- [ ] Package update breaks overrides

### Related Rules
- (Rule: If 20% of needs aren't met by the package, use raw SDK — from anti-patterns in knowledge)

### Related Skills
- (Related: OTel PHP SDK setup)

---

## Anti-Pattern 4: Not Testing Package Compatibility With SDK Upgrades

### Category
Testing

### Description
Upgrading either the community package or the OTel SDK without testing compatibility in staging, leading to silent instrumentation failures in production.

### Warning Signs
- Package upgrades deployed directly to production
- No staging test for OTel component upgrades
- Team relies on CI passing but doesn't verify spans appear
- Instrumentation failures discovered hours/days later

### Why It Is Harmful
Community packages may have subtle incompatibilities with newer OTel SDK versions that only manifest under real traffic patterns — span processor changes, exporter interface changes, or configuration option deprecations. CI may pass but telemetry stops.

### Real-World Consequences
Team upgrades OTel SDK from 1.0.0 to 1.1.0 in staging. They run unit tests (pass). They deploy to production. The community package's exporter interface is incompatible with SDK 1.1.0. Zero spans are exported for 8 hours until a developer checking the dashboard notices "No data."

### Preferred Alternative
Always test OTel component upgrades in staging with production-mirroring traffic before deploying to production.

### Refactoring Strategy
1. Create staging environment that mirrors production traffic
2. Run load tests after OTel component upgrades
3. Verify spans appear in the Collector/dashboard within 60 seconds
4. Only then promote to production

### Detection Checklist
- [ ] Package upgrades deployed without staging test
- [ ] No verification that spans appear after upgrade
- [ ] Instrumentation failures detected by chance

### Related Rules
- (Rule: Test community package compatibility with each OTel SDK upgrade in staging)

---

## Anti-Pattern 5: Sampler Configuration Hardcoded in Application Code

### Category
Maintainability

### Description
Hardcoding sampler type and ratio in application code rather than in config files or environment variables, requiring a code deployment to adjust sampling rates.

### Warning Signs
- Sampler configured in application code: `new TraceIdRatio(0.1)`
- No env var or config file overrides for sampler
- Sampling rate changes require full deploy cycle
- During incidents, cannot increase sampling temporarily without deployment

### Why It Is Harmful
Hardcoded sampler configuration requires a code commit and deployment to change the sampling rate. During incidents, teams may need to increase sampling temporarily to capture more trace data — but they can't without a deploy, wasting critical debugging time.

### Real-World Consequences
An incident is causing intermittent failures. The current 1% sampling rate isn't capturing enough traces to debug. The team needs to increase to 100%. But the sampler is hardcoded. They deploy an emergency config change — 15 minutes of incident time lost.

### Preferred Alternative
Configure sampler type and ratio in config file or environment variables for operator-controlled adjustment without code changes.

### Refactoring Strategy
1. Move sampler config to `config/opentelemetry.php`
2. Use env vars: `OTEL_TRACES_SAMPLER`, `OTEL_TRACES_SAMPLER_ARG`
3. Remove hardcoded sampler from application code
4. Document how operators can adjust sampling during incidents

### Detection Checklist
- [ ] Sampler configured in application code
- [ ] No env var override for sampling ratio
- [ ] Sampling changes require code deployment

### Related Rules
- (Rule: Set sampler type and ratio in config file — not in code)
