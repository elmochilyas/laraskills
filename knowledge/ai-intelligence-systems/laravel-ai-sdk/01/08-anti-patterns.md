# ECC Anti-Patterns — Provider Abstraction Layer Design

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Laravel AI SDK |
| **Knowledge Unit** | Provider Abstraction Layer Design |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Leaking Provider-Specific Types Through the Abstraction Interface
2. Implementing Lowest Common Denominator Interface Only
3. Provider-Specific Error Handling Outside the Abstraction
4. Bypassing the Abstraction — Direct Provider Calls in Business Logic
5. Not Implementing Capability Detection in the Abstraction

---

## Repository-Wide Anti-Patterns

- Abstraction leak — provider-specific fields in standardized DTOs
- Interface bloating — adding methods that only one provider implements

---

## Anti-Pattern 1: Leaking Provider-Specific Types Through the Abstraction Interface

### Category
Architecture

### Description
The provider interface or standardized DTOs include fields/methods specific to a single provider — breaks the abstraction contract for others.

### Why It Happens
Developer adds a convenient field for OpenAI, then every adapter must implement or stub it.

### Warning Signs
- `ChatResponse` has fields only populated by one provider
- `supports()` method with provider-specific enum values
- Nullable fields that are always null for most providers

### Why It Is Harmful
Every new provider must implement fields they cannot populate, forcing null returns or stubs. The abstraction loses its usefulness — consumers must check which provider is in use before accessing fields. Adding a new provider requires understanding provider-specific quirks embedded in the interface.

### Preferred Alternative
Keep the interface minimal and provider-agnostic. Use optional extension mechanisms (options, metadata maps) for provider-specific data.

### Detection Checklist
- [ ] Provider-specific field in abstract DTO
- [ ] Null/unused fields for most providers
- [ ] Consumers check provider type before field access

### Related Rules
Keep Provider Interface Provider-Agnostic (05-rules.md)

---

## Anti-Pattern 2: Implementing Lowest Common Denominator Interface Only

### Category
Architecture

### Description
Only implementing features that all providers support — hiding advanced capabilities.

### Preferred Alternative
Implement capability detection (`supports()`). Expose advanced features via options and fallbacks.

### Detection Checklist
- [ ] All providers limited to common features
- [ ] Capability detection not implemented
- [ ] Provider-specific power unused

---

## Anti-Pattern 3: Provider-Specific Error Handling Outside the Abstraction

### Category
Reliability

### Description
Application-level code catches `GuzzleException` or raw HTTP errors instead of provider-abstracted exceptions.

### Preferred Alternative
All provider errors should flow through the abstraction's exception hierarchy. Catch `ProviderException` subtypes only.

### Detection Checklist
- [ ] `catch (GuzzleException $e)` in business logic
- [ ] Raw HTTP error handling at application layer
- [ ] Provider change breaks error handling

---

## Anti-Pattern 4: Bypassing the Abstraction — Direct Provider Calls in Business Logic

### Category
Architecture

### Description
Calling provider SDK methods directly in service classes instead of going through the abstraction layer.

### Preferred Alternative
All provider communication must go through the abstraction. Direct calls couple business logic to specific providers.

### Detection Checklist
- [ ] OpenAI/Anthropic SDK imports in business code
- [ ] Provider switch requires rewriting business logic
- [ ] No abstraction layer in use

---

## Anti-Pattern 5: Not Implementing Capability Detection

### Category
Framework Usage

### Description
The abstraction interface forces all providers to implement the same methods without a way to query supported features.

### Preferred Alternative
Add `supports(string $capability): bool` to the provider interface. Map feature detection at the adapter level.

### Detection Checklist
- [ ] No `supports()` method on provider interface
- [ ] Runtime errors on unsupported features
- [ ] Provider feature parity undocumented
