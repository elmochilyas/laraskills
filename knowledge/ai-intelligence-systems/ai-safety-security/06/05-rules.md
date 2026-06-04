---
id: ku-06
title: "Psalm/PHPStan Taint Analysis - Rules"
subdomain: "ai-safety-security"
ku-type: "static-analysis"
date-created: "2026-06-02"
---

## Rules for Psalm/PHPStan Taint Analysis

### R1: Enable taint analysis in Psalm/PHPStan with specific taint sources and sinks for AI contexts
- **Category:** Security
- **Category:** Security
- **Rule:** Configure Psalm's taint analysis by defining user input as taint sources and LLM provider calls as taint sinks; never run static analysis without taint detection enabled for AI features.
- **Reason:** Standard Psalm/PHPStan configurations do not treat LLM provider calls as sinks by default. Without explicit configuration, injection-vulnerable code paths (user input → agent → LLM) are not flagged.
- **Bad Example:** Psalm running with only default taint sources/sinks — a code path that passes `$_GET['query']` directly to `Ai::chat()` shows no warnings.
- **Good Example:** Psalm configuration with `<taintSource name="request"/>` and a custom `ai-sink` taint type applied to all `Ai::chat()` calls.
- **Exceptions:** Projects not using Psalm/PHPStan for static analysis.
- **Consequences of Violation:** Vulnerable code paths where user input reaches the LLM without sanitization go undetected; injection attacks succeed in production.

### R2: Never suppress taint analysis warnings without explicit security review and documentation
- **Category:** Security
- **Rule:** Every Psalm/PHPStan taint suppression (`@psalm-suppress TaintedInput` or `@phpstan-ignore`) must be accompanied by a comment explaining why the suppression is safe and must be reviewed by a security-aware engineer before merging.
- **Reason:** Suppressing taint warnings bypasses the primary automated injection detection mechanism. Without review, suppressions become permanent blind spots that hide real vulnerabilities.
- **Bad Example:** A `@psalm-suppress TaintedCustom` annotation added during development and never reviewed — a direct user-to-LLM code path without sanitization remains undetected.
- **Good Example:** `@psalm-suppress TaintedCustom // Why: Input is sanitized by RequestSanitizer::clean() above. Reviewed by: @security-lead, 2026-05-15.`
- **Exceptions:** Suppressions in test code that don't reach production.
- **Consequences of Violation:** A suppressed warning hides a real injection vulnerability; the vulnerability remains in production, detectable by static analysis but ignored until exploited.

### R3: Integrate taint analysis into CI pipeline with a failing threshold for AI-specific taint violations
- **Category:** Workflow
- **Rule:** Configure CI to fail the build when any AI-specific taint violation (user input → LLM sink) is detected; treat AI taint violations as critical security issues, not style warnings.
- **Reason:** AI injection vulnerabilities are as severe as SQL injection or XSS but are often treated less seriously. Treating them as build failures ensures they are addressed before deployment, not left as technical debt.
- **Bad Example:** CI configured to warn about taint violations without failing — developers ignore taint warnings, and injection vulnerabilities accumulate.
- **Good Example:** A CI step: `vendor/bin/psalm --taint-analysis --fail-on=TaintedCustom` — any AI-specific taint violation fails the build immediately.
- **Exceptions:** None — taint violations for AI sinks are always security-critical.
- **Consequences of Violation:** AI injection vulnerabilities accumulate in the codebase; a single unpatched vulnerability is exploited in production, causing brand damage, data exposure, or financial loss.
