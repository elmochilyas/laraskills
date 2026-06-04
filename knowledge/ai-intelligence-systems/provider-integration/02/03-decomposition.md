# Decomposition: Provider Adapters

## Topic Overview

Provider adapters are concrete implementations of the provider abstraction layer (ku-01) that translate between the application's standardized interface and each LLM provider's native API. Each adapter handles provider-specific authentication, request format, response parsing, error mapping, and capability detection. The Laravel AI SDK includes adapters for 14+ providers, with a consistent pattern that makes adding new providers predictable.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-02/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Provider Adapters
- **Purpose:** Provider adapters are concrete implementations of the provider abstraction layer (ku-01) that translate between the application's standardized interface and each LLM provider's native API. Each adapter handles provider-specific authentication, request format, response parsing, error mapping, and capability detection. The Laravel AI SDK includes adapters for 14+ providers, with a consistent pattern that makes adding new providers predictable.
- **Difficulty:** Intermediate
- **Dependencies:** ku-01, ku-03, ku-04, ku-06, ku-04

## Dependency Graph
**Depends on:**
- ku-01
- ku-03
- ku-04
- ku-06
- ku-04

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Request Translation:** Converting the standardized `ChatRequest` DTO into the provider-specific JSON payload (different schema per provider).
- **Response Translation:** Parsing the provider-specific JSON response into the standardized `ChatResponse` DTO.
- **Authentication:** Injecting API keys, tokens, or other credentials in the format expected by the provider (header, query param, or body).
- **Endpoint Management:** Constructing the correct API URL for each provider and model.
- **Capability Mapping:** Mapping standardized capabilities (tool calling, streaming, vision, JSON mode) to provider-specific equivalents.
- **Error Mapping:** Converting provider-specific error responses into the application's exception hierarchy.
- **Streaming Adaptation:** Translating provider-specific streaming formats (SSE, server-sent events, WebSocket) into a unified `StreamIterator`.

**Out of scope:**
- ku-01 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-06 topics covered in their respective KUs
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

