# ECC Anti-Patterns — Provider-Specific Features

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | LLM Provider Abstraction & Integration |
| **Knowledge Unit** | Provider-Specific Features |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Calling a Provider-Specific Feature Without Checking `supports()` First
2. Feature Leakage — Exposing Provider-Specific Names in the Application Layer
3. Capability Creep — Supporting Every Minor Provider-Specific Feature
4. False Equivalence — Claiming Support When Implementation Differs Functionally
5. All-or-Nothing Capabilities — Treating Capabilities as Binary

---

## Repository-Wide Anti-Patterns

- Capability Silo — only one developer knows which capabilities each provider supports
- Undocumented Capability Matrix — no visible record of which providers support which features

---

## Anti-Pattern 1: Calling a Provider-Specific Feature Without Checking `supports()` First

### Category
Reliability

### Description
Passing provider-specific options like `response_format` or `vision` without first calling `$provider->supports()` — crashes silently on unsupported providers.

### Why It Happens
Developers test with one provider (e.g., OpenAI) and assume all providers support the same features.

### Warning Signs
- Runtime errors on provider switch
- `$request->withOption()` without `supports()` check
- Tests only cover a single provider

### Why It Is Harmful
When a request is sent to a provider that doesn't support a requested capability, the provider may return an error (wasting tokens), ignore the option (producing unexpected output), or the adapter may crash. Without the `supports()` check, the application has no opportunity to degrade gracefully. The error surfaces to the user as a generic failure rather than a clear capability mismatch.

### Preferred Alternative
Always check `$provider->supports(Capability::*)` before using capability-dependent code. Implement fallback paths for unsupported capabilities.

### Detection Checklist
- [ ] Capability-dependent option without supports() check
- [ ] Provider switch breaks features
- [ ] No fallback path for unsupported features

### Related Rules
Always Check supports() Before Using Provider-Specific Features (05-rules.md)

---

## Anti-Pattern 2: Feature Leakage — Exposing Provider-Specific Names in Application Layer

### Category
Architecture

### Description
Using provider-specific method names like `$request->anthropicBeta()` or `$request->openaiJsonMode()` instead of generic option names.

### Preferred Alternative
Use generic option names like `$request->withOption('response_format', 'json_schema', $schema)`.

### Detection Checklist
- [ ] Provider-specific method names in business logic
- [ ] Provider switch requires code changes
- [ ] Abstraction leak

---

## Anti-Pattern 3: Capability Creep — Supporting Every Minor Feature

### Category
Maintainability

### Description
Adding adapter support for every minor provider-specific feature regardless of whether the application needs it.

### Preferred Alternative
Focus on features that provide clear value. Use capability detection to expose only what the application uses.

### Detection Checklist
- [ ] Adapter supports 10+ unused features
- [ ] Feature implementations untested
- [ ] Maintenance cost exceeds value

---

## Anti-Pattern 4: False Equivalence — Claiming Support When Implementation Differs

### Category
Reliability

### Description
Reporting `supports(Capability::Streaming) = true` when the streaming implementation has fundamentally different chunk semantics from other providers.

### Preferred Alternative
Be precise about what "support" means. Document functional differences in the capability matrix.

### Detection Checklist
- [ ] Same capability name, different behavior
- [ ] Consumers surprised by behavior differences
- [ ] Assumptions based on capability name

---

## Anti-Pattern 5: All-or-Nothing Capabilities

### Category
Architecture

### Description
Capabilities treated as binary (supported/not supported) when they have varying levels of support (e.g., "streaming" may support text but not tool calls).

### Preferred Alternative
Use configurable capability levels or separate fine-grained capability enums.

### Detection Checklist
- [ ] Binary capability flags for graded features
- [ ] Partial support incorrectly reported
- [ ] Misleading capability matrix
