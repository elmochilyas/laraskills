# Knowledge Unit: Image Generation & Audio

## Metadata

- **ID:** KU-008
- **Subdomain:** LLM Provider Abstraction & Integration
- **Slug:** image-generation-audio
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

The Laravel AI SDK supports multimodal generation beyond text: image generation (DALL-E, Gemini, xAI), text-to-speech (OpenAI, ElevenLabs), and speech-to-text (OpenAI, ElevenLabs). These follow the same provider-agnostic pattern as text generation — `Ai::call()` with appropriate provider and model configuration.

## Core Concepts

- Image generation: `Ai::call()` with image generation model — returns generated image URL or base64 data
- Text-to-Speech (TTS): Converts text to audio — returns audio stream or file URL
- Speech-to-Text (STT): Transcribes audio to text — returns transcription string
- Provider abstraction: Same unified API across providers for each modality
- File handling: SDK integrates with Laravel Filesystem for storing generated media

## Mental Models

- **Multimedia as provider feature**: Like text generation, images and audio are just different model capabilities behind the same abstraction. Swap providers to change model behavior.
- **Filesystem integration**: Generated media is stored via Laravel's Filesystem — configurable disk, S3, local, etc.

## Internal Mechanics

For image generation, the SDK:
1. Sends prompt and parameters to image model provider
2. Receives image response (URL or base64-encoded)
3. Optionally stores to configured filesystem disk
4. Returns path or URL to application

For audio, TTS sends text with voice parameters, STT sends audio file with transcription parameters. Each provider driver handles the specific API format.

Provider support:
- Image: OpenAI (DALL-E 3), Gemini, xAI
- TTS: OpenAI, ElevenLabs
- STT: OpenAI (Whisper), ElevenLabs

## Patterns

- **Combine with agent tools**: Agent generates image via tool call, stores to filesystem, returns URL in response
- **Caching generated images**: Cache prompts → image URL mappings to avoid regenerating
- **Progressive enhancement**: Generate text first, then generate image/audio as follow-up step

## Architectural Decisions

- **Decision**: Provider-specific model config vs. unified → Providers have different parameter names and capabilities. SDK normalizes common parameters, exposes provider-specific ones via `$parameters` array.
- **Decision**: Filesystem storage vs. return URL → Configurable via disk setting. Production: S3 for persistence. Development: local disk.

## Tradeoffs

- **Image generation quality varies by provider**: DALL-E 3 for photorealism, Gemini for speed — test outputs for use case
- **Audio latency**: TTS generates sequentially — 5-30 seconds for typical response. Consider pre-generation or streaming for real-time.
- **Cost**: Image generation is 10-100x more expensive than text tokens per call

## Performance Considerations

- Image generation takes 5-30 seconds — always use `->queue()` for non-interactive generation
- Audio transcription is CPU-bound on provider side — no SDK-side performance tuning available
- Large image/audio files strain PHP memory if processed without streaming — use `stream()` for downloads

## Production Considerations

- Store generated images on S3/CDN, not local disk — durable, scalable delivery
- Implement image generation rate limiting — DALL-E 3 is $0.040/image
- Cache image generation results by prompt hash — avoid regenerating identical images
- For audio, consider pre-generating common TTS responses during deployment
- Handle provider content policy rejections gracefully — prompt may be rejected for policy reasons

## Common Mistakes

- Generating images synchronously in HTTP request — blocks worker for 10-30 seconds
- Not handling content policy rejection — prompt may violate provider guidelines
- Storing generated images only on local disk — lost on redeployment
- Forgetting provider-specific parameters (size, quality, style) — defaults may not suit use case

## Failure Modes

- **Content policy rejection**: Provider refuses to generate — return user-friendly error, log prompt for review
- **Provider API change**: Image generation endpoint changes — monitor provider changelogs
- **Audio transcription quality**: Poor audio input produces garbage transcription — validate input audio quality
- **Rate limits on generation**: Image and audio endpoints typically have lower rate limits than text

## Ecosystem Usage

- Generate product images from descriptions (e-commerce)
- Voice interface for AI assistants (TTS + STT)
- Real-time transcription for meetings or customer calls
- Automated content creation: text → image → audio pipelines

## Related Knowledge Units

- KU-002: Multi-Provider Text Generation
- KU-011: Agent Architecture Fundamentals

## Research Notes

- Provider support matrix: Image (OpenAI, Gemini, xAI), TTS (OpenAI, ElevenLabs), STT (OpenAI, ElevenLabs)
- Image generation added in v0.2.0, audio in v0.3.0
- ElevenLabs voices are configurable via provider-specific parameters
- Audio support enables voice interfaces without Python sidecars
