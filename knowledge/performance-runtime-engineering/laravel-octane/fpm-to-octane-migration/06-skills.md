# Skill: Perform FPM-to-Octane Migration with Structured Audit and Canary Rollout

## Purpose
Migrate a Laravel application from PHP-FPM to Octane through a structured 5-phase process: static property elimination, service provider audit, singleton-to-scoped migration, state leak testing, and canary production rollout with rollback readiness.

## When To Use
- Migrating a production PHP-FPM Laravel application to Octane for throughput improvements
- When the application has been audited and confirmed Octane-compatible in principle
- When the team has prepared for the execution model change (training, documentation, runbooks)
- When a business case for Octane migration has been approved based on gain estimation

## When NOT To Use
- For greenfield applications starting with Octane from day one (no migration needed)
- When Octane-incompatible packages cannot be replaced or refactored
- When the team lacks capacity for thorough concurrent request testing and soak testing
- When the application relies on `$_SESSION`, `$_REQUEST`, or other superglobal manipulation
- When the application uses `ext-pcntl` features that conflict with Octane's process management

## Prerequisites
- Octane gain estimation completed (bootstrap proportion measured, business case approved)
- Octane installation and configuration completed for the chosen driver
- Staging environment matching production infrastructure
- CI/CD pipeline with `php artisan octane:test` integrated
- PHP-FPM baseline performance metrics captured (RPS, p95 latency, error rate, RSS)
- Rollback plan documented (revert to FPM process manager configuration)

## Inputs
- Application codebase with all service providers, facades, middleware, and custom packages
- Complete list of third-party Composer packages with versions
- PHP-FPM baseline benchmarks (throughput, latency, error rate, memory usage)
- Current `config/app.php` provider list
- Output of `grep -rn "static \" app/ --include="*.php"` and similar static property scans
- Production architecture diagram (load balancers, web servers, database, Redis)

## Workflow

### 1. Phase 1 — Static Property Audit and Elimination
- Run `grep -rn "static " app/ --include="*.php"` across the entire codebase
- For each static property found, classify as request-scoped (mutable, holds user/data state) or application-wide (read-only configuration, immutable cache)
- Create a tracking spreadsheet: file, class, property name, classification, action required, owner, status
- Replace all request-scoped static properties with instance properties and `scoped()` container bindings
- For read-only shared static state, add explicit documentation that it is intentionally shared
- Run the same audit on vendor packages: `grep -rn "public static \" vendor/ --include="*.php"` — flag packages with mutable static caches
- For incompatible vendor packages: find alternatives, submit PRs, or wrap with scoped bindings

### 2. Phase 2 — Service Provider Audit
- List every provider in `config/app.php` and any dynamically registered providers
- For each provider, examine `register()` and `boot()` methods
- Flag provider `boot()` methods with side effects: event listeners, middleware registration, route registrations, database queries, API calls, file I/O
- Verify all boot-time registrations are idempotent (no duplicate listeners)
- Move non-idempotent boot logic to `Octane::booted()` callbacks
- Replace expensive operations in `boot()` with lazy initialization or singleton closures
- Apply `DeferrableProvider` to providers used in fewer than 50% of requests

### 3. Phase 3 — Singleton Binding Review
- Review every `$this->app->singleton()` binding across all providers
- Classify each singleton as request-scoped (auth, session, user data) or stateless (config, logger, cache client)
- Replace request-scoped singletons with `$this->app->scoped()` bindings
- Verify database connection bindings use `scoped()` or implement explicit per-request reset
- Verify session and auth bindings are correctly `scoped()`
- Document all binding changes in a migration changelog

### 4. Phase 4 — State Leak and Concurrent Request Testing
- Deploy the migrated application to staging with Octane
- Run single-request smoke tests: verify endpoints return correct data
- Run concurrent request state leak tests:
  `ab -n 100 -c 10 "http://staging:8000/test?user=alice"` — verify all responses contain alice's data only
  `ab -n 100 -c 10 "http://staging:8000/test?user=bob"` — verify all responses contain bob's data only
- Run `php artisan octane:watch` during testing to detect state leaks at runtime
- Run full test suite under Octane: `php artisan octane:test`
- Run 24-hour soak test: monitor per-worker RSS every hour, alert on >10% hourly growth
- Verify graceful reload: `php artisan octane:reload` drops zero in-flight requests
- Fix any detected state leaks before proceeding to production

### 5. Phase 5 — Canary Production Rollout
- Deploy Octane configuration to 10% of production servers (2 of 20, for example)
- Compare error rates against the FPM baseline for 24 hours
- Compare p95 latency and throughput against the FPM baseline
- Monitor per-worker RSS: should stabilize within 24 hours
- Keep FPM deployment configuration intact on the remaining 90% of servers
- If no issues after 24 hours: deploy Octane to remaining 90% of servers
- If issues detected: rollback the canary servers to FPM, investigate, fix, restart canary

### 6. Post-Migration Verification
- Compare post-migration metrics to pre-migration baseline: verify throughput gain matches estimation
- Document actual throughput gain vs estimated gain — feed back into estimation methodology
- Update deployment runbook with Octane-specific procedures (reload, health check, worker monitoring)
- Schedule weekly RSS review for the first month to catch late-emerging memory leaks
- Train operations team on Octane-specific alerting and incident response

## Validation Checklist
- [ ] All request-scoped static properties eliminated from app code
- [ ] Vendor package static properties audited and flagged
- [ ] All service providers audited: boot() side effects idempotent
- [ ] Expensive boot() operations moved to lazy initialization
- [ ] Deferred providers applied where appropriate
- [ ] All request-scoped singletons converted to scoped() bindings
- [ ] Concurrent request test passes: no cross-request data contamination
- [ ] `php artisan octane:test` passes with zero warnings
- [ ] 24-hour soak test: RSS stable (<10% growth per hour)
- [ ] Graceful reload verified (zero dropped in-flight requests)
- [ ] Canary rollout (10% servers, 24-hour observation) completed without incident
- [ ] Post-migration metrics collected and compared to baseline
- [ ] Rollback procedure documented and tested
- [ ] Operations team trained on Octane runbooks

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Cross-request data leak after migration | User A sees User B's data | Missed static property or singleton during audit | Add static property scanning to CI, fix binding |
| Worker OOM after 6-8 hours | RSS grows until killed | Memory leak in vendor package | Audit vendor static properties, switch to known-compatible package |
| `octane:reload` drops requests | In-flight requests fail during reload | Load balancer not configured for graceful draining | Configure health check with draining period |
| Canary servers show higher error rate | Intermittent 500 errors | Connection pool exhaustion (more persistent connections) | Recalculate connection budget, increase database max_connections |
| Migration gain lower than estimated | Throughput gain 1.5x instead of expected 5x | Bootstrap proportion overestimated (real-world I/O higher) | Refine estimation methodology; optimize I/O-bound endpoints |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Full migration vs stay on FPM | Octane is worth it if bootstrap proportion >30% AND packages are compatible AND team has resources for migration |
| Fix vendor package vs replace it | Fix with PR if the package is actively maintained; replace if abandoned or the fix is too invasive |
| Canary percentage | 10% is standard for most applications; 5% for high-risk migrations; 20% for low-risk |
| Rollback vs fix forward | Rollback immediately if data leakage detected; fix forward can work for performance regressions |
| Skip phase if all statics clean | No phases can be skipped — provider audit and singleton review still required |

## Performance Considerations
- Octane delivers 2.5-20× throughput over PHP-FPM depending on bootstrap proportion
- Each worker adds 30-80MB RSS — fewer workers may fit than FPM pools
- Migration cost (1-4 weeks team effort) vs gain (2-20× throughput) — calculate ROI
- Database queries become primary bottleneck after bootstrap elimination — may need query optimization
- OpCache preloading further reduces cold-start latency by 2-5ms per worker

## Security Considerations
- State leaks (User A sees User B's data) are the most critical security risk during migration
- Static properties in vendor packages can silently expose data — audit is mandatory
- Singleton misuse with request-scoped data causes privilege escalation
- During canary rollout, FPM servers and Octane servers process different subsets of traffic — ensure consistent authentication behavior
- Session data must use Laravel's session drivers — `$_SESSION` persists across requests in the same worker
- Rollback plan must include data integrity verification when switching back to FPM

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Follow structured migration order: static properties → providers → singletons → testing → canary | `05-rules.md:1` | Entire workflow is structured per this rule |
| Run concurrent request tests with different user parameters | `05-rules.md:28` | Phase 4: state leak detection |
| Audit all third-party packages for Octane compatibility | `05-rules.md:58` | Phase 1: vendor static property audit |
| Deploy Octane to a canary subset for 24 hours before full rollout | `05-rules.md:84` | Phase 5: canary rollout |

## Related Skills

| Skill | Relation |
|-------|----------|
| Audit and Adapt Laravel Application for Octane's Persistent Execution Model | Phase 1-3 are detailed implementations of this skill |
| Install and Configure Octane for a Laravel Project | Prerequisite — Octane must be installed before migration |
| Select the Optimal Octane Driver | Must be completed before migration begins |
| Estimate Octane Performance Gain | Prerequisite — used to build business case for migration |
| Optimize Service Providers for Octane Persistence | Phase 2-3 detailed implementation |
| Manage and Prevent Octane State Leaks | Phase 4 detailed implementation and ongoing |
| Configure Octane Workers by Driver | Phase 5: production configuration |

## Success Criteria
- Application migrated from FPM to Octane with zero state leak incidents in production
- Post-migration throughput matches or exceeds pre-migration gain estimation (within 20%)
- Worker RSS stable over 24+ hours of production traffic (<10% growth per hour)
- Canary rollout completed without incident, rollback not needed
- All service providers use correct singleton/scoped/deferred patterns
- Team understands Octane execution model differences and runbook procedures
- Rollback procedure tested and documented (revert to FPM in <10 minutes)
