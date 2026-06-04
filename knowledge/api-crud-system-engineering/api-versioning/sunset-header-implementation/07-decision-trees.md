# Decision Trees — Sunset Header Implementation

## Tree 1: Sunset Date Setting

**Decision Context**: Determining the sunset date — how far in the future to set it and how to handle extensions.

**Decision Criteria**:
- Deprecation announcement date
- Consumer migration progress
- Business urgency
- Regulatory requirements

**Decision Tree**:
```
Has the Deprecation header been active for at least 6 months?
├── YES → Set Sunset date 6-12 months from the earliest Deprecation header
└── NO → Has the announcement phase been completed (blog post, email)?
    ├── YES → Set Sunset date at least 6 months from today; ensure Deprecation header precedes Sunset
    └── NO → Deploy Deprecation header first; Sunset comes later when date is determined
```

**Rationale**: Consumers should see Deprecation warnings before Sunset deadlines. At least 6 months between first Deprecation and Sunset gives time for migration.

**Recommended Default**: Sunset date = 12 months from deprecation announcement. Never less than 6 months between first Deprecation header and Sunset.

**Risks**: Too-short timeline causes consumer panic. Too-long timeline reduces urgency. Extending a published Sunset date trains consumers to ignore deadlines.

---

## Tree 2: Sunset Enforcement

**Decision Context**: How to enforce the sunset date — automatic 410, traffic gating, or manual removal.

**Decision Criteria**:
- Automation reliability
- Consumer impact of premature enforcement
- Rollback capability requirements

**Decision Tree**:
```
Is the sunset date approaching (within 30 days)?
├── YES → Enable automated enforcement: scheduled command returns 410 on/after the date
│   Include: 30-day warning log, dry-run mode pre-execution, rollback to Warn phase within 24h
└── NO → Is the sunset date more than 30 days away?
    ├── YES → Keep Sunset headers active; no enforcement yet; monitor migration progress
    └── NO → Has the sunset date passed?
        ├── YES → Automated enforcement should have triggered; verify 410 is being returned; audit logs
        └── NO → Sunset header only; no enforcement
```

**Rationale**: Automated enforcement ensures the sunset date is honored. Dry-run mode and rollback capability prevent accidental premature removal.

**Recommended Default**: Scheduled command runs daily checking sunset dates; when date is reached, returns 410. 24-hour rollback window.

**Risks**: Automated enforcement without rollback can disrupt consumers if the date is wrong. Manual enforcement is easily forgotten, undermining the sunset policy.
