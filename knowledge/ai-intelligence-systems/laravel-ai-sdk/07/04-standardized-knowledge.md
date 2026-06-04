---
id: ku-07
title: "Vision & Multimodal Support"
subdomain: "llm-provider-abstraction"
ku-type: "capability"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/llm-provider-abstraction/ku-07/04-standardized-knowledge.md"
---

# Vision & Multimodal Support

## Overview

Vision and multimodal support enables LLMs to process images, audio, video, and other non-text inputs alongside text. The provider abstraction layer must handle different image encoding formats (base64, URL), content block structures (OpenAI's content array, Anthropic's content blocks), size limitations, and provider-specific features like image detail levels, multi-image processing, and image generation. In the Laravel AI ecosystem, multimodal inputs are passed as content blocks within messages.

## Core Concepts

- **Content Block:** A structured element within a message that can be text, image, audio, or video. Messages can contain multiple content blocks.
- **Image Encoding:** Images are typically sent as base64-encoded data URIs or as URLs. The abstraction layer should support both.
- **Image Detail:** Control over how the model processes images — `low` (faster, cheaper), `high` (more accurate), `auto`.
- **Multi-Image Processing:** Some providers support multiple images in a single request; others have limits.
- **Image Tokenization:** Images consume tokens proportional to their resolution and detail level. Large images can consume 1000+ tokens.
- **Vision Capability Detection:** Checking if the selected model supports vision inputs (not all models do, even within the same provider).
- **Content Type Negotiation:** The abstraction layer should validate that content types are compatible with the selected provider/model.

## When To Use

- Applications that analyze user-uploaded images (screenshots, documents, photos).
- Document processing systems that need OCR or visual layout analysis.
- Applications requiring multi-modal reasoning (diagrams, charts, UI screenshots).
- Accessibility features (describing images for visually impaired users).

## When NOT To Use

- Text-only applications (no need for multimodal support).
- When image processing can be done with a specialized model (OCR, object detection) — cheaper than using a multimodal LLM.
- High-throughput, low-latency paths where image processing adds unacceptable latency.

## Best Practices

- **Support both base64 and URL image inputs.** Base64 is self-contained; URLs offload bandwidth to the provider.
- **Validate image size before sending.** Enforce maximum dimensions (e.g., 20MP) and file size (e.g., 20MB).
- **Provide image detail control.** Default to `auto`; let the application override when needed.
- **Count image tokens.** Use provider-specific tokenizers or estimates to track vision-related token usage.
- **Cache image analysis results** where appropriate (same image queried multiple times).
- **Handle unsupported content types gracefully.** If the model doesn't support images, return a clear error.

## Architecture Guidelines

- Extend the message DTO to support **content blocks**: `TextBlock`, `ImageBlock`, `AudioBlock`.
- Content blocks should be **provider-agnostic** in the request and **provider-specific** in the adapter translation.
- Implement image preprocessing as a **middleware** step: resize, compress, encode before sending to the provider.
- Use a **content type validator** that checks provider/model compatibility before sending.
- For streaming with vision, handle the case where the model describes an image progressively (per-chunk text generation).

## Performance Considerations

- Image encoding (base64) and resizing add 1-10ms depending on image size. Cache encoded versions.
- Image token consumption: a 1024x1024 image at high detail consumes ~255 tokens (OpenAI). Large images can consume 2000+ tokens.
- Vision requests are typically 2-5x slower than text-only requests (model spends more processing time).
- For high-volume image processing, consider using a dedicated vision model (cheaper, faster) instead of a multimodal LLM.
- Image URL downloads: if using URL mode, the provider downloads the image. Offloads bandwidth cost to the provider.

## Security Considerations

- **Image content moderation:** Images from users may contain inappropriate content. Apply image moderation before sending to the LLM.
- **Image EXIF data:** Images may contain location data, device info, or other metadata. Strip EXIF data before sending.
- **SSRF via image URLs:** If accepting image URLs from users, validate against SSRF (no internal URLs, no localhost).
- **Base64 injection:** Validate that base64 content is actually an image (check magic bytes), not arbitrary data.
- **Data leakage:** Images may contain sensitive information (documents, screenshots with confidential data). Apply PII redaction to extracted text.

## Common Mistakes

- Not removing EXIF data from user-uploaded images before sending to providers.
- Sending oversized images that exceed the provider's limits (e.g., OpenAI's 20MB limit).
- Not handling the case where the model cannot see images (returns "I cannot see images").
- Assuming all models within a provider support vision (e.g., GPT-4 Turbo does, GPT-3.5 does not).
- Not providing fallback text for accessibility when images fail to load.

## Anti-Patterns

- **Image Dump:** Sending multiple high-resolution images in a single request without considering token cost.
- **Ignoring Detail Levels:** Using `high` detail for all images when `low` would suffice for most use cases.
- **No Image Preprocessing:** Sending images in their original resolution without resizing or compression.
- **Unlimited Image Uploads:** Allowing users to upload unlimited or unbounded images — set limits.
- **Synchronous Large Image Processing:** Processing large images synchronously in a web request. Use queues.

## Examples

### Content Block Structure
```php
class ImageBlock {
    public function __construct(
        public readonly string $data,        // base64 or URL
        public readonly string $mimeType,    // image/png, image/jpeg, image/webp
        public readonly ImageSource $source, // base64 or url
        public readonly ImageDetail $detail = ImageDetail::Auto,
    ) {}
}

class Message {
    /** @var array<TextBlock|ImageBlock> */
    public readonly array $content;

    public function toOpenAI(): array {
        return array_map(fn($block) => match(true) {
            $block instanceof TextBlock => ['type' => 'text', 'text' => $block->text],
            $block instanceof ImageBlock => [
                'type' => 'image_url',
                'image_url' => [
                    'url' => $block->source === ImageSource::Base64
                        ? "data:{$block->mimeType};base64,{$block->data}"
                        : $block->data,
                    'detail' => $block->detail->value,
                ],
            ],
        }, $this->content);
    }
}
```

### Image Preprocessing
```php
class ImagePreprocessor {
    private const MAX_DIMENSION = 4096;
    private const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

    public function preprocess(UploadedFile $file): ImageBlock {
        if ($file->getSize() > self::MAX_FILE_SIZE) {
            throw new ImageTooLargeException();
        }

        $image = imagecreatefromstring($file->getContent());
        $width = imagesx($image);
        $height = imagesy($image);

        // Resize if needed
        if ($width > self::MAX_DIMENSION || $height > self::MAX_DIMENSION) {
            $ratio = min(self::MAX_DIMENSION / $width, self::MAX_DIMENSION / $height);
            $newWidth = (int) ($width * $ratio);
            $newHeight = (int) ($height * $ratio);
            $image = imagescale($image, $newWidth, $newHeight);
        }

        // Strip EXIF
        $encoded = imagepng($image); // or imagewebp for smaller size
        imagedestroy($image);

        return new ImageBlock(
            data: base64_encode($encoded),
            mimeType: 'image/png',
            source: ImageSource::Base64,
            detail: ImageDetail::Auto,
        );
    }
}
```

## Related Topics

- ku-03 (Provider-Specific Features): Vision capability flag.
- ku-05 (Configuration & Environment): Configuring vision-enabled models.
- cost-management-observability/ku-04: Tracking image token usage.
- ai-safety-security/ku-02: Content moderation for images.
- retrieval-augmented-generation/ku-03: Processing images in RAG pipelines.

## AI Agent Notes

- When asked to implement vision support, first determine: which providers/models are vision-capable, image source (user upload or URL), and preprocessing requirements.
- For vision-related bugs, check: content block format, image encoding, detail level settings, and token counting.
- Prefer reading the content block definitions and to-provider translation before image preprocessing.
- When generating vision code, include: EXIF stripping, size validation, and content type validation.

## Verification

- [ ] Content blocks support both text and image types with provider-agnostic interface.
- [ ] Image uploads are validated (file size, dimensions, MIME type).
- [ ] EXIF data is stripped from user-uploaded images.
- [ ] Both base64 and URL image sources are supported.
- [ ] Image detail level is configurable (low, high, auto).
- [ ] Vision capability is detected via `supports()` before sending image inputs.
- [ ] Image token consumption is tracked in cost analytics.
