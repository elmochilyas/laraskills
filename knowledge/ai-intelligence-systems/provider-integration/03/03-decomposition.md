# Decomposition: Provider-Specific Features

## Topic Overview

Provider-specific features are capabilities offered by individual LLM providers that go beyond the common chat/embed/stream interface. Examples include vision/image inputs, structured output (JSON mode), context caching, prompt caching, response moderation labels, parallel tool calling limits, and system fingerprinting. The provider abstraction layer must expose these features without leaking provider-specific types or forcing all providers to implement features they don't support.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-03/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Provider-Specific Features
- **Purpose:** Provider-specific features are capabilities offered by individual LLM providers that go beyond the common chat/embed/stream interface. Examples include vision/image inputs, structured output (JSON mode), context caching, prompt caching, response moderation labels, parallel tool calling limits, and system fingerprinting. The provider abstraction layer must expose these features without leaking provider-specific types or forcing all providers to implement features they don't support.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-02, ku-07, ku-08, ku-04

## Dependency Graph
**Depends on:**
- ku-01
- ku-02
- ku-07
- ku-08
- ku-04

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Capability Detection:** The `supports(string $capability): bool` method on the provider interface. Allows the application to check if a feature is available before using it.
- **Feature Flags:** A mechanism for the application to request provider-specific features in a provider-agnostic way (e.g., `$request->withOption('response_format', 'json_schema', $schema)`).
- **Extension Methods:** Provider-specific methods on the adapter that can be accessed when the application knows it's using a specific provider.
- **Capability Matrix:** A mapping of providers to supported capabilities, used for routing decisions and feature detection.
- **Graceful Degradation:** When a requested feature is not supported by the selected provider, fall back to a supported alternative or fail with a clear message.
- **Cross-Provider Equivalents:** Different providers may have equivalent features under different names (e.g., OpenAI's JSON mode vs. Anthropic's structured output).

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs
- ku-07 topics covered in their respective KUs
- ku-08 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

