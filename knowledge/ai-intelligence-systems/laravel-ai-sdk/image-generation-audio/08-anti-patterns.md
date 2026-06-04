# ECC Anti-Patterns — Image Generation & Audio

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Laravel AI SDK |
| **Knowledge Unit** | Image Generation & Audio |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Synchronous image generation with prompt() blocking workers
2. Not caching generated images — regenerating identical prompts
3. Ignoring content moderation for user-submitted generation prompts
4. No size/quality configuration — default output unsuitable for use case
5. Not handling generation failures (NSFW filter, timeout, credit exhaustion)

---

## Repository-Wide Anti-Patterns

- Storing base64 images in database instead of file storage
- No image format conversion (WebP) for web delivery

---

## Anti-Pattern 1: Synchronous prompt() for Image Generation

### Category
Performance

### Description
Calling `$imageAgent->prompt()` for image generation — blocks PHP-FPM worker for 10–30s.

### Preferred Alternative
Use `->stream()` for progress or `->queue()` for background generation.

### Detection Checklist
- [ ] prompt() for image generation
- [ ] Worker pool exhaustion
- [ ] User-facing timeout

---

## Anti-Pattern 2: Not Caching Generated Images

### Category
Performance

### Description
Regenerating images for identical prompts — costs, latency, rate limits.

### Preferred Alternative
Cache generated image URLs or file paths by prompt hash.

### Detection Checklist
- [ ] Same prompt regenerated
- [ ] No generation cache
- [ ] Redundant API costs

---

## Anti-Pattern 3: Ignoring Content Moderation

### Category
Security

### Description
No moderation check on user-submitted image generation prompts — NSFW content generated.

### Preferred Alternative
Run moderation on prompts before sending to generation API.

### Detection Checklist
- [ ] No prompt moderation
- [ ] User-generated prompts unfiltered
- [ ] Safety policy violation risk

---

## Anti-Pattern 1 Standardized
