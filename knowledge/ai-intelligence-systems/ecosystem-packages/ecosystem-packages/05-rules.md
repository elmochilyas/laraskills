---
id: KU-046 (Ecosystem)
title: "Ecosystem Packages - Rules"
subdomain: "ecosystem-packages"
ku-type: "reference"
date-created: "2026-06-02"
---

## Rules for Ecosystem Packages

### R1: Always verify package maintenance status before adoption — check last release, open issues, and PHP version support
- **Category:** Reliability
- **Rule:** Before adopting any AI-related PHP package, verify: (1) last release <6 months ago, (2) compatible with current PHP and Laravel versions, (3) open issues don't include critical unpatched bugs; never adopt unmaintained packages.
- **Reason:** AI SDKs and packages evolve rapidly with provider API changes. An unmaintained package (last release >6 months) will break as providers update their APIs, leaving the application broken with no path to fix.
- **Bad Example:** Adopting a community Ollama wrapper with 0 GitHub stars and last release 14 months ago — the package doesn't support Ollama 0.3.x API changes, and the Laravel app is stuck on an old Ollama version.
- **Good Example:** Evaluating the package checklist: last release (2 months ago ✓), PHP 8.2+ (✓), Laravel 11+ (✓), open issues (none critical ✓), GitHub stars (500+ indicates community trust ✓).
- **Exceptions:** Air-gapped environments where a "stuck" package version is acceptable.
- **Consequences of Violation:** Application depends on a package that cannot be updated; provider API change breaks the integration; emergency migration to a replacement package under time pressure.

### R2: Never install AI packages that require `exec()`, `shell_exec()`, or `passthru()` in production
- **Category:** Security
- **Rule:** Review the source code of any AI package for PHP execution functions (`exec`, `shell_exec`, `passthru`, `system`, `popen`) before installing; reject any package that uses them for production operation.
- **Reason:** PHP execution functions are the most common vector for RCE vulnerabilities in PHP packages. An AI package that runs `exec("ollama run ...")` or `exec("python script.py ...")` can be exploited to execute arbitrary system commands if input is not perfectly sanitized.
- **Bad Example:** A popular "AI Assistant" package that calls `exec("ollama run {$prompt}")` — a prompt containing `; rm -rf /` executes as a system command.
- **Good Example:** A package that communicates with Ollama via its HTTP API (curl/Guzzle), never shelling out. Code review confirms zero execution functions.
- **Exceptions:** Internal development tools running with restricted permissions.
- **Consequences of Violation:** Remote code execution vulnerability via prompt injection through the AI package; complete server compromise.

### R3: Prefer packages that implement the provider abstraction pattern over provider-specific packages
- **Category:** Maintainability
- **Rule:** When given a choice between a multi-provider abstraction package (e.g., `openai-php/laravel-ai`, `llm-agents/laravel-ai-chat`) and a single-provider package (`openai-php/client` on its own), choose the abstraction unless the single-provider is the only target.
- **Reason:** Provider abstraction packages support swapping providers via configuration. Single-provider packages must be replaced entirely when changing providers. An abstraction costs slightly more initially but saves significant migration work.
- **Bad Example:** Using `openai-php/client` directly everywhere — when the team later adds Anthropic, they must implement a parallel integration.
- **Good Example:** Using `openai-php/laravel-ai` which provides a unified `Ai::chat()` interface — adding Anthropic requires only adding a driver.
- **Exceptions:** When only one provider will ever be used (vendor lock-in accepted).
- **Consequences of Violation:** Future provider migration requires rewriting all AI service code; cost and time of migration prevents adopting better/cheaper providers; vendor lock-in is effectively permanent.
