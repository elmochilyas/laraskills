## OCR Every Image Containing Text

---
## Category
Reliability | Performance

---
## Rule
Apply OCR to every image that may contain text (screenshots, scanned documents, slides, diagrams); never rely solely on image captioning to extract textual content from images.

---
## Reason
Image captions describe the visual content but do not read embedded text. OCR extracts the actual text (labels, numbers, code) that is often the most valuable information for retrieval and generation.

---
## Bad Example
```php
class ImageProcessor {
    public function process(string $imagePath): ProcessedImage {
        $caption = $this->captioner->describe($imagePath);
        return new ProcessedImage(caption: $caption);
        // No OCR — text in the image is lost
    }
}
```

---
## Good Example
```php
class ImageProcessor {
    public function process(string $imagePath): ProcessedImage {
        $ocrText = $this->ocr->extract($imagePath);
        $caption = $this->captioner->describe($imagePath);
        return new ProcessedImage(
            ocrText: $ocrText,    // Extracted text for indexing
            caption: $caption,    // Visual description for context
        );
    }
}
```

---
## Exceptions
Decorative images with no textual content (photographs, illustrations) may skip OCR.

---
## Consequences Of Violation
Text embedded in images is invisible to retrieval, users cannot find information that exists only in images.

---

## Use CLIP-Style Embeddings for Cross-Modal Retrieval

---
## Category
Architecture | Reliability

---
## Rule
Use embedding models that project both text and images into a shared vector space (CLIP, SigLIP) for multi-modal retrieval; never use separate embedding spaces for text and images.

---
## Reason
Separate embedding spaces cannot compare text queries against image content. A shared space enables searching images by text description and finding relevant images for text queries.

---
## Bad Example
```php
// Separate models — incompatible vector spaces
$textVector = $textEmbedder->embed($query);
$imageVector = $imageEmbedder->embed($image);
// Cannot compare — cross-modal search fails
```

---
## Good Example
```php
interface MultiModalEmbedder {
    public function embedText(string $text): array;
    public function embedImage(string $imagePath): array;
    public function dimensions(): int;
}

class CLIPEmbedder implements MultiModalEmbedder {
    public function embedText(string $text): array { /* CLIP text encoder */ }
    public function embedImage(string $imagePath): array { /* CLIP vision encoder */ }
}

// Both produce vectors in the same 512-dim space
// Text query can find relevant images and vice versa
```

---
## Exceptions
Text-only RAG systems with no image content do not need multi-modal embedding.

---
## Consequences Of Violation
Text queries cannot find relevant images, image queries cannot find relevant text, effectively two separate unsearchable corpora.

---

## Preprocess Images Before Indexing

---
## Category
Performance | Reliability

---
## Rule
Resize, compress, strip EXIF, and moderate images before embedding and storage; never index raw user-uploaded images without preprocessing.

---
## Reason
Raw images may exceed provider limits (size, dimensions), contain privacy-leaking EXIF data, or include inappropriate content. Preprocessing ensures consistent quality, privacy, and safety.

---
## Bad Example
```php
// Indexes raw image — may be too large, contain EXIF, or be inappropriate
$vector = $this->multiModalEmbedder->embedImage($imagePath);
$this->vectorStore->store($vector, ['path' => $imagePath]);
```

---
## Good Example
```php
class ImagePreprocessingPipeline {
    public function process(UploadedFile $file): ProcessedImage {
        $this->moderator->check($file);          // Content safety
        $image = $this->resize($file, 1024, 1024); // Max dimensions
        $clean = $this->stripExif($image);        // Privacy
        $compressed = $this->compress($clean, 'webp', 85); // Storage efficiency
        return new ProcessedImage(
            data: $compressed,
            mimeType: 'image/webp',
        );
    }
}
```

---
## Exceptions
Trusted, pre-verified image sources (internal tools, curated datasets) may skip moderation.

---
## Consequences Of Violation
Privacy leakage via EXIF data, oversized images cause provider errors, inappropriate content reaches the LLM.

---

## Filter Images by Relevance Before VLM

---
## Category
Cost | Performance

---
## Rule
Select only the top-N most relevant images (based on multi-modal retrieval score) to send to the Vision-Language Model; never send all images from the retrieved set.

---
## Reason
VLM inference with images is 2-5x slower and 5-20x more expensive than text-only inference. Including irrelevant images wastes cost and dilutes the LLM's attention.

---
## Bad Example
```php
// Sends all retrieved images to VLM — expensive and noisy
$context = $this->formatImages($allRetrievedImages);
$response = $this->vlm->chat($systemPrompt . "\nImages:\n" . $context, $query);
```

---
## Good Example
```php
$allImages = $this->multiModalRetriever->searchImages($query, topK: 10);
$topImages = array_slice($allImages, 0, 3); // Only top 3

if (count($topImages) > 0) {
    $context = $this->formatImages($topImages);
    $response = $this->vlm->chat($systemPrompt . "\nRelevant Images:\n" . $context, $query);
} else {
    // Text-only fallback — cheaper and faster
    $response = $this->textLLM->chat($systemPrompt, $query);
}
```

---
## Exceptions
Tasks that require analyzing multiple images for comparison (e.g., "which diagram is correct?") may include more images with explicit relevance filtering.

---
## Consequences Of Violation
Excessive VLM costs, slow responses, attention dilution from irrelevant images.

---

## Generate Captions as Fallback for Text-Only Models

---
## Category
Reliability

---
## Rule
Generate text captions for every image and use them as context when the generation model does not support image inputs; never send raw image references to text-only models.

---
## Reason
Text-only models cannot process images. Without captions, the image content is invisible to the model, and image references in context are meaningless. Captions bridge the modality gap.

---
## Bad Example
```php
// Text-only model receives image reference — cannot process
$context = "![diagram](image_001.png)";
$response = $textOnlyModel->chat($context);
// Model cannot see the image
```

---
## Good Example
```php
if ($model->supports('vision')) {
    $response = $this->vlm->chat($prompt, $images);
} else {
    $captions = collect($images)->map(fn($img) =>
        "[Image: {$img->caption}] OCR text: {$img->ocrText}"
    )->implode("\n");
    $response = $this->textLLM->chat($prompt . "\n\nImage descriptions:\n{$captions}");
}
```

---
## Exceptions
When all deployed models support vision inputs, captions are still useful for text-based retrieval indexing.

---
## Consequences Of Violation
Image content is invisible to text-only models, breaking the RAG pipeline when the generation model does not support vision.
