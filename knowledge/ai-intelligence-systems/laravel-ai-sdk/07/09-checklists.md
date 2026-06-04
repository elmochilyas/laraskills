# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** laravel-ai-sdk
**Knowledge Unit:** ku-07
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Cache image analysis results
- [ ] Count image tokens.
- [ ] Handle unsupported content types gracefully.
- [ ] Provide image detail control.
- [ ] Support both base64 and URL image inputs.
- [ ] Both base64 and URL image sources are supported.
- [ ] Content blocks support both text and image types with provider-agnostic interface.
- [ ] EXIF data is stripped from user-uploaded images.
- [ ] Check Vision Capability Before Sending Images
- [ ] Limit Multiple Images Per Request
- [ ] Prevent SSRF via Image URLs
- [ ] Strip EXIF Data from User-Uploaded Images
- [ ] Use Appropriate Image Detail Level
- [ ] EXIF metadata stripped from user-uploaded images before transmission
- [ ] Image detail level set appropriately (low for layout, high for fine detail)
- [ ] Image dimensions and file size validated against provider limits
- [ ] Check vision capability via `$provider->supports('vision')` before sending images
- [ ] Downscale oversized images before encoding to save tokens
- [ ] Limit the number of images sent per request (5-10 maximum)
- [ ] Detail level matched to use case (low for layout, high for fine detail)

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy

---

# Implementation Checklist

- [ ] Cache image analysis results
- [ ] Count image tokens.
- [ ] Handle unsupported content types gracefully.
- [ ] Provide image detail control.
- [ ] Support both base64 and URL image inputs.
- [ ] Validate image size before sending.
- [ ] Check vision capability via `$provider->supports('vision')` before sending images
- [ ] Downscale oversized images before encoding to save tokens
- [ ] Limit the number of images sent per request (5-10 maximum)
- [ ] Set image detail level to `low` unless the use case requires `high` detail
- [ ] Strip EXIF metadata from user-uploaded images before sending to providers
- [ ] Use content blocks for multimodal message construction

---

# Performance Checklist

- [ ] For high-volume image processing, consider using a dedicated vision model (cheaper, faster) instead of a multimodal LLM.
- [ ] Image encoding (base64) and resizing add 1-10ms depending on image size. Cache encoded versions.
- [ ] Image token consumption: a 1024x1024 image at high detail consumes ~255 tokens (OpenAI). Large images can consume 2000+ tokens.
- [ ] Image URL downloads: if using URL mode, the provider downloads the image. Offloads bandwidth cost to the provider.
- [ ] Vision requests are typically 2-5x slower than text-only requests (model spends more processing time).
- [ ] Downscale oversized images before encoding to save bandwidth and tokens
- [ ] Strip EXIF data from user-uploaded images (GPS, device info privacy)

---

# Security Checklist

- [ ] Base64 injection:
- [ ] Data leakage:
- [ ] Image content moderation:
- [ ] Image EXIF data:
- [ ] SSRF via image URLs:
- [ ] Downscale oversized images before encoding to save bandwidth and tokens
- [ ] High detail images consume 2-5x more tokens; use low detail where possible
- [ ] Validate user-provided image URLs against SSRF attacks

---

# Reliability Checklist

- [ ] Assuming all models within a provider support vision (e.g., GPT-4 Turbo does, GPT-3.5 does not).
- [ ] Not handling the case where the model cannot see images (returns "I cannot see images").
- [ ] Not providing fallback text for accessibility when images fail to load.
- [ ] Not removing EXIF data from user-uploaded images before sending to providers.
- [ ] Sending oversized images that exceed the provider's limits (e.g., OpenAI's 20MB limit).
- [ ] Confusing "I can't see"
- [ ] Context window overflow
- [ ] HTTP 400 from provider
- [ ] Privacy data leaked via EXIF
- [ ] SSRF attack vector

---

# Testing Checklist

- [ ] Both base64 and URL image sources are supported.
- [ ] Content blocks support both text and image types with provider-agnostic interface.
- [ ] Detail level matched to use case (low for layout, high for fine detail)
- [ ] EXIF data is stripped from user-uploaded images.
- [ ] EXIF data stripped from all user-uploaded images
- [ ] EXIF metadata stripped from user-uploaded images before transmission
- [ ] Image detail level is configurable (low, high, auto).
- [ ] Image detail level set appropriately (low for layout, high for fine detail)
- [ ] Image dimensions and file size validated against provider limits
- [ ] Image token consumption is tracked in cost analytics.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Using prompt() Where stream() Is More Appropriate]
- [ ] [Not Handling Streaming Errors Mid-Response]
- [ ] [Queue Without Notification â€” User Never Knows Agent Completed]
- [ ] [Mixing Synchronous and Async Patterns in Same Workflow]
- [ ] [No Timeout on prompt() â€” Indefinite Blocking]
- [ ] Ignoring Detail Levels:
- [ ] Image Dump:
- [ ] No Image Preprocessing:
- [ ] Synchronous Large Image Processing:
- [ ] Unlimited Image Uploads:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


