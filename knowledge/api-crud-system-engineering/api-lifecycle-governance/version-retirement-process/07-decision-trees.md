# Decision Trees — Version Retirement Process

## Tree 1: Retirement Stage Progression Strategy

**Decision Context**: Choosing the stage progression model when retiring an API version — whether to use traffic-light stages, immediate cutoff, or phased traffic ramping.

**Decision Criteria**:
- Consumer count and diversity
- Communication channel reliability
- Security/compliance urgency
- Rollback capability requirements

**Decision Tree**:
```
Is there a security vulnerability requiring immediate removal?
├── YES → Emergency immediate removal (skip to Black/404)
└── NO → Is this a minor version with known, few consumers?
    ├── YES → Can you notify all consumers directly?
    │   ├── YES → Use simplified 2-stage: Yellow (30d notice) → Red (410)
    │   └── NO → Use full 4-stage: Green → Yellow → Red → Black
    └── NO → Are there consumers with complex migration paths?
        ├── YES → Use full 4-stage with extended migration window (6-12mo)
        └── NO → Use standard 4-stage: Green → Yellow (freeze+headers) → Red (410) → Black (404)
```

**Rationale**: The stage model balances consumer experience with operational hygiene. Full 4-stage covers the general case; simplified stages reduce overhead when risk is low; emergency bypass is reserved for security.

**Recommended Default**: Full 4-stage traffic-light model (Green → Yellow → Red → Black) with standard migration window.

**Risks**:
- Skipping stages leaves consumers without transitional warnings
- Extended stages delay cleanup and accumulate maintenance cost
- Emergency bypass risks consumer breakage if used unnecessarily

**Related Rules/Skills**: Rules: Audit All Consumers Before Announcing Freeze, Implement Traffic-Light Retirement Stages, Return 410 Gone with Migration Link, Not Bare 404. Skills: Retire API Versions.

---

## Tree 2: Consumer Exception Handling

**Decision Context**: Deciding how to handle consumers who cannot migrate within the standard retirement window — whether to grant exceptions, extend the window, or enforce cutoff.

**Decision Criteria**:
- Consumer business impact
- Migration complexity
- Exception count and duration
- Regulatory deadline

**Decision Tree**:
```
Has the consumer demonstrated active migration effort?
├── YES → Is there a hard regulatory/compliance deadline?
│   ├── YES → Grant time-limited exception with weekly check-ins (max 30d)
│   └── NO → Grant exception with expiration date (max 90d), track in allowlist
└── NO → Is the consumer a high-revenue enterprise tier?
    ├── YES → Escalate to account management; grant exception only with executive approval and expiration date
    └── NO → Enforce cutoff at sunset date; provide migration guide in 410 response
```

**Rationale**: Exceptions prevent revenue loss from stranded consumers but must have expiration dates to prevent indefinite extension. Active migration effort is the key discriminator — consumers who haven't started won't finish without enforcement.

**Recommended Default**: Grant exceptions only with expiration dates (max 90 days, 30 days for regulatory scenarios) and track in an allowlist with automated expiry reminders.

**Risks**:
- Exceptions without expiration dates become permanent
- Too many exceptions undermine retirement schedule
- Hard cutoff of high-value consumers causes business escalation

**Related Rules/Skills**: Rules: Maintain Rollback Capability for 30 Days Post-Cutoff, Grant Exceptions with Expiration Dates. Skills: Retire API Versions.

---

## Tree 3: Notification Wave Timing

**Decision Context**: Determining the notification schedule for announcing version retirement to consumers — how far in advance and how many waves.

**Decision Criteria**:
- Consumer responsiveness history
- Migration complexity
- Total number of consumers
- Previous notification engagement rates

**Decision Tree**:
```
Is migration complexity high (breaking changes, data migration required)?
├── YES → Use 4-wave notification: 9mo → 6mo → 3mo → 30d
└── NO → Is the consumer base large (>100 consumers)?
    ├── YES → Use 3-wave notification: 6mo → 3mo → 30d
    └── NO → Is previous notification engagement above 80%?
        ├── YES → Use 2-wave notification: 3mo → 30d
        └── NO → Use 3-wave notification: 6mo → 3mo → 30d (more reminders = higher migration)
```

**Rationale**: Notification timing should match migration complexity and consumer engagement. More waves for complex migrations; fewer for responsive consumers with simple migrations.

**Recommended Default**: 3-wave notification (6 months, 3 months, 30 days) via email + dashboard banner + changelog entry.

**Risks**:
- Too few waves catch consumers off-guard
- Too many waves cause notification fatigue
- Early notifications may be forgotten by cutoff time

**Related Rules/Skills**: Rules: Audit All Consumers Before Announcing Freeze. Skills: Retire API Versions.
