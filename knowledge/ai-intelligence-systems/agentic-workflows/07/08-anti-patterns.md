# ECC Anti-Patterns — Agent Observability

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Agentic Workflows |
| **Knowledge Unit** | Agent Observability |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Agent Execution Logging — Black Box Behavior
2. Logging Full Prompt Content Including PII
3. No Token Usage Tracking Per Agent Call
4. No Error Rate Alerting on Agent Failures
5. Not Correlating Agent Calls with User Requests

---

## Repository-Wide Anti-Patterns

- No trace ID across multi-agent chain — hard to debug
- Agent latency not monitored — performance regressions undetected

---

## Anti-Pattern 1: No Agent Execution Logging

### Category
Observability

### Description
Agent calls are black boxes — no record of what was sent, what tools were called, or what was returned.

### Preferred Alternative
Log agent execution: instructions, tool calls, responses, latency, token usage, errors.

### Detection Checklist
- [ ] No agent logging
- [ ] Cannot debug agent behavior
- [ ] No audit trail

---

## Anti-Pattern 2: Logging PII in Prompts

### Category
Security

### Description
Full prompt content logged including user PII, API keys, or sensitive data — compliance violation.

### Preferred Alternative
Redact PII before logging. Log prompt structure, token count, and metadata, not full content.

### Detection Checklist
- [ ] PII in prompt logs
- [ ] No redaction mechanism
- [ ] Compliance risk
