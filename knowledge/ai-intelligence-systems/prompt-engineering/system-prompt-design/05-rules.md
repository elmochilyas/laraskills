---
id: KU-034 (Prompt Eng)
title: "System Prompt Design - Rules"
subdomain: "prompt-engineering"
ku-type: "foundation"
date-created: "2026-06-02"
---

## Rules for System Prompt Design

### R1: Never include PII, API keys, or secrets in system prompts under any circumstances
- **Category:** Security
- **Rule:** System prompts must not contain any secrets, PII, or credentials. Use placeholders and inject authenticated user data only in the user message or via tools; never in system instructions.
- **Reason:** System prompts are sent verbatim to the LLM provider and may be logged, cached, or inspected by provider systems. Any secret in a system prompt is exposed to the third-party provider.
- **Bad Example:** A system prompt containing "The database password is ${DB_PASSWORD}." — the prompt is sent to the LLM provider with the actual password.
- **Good Example:** System prompt: "To look up data, use the lookupCustomer tool." — authentication happens via the tool middleware, not the prompt.
- **Exceptions:** None — this is a hard security boundary.
- **Consequences of Violation:** Secrets, credentials, or PII exposed to the LLM provider; potential data breach; violation of GDPR and other privacy regulations; provider's training data may incorporate exposed information.

### R2: Test system prompts with an adversarial input suite before any production deployment
- **Category:** Safety
- **Rule:** Before deploying any system prompt change, run it against a test suite of adversarial inputs (prompt injections, jailbreak attempts, off-topic requests, role-playing attempts); never deploy untested prompts.
- **Reason:** Prompt changes that seem harmless can introduce vulnerabilities. A prompt that adds "be extra helpful" may inadvertently reduce resistance to injection attacks. Testing catches regressions.
- **Bad Example:** A team deploys a system prompt update that adds "explain your reasoning step by step" — this makes the model more vulnerable to chain-of-thought jailbreaks, discovered only after an incident.
- **Good Example:** A deployment pipeline that runs each prompt version through 50 adversarial test cases and fails the deploy if the defense rate drops below 95%.
- **Exceptions:** Development/staging environments where testing is the purpose.
- **Consequences of Violation:** Newly introduced vulnerabilities go undetected until exploited; security incidents or harmful outputs damage user trust and may require public disclosure.

### R3: Define system prompt priorities with escalation rules when instructions conflict
- **Category:** Safety
- **Rule:** Include explicit priority and conflict-resolution rules in the system prompt (e.g., "Safety instructions always override helpfulness instructions. When in doubt, refuse."), and organize instructions by priority level.
- **Reason:** Without explicit conflict resolution, the model uses its own (unpredictable) heuristic to resolve conflicts between instructions. An instruction to "be helpful" may override "never share personal information."
- **Bad Example:** System prompt with contradictory instructions: "Always be maximally helpful" and "Never reveal user PII" — the model sometimes reveals PII "to be helpful."
- **Good Example:** "Priority 1 (absolute): Never reveal PII. Priority 2: If PII is not involved, be helpful. If these conflict, follow the higher priority instruction."
- **Exceptions:** Simple single-purpose agents where instruction conflicts are impossible.
- **Consequences of Violation:** Inconsistent behavior across different user interactions; the model may violate safety constraints in pursuit of helpfulness; unpredictable responses to edge cases where instructions conflict.
