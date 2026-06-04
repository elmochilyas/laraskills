---
id: KU-042 (Local LLMs)
title: "Dev-to-Prod Provider Switching - Rules"
subdomain: "local-llms"
ku-type: "strategy"
date-created: "2026-06-02"
---

## Rules for Dev-to-Prod Provider Switching

### R1: Always use the same provider abstraction interface in development and production
- **Category:** Architecture
- **Rule:** Code against a provider-agnostic interface (e.g., `AiProvider::chat()`) in all application code; switch between Ollama (dev) and OpenAI/Anthropic (prod) via configuration only, never via code branches.
- **Reason:** If development and production use different code paths, the production behavior is never tested in development. Bugs, edge cases, and response format differences surface only after deployment.
- **Bad Example:** A development environment with `Ollama::chat()` calls and production with `OpenAI::chat()` calls — development tests pass but production has format mismatch errors.
- **Good Example:** Both environments call `$this->provider->chat($messages)`. The provider is resolved from config: `services.ai.driver: 'ollama'` (dev) or `'openai'` (prod).
- **Exceptions:** Provider-specific features (vision, function calling) not available in the local model.
- **Consequences of Violation:** Production-only failures from untested code paths; development catches 0% of provider-specific issues; wasted debugging time on issues that don't reproduce in dev.

### R2: Never assume local models have the same capabilities as production cloud models
- **Category:** Reliability
- **Rule:** Test every feature against the target cloud model before deploying; never validate functionality against a local model alone and promote to production assuming the same behavior.
- **Reason:** Local models (Llama 3.1, Mistral) have different instruction-following ability, output format compliance, and refusal patterns than GPT-4o or Claude. Features that work perfectly on Llama 3.1 may fail on Claude or vice versa.
- **Bad Example:** A JSON extraction feature developed and tested only with Ollama/Llama 3.1 — the production GPT-4o version returns JSON with different field names, breaking downstream parsing.
- **Good Example:** The extraction feature is tested with both Ollama (dev) and one-shot against GPT-4o-mini (CI) to catch format differences before production deploy.
- **Exceptions:** Non-production tasks like internal prototyping.
- **Consequences of Violation:** Feature works in development but breaks in production due to model differences; users encounter format errors, instruction misunderstandings, or different refusal behavior.

### R3: Implement a local-model fallback mode that degrades gracefully when cloud provider is unavailable
- **Category:** Reliability
- **Rule:** Configure the provider resolver to fall back to a local model (Ollama) when the cloud provider is unreachable or returns errors; notify the user or developer about the fallback state.
- **Reason:** Cloud provider outages are rare but impactful. A local fallback keeps the application functional (with reduced quality) during downstream outages, maintaining user trust.
- **Bad Example:** A production app that depends entirely on OpenAI — a 2-hour OpenAI outage makes the entire AI feature set unavailable.
- **Good Example:** Circuit breaker opens for OpenAI → provider resolver falls back to local Ollama instance → response quality decreases but service continues → "Powered by local model" banner displayed.
- **Exceptions:** Features that require cloud-only capabilities (vision, advanced reasoning).
- **Consequences of Violation:** Complete AI feature downtime during any cloud provider outage; users cannot access any AI-powered functionality.
