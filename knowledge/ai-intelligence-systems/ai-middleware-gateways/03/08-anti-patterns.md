# ECC Anti-Patterns — Gateway Request/Response Transformation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Middleware & Gateways |
| **Knowledge Unit** | Gateway Request/Response Transformation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Transformation Mutating Original Request — Unexpected Side Effects
2. No Transformation Validation — Malformed Requests Reach Provider
3. Response Transformation Losing Provider-Specific Metadata
4. Heavy Transformations Blocking Gateway Throughput
5. Transformation Logic Not Reusable Across Routes

---

## Repository-Wide Anti-Patterns

- No transformation unit tests — breaks silently on API changes
- Transformations not versioned — can't roll back

---

## Anti-Pattern 1: Transformation Mutating Original Request

### Category
Reliability

### Description
Transform middleware modifies the original request object instead of creating a copy — side effects in downstream middleware.

### Preferred Alternative
Create a new request object for transformation. Preserve original.

### Detection Checklist
- [ ] Mutation of original request
- [ ] Downstream middleware affected
- [ ] Side effects from transformation

---

## Anti-Pattern 2: No Transformation Validation

### Category
Reliability

### Description
Transformation runs but no validation of output — malformed request sent to provider.

### Preferred Alternative
Validate transformed request against schema before sending to provider.

### Detection Checklist
- [ ] No post-transformation validation
- [ ] Malformed requests sent to provider
- [ ] Provider-side errors from invalid format
