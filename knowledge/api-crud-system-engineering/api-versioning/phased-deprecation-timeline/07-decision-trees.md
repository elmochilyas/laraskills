# Decision Trees — Phased Deprecation Timeline

## Tree 1: Phase Duration Selection

**Decision Context**: Setting the duration of each deprecation phase — how long to stay in Announce, Warn, Enforce, and Remove.

**Decision Criteria**:
- API type (public vs internal)
- Consumer count and migration complexity
- Business urgency
- Regulatory requirements

**Decision Tree**:
```
Is the API public with third-party consumers?
├── YES → Announce: 6+ months (blog post, email, dashboard)
│   Warn: 3-6 months (deprecation + sunset headers)
│   Enforce: 1-2 months (rate limiting, intentional degradation)
│   Remove: 410 Gone after enforce phase ends
└── NO → Is the API internal with few consumers?
    ├── YES → Announce: 1-3 months (email + changelog)
    │   Warn: 1-3 months (headers only)
    │   Enforce: 2-4 weeks (rate limiting)
    │   Remove: 410 Gone after enforce phase ends
    └── NO → Is this an emergency removal (security vulnerability)?
        ├── YES → Skip Announce and Warn; immediate Remove with 410 and migration guide
        └── NO → Standard timeline: Announce 3mo, Warn 3mo, Enforce 1mo, Remove
```

**Rationale**: Public APIs need longer timelines for third-party consumer migration. Internal APIs can move faster. Security emergencies bypass the standard timeline entirely.

**Recommended Default**: Public: 6mo Announce + 6mo Warn + 2mo Enforce. Internal: 3mo Announce + 3mo Warn + 1mo Enforce.

**Risks**: Too-short Announce phase surprises consumers. Too-long Warn phase delays cleanup. Missing Enforce phase gives no urgency signal.

---

## Tree 2: Phase Transition Automation

**Decision Context**: Whether to automate phase transitions or trigger them manually.

**Decision Criteria**:
- Team size and operational maturity
- Consumer impact of premature transition
- Monitoring and rollback capability

**Decision Tree**:
```
Are phase transitions config-driven with dates and automated checks?
├── YES → Use scheduled command (daily) that compares current date to configured phase dates; transitions automatically
│   Include: transition log, pre-transition dry-run, rollback capability
└── NO → Is the team small (<5) or the API low-risk?
    ├── YES → Manual transitions via deploy that updates config; use runbook with checklist per phase
    └── NO → Is the consumer impact of a premature transition severe?
        ├── YES → Automated transitions with manual approval gate at each phase boundary
        └── NO → Fully automated with monitoring alerts at each transition
```

**Rationale**: Automation ensures consistent timing. Manual gates protect against premature transitions for high-impact deprecations.

**Recommended Default**: Config-driven dates + daily automated transition command + manual approval gate at Warn → Enforce boundary.

**Risks**: Automated transitions without rollback capability can prematurely remove a version. Manual transitions can be forgotten, leaving a version in Warn indefinitely.
