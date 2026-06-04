# Decision Trees — API Audit Review Process

## Tree 1: Audit Frequency Selection

**Decision Context**: Determining how often to run API audits — whether to use quarterly, monthly, or event-triggered audits based on API maturity and change velocity.

**Decision Criteria**:
- API maturity (new vs stable)
- Change frequency (endpoints added/changed per month)
- Consumer count and external exposure
- Compliance/regulatory requirements
- Previous audit finding volume

**Decision Tree**:
```
Is the API in a regulated industry (finance, healthcare, PCI)?
├── YES → Quarterly audits minimum; monthly during major version development
└── NO → Is the API changing rapidly (>5 endpoint changes per month)?
    ├── YES → Monthly audits until change velocity stabilizes below 5/month
    └── NO → Is this a new API (<6 months in production)?
        ├── YES → Monthly audits for first 6 months, then quarterly
        └── NO → Are previous audit findings above 20% remediation backlog?
            ├── YES → Monthly audits until backlog cleared, then quarterly
            └── NO → Quarterly audits (standard cadence)
```

**Rationale**: Audit frequency should match risk profile. Regulated/high-change/new/high-debt APIs need more frequent oversight. Quarterly is the standard baseline.

**Recommended Default**: Quarterly audits with automated monthly linting runs in between.

**Risks**:
- Too infrequent audits miss accumulating debt
- Too frequent audits cause fatigue and resistance
- Event-triggered audits (post-incident only) miss systemic issues

**Related Rules/Skills**: Rules: Run Automated Checks Before Manual Review, Measure Remediation Rate, Not Finding Rate. Skills: Conduct API Audit Reviews.

---

## Tree 2: Finding Severity Classification and Response

**Decision Context**: Classifying audit findings by severity and determining the appropriate response time and escalation path.

**Decision Criteria**:
- Consumer impact (breakage, data loss, degradation)
- Security implications
- Compliance violation
- Remediation complexity
- Number of affected consumers

**Decision Tree**:
```
Does the finding cause production outage or data loss?
├── YES → Blocker: remediate immediately within 24 hours, notify stakeholders
└── NO → Does the finding break the consumer contract (breaking change)?
    ├── YES → Critical: remediate within 48 hours, notify affected consumers
    └── NO → Does the finding violate a governance MUST rule?
        ├── YES → Major: schedule within current sprint (≤2 weeks)
        └── NO → Is the finding a minor convention violation?
            ├── YES → Minor: schedule within current quarter
            └── NO → Suggestion: discuss at next API design review; may backlog
```

**Rationale**: Severity classification drives prioritization. Consumer-impacting and security issues get fastest response; style preferences get lowest priority.

**Recommended Default**: 5-level classification: Blocker (24h), Critical (48h), Major (current sprint), Minor (current quarter), Suggestion (discuss).

**Risks**:
- Over-classifying minor issues causes audit fatigue
- Under-classifying critical issues delays fixes
- No clear thresholds lead to inconsistent prioritization

**Related Rules/Skills**: Rules: Enforce Severity-Based Action Thresholds, Allocate 10% of Sprint Capacity to Remediation. Skills: Conduct API Audit Reviews.

---

## Tree 3: Auditor Assignment Model

**Decision Context**: How to assign the auditor role — whether to use a rotating model, dedicated SRE/Platform team, or external auditors.

**Decision Criteria**:
- Team size
- Cross-team API ownership
- Domain knowledge requirements
- Objectivity requirements

**Decision Tree**:
```
Is there a dedicated platform/SRE team that owns API governance?
├── YES → Platform team conducts audits; rotate individual reviewer quarterly to prevent blind spots
└── NO → Is the API owned by a single team?
    ├── YES → Rotate auditor role among team members quarterly; never same person consecutive quarters
    └── NO → Is compliance requiring external objectivity?
        ├── YES → External auditor (different team or consultant) + internal shadow to transfer knowledge
        └── NO → Rotate auditor among teams; each team audits another's API
```

**Rationale**: Rotation prevents blind spots and distributes knowledge. Platform teams provide consistency but still need rotation for fresh perspective. Cross-team auditing builds shared standards.

**Recommended Default**: Quarterly rotation among team members; never same auditor consecutive quarters.

**Risks**:
- No rotation creates blind spots and single points of failure
- Too frequent rotation prevents deep understanding
- External auditors lack context for nuanced decisions

**Related Rules/Skills**: Rules: Rotate Auditor Role Each Quarter. Skills: Conduct API Audit Reviews.
