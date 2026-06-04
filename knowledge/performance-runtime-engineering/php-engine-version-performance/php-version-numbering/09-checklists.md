# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** PHP Engine & Version Performance
**Knowledge Unit:** PHP Version Numbering â€” Minor Releases, Security vs Active Support
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Leapfrog upgrades**: Skip intermediate versions when migrating (e.g., 7.4 to 8.2 directly) to reduce migration cycles. Test each major boundary separately.
- [ ] **Upgrade before EOL**: Plan migrations to complete before the version reaches End of Life. Running EOL versions exposes the application to unpatched security vulnerabilities.
- [ ] **Stagger production rollout**: Deploy the new PHP version to a staging environment first, run the full test suite, then gradually roll out to production.
- [ ] **Monitor the community**: Security announcements are published on php.net and the PHP mailing list. Subscribe for critical notifications.
- [ ] Current PHP version is actively supported (not EOL)
- [ ] Version upgrade plan includes leapfrog strategy
- [ ] Test suite passes on target PHP version
- [ ] All extensions are compatible with target version
- [ ] Deployment pipeline supports the new version
- [ ] PHP version upgrade completed with zero production incidents
- [ ] Full test suite passes on target version
- [ ] Performance meets or exceeds baseline
- [ ] composer.json updated and committed
- [ ] Support timeline for new version documented
- [ ] Current PHP version support status confirmed
- [ ] Target version selected based on stability and feature requirements
- [ ] Composer dependencies tested with target version
- [ ] Performance benchmark completed (no regression)
- [ ] Rollback plan documented
- [ ] composer.json PHP constraint updated

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Shared-nothing architecture** (PHP-FPM): Each request is isolated in a separate OS process. Maximizes fault isolation at the cost of per-request bootstrap overhead. Best for multi-tenant hosting where isolation is prioritized.
- [ ] **Memory-resident architecture** (Octane/Swoole): Boot once, handle many. Reduces latency by 60-90% for framework-heavy applications but introduces state management complexity. Best for dedicated API servers with controlled code deployments.
- [ ] **Event-driven coroutines** (Swoole/FrankenPHP): Single process handles many concurrent requests via coroutine switching. Memory efficiency is high but requires non-blocking I/O for all operations.
- [ ] Document and follow through on architectural decision: Which PHP version to run in production
- [ ] Document and follow through on architectural decision: When to upgrade PHP version
- [ ] Document and follow through on architectural decision: Leapfrog vs sequential upgrade
- [ ] Document and follow through on architectural decision: Hold current version vs upgrade
- [ ] Ensure architecture aligns with core concept: **Version scheme**: `major.minor.patch` â€” PHP 8.5.0 (major=8, minor=5, patch=0).
- [ ] Ensure architecture aligns with core concept: **Active support**: ~2 years from release date â€” bug fixes, performance improvements, security patches.
- [ ] Ensure architecture aligns with core concept: **Security support**: ~1 additional year â€” security fixes only.
- [ ] Ensure architecture aligns with core concept: **Current timeline (2026)**: PHP 8.5 (active), 8.4 (security only), 8.3 (security only, ending soon), 8.2 (EOL), 8.1 (EOL), 8.0 (EOL).
- [ ] Ensure architecture aligns with core concept: **Migration window**: Teams should upgrade within 2 years of a release to remain on supported versions.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Leapfrog upgrades**: Skip intermediate versions when migrating (e.g., 7.4 to 8.2 directly) to reduce migration cycles. Test each major boundary separately.
- [ ] **Upgrade before EOL**: Plan migrations to complete before the version reaches End of Life. Running EOL versions exposes the application to unpatched security vulnerabilities.
- [ ] **Stagger production rollout**: Deploy the new PHP version to a staging environment first, run the full test suite, then gradually roll out to production.
- [ ] **Monitor the community**: Security announcements are published on php.net and the PHP mailing list. Subscribe for critical notifications.
- [ ] Identify current PHP version and check its support status on php.net/supported-versions.php
- [ ] If current version is in "security fixes only" phase (last year), plan upgrade within 3 months
- [ ] If current version is end-of-life, treat as critical â€” upgrade immediately
- [ ] Select target version: for production stability, choose the latest minor of the current major (e.g., 8.3.x if on 8.2.x)
- [ ] For new projects, use the latest stable major.minor release (e.g., 8.4)
- [ ] Run `composer update --dry-run` with target PHP version constraint to check package compatibility
- [ ] Set up a staging environment with target PHP version and run full test suite
- [ ] Benchmark performance delta (see Engine Version Performance Deltas skill)
- [ ] Deploy using blue-green strategy with rollback to current PHP version if issues arise
- [ ] After deployment, update composer.json require.php version to match target

# Performance Checklist (from 04/06)
- [ ] Shared-nothing (FPM)
- [ ] Memory-resident (Octane)
- [ ] JIT compilation
- [ ] OpCache

# Security Checklist (from 04/06 - only if relevant)
- [ ] PHP 7.4, 8.0, 8.1, and 8.2 have reached End of Life â€” no security patches
- [ ] CVE exploits targeting known PHP vulnerabilities appear regularly for EOL versions
- [ ] Running unsupported versions violates compliance requirements (PCI-DSS, SOC2)
- [ ] Security-only support means only critical fixes â€” minor vulnerabilities go unfixed

# Reliability Checklist (from 04/05/06)
- [ ] **Deadlock**: PHP-FPM workers deadlocked on shared resource (file lock, database connection pool). Symptom: active workers plateau at max_children, no requests complete. Mitigation: Set request_terminate_timeout to kill stuck workers.
- [ ] **Memory exhaustion**: PHP worker exceeds memory_limit. Symptom: PHP Fatal error "Allowed memory size exhausted". Mitigation: Increase limit or optimize memory usage. Root cause analysis via memory profiler.
- [ ] **File descriptor exhaustion**: OpCache or PHP worker runs out of file descriptors. Symptom: "Too many open files" errors. Mitigation: Increase ulimit -n in systemd service file.
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Testing Checklist (from 04/06)
- [ ] Current PHP version is actively supported (not EOL)
- [ ] Version upgrade plan includes leapfrog strategy
- [ ] Test suite passes on target PHP version
- [ ] All extensions are compatible with target version
- [ ] Deployment pipeline supports the new version
- [ ] Security support timeline verified for all production environments
- [ ] PHP version upgrade completed with zero production incidents
- [ ] Full test suite passes on target version
- [ ] Performance meets or exceeds baseline
- [ ] composer.json updated and committed
- [ ] Support timeline for new version documented
- [ ] Current PHP version support status confirmed
- [ ] Target version selected based on stability and feature requirements
- [ ] Composer dependencies tested with target version
- [ ] Performance benchmark completed (no regression)
- [ ] Rollback plan documented
- [ ] composer.json PHP constraint updated

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Leapfrog upgrades**: Skip intermediate versions when migrating (e.g., 7.4 to 8.2 directly) to reduce migration cycles. Test each major boundary separately.
- [ ] **Upgrade before EOL**: Plan migrations to complete before the version reaches End of Life. Running EOL versions exposes the application to unpatched security vulnerabilities.
- [ ] **Stagger production rollout**: Deploy the new PHP version to a staging environment first, run the full test suite, then gradually roll out to production.
- [ ] **Monitor the community**: Security announcements are published on php.net and the PHP mailing list. Subscribe for critical notifications.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Running EOL versions
- [ ] Avoid: Upgrading every minor version
- [ ] Avoid: Not testing before upgrade
- [ ] Avoid: Ignoring extension compatibility
- [ ] Avoid anti-pattern: **Chasing every release**: Minor version upgrades for marginal gains waste effort. Leapfrog to the version that provides the features or security support you need.
- [ ] Avoid anti-pattern: **Delaying upgrades indefinitely**: The risk of running EOL PHP increases over time. Plan upgrades as part of the regular maintenance cycle.
- [ ] Avoid anti-pattern: **Assuming "it works" without a test suite**: PHP minor versions can contain BC breaks. Always verify with automated tests.
- [ ] Guard against anti-pattern: Running EOL Versions
- [ ] Guard against anti-pattern: Upgrading Every Minor Version Immediately
- [ ] Guard against anti-pattern: Delaying Upgrades Indefinitely
- [ ] Guard against anti-pattern: Assuming "It Works" Without Automated Test Verification
- [ ] Guard against anti-pattern: Leapfrog Upgrading Without Intermediate Validation
- [ ] All production PHP versions are actively supported (not EOL)
- [ ] EOL monitoring in place (calendar reminders, automated alerts)

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **PHP version lifecycle**: Always run a supported PHP version (currently 8.1+). Each minor version brings 5-15% performance improvement. Upgrade within 3 months of release.
- [ ] **Configuration audit**: Check memory_limit, max_execution_time, max_input_vars, ealpath_cache_size are tuned for your application. Defaults are conservative.
- [ ] **Error handling**: display_errors=Off, log_errors=On, error_reporting=E_ALL. Never show errors to users.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Version scheme**: `major.minor.patch` â€” PHP 8.5.0 (major=8, minor=5, patch=0)., **Active support**: ~2 years from release date â€” bug fixes, performance improvements, security patches., **Security support**: ~1 additional year â€” security fixes only., **Current timeline (2026)**: PHP 8.5 (active), 8.4 (security only), 8.3 (security only, ending soon), 8.2 (EOL), 8.1 (EOL), 8.0 (EOL)., **Migration window**: Teams should upgrade within 2 years of a release to remain on supported versions.
**Rules:**
- General: Subscribe to PHP Security Announcements
**Skills:** Engine Version Performance Deltas Measurement, Dependency Compatibility Validation, Deployment Cache Invalidation
**Decision Trees:** Which PHP version to run in production, When to upgrade PHP version, Leapfrog vs sequential upgrade, Hold current version vs upgrade
**Anti-Patterns:** Running EOL Versions, Upgrading Every Minor Version Immediately, Delaying Upgrades Indefinitely, Assuming "It Works" Without Automated Test Verification, Leapfrog Upgrading Without Intermediate Validation
**Related Topics:** Engine Version Performance Deltas, Version Migration Planning, PHP Version Support Timeline

