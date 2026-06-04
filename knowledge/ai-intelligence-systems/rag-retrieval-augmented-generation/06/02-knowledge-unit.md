# Knowledge Unit: Multi-Modal RAG

## Metadata

- **ID:** ku-06
- **Subdomain:** Retrieval-Augmented Generation
- **Slug:** multi-modal-rag
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Multi-Modal RAG extends traditional text-only RAG to include images, diagrams, tables, audio, and video in the retrieval and generation pipeline. Instead of only retrieving text chunks, the system retrieves relevant images, generates captions or descriptions, and injects both text and visual information into the LLM's context. This is critical for document types that combine text and images (PDFs, slides, screenshots, technical diagrams) where the image contains information not present in the text.

## Core Concepts

- **Multi-Modal Embedding:** Using embedding models that can represent both text and images in a shared vector space (CLIP, SigLIP, AltCLIP).
- **Image Captioning:** Generating text descriptions of images for retrieval and context (when the LLM cannot process images directly).
- **Vision-Language Model (VLM):** A model that can process both text and images (GPT-4o, Claude 3.5 Sonnet, Gemini) for direct multi-modal generation.
- **Text Extraction from Images:** OCR for text in images, diagrams, screenshots â€” extracting textual content from visual elements.
- **Table Extraction:** Parsing tabular data from images or PDFs into structured formats the LLM can process.
- **Audio/Video Transcription:** Converting audio and video to text for indexing and retrieval (whisper, speech-to-text).
- **Multi-Vector Indexing:** Indexing both text chunks and image embeddings in the same vector database with type metadata.

## Mental Models

- **Multi-Modal Embedding:** Using embedding models that can represent both text and images in a shared vector space (CLIP, SigLIP, AltCLIP).
- **Image Captioning:** Generating text descriptions of images for retrieval and context (when the LLM cannot process images directly).
- **Vision-Language Model (VLM):** A model that can process both text and images (GPT-4o, Claude 3.5 Sonnet, Gemini) for direct multi-modal generation.


## Internal Mechanics

The internal mechanics of Multi-Modal RAG follow established patterns within the Retrieval-Augmented Generation domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Use CLIP-style embeddings** for multi-modal retrieval. They project text and images into a shared space for cross-modal search.
- **Generate image captions as fallback.** For models that don't support images, captions provide visual information in text form.
- **OCR every image** that may contain text (screenshots, scanned documents, slides). Store OCR text alongside the image.
- **Separate image indexing from text indexing.** Use different embedding models (CLIP for images, text model for text) and store type metadata.
- **Include image context in the prompt.** When an image is relevant, include its caption or OCR text, not just the image URL.
- **Respect image size limits.** Models have maximum image dimensions and file sizes. Pre-process images before sending.

## Patterns

- **Use CLIP-style embeddings** for multi-modal retrieval. They project text and images into a shared space for cross-modal search.
- **Generate image captions as fallback.** For models that don't support images, captions provide visual information in text form.
- **OCR every image** that may contain text (screenshots, scanned documents, slides). Store OCR text alongside the image.
- **Separate image indexing from text indexing.** Use different embedding models (CLIP for images, text model for text) and store type metadata.
- **Include image context in the prompt.** When an image is relevant, include its caption or OCR text, not just the image URL.
- **Respect image size limits.** Models have maximum image dimensions and file sizes. Pre-process images before sending.

## Architectural Decisions

- Extend the indexing pipeline to support **multi-modal chunking**: extract images from documents, generate captions, embed both text and images.
- Use a **multi-modal embedding service** that supports both text and image embedding through a unified interface.
- Store images in an **object store** (S3, local filesystem) with content-addressed keys (hash of image content).
- For VLM-based generation, send the image directly to the model (via content blocks). For text-only models, send captions.
- Implement an **image preprocessing pipeline**: extract, OCR, caption, resize, compress before storage and embedding.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Image embedding is 2-5x slower than text embedding (CLIP vs. BERT).
- OCR adds 200-1000ms per image (depends on image quality and OCR engine).
- Image captioning with a VLM adds 500-2000ms per image.
- VLM inference with images is 2-5x slower and 5-20x more expensive than text-only inference.
- Image storage costs: store images in compressed format (WebP) and set retention policies.
- Cache image embeddings, OCR results, and captions to avoid recomputation.

## Production Considerations

- **Image content moderation:** User-uploaded images may contain inappropriate content. Apply image moderation before indexing.
- **OCR data leakage:** OCR may extract sensitive text from images (whiteboard photos, documents). Apply the same PII redaction as text.
- **Embedding reversal:** Image embeddings can theoretically be reversed to approximate the original image. Use local embedding for sensitive images.
- **Image EXIF data:** Strip EXIF metadata (location, device, date) from images before storage or transmission.
- **SSRF in image loading:** If loading images from URLs, validate URLs against SSRF allowlists.

## Common Mistakes

- Not extracting text from images â€” the LLM misses information that's only in the visual content.
- Using image captioning as a replacement for OCR â€” captions describe the image but don't read the text in it.
- Sending high-resolution images directly to the VLM â€” consumes excessive tokens and latency.
- Not handling images that fail to load or process â€” the pipeline should degrade gracefully.
- Indexing images without alt text or captions â€” text-only retrieval can't find relevant images.

## Failure Modes

- **Images-as-Context-Dump:** Sending all images to the VLM without relevance filtering. Select only the most relevant images.
- **Text-Only OCR:** Using OCR output without the visual context. OCR text loses layout, color coding, and visual relationships.
- **No Image Deduplication:** Indexing the same image multiple times (from different documents). Deduplicate by content hash.
- **Ignoring Image Quality:** Poor quality images (blurry, dark, tilted) produce bad OCR and bad captions. Validate image quality.
- **VLM for Every Image:** Using a VLM for simple images where OCR + text model would suffice. Route to the appropriate model.

## Ecosystem Usage

### Multi-Modal Chunk
```php
class MultiModalChunk {
    public function __construct(
        public readonly string $chunkId,
        public readonly ?string $textContent,
        public readonly ?string $imagePath,
        public readonly ?string $imageCaption,
        public readonly ?string $ocrText,
        public readonly string $embeddingModel,
        public readonly array $metadata,
    ) {}
}
```

### Image Processing Pipeline
```php
class ImageProcessingPipeline {
    public function __construct(
        private OCRService $ocr,
        private CaptioningService $captioner,
        private ImageModerator $moderator,
    ) {}

    public function process(string $imagePath): ProcessedImage {
        // 1. Validate and moderate
        $this->moderator->check($imagePath);

        // 2. Extract text via OCR
        $ocrText = $this->ocr->extract($imagePath);

        // 3. Generate caption
        $caption = $this->captioner->describe($imagePath);

        return new ProcessedImage(
            imagePath: $imagePath,
            ocrText: $ocrText,
            caption: $caption,
        );
    }
}
```

## Related Knowledge Units

- ku-01 (RAG Architecture Fundamentals): Foundation for multi-modal RAG.
- ku-02 (Document Chunking): Chunking multi-modal documents.
- ku-03 (Embedding Generation): Multi-modal embedding models.
- llm-provider-abstraction/ku-07: VLM support for multi-modal generation.
- vector-database-integration/ku-02: Multi-modal vector indexing.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

