---
id: KU-032 (Prompt Eng)
title: "Prompt Versioning - Rules"
subdomain: "prompt-engineering"
ku-type: "workflow"
date-created: "2026-06-02"
---

## Rules for Prompt Versioning

### R1: Store prompts in version-controlled files (YAML/JSON) separate from application code, never hardcoded
- **Category:** Maintainability
- **Rule:** Define each prompt as a versioned file in a `prompts/` directory with metadata (id, version, hash, author, date); load prompts by version tag at runtime; never define prompts as PHP strings in controllers or services.
- **Reason:** Hardcoded prompts cannot be version-tracked, rolled back independently, or deployed without application code changes. Separate files enable dedicated prompt review and deployment workflows.
- **Bad Example:** A `CustomerSupportAgent` class with `protected $systemPrompt = "You are..."` embedded as a string literal.
- **Good Example:** A `prompts/customer-support/v3.yaml` file loaded by `PromptRepository::load('customer-support', 'v3')`.
- **Exceptions:** Trivial one-line prompts used in tests.
- **Consequences of Violation:** Prompts bypass code review; rollback of a prompt requires rolling back code; no audit trail of who changed what and when.

### R2: Always include a version hash in logged metadata to correlate responses with the exact prompt version used
- **Category:** Observability
- **Rule:** Record the prompt version hash (or git SHA) in every LLM request log entry as a structured field; never log the full prompt text in production.
- **Reason:** Without version metadata, you cannot determine which prompt version generated a given response. This makes debugging quality regressions impossible — you don't know if the new or old prompt caused the bad response.
- **Bad Example:** Log entries with the LLM response but no indication of which prompt version was used — a quality regression investigation stalls because no one knows when the prompt was last changed.
- **Good Example:** Log entry: `{ prompt_version: 'a3f2c9e', response: '...', latency: 1200, tokens: 150 }`.
- **Exceptions:** Development environments where full prompt logging is acceptable.
- **Consequences of Violation:** Quality regressions cannot be attributed to prompt changes; investigation time is wasted comparing logs to git history manually; prompt rollback decisions are made without data.

### R3: Use semantic versioning for prompts and maintain a changelog for each prompt variant
- **Category:** Maintainability
- **Rule:** Assign semantic versions to prompts (major for breaking output format changes, minor for quality improvements, patch for fixes) and maintain a CHANGELOG per prompt; never deploy unversioned prompt changes.
- **Reason:** Semantic versioning enables consumers to depend on specific prompt behavior. A changelog provides accountability and context for why a prompt changed, which is essential for debugging.
- **Bad Example:** A prompt that was edited in place 15 times over 6 months with no version tracking — no one knows what changed or why.
- **Good Example:** `prompts/summarizer/v2.1.0.yaml` with CHANGELOG entries: "v2.1.0 — Added bullet-point output format option; v2.0.0 — Switched from paragraph to structured output (breaking)."
- **Exceptions:** Internal-only prompts with a single consumer.
- **Consequences of Violation:** Consumers don't know when a prompt change will break their integration; no documentation of why specific changes were made; hard to roll back without knowing the previous version.
