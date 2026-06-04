---
id: ku-04
title: "OWASP LLM Compliance (Top 10 for LLM Apps) - Rules"
subdomain: "ai-safety-security"
ku-type: "compliance"
date-created: "2026-06-02"
---

## Rules for OWASP LLM Compliance

### R1: Address all OWASP LLM Top 10 categories in the application's threat model before production
- **Category:** Security
- **Rule:** Conduct a dedicated threat modeling session mapping mitigations against each OWASP LLM Top 10 category (LLM01: Prompt Injection through LLM10: Model Theft); document mitigations in the security architecture; never skip categories.
- **Reason:** Each category represents a distinct attack vector. Skipping any category (e.g., LLM05: Supply Chain) leaves a blind spot, and attackers systematically probe all vectors.
- **Bad Example:** A threat model that covers only prompt injection and excessive agency but ignores model denial of service and supply chain vulnerabilities.
- **Good Example:** A security checklist: LLM01 (injection shields), LLM02 (sensitive info disclosure → PII redaction), LLM03 (output guard), LLM04 (tool auth), LLM05 (dependency pinning), LLM06 (excessive agency → permission scoping), LLM07 (rate limiting), LLM08 (over-reliance → disclaimers), LLM09 (vector store access control), LLM10 (model access control).
- **Exceptions:** Applications that only interact with models locally via Ollama and have no network exposure.
- **Consequences of Violation:** Unaddressed attack vectors remain exploitable; security audit failures; compliance gaps in regulated industries.

### R2: Never give LLM agents access to tools that can modify or delete production data
- **Category:** Security
- **Rule:** Unless explicitly required and audited, restrict agent tools to read-only operations on production data (GET endpoints, SELECT queries); require a separate approval flow for write/delete tool access.
- **Reason:** The LLM Top 10 identifies Excessive Agency (LLM06) as a critical risk. An agent with write access can be manipulated via injection to delete data, modify permissions, or escalate privileges.
- **Bad Example:** A customer support agent with direct access to `DELETE FROM users WHERE id = ?` — an injection attack deletes user accounts.
- **Good Example:** Support agent tools are all SELECT queries on user data; account deletion requires a separate admin tool with human-in-the-loop approval.
- **Exceptions:** Internal-admin-only agents running in isolated environments with full audit logging.
- **Consequences of Violation:** Data loss or corruption via indirect prompt injection; unauthorized modifications trigger cascading failures in downstream systems.

### R3: Implement per-session and per-user rate limiting on LLM calls to prevent DoS and budget exhaustion
- **Category:** Security
- **Rule:** Apply rate limits at both the user level (X requests/minute) and session level (Y requests/minute); configure limits to prevent both accidental runaway requests and intentional DoS; never allow unlimited LLM access.
- **Reason:** Without rate limits, a single user or script can exhaust the AI budget (cost DoS), degrade service for other users (performance DoS), or use aggressive prompt extraction techniques requiring many requests.
- **Bad Example:** An unauthenticated AI chat feature with no rate limiting — an attacker runs a script sending 10,000 requests in an hour, consuming the monthly AI budget.
- **Good Example:** Authenticated users: 30 requests/minute; anonymous users: 5 requests/minute; a Redis-based sliding window counter prevents all users collectively exceeding 1000 requests/minute.
- **Exceptions:** Internal batch-processing jobs with separate billing.
- **Consequences of Violation:** AI budget consumed by a single attacker; legitimate users experience degraded service or rate limiting due to budget exhaustion; prompt extraction attacks require many requests to succeed.
