---
id: KU-008
title: "Image Generation & Audio"
subdomain: "laravel-ai-sdk"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/02-laravel-ai-sdk/image-generation-audio/04-standardized-knowledge.md"
---

# Image Generation & Audio

## Overview

The Laravel AI SDK supports multimodal generation beyond text: image generation (DALL-E, Gemini, xAI), text-to-speech (OpenAI, ElevenLabs), and speech-to-text (OpenAI, ElevenLabs). These follow the same provider-agnostic pattern as text generation â€” `Ai::call()` with appropriate provider and model configuration.

## Core Concepts

- Image generation: `Ai::call()` with image generation model â€” returns generated image URL or base64 data
- Text-to-Speech (TTS): Converts text to audio â€” returns audio stream or file URL
- Speech-to-Text (STT): Transcribes audio to text â€” returns transcription string
- Provider abstraction: Same unified API across providers for each modality
- File handling: SDK integrates with Laravel Filesystem for storing generated media

## When To Use

- Production applications requiring Image Generation & Audio functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Combine with agent tools**: Agent generates image via tool call, stores to filesystem, returns URL in response
- **Caching generated images**: Cache prompts â†’ image URL mappings to avoid regenerating
- **Progressive enhancement**: Generate text first, then generate image/audio as follow-up step

- **Multimedia as provider feature**: Like text generation, images and audio are just different model capabilities behind the same abstraction. Swap providers to change model behavior.
- **Filesystem integration**: Generated media is stored via Laravel's Filesystem â€” configurable disk, S3, local, etc.

## Architecture Guidelines

- **Decision**: Provider-specific model config vs. unified â†’ Providers have different parameter names and capabilities. SDK normalizes common parameters, exposes provider-specific ones via `$parameters` array.
- **Decision**: Filesystem storage vs. return URL â†’ Configurable via disk setting. Production: S3 for persistence. Development: local disk.

## Performance Considerations

- Image generation takes 5-30 seconds â€” always use `->queue()` for non-interactive generation
- Audio transcription is CPU-bound on provider side â€” no SDK-side performance tuning available
- Large image/audio files strain PHP memory if processed without streaming â€” use `stream()` for downloads

- **Image generation quality varies by provider**: DALL-E 3 for photorealism, Gemini for speed â€” test outputs for use case
- **Audio latency**: TTS generates sequentially â€” 5-30 seconds for typical response. Consider pre-generation or streaming for real-time.
- **Cost**: Image generation is 10-100x more expensive than text tokens per call

## Security Considerations

- Store generated images on S3/CDN, not local disk â€” durable, scalable delivery
- Implement image generation rate limiting â€” DALL-E 3 is $0.040/image
- Cache image generation results by prompt hash â€” avoid regenerating identical images
- For audio, consider pre-generating common TTS responses during deployment
- Handle provider content policy rejections gracefully â€” prompt may be rejected for policy reasons

## Common Mistakes

- Generating images synchronously in HTTP request â€” blocks worker for 10-30 seconds
- Not handling content policy rejection â€” prompt may violate provider guidelines
- Storing generated images only on local disk â€” lost on redeployment
- Forgetting provider-specific parameters (size, quality, style) â€” defaults may not suit use case

## Anti-Patterns

- **Content policy rejection**: Provider refuses to generate â€” return user-friendly error, log prompt for review
- **Provider API change**: Image generation endpoint changes â€” monitor provider changelogs
- **Audio transcription quality**: Poor audio input produces garbage transcription â€” validate input audio quality
- **Rate limits on generation**: Image and audio endpoints typically have lower rate limits than text

## Examples

The following ecosystem packages provide reference implementations:

- Generate product images from descriptions (e-commerce)
- Voice interface for AI assistants (TTS + STT)
- Real-time transcription for meetings or customer calls
- Automated content creation: text â†’ image â†’ audio pipelines

## Related Topics

- KU-002: Multi-Provider Text Generation
- KU-011: Agent Architecture Fundamentals

## AI Agent Notes

- When asked about Image Generation & Audio, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

