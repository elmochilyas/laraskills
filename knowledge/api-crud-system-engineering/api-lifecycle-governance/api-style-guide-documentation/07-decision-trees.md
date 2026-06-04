# Decision Trees — API Style Guide Documentation

## Tree 1: Style Guide Rule Classification

**Decision Context**: Determining the enforcement level for each style guide rule — whether a rule is MUST, SHOULD, or MAY, and whether it should be automatically enforced.

**Decision Criteria**:
- Consumer impact if violated
- Automation feasibility
- Team consistency requirements
- Flexibility needs for edge cases

**Decision Tree**:
```
Does violating this rule cause a consumer-facing issue?
├── YES → Is it automatically checkable (Spectral, linter)?
│   ├── YES → MUST + Spectral enforcement in CI
│   └── NO → MUST + manual review checklist item
└── NO → Does the rule significantly improve consistency or developer experience?
    ├── YES → Is there a valid reason to ever deviate?
    │   ├── YES → SHOULD + recommended, exception possible with ADR
    │   └── NO → MUST (strong recommendation, no exceptions expected)
    └── NO → MAY (optional guideline, no enforcement)
```

**Rationale**: Consumer-impacting rules must be MUST with automated enforcement. Consistency rules can be SHOULD with documented exceptions. Minor preferences are MAY.

**Recommended Default**: Consumer-facing rules = MUST + Spectral enforcement. Internal consistency = SHOULD. Style preferences = MAY.

**Risks**:
- Too many MUST rules cause pushback and workarounds
- Too few MUST rules lead to inconsistent APIs
- MUST rules without automation require manual enforcement that drifts over time

**Related Rules/Skills**: Rules: Use RFC 2119 Keywords for Every Rule, Include Positive and Negative Examples for Every Rule. Skills: Implement API Style Guide Documentation.

---

## Tree 2: Style Guide Organization and Storage

**Decision Context**: How to organize and store the style guide — single document vs modular, in-repo vs wiki, internal-only vs public.

**Decision Criteria**:
- Team size and distribution
- Consumer visibility requirements
- Update workflow
- Integration with enforcement tooling

**Decision Tree**:
```
Is the style guide for external consumers to read?
├── YES → Store as Markdown in repository alongside Spectral rules; publish to developer portal as HTML
│        Separate internal-only section (implementation details) not published to public
└── NO → Is the team > 10 developers across multiple squads?
    ├── YES → Modular: main guide with separate documents per topic (naming, errors, pagination)
    │        + quick reference cheat sheet
    └── NO → Single CHANGELOG-style document with clear sections; in repository
```

**Rationale**: In-repo Markdown enables version control, PR workflow, and CI integration. Modular structure scales for larger teams. Separate internal section prevents leaking implementation details.

**Recommended Default**: Single `API-STYLE-GUIDE.md` in repository alongside `spectral/rules/` for enforcement. Internal implementation details in separate section.

**Risks**:
- Wiki-based guides become outdated and abandoned
- No version control means no change history
- Public publication of internal details leaks infrastructure information

**Related Rules/Skills**: Rules: Store Style Guide as Code in Repository. Skills: Implement API Style Guide Documentation.

---

## Tree 3: Style Guide Update and Review Cadence

**Decision Context**: How often to review and update the style guide — quarterly, annually, or event-driven updates, and how to handle rule changes.

**Decision Criteria**:
- API change velocity
- Team feedback volume
- Rule maturity (new rules vs established)
- Consumer migration impact of rule changes

**Decision Tree**:
```
Is the rule new (< 6 months old)?
├── YES → Review monthly for first 3 months; adjust based on implementation feedback
└── NO → Does the rule change affect existing API behavior (breaking change)?
    ├── YES → Is the change a relaxation (removing a restriction)?
    │   ├── YES → Update immediately; announce in changelog
    │   └── NO → Is the change a new restriction?
    │       ├── YES → Quarterly review cycle; deprecate old convention with migration window
    │       │        Old convention gets DEPRECATED tag for 1 cycle, then removed
    │       └── NO → Quarterly review cycle; minor version update
    └── NO → Quarterly review (minor clarifications, new examples, no behavioral change)
```

**Rationale**: New rules need frequent adjustment. Breaking rule changes need deprecation windows and migration guidance. Non-breaking clarifications can follow standard quarterly cadence.

**Recommended Default**: Quarterly minor updates, annual major revision. New rules reviewed monthly for first 3 months.

**Risks**:
- Too frequent updates cause change fatigue
- Too infrequent updates cause guide to drift from actual practices
- Breaking rule changes without deprecation cause sudden compliance failures

**Related Rules/Skills**: Rules: Use RFC 2119 Keywords for Every Rule. Skills: Implement API Style Guide Documentation.
