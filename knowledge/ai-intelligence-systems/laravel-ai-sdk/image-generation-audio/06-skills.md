# Skill: Generate Images and Process Audio via AI

## Purpose
Use the Laravel AI SDK's provider-agnostic interface for image generation (DALL-E, Gemini), text-to-speech, and speech-to-text with proper queuing, caching, and rate limiting.

## When To Use
- Applications that need AI image generation from text prompts
- Text-to-speech conversion for voice interfaces
- Speech-to-text transcription for voice input
- Agent tools that generate or process media

## When NOT To Use
- Text-only applications with no media needs
- When image processing can be done with cheaper specialized models
- High-throughput paths where media latency is unacceptable

## Prerequisites
- `laravel/ai` package with provider supporting the media modality
- Queue driver configured for async media generation
- Cloud storage configured for generated media output

## Inputs
- Text prompt for image generation
- Audio file or text for speech processing
- Provider-specific parameters (size, quality, style, voice)

## Workflow
1. Always dispatch media generation to the queue using `->queue()`
2. Cache image generation results by deterministic hash of prompt + parameters
3. Catch content policy rejection errors and return user-friendly messages
4. Store generated media on cloud storage (S3, GCS) behind a CDN
5. Configure provider-specific parameters explicitly (size, quality, voice, format)
6. Apply rate limiting to media generation endpoints
7. Use agent tools to combine media generation with file storage and URL return
8. Handle file storage via Laravel Filesystem integration

## Validation Checklist
- [ ] Media generation dispatched to queue (not synchronous in HTTP request)
- [ ] Image results cached by prompt hash (md5 of prompt + parameters)
- [ ] Content policy rejections caught and handled with user-friendly message
- [ ] Generated media stored on cloud storage (not local disk)
- [ ] Provider-specific parameters set explicitly (not relying on defaults)
- [ ] Rate limiting applied to media generation endpoints
- [ ] `->queue()` used for generation >2s expected duration

## Common Failures

| Failure | Cause | Solution |
|---------|-------|----------|
| Worker pool exhaustion | Synchronous image generation | Always use `->queue()` for media |
| Duplicate generation costs | No caching | Cache by deterministic prompt hash |
| Broken user experience | Unhandled content policy rejection | Catch `ContentFilteredException` |
| Lost media on redeployment | Local disk storage | Use cloud storage (S3, GCS) |
| Wrong image size/quality | Default provider parameters | Set size, quality, style explicitly |
| Budget exhaustion | No rate limiting | Apply throttle middleware to endpoints |

## Decision Points
- **Generation mode:** Sync (short TTS) vs async queue (images, long audio)
- **Storage backend:** Cloud storage (S3) vs local disk (dev only) vs CDN
- **Cache strategy:** Full prompt hash key vs partial (excluding user-specific parts)
- **Rate limit:** Per-user vs global; tokens vs requests per time window

## Performance/Security Considerations
- Image generation costs 10-100x more than text tokens; always cache results
- Content policy rejections must not expose internal error details to users
- Generated media should be served through CDN with appropriate cache headers
- Rate limit media endpoints to prevent budget exhaustion
- EXIF data should be stripped from user-uploaded images before sending to providers

## Related Rules
- image-generation-audio/05-rules.md (all rules)

## Related Skills
- Build Agents with the Laravel AI SDK
- Implement Tool Calling with Agents
- Manage Provider Configuration and Environment

## Success Criteria
- Media generation dispatched to queue, not blocking HTTP requests
- Identical prompts retrieve cached results (no redundant generation cost)
- Content policy rejections show user-friendly messages, not exceptions
- Generated media stored on cloud storage with CDN delivery
- Rate limiting prevents budget exhaustion
