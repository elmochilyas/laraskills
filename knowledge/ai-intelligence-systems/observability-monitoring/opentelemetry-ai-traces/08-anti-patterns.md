# Anti-Patterns: OpenTelemetry for AI Traces

## Metadata

| Attribute | Value |
|-----------|-------|
| **ID** | KU-044 |
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Observability & Monitoring |
| **Type** | Implementation |
| **Version** | 1.0.0 |
| **Status** | Standardized |

## Anti-Pattern Inventory

1. [No Trace Sampling in Production](#1-no-trace-sampling-in-production)
2. [PII in Span Attributes](#2-pii-in-span-attributes)
3. [Synchronous Span Export](#3-synchronous-span-export)
4. [Over-Instrumentation Creating Noise](#4-over-instrumentation-creating-noise)
5. [Not Testing OTel Before Production](#5-not-testing-otel-before-production)

---

## 1. No Trace Sampling in Production

### Category
Cost & Capacity Planning Failure

### Description
Running OpenTelemetry at 100% sampling rate in production without configuring head-based or tail-based sampling. Every single AI request, tool call, and agent step generates traces that are exported to the OTel backend, causing storage costs to explode linearly with traffic volume. At scale, this makes OTel observability costs exceed AI inference costs.

### Why It Happens
- Default configuration: many OTel SDKs default to 100% sampling
- Fear of missing data: team wants to see every trace
- No capacity planning for OTel backend storage
- Development/staging configuration deployed to production
- "We'll add sampling later" — and never do

### Warning Signs
- OTel backend costs increase linearly with application traffic
- Storage volume grows faster than useful analysis can consume
- Dashboards show every individual trace, not aggregated metrics
- Team can't find relevant traces among massive volume
- OTel backend performance degrades under data volume

### Why Harmful
- Observability costs become a significant line item
- Storage volume makes trace queries slow and expensive
- Signal-to-noise ratio degrades: relevant traces are buried
- Backend performance impact from exporting millions of spans
- Budget spent on OTel storage could be used for AI compute

### Real-World Consequences
- Monthly OTel backend bill exceeds LLM inference costs
- Grafana Tempo query timeouts due to data volume
- Team cannot find specific error traces among millions of successful ones
- Cost-cutting mandate forces emergency sampling implementation

### Preferred Alternative
Configure sampling for production: head-based sampling (5-10%) for general traffic, tail-based sampling (100%) for error traces. Keep 100% for staging and development environments where volume is low.

### Refactoring Strategy
1. Implement head-based sampling: sample 1 in 10 or 1 in 20 requests
2. Implement tail-based sampling: capture 100% of error traces, sample successful ones
3. Configure different sampling rates per endpoint (high-volume endpoints lower sampling)
4. Set up OTel collector-level sampling (not just SDK-level)
5. Monitor sampling effectiveness: are you capturing enough error traces?

### Detection Checklist
- [ ] Production sampling rate is configured (<100%)
- [ ] Error traces are captured at 100% (tail-based sampling)
- [ ] Different endpoints have different sampling rates
- [ ] OTel storage cost is monitored against budget

### Related Rules/Skills/Trees
- Skill: Implement OpenTelemetry for AI Traces
- Decision Tree: Performance & Optimization

---

## 2. PII in Span Attributes

### Category
Data Privacy Violation

### Description
Attaching personally identifiable information (PII) such as user IDs, email addresses, full names, conversation content, or API keys to OpenTelemetry span attributes. Since OTel spans are exported to external observability backends (Grafana Tempo, Datadog, Honeycomb), PII in attributes creates a data leakage path to third-party systems, potentially violating GDPR, HIPAA, or other regulations.

### Why It Happens
- Debugging convenience: "let's add user info so we can trace issues"
- No awareness that OTel data leaves the application server
- Overly permissive attribute logging without PII classification
- Copy-paste from examples that include identifying attributes
- No OTel-specific data sanitization pipeline

### Warning Signs
- Span attributes contain user IDs, email addresses, or names
- Conversation text or prompt content is attached as attributes
- API keys or tokens appear in any span attribute
- OTel configuration has no attribute filtering or redaction
- Observability backend has no PII scanning on ingested data

### Why Harmful
- PII leaves your infrastructure and enters third-party observability systems
- GDPR right to erasure: deleting user data from OTel backends is difficult
- Compliance audit findings for uncontrolled PII flow
- API keys in span attributes are leaked to observability providers
- Data subject access requests cannot be fulfilled for OTel data
- OTel backend compromise exposes PII

### Real-World Consequences
- User conversation content appears in Datadog APM traces
- GDPR fine for sending PII to US-based observability provider
- API key leaked through span attribute visible to all team members
- Compliance audit flags OTel as uncontrolled PII data flow
- Legal mandates OTel decommissioning or reconfiguration

### Preferred Alternative
Never attach PII or sensitive data to span attributes. Use pseudonymized identifiers (opaque user UUIDs, not emails). If conversation traces are needed, store them in the application database with PII redaction and reference the trace ID.

### Refactoring Strategy
1. Audit all span attributes for PII and sensitive data
2. Replace PII attributes with pseudonymized or hashed identifiers
3. Implement OTel attribute filtering or redaction in the SDK or collector
4. Configure OTel collector to drop or redact sensitive attributes
5. Add PII scanning to OTel data pipeline (pre-export)

### Detection Checklist
- [ ] No PII in span attributes (user IDs are pseudonymized)
- [ ] No API keys, tokens, or secrets in attributes
- [ ] No conversation text or prompt content in spans
- [ ] OTel collector has attribute redaction configured

### Related Rules/Skills/Trees
- Skill: Implement OpenTelemetry for AI Traces
- KU-04: Data Privacy & PII Protection

---

## 3. Synchronous Span Export

### Category
Performance Anti-Pattern

### Description
Configuring OpenTelemetry to export spans synchronously within the PHP request lifecycle, blocking the worker thread while spans are sent to the OTel collector. Each HTTP request pays the latency cost of span export, adding 10-100ms to response times and reducing request throughput.

### Why It Happens
- Default OTel SDK configuration often defaults to synchronous export
- Simple setup: synchronous export "just works" without additional infrastructure
- No awareness of the performance impact at scale
- Development environment where latency is not noticeable
- Missing OTel collector deployment (direct export from PHP workers)

### Warning Signs
- Request latency increases by 10-100ms after OTel instrumentation
- PHP worker processes are blocked during span export
- OTel export errors cause request failures (if export is in the critical path)
- Number of exported spans correlates directly with P95 latency
- No OTel collector sidecar or gateway is deployed

### Why Harmful
- Every request pays latency cost for observability
- Throughput decreases because workers spend time exporting
- Request failures cascade from OTel backend issues
- Observability becomes a performance problem, not a solution
- OTel export errors cause 5xx responses to users

### Real-World Consequences
- P95 latency increased 50ms after OTel implementation
- PHP worker pool exhausted because workers blocked on OTel export
- OTel backend outage caused application downtime
- Team considers removing OTel to fix performance

### Preferred Alternative
Use asynchronous batch export. Configure the OTel SDK to batch spans and export on a separate thread/process. Deploy an OTel collector as a sidecar or gateway to receive spans locally without network latency.

### Refactoring Strategy
1. Configure batch span processor with async export
2. Set batch size (100 spans) and export interval (5 seconds)
3. Deploy OTel collector as a sidecar in the same deployment
4. Export from PHP workers to local collector (localhost, no network latency)
5. Configure collector to batch and forward to remote backend

### Detection Checklist
- [ ] Span export is asynchronous (does not block request)
- [ ] Batch processor is configured (not simple processor)
- [ ] OTel collector is deployed (not direct export from workers)
- [ ] Export errors do not affect request success/failure

### Related Rules/Skills/Trees
- Skill: Implement OpenTelemetry for AI Traces
- Decision Tree: Performance & Optimization

---

## 4. Over-Instrumentation Creating Noise

### Category
Signal-to-Noise Ratio Degradation

### Description
Creating too many spans within a single trace, such as a span for every line of code, every token generated, or every micro-operation within an agent. This creates traces with hundreds or thousands of spans, making the relevant high-level structure hard to see, increasing storage costs, and degrading observability tool performance.

### Why It Happens
- Enthusiasm for granular observability
- Auto-instrumentation that generates spans for everything
- No span design or hierarchy planning before implementation
- Misunderstanding that more data = better observability
- Framework auto-instrumentation adding spans at every layer

### Warning Signs
- Single traces contain 50+ spans
- Most spans have no useful attributes or events
- Trace waterfall view is too deep to be useful
- OTel backend struggles with high span cardinality
- Team cannot quickly identify the root cause from the trace
- Per-token spans or per-loop-iteration spans exist

### Why Harmful
- Relevant spans are buried in noise, making debugging harder
- Storage costs increase without corresponding value
- OTel backend query performance degrades
- Team ignores traces because they're too complex
- Overhead from creating/closing thousands of spans per request

### Real-World Consequences
- Trace with 200 spans where only 5 are relevant for debugging
- Team stops using traces because "they're too noisy"
- Grafana Tempo page crashes when loading complex traces
- Monthly OTel storage costs $10K with 90% noise spans

### Preferred Alternative
Design span hierarchy before implementation. Limit spans to meaningful boundaries: one span per agent step, one per tool call, one per LLM request, one per database query. Keep span depth to <10 per trace. Use events (not child spans) for granular annotations within a span.

### Refactoring Strategy
1. Review existing span creation and identify noise spans
2. Merge or remove spans that don't add diagnostic value
3. Replace child spans with span events for granular annotations
4. Set maximum span depth and enforce in code review
5. Implement span budget: fail or warn if trace exceeds N spans

### Detection Checklist
- [ ] Average span count per trace is <15
- [ ] Each span serves a clear diagnostic purpose
- [ ] Events are used instead of child spans for granularity
- [ ] Span hierarchy depth is limited

### Related Rules/Skills/Trees
- Skill: Implement OpenTelemetry for AI Traces

---

## 5. Not Testing OTel Before Production

### Category
Operational Readiness Failure

### Description
Deploying OpenTelemetry instrumentation to production without testing the entire pipeline: span creation, export, collector processing, backend ingestion, and querying. The first indication of a problem is during an outage when traces are needed for debugging—and they're missing, incomplete, or unqueryable.

### Why It Happens
- OTel is treated as "free" non-functional instrumentation that doesn't need testing
- No staging environment that mirrors production OTel setup
- OTel configuration considered "simple" and not worth testing
- Testing observable systems is unfamiliar to the team
- Collector and backend are external dependencies assumed to work

### Warning Signs
- OTel was deployed without a dedicated testing phase
- First production trace viewing happens during an incident
- No test that verifies spans are actually exported
- OTel collector configuration has never been tested end-to-end
- Team discovers missing traces during production debugging

### Why Harmful
- Missing traces during the exact moments they're most needed (outages)
- Incorrect configuration causes silent data loss (failed exports without alerts)
- Sampling configuration proves wrong for production traffic patterns
- Backend capacity insufficient for actual production volume
- No trust in observability data: team stops relying on it

### Real-World Consequences
- Production outage with zero traces because OTel export was failing silently
- 3 weeks of production data lost due to misconfigured collector
- Incident response delayed because traces aren't queryable when needed
- Team spends days debugging OTel instead of debugging the application

### Preferred Alternative
Test the OTel pipeline before production deployment: unit test span creation, integration test export connectivity, load test collector throughput, verify traces are queryable in the backend. Include OTel testing in the deployment checklist.

### Refactoring Strategy
1. Add unit tests that verify span creation and attribute attachment
2. Create integration test that sends spans to a test collector
3. Deploy OTel collector to staging and verify end-to-end trace flow
4. Load test staging at expected production volume
5. Add OTel health check and alerting to production monitoring
6. Document OTel testing in deployment runbook

### Detection Checklist
- [ ] Unit tests verify span creation
- [ ] Integration tests verify export to collector
- [ ] Staging OTel environment mirrors production
- [ ] Load testing confirms collector can handle production volume
- [ ] OTel health monitoring and alerting exist

### Related Rules/Skills/Trees
- Skill: Implement OpenTelemetry for AI Traces
- Decision Tree: Reliability & Error Handling
