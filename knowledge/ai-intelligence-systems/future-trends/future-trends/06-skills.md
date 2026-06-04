# Skill: Future-Proof AI Architecture for Emerging Standards
## Purpose
Design the AI abstraction layer to accommodate emerging standards (MCP, A2A, multi-modal) without requiring breaking changes, ensuring long-term adaptability of the architecture.
## When To Use
- Building new AI infrastructure that must last 12-18+ months
- Designing provider abstraction, agent tool systems, or inter-agent communication layers
- Strategic planning for AI roadmap where protocol standardization is expected (MCP, A2A)
## When NOT To Use
- Short-lived projects (<6 month lifespan) where immediate delivery outweighs future flexibility
- Prototypes where over-engineering abstraction is premature
## Prerequisites
- Understanding of emerging AI protocols (MCP, A2A)
- Current provider abstraction layer architecture
- Tool abstraction design patterns
## Inputs
- Current tool implementation interfaces
- Provider abstraction layer interface definitions
- Compliance and observability requirements
## Workflow (numbered)
1. Wrap all AI tool implementations behind a common interface (`name()`, `description()`, `handle()`)
2. Design message envelope with standard fields (`from`, `to`, `type`, `id`, `timestamp`, `payload`, `trace_id`)
3. Architect provider inputs to support multi-modal content from the start (TextPart, ImagePart, AudioPart)
4. Make provider selection configuration-driven for sovereign routing (tenant-level)
5. Build compliance audit logging as middleware from day one
6. Classify trends: "build now" (compliance, observability), "prepare" (MCP, durable workflows), "wait" (A2A, edge AI production)
7. Monitor protocol standards with notification system for major releases
## Validation Checklist
- [ ] Tool abstraction layer supports future MCP adaptation (tools implement common interface)
- [ ] Compliance audit logging operational from day one of production AI usage
- [ ] Provider selection is configuration-driven (not hardcoded) for sovereign routing
- [ ] Message envelope supports future A2A protocol compatibility
- [ ] Provider abstraction accepts multi-modal content (not just text strings)
- [ ] "Wait" trends have documented trigger conditions for future investment
- [ ] Architecture decisions recorded with rationale for each "wait" vs "act now" assessment
## Common Failures
- Over-engineering for trends that may not materialize (A2A especially speculative in mid-2026)
- Building custom infrastructure that community or first-party solutions will soon provide
- Ignoring compliance because "it's early" — retrofit cost multiplies as scale grows
- Deep integration with proprietary protocols that may lose to open standards
- Text-only abstraction that requires breaking changes for multi-modal support
## Decision Points
- **Build now vs prepare vs wait**: Classify each trend and invest accordingly
- **Abstraction depth**: Enough abstraction to avoid rewrites, not so much it has no practical benefit
- **Open standard vs proprietary**: Bet on open standards (MCP) over proprietary protocols
## Performance Considerations
- MCP tool discovery: ~50-100ms on first call (cachable)
- Durable workflow checkpoint: ~10-50ms per transition
- Compliance logging: ~1-5ms per call (async queue for persistence)
- Multi-modal abstractions add negligible overhead when processing text-only
## Security Considerations
- MCP expands attack surface — external AI systems gain access to tool interfaces
- A2A requires inter-agent authentication — JWT with short expiry, mutual TLS
- Compliance audit logs must be immutable and append-only
- Data residency routing enforced at infrastructure layer, not just application layer
## Related Rules (from 05-rules.md)
- Design current architecture to support multi-modal inputs
- Implement cost-aware routing that tracks token prices
- Prepare for agent-to-agent communication protocols with standard message envelope
## Related Skills
- Implement Compliance Audit Logging for AI Systems
- Implement MCP-Adaptable Tool Interfaces
- Design Multi-Provider Abstraction Layer
## Success Criteria
- Architecture accommodates multi-modal and agent-to-agent features without breaking changes
- Compliance audit logging is operational from first production AI call
- Provider selection is configuration-driven for sovereign routing
- Protocol evolution monitored with documented decision triggers

---

# Skill: Implement Compliance Audit Logging for AI Systems
## Purpose
Build immutable, append-only audit logging for all AI calls from day one, supporting GDPR/HIPAA/SOC2 compliance requirements with PII anonymization and data residency enforcement.
## When To Use
- Production AI systems subject to regulatory compliance
- Any system processing user data through LLM APIs
- Multi-tenant systems where audit trails must be tenant-scoped
## When NOT To Use
- Prototype systems with no user data processing
- Air-gapped development environments
## Prerequisites
- Agent middleware pipeline in laravel/ai SDK
- Audit log storage (append-only table or dedicated log service)
- PII detection and anonymization rules
## Inputs
- Agent prompt and response content
- User/tenant identity context
- Compliance rules (data residency, retention period, anonymization requirements)
- Timestamp and correlation ID for audit trail
## Workflow (numbered)
1. Create middleware implementing `AgentMiddlewareContract`
2. Before agent execution: log anonymized prompt with metadata (user, tenant, timestamp, model, provider)
3. Execute agent call
4. After agent response: log anonymized response with result metadata
5. Use immutable, append-only storage for audit records
6. Implement async queue for audit log persistence (non-blocking)
7. Configure data retention TTL for audit logs
8. Implement data residency checks — ensure data stays in allowed regions
9. Test audit middleware with agent fakes to verify all calls are logged
## Validation Checklist
- [ ] All AI calls pass through audit middleware
- [ ] Audit records are append-only and immutable
- [ ] PII is anonymized before logging (hash or strip)
- [ ] Audit records include tenant/user context for scoping
- [ ] Data retention TTL configured and enforced
- [ ] Data residency checks operational (routing based on user region)
- [ ] Audit middleware tested with agent fakes
- [ ] Audit log storage monitored for growth and anomalies
## Common Failures
- Logging raw prompts containing PII to audit storage
- Audit logging added retroactively after 1M+ AI calls processed
- Synchronous audit logging adding latency to AI calls
- Immutable storage not truly immutable (delete permissions exist)
- Not scoping audit logs by tenant in multi-tenant systems
## Decision Points
- **Anonymization depth**: Strip all PII vs hash with reversible mapping for debugging?
- **Storage engine**: Append-only DB table, dedicated log service, or S3/object storage?
- **Retention period**: 30 days, 90 days, or compliance-mandated duration?
- **Synchronous vs async**: Async queue for production; sync only for compliance-critical paths?
## Performance Considerations
- Audit logging middleware: ~1-5ms per call (anonymization + metadata collection)
- Async queue persistence: negligible request-time overhead (<1ms dispatch)
- Audit storage: 1KB-10KB per record — 1M records = 1-10GB
- Periodic cleanup jobs for TTL enforcement: ~5 minutes per million records
## Security Considerations
- Audit logs must be immutable and append-only (no DELETE, no UPDATE)
- Access to audit logs must be restricted and logged
- Audit logs may contain sensitive metadata — encrypt at rest
- Implement audit log monitoring for unauthorized access attempts
- Ensure audit trail integrity with hash chains or digital signatures for high-compliance environments
## Related Rules (from 05-rules.md)
- Design current architecture to support multi-modal inputs
- Prepare for agent-to-agent communication protocols
## Related Skills
- Future-Proof AI Architecture for Emerging Standards
- Implement Security Middleware for AI Calls
- Implement PII Pseudonymization for AI Prompts
## Success Criteria
- Every AI call produces an immutable audit record
- PII is never stored in raw form in audit logs
- Audit log retention and cleanup operates automatically
- Data residency enforcement prevents cross-region data flow
- Audit trail supports compliance audit requests with tenant-scoped queries
