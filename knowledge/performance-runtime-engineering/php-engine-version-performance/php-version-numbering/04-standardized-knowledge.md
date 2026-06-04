# Standardized Knowledge: PHP Version Numbering

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | PHP Version Numbering |
| Difficulty | Foundation |
| Lifecycle | Maintain, Plan |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

PHP follows a yearly release cadence with a new minor version every November. Each version receives **2 years of active support** (bug fixes) and **1 additional year of security support** (critical fixes only). As of 2026, PHP 8.5 is the latest release; PHP 8.0 and 8.1 have reached End of Life.

## Core Concepts

- **Version scheme**: `major.minor.patch` — PHP 8.5.0 (major=8, minor=5, patch=0).
- **Active support**: ~2 years from release date — bug fixes, performance improvements, security patches.
- **Security support**: ~1 additional year — security fixes only.
- **Current timeline (2026)**: PHP 8.5 (active), 8.4 (security only), 8.3 (security only, ending soon), 8.2 (EOL), 8.1 (EOL), 8.0 (EOL).
- **Migration window**: Teams should upgrade within 2 years of a release to remain on supported versions.

## When To Use

- Planning PHP version upgrade cycles
- Determining whether to upgrade or stay on a current version
- Evaluating security support timelines for compliance
- Building migration roadmaps

## When NOT To Use

- When making performance tuning decisions (focus on profiling instead)
- As a substitute for testing compatibility before upgrade
- For understanding specific version features (refer to version-specific KUs)

## Best Practices (WHY)

- **Leapfrog upgrades**: Skip intermediate versions when migrating (e.g., 7.4 to 8.2 directly) to reduce migration cycles. Test each major boundary separately.
- **Upgrade before EOL**: Plan migrations to complete before the version reaches End of Life. Running EOL versions exposes the application to unpatched security vulnerabilities.
- **Stagger production rollout**: Deploy the new PHP version to a staging environment first, run the full test suite, then gradually roll out to production.
- **Monitor the community**: Security announcements are published on php.net and the PHP mailing list. Subscribe for critical notifications.

## Performance

- PHP version upgrades provide 1-26% throughput improvement per version (8.0 was the largest)
- Cumulative 48.6% gain from 7.4 to 8.3 in real-world benchmarks
- Later versions (8.3+) offer diminishing returns for web applications
- Performance gain is secondary to security and compatibility considerations

## Security

- PHP 7.4, 8.0, 8.1, and 8.2 have reached End of Life — no security patches
- CVE exploits targeting known PHP vulnerabilities appear regularly for EOL versions
- Running unsupported versions violates compliance requirements (PCI-DSS, SOC2)
- Security-only support means only critical fixes — minor vulnerabilities go unfixed

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running EOL versions | Neglecting maintenance, fear of breaking changes | No security patches, compliance violations | Plan upgrades before EOL deadline |
| Upgrading every minor version | Assuming each upgrade is critical | Wasted testing cycles | Leapfrog to the version you need |
| Not testing before upgrade | Assuming backward compatibility | BC breaks in production | Run full test suite on staging first |
| Ignoring extension compatibility | Only checking PHP itself | Extension breakage blocks upgrade | Verify all extensions support target version |

## Anti-Patterns

- **Chasing every release**: Minor version upgrades for marginal gains waste effort. Leapfrog to the version that provides the features or security support you need.
- **Delaying upgrades indefinitely**: The risk of running EOL PHP increases over time. Plan upgrades as part of the regular maintenance cycle.
- **Assuming "it works" without a test suite**: PHP minor versions can contain BC breaks. Always verify with automated tests.

## Examples

```bash
# Check current PHP version
php -v

# List supported PHP versions (2026)
# 8.5: Active support (bug fixes + security)
# 8.4: Security support only
# 8.3: Security support only (ending soon)
# 8.2: End of Life — upgrade immediately
# 8.1: End of Life — upgrade immediately
# 8.0: End of Life — upgrade immediately

# Check extension compatibility
php -m | grep -i extension_name
```

## Related Topics

- Engine Version Performance Deltas
- Version Migration Planning
- PHP Version Support Timeline

## AI Agent Notes

- PHP releases a new minor version every November.
- Active support = 2 years. Security support = 1 additional year. Total = 3 years per version.
- As of 2026: PHP 8.5 is the active release. PHP 8.0-8.2 are EOL.
- Leapfrog upgrades (e.g., 7.4 to 8.2 directly) reduce migration cycles.
- Security is the primary reason to upgrade — performance gains are secondary for later versions.

## Verification

- [ ] Current PHP version is actively supported (not EOL)
- [ ] Version upgrade plan includes leapfrog strategy
- [ ] Test suite passes on target PHP version
- [ ] All extensions are compatible with target version
- [ ] Deployment pipeline supports the new version
- [ ] Security support timeline verified for all production environments
