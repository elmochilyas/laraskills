# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Mutation Testing
Knowledge Unit: Infection PHP Mutation Testing
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary
Infection PHP is a standalone mutation testing framework for PHP projects that evaluates test suite quality by introducing controlled faults (mutations) into the codebase and checking whether the test suite detects them. A surviving mutation indicates untested behavior — code that executes but whose correctness is not verified by any assertion. Infection PHP provides deeper configuration than Pest's built-in mutation testing, supporting custom mutators, differential mutation (changed lines only), and MSI (Mutation Score Indicator) threshold enforcement. It integrates with both PHPUnit and Pest test frameworks and is the standard tool for teams that need comprehensive mutation analysis beyond Pest's built-in capabilities.

# Core Concepts
- **Mutation**: A single intentional change to source code. E.g., changing `>` to `>=`, removing a method call, replacing a return value with `null`.
- **Killed mutation**: The test suite fails when a mutation is introduced. Means the tests detect the change. Good.
- **Survived mutation**: The test suite still passes when a mutation is introduced. Means the code change was not detected by any test. Bad.
- **MSI (Mutation Score Indicator)**: Percentage of mutations killed: `killed / (killed + survived) × 100`. Target: >70% for critical paths.
- **Mutator**: A specific type of mutation. Infection includes 60+ mutators: `Plus`, `Minus`, `TrueValue`, `FalseValue`, `ReturnValue`, `MethodCallRemoval`, etc.
- **Coverage-guided mutation**: Infection only mutates code covered by the test suite. Uncovered code is not mutated (surviving mutation would be guaranteed).
- **Differential mutation**: Infects only lines changed in a particular diff. Used for CI to provide fast feedback on new/changed code.
- **Escaped mutation**: A mutation that survives but is semantically equivalent (e.g., formatting changes). Rarely problematic but can reduce MSI.

# Mental Models
- **Mutation testing as test quality meter**: Code coverage answers "what code ran?" Mutation testing answers "what did the test assert about that code?" High coverage with low MSI means many assertions but weak verification.
- **Surviving mutation as untested contract**: Each surviving mutation is a behavior that the team implicitly accepted could change without detection. Every surviving mutation is a risk.
- **MSI threshold as quality floor**: Like coverage `--min`, MSI `--min-msi` provides a gate. Unlike coverage, MSI is hard to game — you need meaningful assertions, not just code execution.
- **Differential mutation as targeted review**: Full mutation runs are slow (minutes to hours). Differential mutation (changed lines only) is fast enough for CI per-commit feedback.

# Internal Mechanics
- **Mutation process**: Infection parses source code into AST → applies mutators one at a time → runs test suite for each mutation → records killed/survived/uncovered → generates report.
- **Mutator application**: Each mutation is isolated. Infection runs the test suite once per mutation (optimized: initial test run captures coverage, only tests covering the mutated line are re-run).
- **Coverage optimization**: First run collects code coverage. Subsequent mutation runs only execute tests that cover the mutated line. Reduces total time significantly (50-80%).
- **Configuration**: `infection.json` or `infection.json5` defines source directories, mutators, MSI thresholds, and test framework configuration.
- **Infection in CI**: `vendor/bin/infection --min-msi=70 --min-covered-msi=80 --threads=4 --git-diff-filter=AM`. The `--git-diff-filter=AM` enables differential mutation.
- **Log files**: Infection produces JSON, text, and HTML log files. HTML log shows mutated files with inline diff of each mutation.

# Patterns
- **Pattern: Full mutation run before release**
  - Purpose: Comprehensive quality assessment before deployment
  - Benefits: Catches all untested behaviors; complete confidence
  - Tradeoffs: Slow (10-60 minutes for medium codebase)
  - Implementation: `vendor/bin/infection --min-msi=70 --threads=max`

- **Pattern: Differential mutation in CI (per-PR)**
  - Purpose: Fast mutation feedback on changed code only
  - Benefits: <2 minutes per PR; catches untested new code
  - Tradeoffs: Does not catch untested existing code
  - Implementation: `vendor/bin/infection --git-diff-filter=AM --min-msi=80 --threads=4`

- **Pattern: MSI threshold escalation**
  - Purpose: Gradually improve test quality
  - Benefits: Achievable incremental goals
  - Tradeoffs: Requires periodic adjustment
  - Implementation: Start `--min-msi=60`, increase by 5 every quarter, target 80+

- **Pattern: Mutator exclusion for pragmatic testing**
  - Purpose: Exclude mutators that produce invalid or irrelevant mutations
  - Benefits: Reduces noise; focuses on meaningful mutators
  - Tradeoffs: May miss some mutation types
  - Implementation: In `infection.json`, set `"mutators": { "global-ignore": ["DecrementInteger", "IncrementInteger"] }`

- **Pattern: Escaped mutation baseline**
  - Purpose: Suppress known acceptable escaped mutations
  - Benefits: Clean MSI report; focus on genuine issues
  - Tradeoffs: Risk of suppressing important mutations if not careful
  - Implementation: Use Infection's baseline feature: `vendor/bin/infection --generate-baseline`

# Architectural Decisions
- **Infection vs Pest mutation**: Use Infection for comprehensive mutation analysis (CI gates, release quality checks). Use Pest mutation for quick local feedback during development. Infection is more configurable and has more mutators.
- **Full vs differential mutation**: Full mutation for pre-release and scheduled nightly runs. Differential mutation for per-commit CI gates. Both have complementary roles.
- **MSI threshold configuration**: Start with 60% for overall MSI, 70% for covered MSI (mutations on covered code). These are achievable targets that provide meaningful quality signal.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Deep test quality assessment | 10-60 minutes for full run | Use differential for PRs; full for nightly |
| Hard to game (unlike coverage) | Configuration overhead | Use Infection JSON config; share across team |
| 60+ mutator types | Some mutators produce equivalent mutations | Exclude noisiest mutators via config |
| Coverage-guided optimization | Still slower than test suite | Use `--threads` for parallel execution |

# Performance Considerations
- Initial coverage collection: same time as running tests with coverage (pcov recommended).
- Per-mutation test execution: ~100-500ms per mutation (coverage-guided, only relevant tests re-run).
- Total mutation time: For 1000 mutations at 200ms each = 200 seconds + initial coverage time.
- Parallel execution: `--threads=4` reduces total time by ~3.5x. `--threads=max` uses all CPU cores.
- Differential mutation: 1-5 minutes for typical PR changes. Fast enough for CI.
- Memory: Infection can use 100-500MB RAM for large codebases. Ensure CI runner has sufficient memory.

# Production Considerations
- **CI schedule**: Run full mutation testing nightly or weekly. Differential mutation on every PR.
- **MSI enforcement**: Set `--min-msi` in CI. If MSI drops below threshold, CI fails. But beware: MSI can fluctuate due to test timing or random data.
- **Baseline management**: Infection baseline (JSON file) stores known escaped mutations. Commit baseline and review quarterly. Update when mutators are added or removed.
- **Team training**: Teach developers to read Infection reports. A surviving mutation report shows exactly what behavior is untested. Fixing a surviving mutation means adding a test assertion for that behavior.
- **Resource planning**: Full mutation run on a large codebase (50k+ LOC) may take 1+ hours. Schedule during off-peak CI hours or on dedicated runners.

# Common Mistakes
- **Mistake: Running full mutation on every PR**
  - Why: "Want 100% quality assurance on every change"
  - Why harmful: 30-minute CI delay for a one-line comment fix
  - Better: Differential mutation on PRs; full mutation on merge or nightly

- **Mistake: Using Infection without coverage optimization**
  - Why: Not using `--coverage` or skipping initial coverage run
  - Why harmful: Infection runs full test suite for every mutation; 10x slower
  - Better: Always run coverage collection first; use `--coverage` cache

- **Mistake: Setting unrealistically high MSI targets**
  - Why: `--min-msi=100` for the whole codebase
  - Why harmful: Impossible to achieve; team ignores MSI entirely
  - Better: Start at 60-70%; target aggressive but achievable levels

- **Mistake: Ignoring uncovered code mutations**
  - Why: "Uncovered code doesn't affect MSI"
  - Why harmful: Uncovered code has 0% mutation score; untested code grows silently
  - Better: Set `--min-covered-msi` separately; track uncovered code coverage over time

# Failure Modes
- **Mutation digestion time**: Large mutation sets may take hours. Infection's "digesting" phase (parsing and preparing mutations) can take 5-10 minutes. Be patient or configure smaller scope.
- **Memory exhaustion**: Infection on a large codebase with all mutators may exceed PHP memory limit. Increase memory limit or reduce scope.
- **False surviving mutations**: Mutators that produce semantically equivalent code (e.g., `++$i` vs `$i += 1`). These survive because behavior is identical. Use baseline to suppress known false survivors.
- **Parallel execution race conditions**: Tests that depend on test execution order may fail when parallelized. `--threads=1` is more reliable but slower.
- **Configuration drift**: As the codebase evolves, `infection.json` source directories may become outdated. Review configuration when new modules are added.

# Ecosystem Usage
- **Infection PHP**: The standard mutation testing tool for PHP. Used by PHPUnit, Symfony, and Laravel core projects. Available at `infection.github.io`.
- **Laravel core**: Laravel uses Infection in its CI pipeline for critical path mutation analysis. The framework's high test coverage is complemented by mutation testing validation.
- **Symfony**: Symfony project uses Infection with a minimum MSI of 80%. Provided inspiration for Laravel adoption.
- **PHPUnit**: PHPUnit itself uses Infection to validate its test suite quality. PHPUnit's coverage + mutation approach is the model for Laravel testing best practices.

# Related Knowledge Units
- **Prerequisites**: Test coverage concepts, PHPUnit/Pest fundamentals, Test writing best practices
- **Related Topics**: Pest mutation testing, Coverage reporting and enforcement, Test quality metrics
- **Advanced Follow-up**: Custom mutator development, Infection baseline strategies, Mutation testing for legacy codebases

# Research Notes
- Infection PHP is the most widely adopted mutation testing tool in the PHP ecosystem, with 2000+ GitHub stars and integration with major frameworks (Laravel, Symfony, WordPress)
- The `--git-diff-filter=AM` feature enables differential mutation testing, which makes mutation testing practical for CI by limiting analysis to changed lines
- Infection's coverage-guided execution mode (default since v0.27) is a significant performance improvement; it reduced full mutation run times by 60-80% compared to the naive per-mutation full suite approach
- The Laravel community lags behind the Symfony community in mutation testing adoption; this is attributed to Pest's dominance in Laravel (Infection has historically been PHPUnit-centric) and the relative newness of Pest's built-in mutation feature
- MSI targets should be set per module, not globally; critical paths (billing, auth) should target 80%+ MSI while utility modules may accept 50%+
