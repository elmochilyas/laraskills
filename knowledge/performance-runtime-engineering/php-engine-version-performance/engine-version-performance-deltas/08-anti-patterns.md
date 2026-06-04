# Anti-Patterns: Engine Version Performance Deltas

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | PHP Engine Performance |
| Knowledge Unit | Engine Version Performance Deltas |
| Generated | 2026-06-03 |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|-------------|----------|----------|
| 1 | Assuming Version Upgrade Always Improves Performance | Expectation Management | High |
| 2 | Skipping Direct Upgrades Without Performance Validation | Methodology | High |
| 3 | Using Synthetic Benchmarks for Version Comparison | Methodology | High |
| 4 | Ignoring BC Breaks in Pursuit of Performance | Migration | Critical |
| 5 | Chasing Every Minor Version Release | Maintenance | Medium |

## Repository-Wide Anti-Patterns

- **Baseline neglect**: Comparing performance across PHP versions without a stable, reproducible benchmark baseline leads to false conclusions about version deltas.
- **Feature attraction**: Upgrading PHP versions for a single feature or announced performance improvement without measuring the actual impact on the specific application workload.
- **EOL procrastination**: Delaying version upgrades until security EOL, then being forced to upgrade without time for proper performance validation and regression testing.

---

## Anti-Pattern 1: Assuming Version Upgrade Always Improves Performance

### Category
Expectation Management

### Description
Assuming that upgrading to a newer PHP version automatically improves application performance, without recognizing that later versions (8.3+) show diminishing returns for web applications and that performance deltas vary significantly by workload type.

### Why It Happens
- PHP 8.0 was heavily marketed as "2x faster" (thanks to JIT), creating an expectation that every version brings similar gains
- Version release notes highlight improvements without quantifying workload-specific impact
- Industry pressure to stay current (security, compliance, ecosystem compatibility)
- Lack of application-specific benchmarks to measure actual delta per version
- Confusing synthetic benchmark improvements with real-world application gains

### Warning Signs
- "Upgrade for performance" cited as the primary reason without benchmarks
- Application is a standard CRUD web app (dominated by I/O, not CPU)
- Expected performance gain not quantified before the upgrade
- Previous version upgrade showed minimal gain but expectation remains for the next
- No performance regression testing planned as part of upgrade
- Synthetic benchmarks cited as justification for upgrade

### Why Harmful
Version upgrades are not free and may hurt performance:
- Each upgrade requires testing, validation, and deployment effort
- Some version increments introduce BC breaks that require code changes
- New features may have edge cases with performance regressions
- For I/O-bound applications (most web apps), CPU improvements provide marginal benefit
- PHP 8.3→8.4→8.5 deltas are much smaller than 7.4→8.0
- The upgrade effort may exceed any performance benefit

### Consequences
- Significant effort expended for 1-3% performance gain
- ROI negative when developer hours and testing effort are costed
- BC breaks introduced for marginal or zero performance benefit
- New PHP version may have different OpCache behavior affecting existing tuning
- JIT configuration changes between versions require re-validation
- Team distracted from higher-impact performance activities

### Alternative
Make data-driven upgrade decisions:
1. Run application-specific benchmarks (end-to-end, not synthetic) on current and target versions
2. Quantify the performance delta: RPS, p95 latency, memory consumption
3. Calculate ROI: upgrade effort (hours) vs performance gain (monetized)
4. If gain < 5%, deprioritize the upgrade for performance reasons alone
5. Weigh security, compliance, and feature benefits separately from performance
6. Document the measured delta for future upgrade planning

### Refactoring Strategy
1. Create a reproducible end-to-end benchmark of the application
2. Deploy the target PHP version to a staging environment
3. Run the benchmark against both versions with identical configuration
4. Compare RPS, p50/p95/p99 latency, and memory consumption
5. Document the delta and decide whether the upgrade effort justifies the gain
6. If the delta is marginal, skip the version and target the next major release

### Detection Checklist
- [ ] Application-specific benchmark performed for current vs target version
- [ ] Expected performance delta quantified before upgrade decision
- [ ] ROI calculated: upgrade effort vs performance gain vs other benefits
- [ ] Performance regression testing planned as part of upgrade
- [ ] Upgrade decision documented with data, not assumptions
- [ ] Marginal-gain upgrades deprioritized for later evaluation

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Version Numbering
- 05-rules.md: Benchmark Before Upgrading
- 07-decision-trees.md: Version Upgrade Decision Tree

---

## Anti-Pattern 2: Skipping Direct Upgrades Without Performance Validation

### Category
Methodology

### Description
Performing leapfrog upgrades (e.g., 7.4 → 8.2 directly) without validating the performance characteristics of intermediate versions, missing regressions that were introduced and then fixed in later versions, or experiencing cumulative performance issues.

### Why It Happens
- Leapfrogging reduces the number of upgrade cycles
- "Why test three versions when I can test one?"
- Time pressure to reach the target version quickly
- Assumption that later versions subsume all improvements of earlier ones
- Unawareness that performance can regress between minor versions

### Warning Signs
- Performance regression after leapfrog upgrade that can't be explained
- New performance issues that don't exist in either source or target version but appear in the combination
- OpCache or JIT behavior changed between versions in ways that interact
- Configuration parameter deprecations or behavior changes accumulate
- Performance testing only performed on source and target, not on intermediate versions

### Why Harmful
Leapfrog upgrades skip intermediate version behavior:
- A regression introduced in 8.1 and fixed in 8.2 is invisible in leapfrog
- The cumulative effect of multiple minor changes can produce unexpected performance profiles
- OpCache optimization level bitmask behavior changed between 8.0 and 8.3
- JIT counter mechanism and thresholds changed between versions
- Without intermediate testing, the cause of regressions is harder to isolate
- Rollback is more disruptive because multiple versions need to be reverted

### Consequences
- Unexplained performance regression after upgrade
- Inability to isolate which version change caused the regression
- Rolling back requires reverting through multiple version changes
- If the regression is in the target version, you must go to a different version
- Performance issues attributed to the leapfrog when they may be from individual versions
- Loss of confidence in future upgrades

### Alternative
For leapfrog upgrades:
1. Create a reproducible benchmark suite
2. Test each minor version boundary: 7.4→8.0, 8.0→8.1, 8.1→8.2, 8.2→8.3
3. Document the performance delta at each boundary
4. If any boundary shows a regression, investigate before proceeding
5. After leapfrog is complete, confirm end-to-end performance matches expectations
6. The final benchmark is what matters, but intermediate data helps isolate regressions

### Refactoring Strategy
1. Set up staging environments for the source, all intermediate, and target versions
2. Run the application benchmark suite on each version
3. Identify the largest positive and negative deltas
4. If negative deltas exist in intermediate versions, research the cause (likely a config change)
5. Apply appropriate configuration adjustments for the target version
6. Document the delta at each boundary for future upgrade planning

### Detection Checklist
- [ ] Leapfrog upgrade tested at each major version boundary
- [ ] Intermediate version performance data collected and reviewed
- [ ] Any negative deltas investigated and understood
- [ ] Target version configuration adjusted based on intermediate learnings
- [ ] End-to-end leapfrog performance confirmed acceptable
- [ ] Rollback plan accounts for multiple version changes

### Related Rules, Skills, Trees
- 05-rules.md: Test Each Version Boundary
- 07-decision-trees.md: Leapfrog vs Incremental Upgrade Decision Tree

---

## Anti-Pattern 3: Using Synthetic Benchmarks for Version Comparison

### Category
Methodology

### Description
Using synthetic microbenchmarks (e.g., phpbench, arithmetic loops, function call overhead) to compare PHP version performance, and extrapolating those results to predict real-world application behavior — ignoring that application performance is dominated by I/O, framework overhead, and workload-specific characteristics.

### Why It Happens
- Synthetic benchmarks are easy to run and produce clean, reproducible numbers
- Online articles and PHP release notes cite synthetic benchmark improvements
- Running a full application benchmark requires staging environment, test data, and tool setup
- Microbenchmarks satisfy the need for "objective" comparison without context
- Unawareness of how dramatically real-world behavior differs from microbenchmarks

### Warning Signs
- Version comparison uses phpbench or similar microbenchmark suite
- Results show 10-30% improvement for the application based on synthetic tests
- Application workloads (database, I/O, templating) not included in benchmark
- Only CPU-bound operations measured (loops, function calls, array operations)
- No end-to-end request benchmark with realistic payload and concurrency
- Synthetic benchmark results cited as justification for production upgrade

### Why Harmful
Synthetic benchmarks do not predict real-world performance:
- A 30% improvement in function call overhead is invisible in an application spending 70% of time on I/O
- Database query performance, network latency, and framework bootstrap dominate real-world response time
- Microbenchmark improvements may not translate to any measurable end-to-end gain
- False confidence in upgrade benefits leads to effort without payoff
- Real regressions (e.g., OpCache memory behavior change) are missed by synthetic tests

### Consequences
- Upgrade effort expended for no measurable end-to-end improvement
- Performance regression from version change missed because synthetic tests passed
- Incorrect priority: upgrading PHP instead of optimizing database queries (where real gains are)
- Team misled about the value of version upgrades for performance
- Synthetic benchmark in CI may pass while real performance regresses

### Alternative
Match benchmark type to decision:
- Version upgrade decisions: use end-to-end application benchmarks with realistic workloads
- Component-level optimization: use microbenchmarks for the specific component only
- For version comparisons: benchmark the actual endpoints users will hit
- Include database queries, template rendering, middleware, and framework bootstrap
- Measure at realistic concurrency levels, not single-request latency

### Refactoring Strategy
1. Identify 3-5 endpoints that represent the application's traffic profile
2. Create a load test script (k6) that exercises these endpoints with realistic think times
3. Run the load test against both PHP versions in an identical environment
4. Measure RPS, p50/p95/p99 latency, error rate, and memory consumption
5. Use these results, not synthetic benchmarks, for the upgrade decision
6. If synthetic benchmarks are used, label them clearly as non-representative

### Detection Checklist
- [ ] Version comparison uses end-to-end application benchmarks
- [ ] Realistic endpoints (with DB, templates, middleware) included in benchmark
- [ ] Synthetic benchmarks explicitly labeled as non-representative if included
- [ ] Upgrade decisions based on end-to-end results, not microbenchmarks
- [ ] concurrency levels in benchmark match production traffic patterns
- [ ] Results show RPS, p95 latency, and memory, not just "X% faster"

### Related Rules, Skills, Trees
- 05-rules.md: Benchmark with Realistic Workloads
- 06-skills.md: Design and Execute a Benchmark Campaign
- 07-decision-trees.md: Benchmark Type Selection Decision Tree

---

## Anti-Pattern 4: Ignoring BC Breaks in Pursuit of Performance

### Category
Migration

### Description
Upgrading PHP versions primarily for performance, neglecting to inventory and test for backward compatibility breaks, deprecations, and behavior changes that may break the application, create security issues, or degrade reliability.

### Why It Happens
- Performance improvements are the visible headline — BC breaks are in the fine print
- PHP attempts to minimize BC breaks, creating a false sense of safety
- Application test coverage may be insufficient to catch BC break issues
- "It compiled, so it must work" assumption
- Pressure to upgrade quickly for performance, skipping thorough compatibility testing

### Warning Signs
- UPGRADING guide not read before migration
- Deprecation warnings ignored during development testing
- Test suite coverage is below 80% and doesn't exercise all code paths
- Application uses PHP features that have changed behavior (comparison, type coercion, string handling)
- Third-party dependencies not verified for target PHP version compatibility
- Rollback plan not prepared before upgrade

### Why Harmful
BC breaks can cause more damage than performance gains provide:
- A silent behavior change (e.g., JSON encoding, string comparison) can corrupt data
- Application features break in subtle ways that surface days or weeks after upgrade
- Security-critical functions may have changed behavior (e.g., crypt(), password_hash())
- PHP extension incompatibility can cause crashes or undefined behavior
- Third-party packages may not support the new version, breaking critical functionality
- Emergency rollback during production incidents is stressful and risky

### Consequences
- Production incidents from behavior changes, not crashes
- Data corruption from changed serialization or encoding behavior
- Silent failures that accumulate over time before detection
- Emergency rollback deploying the old PHP version
- Loss of confidence in future upgrades
- Team spending weeks fixing breakage instead of delivering features

### Alternative
Treat version upgrades as application migrations, not configuration changes:
1. Read the UPGRADING guide for each minor version boundary
2. Run the application test suite on the target version and fix all failures
3. Enable deprecation warnings and treat them as errors during development
4. Verify all third-party dependencies support the target version
5. Run behavioral integration tests (not just unit tests) to catch subtle changes
6. Prepare a rollback plan and test it before production deployment
7. Deploy gradually: canary before full rollout

### Refactoring Strategy
1. Read PHP version UPGRADING guides for all boundaries being crossed
2. Run php -l (lint) on all files — this catches syntax-related BC breaks
3. Run the full test suite on the target version with E_ALL error reporting
4. Fix all test failures and address all deprecation warnings
5. Verify third-party dependency compatibility using composer outdated or packagist
6. Deploy to staging and run full integration tests before production
7. Monitor for behavioral differences in error logs during staging testing

### Detection Checklist
- [ ] UPGRADING guides read for each version boundary
- [ ] Test suite passes on target version with zero deprecation warnings
- [ ] All third-party dependencies verified compatible with target version
- [ ] Behavioral integration tests pass (not just unit tests)
- [ ] Rollback plan tested and ready
- [ ] Deployment phased: canary → partial → full rollout
- [ ] Error monitoring configured to catch post-upgrade issues

### Related Rules, Skills, Trees
- 05-rules.md: Test BC Breaks Before Performance
- 07-decision-trees.md: Upgrade Readiness Decision Tree

---

## Anti-Pattern 5: Chasing Every Minor Version Release

### Category
Maintenance

### Description
Upgrading PHP to every new minor version (8.3 → 8.4 → 8.5) immediately upon release, consuming significant engineering effort for marginal performance gains that could be better spent on other optimizations.

### Why It Happens
- Fear of "falling behind" on PHP versions
- Not distinguishing between active support and security-only support timelines
- Belief that every minor release brings critical improvements
- Organizational policy requiring "latest version" without considering ROI
- Performance team wanting to try latest features immediately

### Warning Signs
- Application upgraded to PHP 8.4 within a month of release, then 8.5 within a month
- Each upgrade cycle costs more in engineering time than the performance gained
- Performance benchmarks show < 2% improvement per version upgrade
- BC break fixes consume more time than feature development
- Team expresses exhaustion from constant upgrade cycles
- Upgrades are reactive to new releases rather than planned on a schedule

### Why Harmful
PHP 8.3+ versions show diminishing returns for web applications (0.5-3% per version):
- Each upgrade requires: dev environment updates, CI pipeline changes, dependency verification, test suite fixes, deployment process changes
- Cumulative 3-5% gain from 8.3→8.5 may not justify the total engineering cost
- Team energy consumed by upgrades is unavailable for higher-impact performance work
- Multiple upgrades increase the risk of a BC break causing a production incident
- The upgrade treadmill creates fatigue and reduces attention to quality

### Consequences
- Significant engineering cost for marginal performance gain
- Team distracted from higher-impact work (database optimization, caching, architecture)
- Multiple opportunities for BC break incidents (each upgrade is a risk)
- Fatigue and reduced thoroughness in testing after repeated upgrades
- Inconsistent environment management (different stages on different versions)
- Difficulty tracking which version characteristics are relevant

### Alternative
Adopt a deliberate upgrade cadence:
- Align upgrades with the application's development cycle (quarterly or bi-annual)
- Upgrade to the latest version when the current version approaches security-only support
- Skip minor versions: upgrade from 8.3 to 8.5 directly (leapfrog within active support)
- Invest saved upgrade effort in profiling and optimizing the actual application bottleneck
- Only upgrade for performance when benchmarks show > 5% end-to-end improvement
- Prioritize security upgrades over performance upgrades

### Refactoring Strategy
1. Calculate the engineering cost of the last three upgrades (hours × hourly rate)
2. Measure the performance gain of the same upgrades (RPS, p95 latency, error rate)
3. Calculate ROI: cost vs. benefit (monetized as infrastructure savings or user experience)
4. If ROI is negative, move to a slower upgrade cadence (every 12-18 months)
5. Invest saved engineering time in profiling and optimizing the actual application bottleneck
6. Schedule upgrades to coincide with other infrastructure changes to reduce overhead

### Detection Checklist
- [ ] Upgrade cadence defined and documented (not reactive to releases)
- [ ] Engineering cost of upgrades tracked and reviewed
- [ ] Performance gain per upgrade measured and reviewed
- [ ] ROI calculated for upgrade program
- [ ] Lower-ROI upgrades deferred in favor of higher-impact performance work
- [ ] Security-only versions clearly distinguished from active support versions
- [ ] Team has bandwidth to perform upgrades thoroughly

### Related Rules, Skills, Trees
- 04-standardized-knowledge.md: PHP Version Numbering
- 05-rules.md: Plan Upgrade Cadence Deliberately
- 07-decision-trees.md: Upgrade Timing Decision Tree
