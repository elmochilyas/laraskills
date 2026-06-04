---
id: KU-040 (AI Safety)
title: "Tool Argument Validation - Rules"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Tool Argument Validation

### R1: Implement argument type coercion against a strict schema before execution
- **Category:** Security
- **Rule:** Define each tool argument with a strict type (int, string, email, url, enum) and max length; coerce/validate input against this schema before the tool executes; never pass LLM output directly to execution.
- **Reason:** LLMs produce inconsistent types — they may return a string "42" when the schema specifies integer. If the tool executes with uncoerced types, database errors, type errors, or injection vulnerabilities occur.
- **Bad Example:** A `getUserProfile` tool with `user_id` expecting an integer — the LLM returns `user_id: "42"` (string) and the database query fails or is injected with a non-integer value.
- **Good Example:** A schema validator that casts `"42"` to `42` (int) and rejects `"42; DROP TABLE users;"` (contains non-numeric characters). Validation: `is_int($userId) || (is_string($userId) && ctype_digit($userId))`.
- **Exceptions:** Tools that accept free-form text (like "write a note").
- **Consequences of Violation:** SQL injection via non-validated tool arguments; type errors causing 500 errors; malformed tool calls that corrupt data.

### R2: Never allow tool execution based solely on LLM decision — always have an application-side authorization check
- **Category:** Security
- **Category:** Security
- **Rule:** For every tool, implement a server-side authorization check that verifies the current user has permission to execute the tool with the specific arguments, regardless of what the LLM decides — never let the LLM authorize its own tool calls.
- **Reason:** An LLM can be confused or tricked into calling tools the user is not authorized to use. Authorization must be enforced at the application layer, not delegated to the model.
- **Bad Example:** An `adminDeleteUser` tool defined in the LLM's tools list — if the LLM is convinced the user is an admin, it calls the tool and the application executes it without verifying.
- **Good Example:** The tool middleware checks `$this->authorize('delete-user', $targetUserId)` before executing any delete tool call, regardless of what the LLM decided.
- **Exceptions:** Public-facing tools with no authorization requirements.
- **Consequences of Violation:** Privilege escalation through LLM manipulation; unauthorized users access or modify data beyond their permissions.

### R3: Implement tool output filtering that limits what data from tool results is returned to the LLM
- **Category:** Security
- **Rule:** Before returning tool results to the LLM, filter the output to include only the fields necessary for the LLM to complete its task; never return complete database records including sensitive fields.
- **Reason:** The LLM has an output channel (the response to the user) and may inadvertently or through injection reveal data from tool results. Limiting tool result content limits data exposure.
- **Bad Example:** A `lookupCustomer` tool returns the full user record including `ssn`, `password_hash`, and internal notes — the LLM could reveal these in its response.
- **Good Example:** The tool result includes only `name`, `email`, and `account_status` — fields relevant to customer support.
- **Exceptions:** Internal audit tools where full data access is logged and authorized.
- **Consequences of Violation:** Sensitive data leaked through LLM responses; PII exposure; internal system data revealed to users through model hallucination or manipulation.
