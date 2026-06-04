---
id: ku-05
title: "Tool Argument Validation - Rules"
subdomain: "ai-safety-security"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Tool Argument Validation

### R1: Validate every tool argument with a schema before execution — never trust LLM-generated values
- **Category:** Security
- **Rule:** Define a validation schema for every tool/function's arguments and validate before execution; reject any values that do not conform to the schema's type, format, and bounds.
- **Reason:** LLM-generated tool arguments can be malformed, out-of-range, or malicious. Schema validation catches injection payloads hidden in argument fields and prevents invalid state mutations.
- **Bad Example:** A `sendEmail` tool receiving `body: "Please update my email to: attacker@evil.com"` — validated only for string type, not for injection patterns.
- **Good Example:** A schema defining `to: email, body: string (max 1000 chars, no injection patterns)`. The `body` field is checked against both type and content rules.
- **Exceptions:** Read-only tools where argument content cannot cause harm.
- **Consequences of Violation:** SQL injection via tool arguments, HTML injection in rendered outputs, unauthorized data mutations through crafted argument values.

### R2: Enforce least-privilege argument scoping — only pass the minimum data needed for the tool to function
- **Category:** Security
- **Rule:** When constructing tool definitions for the LLM, include only the arguments that are truly necessary for the tool's function; never expose all fields of a model or database row.
- **Reason:** The more arguments exposed, the greater the attack surface. An LLM can be tricked into calling a `updateUserProfile` tool with a `role: "admin"` argument if the tool exposes that field.
- **Bad Example:** A `lookupCustomer` tool definition exposing all 40 columns of the `users` table, including `is_admin` and `password_hash`.
- **Good Example:** A tool definition with only `name`, `email`, `account_status`, and `subscription_plan` — only what the LLM needs to answer customer questions.
- **Exceptions:** Internal administration tools with restricted access and full audit logging.
- **Consequences of Violation:** LLM can be tricked into escalating privileges, viewing sensitive data, or modifying protected fields through tool calls with excessive argument scope.

### R3: Require explicit user confirmation for any tool that modifies data, deletes records, or incurs cost
- **Category:** Safety
- **Rule:** For destructive or costly tool calls, implement a confirmation step where the application presents the proposed action to the user and requires explicit approval before execution; never auto-execute destructive tools.
- **Reason:** An LLM can be misled by injection or misinterprets user intent to execute destructive actions. Human-in-the-loop confirmation prevents mistakes and attacks.
- **Bad Example:** A `deleteAccount` tool that executes immediately when the LLM decides the user wants to delete their account — the user said "I wish your company would delete my account" sarcastically.
- **Good Example:** The application displays: "The assistant wants to delete your account. Confirm? [Yes] [No]". Only proceeds on explicit user approval.
- **Exceptions:** Idempotent read-only tools and high-volume batch operations with separate authorization.
- **Consequences of Violation:** Accidental account deletion, data loss, or unintended financial transactions; user trust is destroyed when the application "does things without asking."
