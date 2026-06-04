---
id: ku-01
title: "System Prompt Design - Rules"
subdomain: "prompt-engineering"
ku-type: "foundation"
date-created: "2026-06-02"
---

## Rules for System Prompt Design

### R1: Always define the model's persona, constraints, and output format before any instructions
- **Category:** Architecture
- **Rule:** Start every system prompt with a clear definition of who the model is acting as, what constraints it must follow, and what output format is expected; never begin with task instructions.
- **Reason:** The beginning of a prompt sets the model's context. Starting with persona and constraints establishes the behavioral framework before instructions. Starting with task details leads to inconsistent personification and format drift.
- **Bad Example:** "Translate this text to French. Also, you are a professional translator." — the persona instruction after the task is weaker.
- **Good Example:** "You are a professional legal translator specializing in French-English translations. You must preserve all legal terminology precisely. Respond with only the translation, no explanations." — frame set first.
- **Exceptions:** Very short prompts (<50 tokens) where the persona is implicit.
- **Consequences of Violation:** The model may ignore persona instructions, mix output formats, or fail to maintain consistent tone/behavior across interactions.

### R2: Never include factual data directly in system prompt — reference it from knowledge base
- **Category:** Maintainability
- **Rule:** Keep system prompts static by referencing a knowledge base or RAG system for domain-specific facts; never hardcode facts, policies, or product information in the prompt.
- **Reason:** Hardcoded facts in prompts require prompt versioning and redeployment every time a fact changes. A knowledge base can be updated independently without touching the prompt.
- **Bad Example:** A system prompt containing "Our return policy is 30 days from purchase" — when policy changes to 45 days, the prompt must be updated and retested.
- **Good Example:** System prompt: "Use the provided company policy documents to answer return policy questions." — policy documents updated independently.
- **Exceptions:** Immutable facts like the company's founding year.
- **Consequences of Violation:** Stale information in prompts after policy or data changes; costly prompt re-deployment cycle for every data update; increased risk of contradictory instructions when some facts are updated and others are not.

### R3: Implement system prompt composition from modular fragments, never monolithic strings
- **Category:** Maintainability
- **Rule:** Build system prompts by composing modular fragments (role, constraints, output format, context, safety instructions) at request time; never store or edit prompts as a single large string.
- **Reason:** Monolithic prompts are un-testable — you cannot test the role fragment independently from safety instructions. Modular composition enables per-fragment testing, versioning, and reuse across agents.
- **Bad Example:** A 2000-line system prompt stored as a single Markdown file with no structure.
- **Good Example:** A `PromptComposer` class that assembles `new RoleFragment('customer-support')`, `new SafetyFragment('strict-no-pii')`, and `new FormatFragment('json-response')` into a composed prompt.
- **Exceptions:** Short single-purpose agents where fragmentation adds unnecessary complexity.
- **Consequences of Violation:** Cannot test or version individual prompt components; any prompt change requires modifying and reviewing the entire string; no reuse of common fragments across agents.
