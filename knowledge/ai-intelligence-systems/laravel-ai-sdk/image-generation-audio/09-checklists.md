# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** laravel-ai-sdk
**Knowledge Unit:** image-generation-audio
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Caching generated images
- [ ] Combine with agent tools
- [ ] Filesystem integration
- [ ] Multimedia as provider feature
- [ ] Progressive enhancement
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Cache Generated Media by Prompt Hash
- [ ] Configure Provider-Specific Parameters Explicitly
- [ ] Handle Content Policy Rejection Gracefully
- [ ] Implement Rate Limiting for Media Endpoints
- [ ] Store Generated Media on Cloud Storage
- [ ] `->queue()` used for generation >2s expected duration
- [ ] Content policy rejections caught and handled with user-friendly message
- [ ] Generated media stored on cloud storage (not local disk)
- [ ] Always dispatch media generation to the queue using `->queue()`
- [ ] Apply rate limiting to media generation endpoints
- [ ] Cache image generation results by deterministic hash of prompt + parameters
- [ ] Content policy rejections show user-friendly messages, not exceptions

---

# Architecture Checklist

- [ ] Filesystem storage vs. return URL â†’ Configurable via disk setting. Production: S3 for persistence. Development: local disk
- [ ] Provider
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization

---

# Implementation Checklist

- [ ] Caching generated images
- [ ] Combine with agent tools
- [ ] Filesystem integration
- [ ] Multimedia as provider feature
- [ ] Progressive enhancement
- [ ] Always dispatch media generation to the queue using `->queue()`
- [ ] Apply rate limiting to media generation endpoints
- [ ] Cache image generation results by deterministic hash of prompt + parameters
- [ ] Catch content policy rejection errors and return user-friendly messages
- [ ] Configure provider-specific parameters explicitly (size, quality, voice, format)
- [ ] Handle file storage via Laravel Filesystem integration
- [ ] Store generated media on cloud storage (S3, GCS) behind a CDN

---

# Performance Checklist

- [ ] Audio latency
- [ ] Audio transcription is CPU-bound on provider side â€” no SDK-side performance tuning available
- [ ] Cost
- [ ] Image generation quality varies by provider
- [ ] Image generation takes 5-30 seconds â€” always use `->queue()` for non-interactive generation
- [ ] Large image/audio files strain PHP memory if processed without streaming â€” use `stream()` for downloads
- [ ] EXIF data should be stripped from user-uploaded images before sending to providers
- [ ] Generated media should be served through CDN with appropriate cache headers

---

# Security Checklist

- [ ] Cache image generation results by prompt hash â€” avoid regenerating identical images
- [ ] For audio, consider pre-generating common TTS responses during deployment
- [ ] Handle provider content policy rejections gracefully â€” prompt may be rejected for policy reasons
- [ ] Implement image generation rate limiting â€” DALL-E 3 is $0.040/image
- [ ] Store generated images on S3/CDN, not local disk â€” durable, scalable delivery
- [ ] Image generation costs 10-100x more than text tokens; always cache results
- [ ] Rate limit media endpoints to prevent budget exhaustion

---

# Reliability Checklist

- [ ] Forgetting provider-specific parameters (size, quality, style) â€” defaults may not suit use case
- [ ] Generating images synchronously in HTTP request â€” blocks worker for 10-30 seconds
- [ ] Not handling content policy rejection â€” prompt may violate provider guidelines
- [ ] Storing generated images only on local disk â€” lost on redeployment
- [ ] Broken user experience
- [ ] Budget exhaustion
- [ ] Duplicate generation costs
- [ ] Lost media on redeployment
- [ ] Worker pool exhaustion
- [ ] Wrong image size/quality

---

# Testing Checklist

- [ ] `->queue()` used for generation >2s expected duration
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Content policy rejections caught and handled with user-friendly message
- [ ] Content policy rejections show user-friendly messages, not exceptions
- [ ] Core concepts are understood and applied correctly.
- [ ] Generated media stored on cloud storage (not local disk)
- [ ] Generated media stored on cloud storage with CDN delivery
- [ ] Identical prompts retrieve cached results (no redundant generation cost)
- [ ] Image results cached by prompt hash (md5 of prompt + parameters)

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Synchronous image generation with prompt() blocking workers]
- [ ] [Not caching generated images â€” regenerating identical prompts]
- [ ] [Ignoring content moderation for user-submitted generation prompts]
- [ ] [No size/quality configuration â€” default output unsuitable for use case]
- [ ] [Not handling generation failures (NSFW filter, timeout, credit exhaustion)]
- [ ] Audio transcription quality
- [ ] Content policy rejection
- [ ] Provider API change
- [ ] Rate limits on generation

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


