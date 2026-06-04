---
## Rule Name

Upgrade Before EOL

## Category

Security

## Rule

Never run a PHP version that has reached End of Life in any production environment.

## Reason

EOL versions receive no security patches, exposing the application to unpatched CVEs and violating compliance requirements such as PCI-DSS and SOC2.

## Bad Example

```bash
# Production server running PHP 8.0 (EOL as of 2026)
php -v  # PHP 8.0.30
```

## Good Example

```bash
# Production server running actively supported PHP
php -v  # PHP 8.5.x (active support until late 2028)
```

## Exceptions

No common exceptions. Temporary extension incompatibility may delay upgrade by at most 90 days with an approved risk acceptance.

## Consequences Of Violation

Unpatched security vulnerabilities, compliance audit failures, increased risk of exploitation, forced emergency upgrades.

---

## Rule Name

Leapfrog Minor Versions

## Category

Maintainability

## Rule

Prefer leapfrog upgrades (e.g., PHP 7.4 directly to 8.2) over sequential minor version upgrades.

## Reason

Each migration cycle requires testing, validation, and deployment. Leapfrogging reduces the number of cycles while still reaching the target version, saving engineering effort.

## Bad Example

```bash
# Sequential upgrades — three full migration cycles
7.4 -> 8.0 -> 8.1 -> 8.2
```

## Good Example

```bash
# Leapfrog — one migration cycle with major boundary testing
7.4 -> 8.2
```

## Exceptions

When a specific minor version feature is required immediately and cannot wait for the next LTS-equivalent version.

## Consequences Of Violation

Wasted engineering cycles on multiple low-value upgrades, delayed migration to supported versions, prolonged exposure to EOL risks.

---

## Rule Name

Validate Extension Compatibility Before Upgrade

## Category

Maintainability

## Rule

Always verify that all installed PHP extensions are compatible with the target PHP version before upgrading.

## Reason

Extensions compiled against incompatible engine versions cause runtime crashes, missing functions, or silent failures. Full test suite validation alone may miss extension-level incompatibilities.

## Bad Example

```bash
# Upgraded without checking — imagick extension crashes on PHP 8.5
composer update
php artisan serve  # Segmentation fault
```

## Good Example

```bash
# Pre-upgrade check
php -m | grep -E '^(imagick|redis|mongodb|grpc)$'
# Verify each extension has a compatible version available
pecl install imagick  # Check exit code
```

## Exceptions

Containerized deployments where the base image provides all bundled extensions tested for the target version.

## Consequences Of Violation

Production crashes after upgrade, rollback delays, extended downtime, corrupted data from partial writes.

---

## Rule Name

Measure Baseline Before Migrating

## Category

Performance

## Rule

Always capture baseline throughput and latency benchmarks before upgrading PHP versions.

## Reason

Without a pre-migration baseline, it is impossible to verify that the upgrade delivered the expected performance gain or to detect regressions.

## Bad Example

```bash
# Upgraded to PHP 8.5 and observed "it feels faster" — no data
```

## Good Example

```bash
# Baseline before upgrade
ab -n 10000 -c 50 http://app.test/benchmark > baseline-php84.txt
# After upgrade
ab -n 10000 -c 50 http://app.test/benchmark > after-php85.txt
# Compare results
```

## Exceptions

Emergency security upgrades where the version change is forced and performance impact is accepted.

## Consequences Of Violation

Inability to quantify ROI of upgrade, undetected performance regressions, incorrect capacity planning.

---

## Rule Name

Stagger Production Rollout by Environment

## Category

Reliability

## Rule

Always deploy a new PHP version to a staging environment first, run the full test suite, then gradually roll out to production using a canary or blue-green strategy.

## Reason

PHP minor versions can introduce backward-compatibility breaks. Staged rollout catches failures before they affect all users.

## Bad Example

```bash
# Rolling restart of all application servers to PHP 8.5 simultaneously
```

## Good Example

```bash
# 1. Deploy to staging, run tests
# 2. Deploy to 10% of production servers
# 3. Monitor error rates for 30 minutes
# 4. Roll out to remaining servers
```

## Exceptions

Single-server deployments where phased rollout is not technically feasible (test on staging and accept the risk).

## Consequences Of Violation

Full production outage from undetected BC break, extended incident resolution time, user-facing errors.

---

## Rule Name

Subscribe to PHP Security Announcements

## Category

Security

## Rule

Maintain a subscription to the PHP security announcement mailing list and apply security patches within the vendor's recommended timeline.

## Reason

Critical CVEs are published without prior notice. Delayed patching leaves the application exposed to known exploits.

## Bad Example

```bash
# Discovered EOL status during a penetration test six months after the deadline
```

## Good Example

```bash
# Subscribe to PHP-announce list
# Track EOL dates on php.net/supported-versions.php
# Schedule upgrades 3 months before EOL
```

## Exceptions

No common exceptions.

## Consequences Of Violation

Unpatched critical CVEs, compliance violations, data breach exposure, emergency patching during incidents.
