# Decision Trees — Version Retirement Policy

## Tree 1: Retirement Eligibility

**Decision Context**: Determining whether a deprecated version is eligible for retirement.

**Decision Criteria**:
- Notice period met
- Traffic level
- Alternative version stability
- Consumer migration progress

**Decision Tree**:
```
Has the minimum notice period been met (12mo public, 6mo internal)?
├── NO → Version not eligible — continue Warn/Enforce phases
└── YES → Is the version's traffic below the retirement threshold (<1% of API traffic)?
    ├── NO → Has migration stalled despite sunset date?
    │   ├── YES → Escalate: engage consumers directly; extend sunset if needed; do not retire without migration
    │   └── NO → Wait for traffic to drop or sunset date to arrive
    └── YES → Is the alternative version stable and fully functional?
        ├── NO → Delay retirement until alternative is stable
        └── YES → Version eligible for retirement — proceed with retirement procedure
```

**Rationale**: All three criteria must be met: notice period, low traffic, and stable alternative. Retiring without meeting all criteria breaks consumer trust.

**Recommended Default**: Retire when all three criteria are met; automated eligibility check runs monthly.

**Risks**: Retiring with traffic above threshold causes consumer breakage. Retiring without stable alternative leaves consumers with no migration path.

---

## Tree 2: Exception Handling for Retirement

**Decision Context**: How to handle requests to extend a version's life beyond the retirement schedule.

**Decision Criteria**:
- Consumer business impact
- Consumer migration effort
- Exception history
- Revenue at risk

**Decision Tree**:
```
Has the consumer demonstrated active migration effort?
├── YES → Is there a documented plan with a committed migration date?
│   ├── YES → Grant time-limited exception (max 90 days); document in exception register with VP approval
│   └── NO → Grant 30-day extension; require migration plan within 2 weeks; no further extensions
└── NO → Is the consumer a high-revenue enterprise customer?
    ├── YES → Escalate to account management; grant exception only with executive approval; strict expiration date
    └── NO → Enforce retirement on schedule; provide self-service migration tools and documentation
```

**Rationale**: Exceptions should reward active migration effort, not delay. Time-limited exceptions with expiration dates prevent indefinite support.

**Recommended Default**: Grant exceptions only with expiration dates (max 90 days) and documented migration plans.

**Risks**: Exceptions without expiration dates become permanent. Too many exceptions undermine the retirement policy. No exception process forces rigid enforcement without nuance.
