# Skill: Implement Vision and Multimodal Support

## Purpose
Enable LLMs to process images, audio, and other non-text inputs alongside text via the provider abstraction layer, with proper encoding, validation, security, and cost management.

## When To Use
- Applications that analyze user-uploaded images (screenshots, documents, photos)
- Document processing systems that need OCR or visual layout analysis
- Applications requiring multi-modal reasoning (diagrams, charts, UI screenshots)
- Accessibility features (describing images for visually impaired users)

## When NOT To Use
- Text-only applications
- When image processing can be done with cheaper specialized models
- High-throughput, low-latency paths where image processing adds unacceptable latency

## Prerequisites
- Provider supporting vision/multimodal inputs
- Content block structure for multimodal messages
- Image processing library (GD or Imagick) for EXIF stripping and resizing

## Inputs
- Image data (base64, URL, or UploadedFile)
- Content type (image, audio, video)
- Detail level (low, high, auto)
- Provider-specific parameters

## Workflow
1. Strip EXIF metadata from user-uploaded images before sending to providers
2. Validate image dimensions and file size against provider limits before encoding
3. Set image detail level to `low` unless the use case requires `high` detail
4. Check vision capability via `$provider->supports('vision')` before sending images
5. Validate and restrict image URLs to prevent SSRF attacks
6. Limit the number of images sent per request (5-10 maximum)
7. Downscale oversized images before encoding to save tokens
8. Use content blocks for multimodal message construction

## Validation Checklist
- [ ] EXIF metadata stripped from user-uploaded images before transmission
- [ ] Image dimensions and file size validated against provider limits
- [ ] Image detail level set appropriately (low for layout, high for fine detail)
- [ ] Vision capability checked via `supports('vision')` before sending
- [ ] Image URLs validated against SSRF (no private/internal network URLs)
- [ ] Multiple images per request limited to 5-10
- [ ] Oversized images downscaled before encoding

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Privacy data leaked via EXIF | EXIF not stripped | Strip EXIF before sending |
| HTTP 400 from provider | Image exceeds limits | Validate size/dimensions first |
| Wasted tokens on detail | Always using high detail | Use low detail for layout tasks |
| Confusing "I can't see" | Sending to text-only model | Check vision capability first |
| SSRF attack vector | User-provided image URLs | Validate and restrict URLs |
| Context window overflow | Too many images | Limit to 5-10 per request |

## Decision Points
- **Image source:** Base64 (self-contained) vs URL (provider downloads)
- **Detail level:** Low (cheaper, faster) vs High (accurate for fine detail)
- **Encoding format:** PNG vs JPEG (PNG for diagrams, JPEG for photos)
- **Image limit per request:** 5 vs 10 vs dynamic based on resolution

## Performance/Security Considerations
- Strip EXIF data from user-uploaded images (GPS, device info privacy)
- Validate user-provided image URLs against SSRF attacks
- High detail images consume 2-5x more tokens; use low detail where possible
- Downscale oversized images before encoding to save bandwidth and tokens
- Multiple high-res images can exhaust context window quickly; limit appropriately

## Related Rules
- ku-07/05-rules.md (all rules)

## Related Skills
- Generate Images and Process Audio via AI
- Handle Provider-Specific Features
- Implement Provider Adapters

## Success Criteria
- EXIF data stripped from all user-uploaded images
- Images validated against provider limits before sending
- Detail level matched to use case (low for layout, high for fine detail)
- Vision capability checked before image transmission
- SSRF prevented through URL validation
- Number of images per request bounded to prevent context overflow
