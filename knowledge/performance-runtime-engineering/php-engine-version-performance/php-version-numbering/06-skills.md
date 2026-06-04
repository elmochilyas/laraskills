# Skill: Plan a PHP Version Upgrade Based on Version Numbering Semantics

## Purpose

Navigate PHP's version numbering scheme (major.minor.patch) to plan upgrades that balance new features, performance improvements, and stability.

## When To Use

- Evaluating whether to adopt a new PHP minor or major version
- Planning the upgrade cadence for production deployments
- Understanding the support lifecycle and security patch availability

## When NOT To Use

- For emergency security patches (always apply immediately regardless of version planning)
- When the application has confirmed incompatibilities with the target version

## Prerequisites

- Current PHP version and target version identified
- Application dependency list (Composer packages, extensions)
- Understanding of PHP's support policy (2 years active, 1 year security)

## Inputs

- Current PHP version: `php -v`
- Target PHP version release notes and changelog
- Composer dependency compatibility report
- PHP version support timeline (php.net/supported-versions.php)

## Workflow (numbered steps)

1. Identify current PHP version and check its support status on php.net/supported-versions.php
2. If current version is in "security fixes only" phase (last year), plan upgrade within 3 months
3. If current version is end-of-life, treat as critical — upgrade immediately
4. Select target version: for production stability, choose the latest minor of the current major (e.g., 8.3.x if on 8.2.x)
5. For new projects, use the latest stable major.minor release (e.g., 8.4)
6. Run `composer update --dry-run` with target PHP version constraint to check package compatibility
7. Set up a staging environment with target PHP version and run full test suite
8. Benchmark performance delta (see Engine Version Performance Deltas skill)
9. Deploy using blue-green strategy with rollback to current PHP version if issues arise
10. After deployment, update composer.json require.php version to match target

## Validation Checklist

- [ ] Current PHP version support status confirmed
- [ ] Target version selected based on stability and feature requirements
- [ ] Composer dependencies tested with target version
- [ ] Full test suite passes on target version
- [ ] Performance benchmark completed (no regression)
- [ ] Rollback plan documented
- [ ] composer.json PHP constraint updated

## Common Failures

- **Using end-of-life PHP versions**: No security patches available — critical vulnerabilities unpatched
- **Jumping major versions without testing**: PHP 7.4 -> 8.0 has significant breaking changes; test thoroughly
- **Ignoring extension compatibility**: Third-party extensions may not support the new version
- **Upgrading to .0 release**: x.y.0 releases may have undiscovered bugs — wait for x.y.1 or later for production

## Decision Points

- If current version is EOL: upgrade immediately (highest priority)
- If current version is in security-only phase: plan upgrade within quarter
- If current version is actively supported: upgrade at next planned maintenance window
- For new projects: use latest stable version (8.4 as of 2026)

## Performance Considerations

- Each minor version typically provides 2-5% real-world throughput improvement
- Major versions (7.x -> 8.x) provide 10-30% improvement
- JIT improvements compound across versions (8.0 -> 8.4 provides significant CPU-bound gains)
- Typed properties, fibers, and other features enable new optimization patterns

## Security Considerations

- Only supported PHP versions receive security patches — running EOL versions is a security risk
- New versions deprecate unsafe features and improve sandboxing
- Test all security-critical extensions for compatibility before upgrading

## Related Rules (from 05-rules.md)

- Never Run End-of-Life PHP in Production
- Test Full Suite Before Version Upgrade
- Maintain Rollback Capability

## Related Skills

- Engine Version Performance Deltas Measurement
- Dependency Compatibility Validation
- Deployment Cache Invalidation

## Success Criteria

- PHP version upgrade completed with zero production incidents
- Full test suite passes on target version
- Performance meets or exceeds baseline
- composer.json updated and committed
- Support timeline for new version documented
