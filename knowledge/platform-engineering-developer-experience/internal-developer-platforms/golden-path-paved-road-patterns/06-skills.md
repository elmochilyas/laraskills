# Skill: Design Golden Paths for Laravel Development Workflows

## Purpose
Create opinionated, well-documented, and tool-supported golden paths (paved roads) that guide Laravel developers through common tasks (new project creation, CI setup, deployment) with escape hatches for edge cases.

## When To Use
- Team performs a task frequently with consistent patterns
- Organization wants to standardize practices across teams
- Developer onboarding includes repetitive steps that can be automated

## When NOT To Use
- Workflows are highly heterogeneous with few common patterns
- Team is too small (< 5 developers) to justify path creation and maintenance
- Organizational standards are not yet established or change frequently

## Prerequisites
- IDP architecture or platform tooling to host the paths
- Template/project skeleton repositories
- CI/CD infrastructure for path testing
- Developer portal or CLI distribution mechanism

## Inputs
- Developer pain point survey results
- Most common workflow frequencies (new projects, CI setup, deploy)
- Organizational standards (PHP version, code style, CI pipeline shape)

## Workflow (numbered)
1. **Identify pain points** — Interview developers; measure baseline friction for target workflows
2. **Select 2-3 workflows** — Choose highest-frequency, highest-pain tasks for initial paths
3. **Design path flow** — Map full sequence: scaffold → configure → CI → provision → deploy → register
4. **Build template/skeleton** — Create project skeleton encoding organizational defaults
5. **Automate the path** — Implement full automation from start to finish; no manual final steps
6. **Document escape hatches** — For each decision point, document standard choice, alternatives, and tradeoffs
7. **Test in CI** — Automated CI validates the full workflow; scheduled runs catch regressions
8. **Launch and measure** — Release paths; monitor adoption rate as primary success metric

## Validation Checklist
- [ ] Paths cover 80% of use cases with documented escape hatches for the remaining 20%
- [ ] Full automation from start to finish (no "then deploy manually" gaps)
- [ ] Escape hatches documented for every decision point with tradeoffs
- [ ] Path execution from selection to working environment: under 5 minutes
- [ ] CI validates each path on a schedule; broken paths are detected immediately
- [ ] Adoption rate measured; feedback loop established

## Common Failures
- **Enforcing without developer input** — paths solve wrong problems, get zero adoption
- **Too many paths too quickly** — high maintenance burden, paths fall out of date
- **Paths without escape hatches** — frustrated teams create shadow IT
- **Neglecting path maintenance** — paths become liabilities that erode trust

## Decision Points
- Which workflows to path first: prioritize highest-frequency, highest-pain tasks
- Level of opinionation: more opinionated = lower flexibility, faster execution
- Enforcement vs attraction: attract through convenience, not enforce through mandates
- Path discovery: CLI for speed, portal for discovery, README for reference

## Performance/Security Considerations
- Path execution target: under 5 minutes from selection to working environment
- Template generation and dependency installation are the bottlenecks; optimize with caching
- Paths must start with secure defaults: HTTPS, secure session config, proper CORS, rate limiting
- No credentials baked into templates; inject via environment variables at runtime
- Pin dependency versions in templates; scan for vulnerabilities

## Related Rules (from 05-rules.md)
- GP-RULE-001: Design from developer pain points
- GP-RULE-002: Attract, don't enforce
- GP-RULE-003: 80/20 rule
- GP-RULE-004: Start small, expand on demand
- GP-RULE-011: Test paths in CI
- GP-RULE-013: Full automation

## Related Skills
- Architect IDP Patterns for Laravel Teams
- Build Internal Template Registries for Laravel
- Implement Self-Service Environment Provisioning

## Success Criteria
- 2-3 golden paths launched and actively used by 80% of target developers
- Path creation to working environment in under 5 minutes
- Developer satisfaction score > 4/5 on path workflows
- Path maintenance budget allocated; monthly CI validation passing

---

# Skill: Manage Golden Path Lifecycle and Adoption

## Purpose
Maintain, deprecate, and evolve golden paths to ensure they remain current with Laravel versions and tooling, while maximizing developer adoption through feedback-driven iteration.

## When To Use
- Golden paths have been launched and are in active use
- Laravel or tooling version upgrades affect path compatibility
- Adoption metrics show declining or stagnant usage

## When NOT To Use
- Paths are still in design/prototype phase
- No paths have been launched yet (focus on creation first)

## Prerequisites
- Established golden paths with usage metrics collection
- Path CI testing infrastructure
- Developer feedback collection mechanism (surveys, in-app ratings, Slack commands)

## Inputs
- Path usage metrics (adoption rate, completion time, deviation frequency)
- Developer satisfaction scores and qualitative feedback
- Laravel/tooling version release schedule
- Team composition and organizational changes

## Workflow (numbered)
1. **Monitor path metrics** — Track adoption rate, completion time, deviation frequency, satisfaction scores
2. **Collect feedback** — Post-completion surveys; periodic interviews; in-app ratings; Slack feedback commands
3. **Identify improvement areas** — Analyze deviation patterns; logs show where developers go off-path
4. **Update paths** — Within 2 weeks of Laravel version releases; incorporate captured post-generation fixes
5. **Version paths** — Track path versions alongside Laravel versions; Laravel 11 path is distinct from Laravel 12
6. **Deprecate when needed** — Announce deprecation with migration guidance and timeline; never remove without documented migration
7. **Close the feedback loop** — Communicate changes back to developers within 2 weeks of feedback collection

## Validation Checklist
- [ ] Adoption rate measured and trending positively
- [ ] Feedback collected and reviewed within 2 weeks; changes communicated back
- [ ] Paths updated within 2 weeks of Laravel/tooling version releases
- [ ] Deprecated paths have migration guidance and timeline
- [ ] CI scheduled runs catch breakage from Laravel version updates

## Common Failures
- **Hidden paths** — developers don't know paths exist; invest in discovery (portal, CLI, team demos)
- **Rat's nest paths** — paths that grew organically without review; streamline periodically
- **Dead end paths** — final steps manual; paths must be fully automated
- **Bicycle paths** — built for rarely occurring use cases; measure usage before investing

## Decision Points
- When to deprecate: declining adoption + newer alternative path available + migration guidance ready
- Path versioning strategy: major version per Laravel major version, minor for tooling updates
- Feedback channel: in-app for immediate reactions, surveys for structured feedback, interviews for depth

## Performance/Security Considerations
- Path versioning prevents developers from starting on outdated configurations
- Scheduled CI runs detect regressions early; failing paths are fixed within SLA
- Deprecation notices should be surfaced both in-cli and in-portal for maximum visibility
- Migration guidance must include automated upgrade scripts where possible

## Related Rules (from 05-rules.md)
- GP-RULE-008: Path feedback loop
- GP-RULE-009: Path versioning
- GP-RULE-010: Path deprecation
- GP-RULE-026: Avoid the Hidden Path
- GP-RULE-025: Avoid the Rat's Nest

## Related Skills
- Design Golden Paths for Laravel Development
- Build Internal Template Registries for Laravel
- Implement Self-Service Environment Provisioning

## Success Criteria
- Adoption rate increases quarter-over-quarter for active paths
- Path update latency < 2 weeks from Laravel/tooling version release
- Developer satisfaction score > 4/5 maintained quarterly
- Zero deprecated paths without migration guidance
