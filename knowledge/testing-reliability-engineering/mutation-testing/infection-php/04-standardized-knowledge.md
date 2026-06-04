# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mutation Testing |
| Knowledge Unit | Infection PHP Mutation Testing |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Test coverage concepts, PHPUnit/Pest fundamentals, Test writing best practices |
| Related KUs | Pest mutation testing, Coverage reporting and enforcement, Test quality metrics |
| Source | domain-analysis.md K038 |

# Overview

Infection PHP is a standalone mutation testing framework for PHP projects that evaluates test suite quality by introducing controlled faults (mutations) into the codebase and checking whether the test suite detects them. A surviving mutation indicates untested behavior — code that executes but whose correctness is not verified by any assertion. Infection PHP provides deeper configuration than Pest's built-in mutation testing, supporting custom mutators, differential mutation (changed lines only), and MSI (Mutation Score Indicator) threshold enforcement.

# Core Concepts

- **Mutation**: A single intentional change to source code (e.g., `>` to `>=`, removing a method call).
- **Killed mutation**: Test suite fails when mutation is introduced. Good — tests detect the change.
- **Survived mutation**: Test suite passes despite mutation. Bad — code change undetected.
- **MSI (Mutation Score Indicator)**: `killed / (killed + survived) × 100`. Target: >70% for critical paths.
- **Mutator**: A specific type of mutation. Infection includes 60+ mutators.
- **Coverage-guided mutation**: Only mutates code covered by the test suite.
- **Differential mutation**: Mutates only lines changed in a particular diff.

# When To Use

- For pre-release quality assessment (full mutation run before deployment)
- For CI gates on critical code paths (differential mutation per PR)
- When measuring actual test quality (not just code coverage)
- For team-wide test quality improvement initiatives

# When NOT To Use

- For quick local feedback during development (use Pest mutation instead)
- When the test suite has very low code coverage (<30%) — fix coverage first
- For trivial code changes (documentation, comments, config)
- When CI resources are limited (full mutation runs are resource-intensive)

# Best Practices (WHY)

- **Use differential mutation for CI gates, full mutation for nightly**: Differential mutation (`--git-diff-filter=AM`) runs in 1-5 minutes per PR. Full mutation runs 10-60 minutes. Both have complementary roles.
- **Always use coverage optimization**: Infection's first run collects coverage. Subsequent mutation runs only execute tests covering the mutated line. Without this, mutation is 10x slower.
- **Set achievable MSI targets**: Start at 60-70% overall MSI, 70-80% covered MSI. Unrealistic targets (100%) cause the team to ignore MSI entirely.
- **Use Infection baseline for known acceptable survivors**: Some mutations produce semantically equivalent code. Use `--generate-baseline` to suppress known survivors and focus on genuine issues.
- **Set per-module MSI targets**: Critical paths (billing, auth) should target 80%+ MSI. Utility modules may accept 50%+.

# Architecture Guidelines

- **Infection vs Pest mutation**: Infection for comprehensive analysis (CI gates, release quality). Pest mutation for quick local feedback.
- **Full vs differential**: Full mutation for pre-release and scheduled nightly runs. Differential mutation for per-commit CI.
- **MSI configuration**: Overall MSI `--min-msi=60`, covered MSI `--min-covered-msi=70`.

# Performance Considerations

- Initial coverage collection: same time as running tests with coverage (pcov).
- Per-mutation test execution: ~100-500ms per mutation (coverage-guided, only relevant tests).
- Total mutation time: For 1000 mutations at 200ms each = ~200s + initial coverage.
- Parallel execution: `--threads=4` reduces by ~3.5x.
- Differential mutation: 1-5 minutes. Fast enough for CI.
- Memory: 100-500MB RAM for large codebases.

# Security Considerations

- Mutation testing on security-critical code (auth, encryption, validation) is essential. A surviving mutation in auth logic could mean a missing test for an auth bypass vulnerability.
- Ensure mutation test reports are not publicly accessible (they reveal internal code logic).

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running full mutation on every PR | "Want 100% quality on every change" | 30-minute CI delay for a one-line fix | Differential on PRs; full mutation on merge/nightly |
| Using Infection without coverage optimization | Not using `--coverage` | Runs full test suite for every mutation; 10x slower | Always run coverage collection first |
| Setting unrealistically high MSI targets | `--min-msi=100` | Impossible; team ignores MSI entirely | Start at 60-70%; escalate gradually |
| Ignoring uncovered code mutations | "Uncovered code doesn't affect MSI" | Untested code grows silently | Set `--min-covered-msi` separately; track uncovered code |
| Not using baseline for equivalent mutations | Expecting 100% kill rate on all mutators | Noise from semantically equivalent survivors | Generate baseline; review quarterly |

# Anti-Patterns

- **Full mutation on every commit**: Resource-intensive and slow. Use differential mutation for PRs.
- **No coverage optimization**: Running mutation without initial coverage collection. Extremely slow.
- **MSI as a vanity metric**: Setting high targets but not reviewing surviving mutations. A high MSI doesn't guarantee quality if survivors are in critical paths.
- **Ignoring Infection reports**: Running mutation but never reviewing the HTML/JSON output. The report shows exactly what behaviors are untested.

# Examples

```bash
# Full mutation run before release
vendor/bin/infection --min-msi=70 --min-covered-msi=80 --threads=max

# Differential mutation in CI (per-PR)
vendor/bin/infection --git-diff-filter=AM --min-msi=80 --threads=4

# Generate baseline for acceptable survivors
vendor/bin/infection --generate-baseline

# Run with specific configuration
vendor/bin/infection --configuration=infection.json --threads=4 --log-html=report.html
```

```json
// infection.json
{
    "source": {
        "directories": ["app"]
    },
    "mutators": {
        "@default": true
    },
    "minMsi": 70,
    "minCoveredMsi": 80
}
```

# Related Topics

- **Prerequisites**: Test coverage concepts, PHPUnit/Pest fundamentals, Test writing best practices
- **Related**: Pest mutation testing, Coverage reporting and enforcement, Test quality metrics
- **Advanced**: Custom mutator development, Infection baseline strategies, Mutation testing for legacy codebases

# AI Agent Notes

- Pest mutation testing is built on Infection's engine. Start with Pest mutation for local use; migrate to Infection for comprehensive CI analysis.
- Differential mutation is the key to making mutation testing practical in CI. Without it, full mutation runs are too slow for per-commit feedback.
- A surviving mutation is not always a bug — some mutations produce equivalent code. Use baselines to suppress known acceptable survivors.

# Verification

- [ ] Infection is configured with appropriate MSI thresholds (60-70% overall, 70-80% covered)
- [ ] Coverage optimization is enabled
- [ ] Differential mutation is used for per-PR CI gates
- [ ] Full mutation runs are scheduled (nightly/weekly pre-release)
- [ ] Infection baseline is generated and committed for acceptable survivors
- [ ] MSI targets are set per-module (higher for critical paths)
- [ ] Surviving mutations are reviewed as a team
- [ ] Infection reports (HTML/JSON) are reviewed regularly
