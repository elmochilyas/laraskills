# ECC Anti-Patterns — Vision & Multimodal

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Laravel AI SDK |
| **Knowledge Unit** | Vision & Multimodal |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Sending Full-Resolution Images Without Compression
2. No Content Moderation on User-Submitted Images
3. Assuming All Providers Support Vision — No supports() Check
4. Sending Large Base64 Images in Request Body
5. Not Handling Image Token Limits

---

## Repository-Wide Anti-Patterns

- No image format validation — unsupported formats silently fail
- Not caching image analysis results

---

## Anti-Pattern 1: Full-Resolution Images Without Compression

### Category
Performance

### Description
Sending original 4000x3000 images to vision API — massive token cost, slow processing.

### Preferred Alternative
Resize and compress images before sending. Target max 2048px on longest edge.

### Detection Checklist
- [ ] Original resolution images sent
- [ ] High token costs per vision call
- [ ] Slow response times

---

## Anti-Pattern 2: No Content Moderation

### Category
Security

### Description
User-submitted images sent directly to vision API without moderation.

### Preferred Alternative
Run content moderation on images before sending to provider.

### Detection Checklist
- [ ] No image moderation
- [ ] User-submitted images unfiltered
- [ ] NSFW content exposure risk

---

## Anti-Pattern 3: No supports() Check for Vision

### Category
Reliability

### Description
Sending image inputs without checking `supports(Capability::Vision)`.

### Preferred Alternative
Check vision capability before sending. Fall back if unsupported.

### Detection Checklist
- [ ] Image sent without supports() check
- [ ] Provider switch breaks vision features
- [ ] No fallback for non-vision models
