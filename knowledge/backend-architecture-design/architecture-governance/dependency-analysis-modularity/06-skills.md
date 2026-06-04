# Skill: Perform Dependency Analysis on a Codebase

## Purpose

Measure coupling, cohesion, and modularity health to detect architectural decay before it becomes unmanageable.

## When To Use

- Quarterly architecture health check
- Before extracting a module or service
- During code review of cross-module changes
- When team reports "the system is hard to change"

## When NOT To Use

- Trivial applications with fewer than 10 classes
- Prototypes not intended for production
- When metrics would be used as rigid gates without context

## Prerequisites

- Dependency analysis tools (Deptrac, PhpMetrics, PHP Depend)
- Defined module boundaries (namespaces, directories)

## Inputs

- Source code with defined namespace boundaries
- Existing dependency graph (optional, for baseline comparison)

## Workflow

1. Define module/package boundaries (e.g., `App\Modules\Billing`)
2. Run dependency analysis tools to compute metrics per module
3. Calculate: Afferent Coupling (Ca), Efferent Coupling (Ce), Instability (I), Abstractness (A), Distance from Main Sequence (D)
4. Detect circular dependencies between modules
5. Flag modules with Ce > 10 or distance > 0.3
6. Compare metrics against previous quarter's baseline
7. Document findings and create ADRs for identified issues
8. Set coupling thresholds and enforce in CI

## Validation Checklist

- [ ] Analysis runs at module level, not just class level
- [ ] Instability and Abstractness computed per module
- [ ] Circular dependencies detected and documented
- [ ] Modules with distance > 0.3 flagged for review
- [ ] Metrics trended quarterly (not one-time)
- [ ] Thresholds defined per module type
- [ ] CI fails when thresholds are exceeded

## Common Failures

- Measuring without acting on findings
- Focusing only on class-level metrics (missing module-level problems)
- Using metrics as rigid gates without contextual review
- Not setting explicit thresholds for "acceptable"

## Decision Points

- What distance threshold triggers investigation (recommended: 0.3)?
- How to handle modules that intentionally break the pattern (facades, shared kernels)?
- Which modules to refactor first based on distance?

## Performance Considerations

- Full analysis on a medium codebase: ~30-60 seconds
- Run in CI on schedule (nightly) rather than on every commit
- Cache results between runs for trend comparison

## Security Considerations

- Dependency analysis may reveal internal module structure; restrict report access if sensitive

## Related Rules (from 05-rules.md)

- Rule 1: Track dependency metrics quarterly and act on negative trends
- Rule 2: Break dependency cycles immediately on detection
- Rule 3: Set explicit coupling thresholds per module and fail CI when exceeded
- Rule 4: Analyze at the module/package level, not only at class level
- Rule 5: Do not use metrics as rigid gates without contextual review

## Related Skills

- Implement Architecture Fitness Functions
- Detect and Remediate Big Ball of Mud
- Measure Coupling Types

## Success Criteria

- Module distance from main sequence stays under 0.3 for 90%+ of modules
- Zero circular dependencies between defined modules
- Dependency metrics improve or remain stable quarter over quarter
