# Decision Trees — Service Orchestration

## Tree 1: Orchestration vs Composition

**Decision Context**: Choosing between service orchestration (coordinating services across domains) and action composition (coordinating actions within a domain).

**Decision Criteria**:
- Cross-domain scope
- Number of coordinated units
- Compensating action complexity
- Need for saga/compensation patterns

**Decision Tree**:
```
Does the workflow span multiple bounded contexts/domains?
├── YES → Service orchestration — coordinate across domain boundaries using full services
└── NO → Does the workflow involve 3+ coordinated services?
    ├── YES → Service orchestration — orchestrator manages sequence and error recovery
    └── NO → Does the workflow require compensating actions for external API calls?
        ├── YES → Service orchestration — compensating actions need the orchestration pattern
        └── NO → Action composition — simpler, sufficient for intra-domain workflows
```

**Rationale**: Orchestration spans domains and handles compensation. Composition is lighter and sufficient for intra-domain coordination.

**Recommended Default**: Action composition for intra-domain workflows. Service orchestration for cross-domain workflows with 3+ services.

**Risks**: Orchestration for simple 2-step workflows adds unnecessary ceremony. Composition for cross-domain workflows lacks compensation and domain boundary enforcement.

---

## Tree 2: Error Handling Strategy

**Decision Context**: Choosing how the orchestrator handles sub-service failures — rollback, compensation, or escalation.

**Decision Criteria**:
- Database transaction scope
- External system side effects
- Failure criticality
- Compensation availability

**Decision Tree**:
```
Do all sub-service operations use the same database (no external API calls)?
├── YES → Use database transaction — `DB::transaction()` wraps the orchestration; rollback on any failure
└── NO → Are there external API calls (payment gateway, email, SMS)?
    ├── YES → Implement compensating actions — database rollback can't undo an API call
    └── NO → Is the failure critical (financial, security)?
        ├── YES → Compensation with manual escalation path — human review required for recovery
        └── NO → Rollback what you can, log the failure, and escalate to the monitoring system
```

**Rationale**: Database transactions handle intra-database atomicity. Compensating actions handle external system side effects. Escalation handles critical unrecoverable failures.

**Recommended Default**: Database transaction for all-database operations. Compensating actions for operations with external calls. Always log failures.

**Risks**: Missing compensation for external API calls leaves the system in an unrecoverable inconsistent state. Over-engineering compensation for database-only operations adds complexity without benefit.
