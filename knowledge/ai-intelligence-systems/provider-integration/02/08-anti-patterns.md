# ECC Anti-Patterns — Provider Adapters

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | LLM Provider Abstraction & Integration |
| **Knowledge Unit** | Provider Adapters |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Adapter Monolith — One Class Handling Multiple Providers
2. Hardcoding Model Names Inside the Adapter
3. Reading API Keys from Global State Inside Adapter
4. Assuming Identical Streaming Formats Across Providers
5. Embedding Business Logic (Pricing, Routing) in Adapter Code

---

## Repository-Wide Anti-Patterns

- Silent Fallbacks — falling back to a different provider inside an adapter (the application should decide fallback)
- Magic Response Parsing — dynamic property access on responses instead of explicit field mapping

---

## Anti-Pattern 1: Adapter Monolith — One Class Handling Multiple Providers

### Category
Code Organization

### Description
A single adapter class that branches on provider type with if/else or match statements instead of one class per provider.

### Why It Happens
Developers start with one provider and add a second using a conditional, leading to a sprawl of provider-specific branches.

### Warning Signs
- `if ($provider === 'openai') { ... } elseif ($provider === 'anthropic') { ... }`
- Single class with 500+ lines
- Provider-specific edge cases all mixed together

### Why It Is Harmful
Every provider-specific error case, streaming format variant, and capability check lives in one file. A bug in the OpenAI code path can break Anthropic. Testing requires complex setup to exercise each branch. Adding a new provider means touching the same file, increasing risk. The class becomes unmaintainable as provider-specific nuances accumulate.

### Preferred Alternative
One class per provider, each implementing `LLMProvider`. Share common logic via traits or a base class.

### Detection Checklist
- [ ] Single class with provider-branching conditionals
- [ ] Provider-specific bugs affect other providers
- [ ] High maintenance burden from tangled logic

### Related Rules
One Adapter Class per Provider (05-rules.md)

---

## Anti-Pattern 2: Hardcoding Model Names Inside the Adapter

### Category
Maintainability

### Description
Embedding model name strings (e.g., `'gpt-4o'`) directly in adapter code instead of accepting them as configuration.

### Preferred Alternative
Accept model names via constructor injection or request DTOs.

### Detection Checklist
- [ ] Model name string literal in adapter
- [ ] Model change requires code change
- [ ] No per-request model override

---

## Anti-Pattern 3: Reading API Keys from Global State Inside Adapter

### Category
Security

### Description
Adapter calls `env('OPENAI_API_KEY')` or `config('services.openai.key')` directly instead of receiving the key via constructor.

### Preferred Alternative
Inject API keys through the constructor. Reserve config/environment reads for the service provider or factory.

### Detection Checklist
- [ ] `env()` or `config()` call inside adapter method
- [ ] Adapter coupled to Laravel bootstrap
- [ ] Cannot test with different credentials

---

## Anti-Pattern 4: Assuming Identical Streaming Formats Across Providers

### Category
Reliability

### Description
Using a single streaming parser for all providers without accounting for provider-specific SSE event types.

### Preferred Alternative
Implement provider-specific chunk parsers. Test each with real or fixture-based streaming responses.

### Detection Checklist
- [ ] Shared streaming parser for all providers
- [ ] Chunk format errors on specific providers
- [ ] Finish reason parsing mismatches

---

## Anti-Pattern 5: Embedding Business Logic (Pricing, Routing) in Adapter Code

### Category
Architecture

### Description
Adapter contains pricing calculations, provider routing decisions, or fallback orchestration — concerns that belong in the application layer.

### Preferred Alternative
Adapters translate requests/responses only. Keep business rules in services or middleware layers.

### Detection Checklist
- [ ] Pricing logic in adapter
- [ ] Provider routing decisions in adapter
- [ ] Fallback orchestration in adapter
