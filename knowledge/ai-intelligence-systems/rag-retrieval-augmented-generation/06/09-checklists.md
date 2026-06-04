# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** ku-06
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Generate image captions as fallback.
- [ ] Include image context in the prompt.
- [ ] OCR every image
- [ ] Respect image size limits.
- [ ] Separate image indexing from text indexing.
- [ ] Image captions are generated as fallback for text-only models.
- [ ] Image content moderation is applied to user-uploaded images.
- [ ] Images are preprocessed (resize, compress, strip EXIF) before storage.
- [ ] Filter Images by Relevance Before VLM
- [ ] Generate Captions as Fallback for Text-Only Models
- [ ] OCR Every Image Containing Text
- [ ] Preprocess Images Before Indexing
- [ ] Use CLIP-Style Embeddings for Cross-Modal Retrieval
- [ ] Fallback captions available for text-only LLM consumption
- [ ] Image captions generated for all visual content
- [ ] Multi-modal retrieval quality measured with appropriate metrics
- [ ] Captions provide fallback when LLM cannot process images directly
- [ ] Image content retrievable alongside text content for relevant queries
- [ ] Multi-modal access control prevents unauthorized image exposure

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

- [ ] Generate image captions as fallback.
- [ ] Include image context in the prompt.
- [ ] OCR every image
- [ ] Respect image size limits.
- [ ] Separate image indexing from text indexing.
- [ ] Use CLIP-style embeddings
- [ ] Filter Images by Relevance Before VLM
- [ ] Generate Captions as Fallback for Text-Only Models
- [ ] OCR Every Image Containing Text
- [ ] Preprocess Images Before Indexing
- [ ] Use CLIP-Style Embeddings for Cross-Modal Retrieval
- [ ] Image storage

---

# Performance Checklist

- [ ] Cache image embeddings, OCR results, and captions to avoid recomputation.
- [ ] Image captioning with a VLM adds 500-2000ms per image.
- [ ] Image embedding is 2-5x slower than text embedding (CLIP vs. BERT).
- [ ] Image storage costs: store images in compressed format (WebP) and set retention policies.
- [ ] OCR adds 200-1000ms per image (depends on image quality and OCR engine).
- [ ] VLM inference with images is 2-5x slower and 5-20x more expensive than text-only inference.
- [ ] Validate user-uploaded images for malicious content before indexing

---

# Security Checklist

- [ ] Embedding reversal:
- [ ] Image content moderation:
- [ ] Image EXIF data:
- [ ] OCR data leakage:
- [ ] SSRF in image loading:
- [ ] Validate user-uploaded images for malicious content before indexing

---

# Reliability Checklist

- [ ] Indexing images without alt text or captions â€” text-only retrieval can't find relevant images.
- [ ] Not extracting text from images â€” the LLM misses information that's only in the visual content.
- [ ] Not handling images that fail to load or process â€” the pipeline should degrade gracefully.
- [ ] Sending high-resolution images directly to the VLM â€” consumes excessive tokens and latency.
- [ ] Using image captioning as a replacement for OCR â€” captions describe the image but don't read the text in it.
- [ ] Generate Captions as Fallback for Text-Only Models

---

# Testing Checklist

- [ ] Captions provide fallback when LLM cannot process images directly
- [ ] Fallback captions available for text-only LLM consumption
- [ ] Image captions are generated as fallback for text-only models.
- [ ] Image captions generated for all visual content
- [ ] Image content moderation is applied to user-uploaded images.
- [ ] Image content retrievable alongside text content for relevant queries
- [ ] Images are preprocessed (resize, compress, strip EXIF) before storage.
- [ ] Multi-modal access control prevents unauthorized image exposure
- [ ] Multi-modal embedding (CLIP or similar) is used for cross-modal retrieval.
- [ ] Multi-modal retrieval quality measured with appropriate metrics

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Metadata on Chunks â€” Cannot Filter or Scope]
- [ ] [Filtering After Vector Search Instead of Before]
- [ ] [Inconsistent Metadata Schema Across Document Types]
- [ ] [Metadata Without Access Control Information]
- [ ] [Not Indexing Metadata for Fast Filtering]
- [ ] Ignoring Image Quality:
- [ ] Images-as-Context-Dump:
- [ ] No Image Deduplication:
- [ ] Text-Only OCR:
- [ ] VLM for Every Image:

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


