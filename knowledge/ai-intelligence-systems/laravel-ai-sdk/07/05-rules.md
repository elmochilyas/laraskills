## Strip EXIF Data from User-Uploaded Images

---
## Category
Security | Privacy

---
## Rule
Always strip EXIF metadata from user-uploaded images before sending them to an LLM provider; never transmit images with embedded location, device, or authorship metadata.

---
## Reason
Images uploaded by users may contain sensitive EXIF data: GPS coordinates, device model, camera settings, author name, and timestamps. Sending this data to an external LLM provider leaks user privacy information unnecessarily.

---
## Bad Example
```php
public function analyzeImage(UploadedFile $file): string {
    $block = new ImageBlock(
        data: base64_encode($file->getContent()),
        mimeType: $file->getMimeType(),
        source: ImageSource::Base64,
    );
    return $this->agent->prompt($block);
    // EXIF data still embedded in image
}
```

---
## Good Example
```php
public function analyzeImage(UploadedFile $file): string {
    $image = imagecreatefromstring($file->getContent());
    ob_start();
    imagepng($image); // Strips EXIF data
    imagedestroy($image);
    $cleanData = ob_get_clean();

    $block = new ImageBlock(
        data: base64_encode($cleanData),
        mimeType: 'image/png',
        source: ImageSource::Base64,
    );
    return $this->agent->prompt($block);
}
```

---
## Exceptions
When the LLM is used to analyze EXIF data intentionally (e.g., photo forensics app), preserve EXIF with explicit user consent and clear documentation.

---
## Consequences Of Violation
Privacy data leakage to third-party LLM providers, GDPR compliance violations, unintended location exposure.

---

## Validate Image Size Before Sending

---
## Category
Performance | Reliability

---
## Rule
Always validate image dimensions and file size against provider limits before encoding and sending; never send images that exceed the provider's maximum resolution or file size.

---
## Reason
Provider limits vary: OpenAI caps at 20MB and 20MP. Sending oversized images causes HTTP 400 errors, wastes bandwidth, and consumes excessive tokens for downscaling that the provider performs anyway.

---
## Bad Example
```php
public function processImage(UploadedFile $file): string {
    $block = new ImageBlock(
        data: base64_encode($file->getContent()),
        mimeType: $file->getMimeType(),
        source: ImageSource::Base64,
    );
    return $this->agent->prompt($block);
    // No size validation — may exceed provider limits
}
```

---
## Good Example
```php
public function processImage(UploadedFile $file): string {
    if ($file->getSize() > 20 * 1024 * 1024) {
        throw new ImageTooLargeException('File exceeds 20MB limit');
    }

    $image = imagecreatefromstring($file->getContent());
    $width = imagesx($image);
    $height = imagesy($image);

    if ($width > 4096 || $height > 4096) {
        $ratio = min(4096 / $width, 4096 / $height);
        $image = imagescale($image, (int)($width * $ratio), (int)($height * $ratio));
    }

    // Encode and send
}
```

---
## Exceptions
When using URL-based image references (provider downloads the image), validate the URL points to a publicly accessible, appropriately sized resource.

---
## Consequences Of Violation
HTTP 400 errors from provider, wasted upload bandwidth, image processing failures at runtime.

---

## Use Appropriate Image Detail Level

---
## Category
Cost | Performance

---
## Rule
Set the image detail level to `low` for images where fine detail is unnecessary (diagrams, UI layouts); prefer `low` unless the use case requires `high` detail.

---
## Reason
High detail consumes significantly more tokens (~255 tokens for 1024x1024 at high detail vs. ~85 at low detail) and increases latency 2-5x. Most layout and document understanding tasks do not require pixel-level detail.

---
## Bad Example
```php
$block = new ImageBlock(
    data: $data,
    mimeType: 'image/png',
    source: ImageSource::Base64,
    detail: ImageDetail::High,
    // Always uses high detail — wastes tokens on simple images
);
```

---
## Good Example
```php
$detail = $this->requiresFineDetail($image)
    ? ImageDetail::High
    : ImageDetail::Low;

$block = new ImageBlock(
    data: $data,
    mimeType: 'image/png',
    source: ImageSource::Base64,
    detail: $detail,
);
```

---
## Exceptions
Tasks requiring OCR of small text, medical image analysis, or fine-grained visual inspection should use `high` detail.

---
## Consequences Of Violation
Unnecessary token consumption, 2-5x slower responses, higher API costs for low-benefit detail.

---

## Check Vision Capability Before Sending Images

---
## Category
Reliability | Framework Usage

---
## Rule
Always check that the selected model supports vision inputs before sending image content blocks; never assume all models within a provider support multimodal input.

---
## Reason
Not all models support vision — GPT-4 Turbo does, GPT-3.5 does not. Sending images to a text-only model produces a confusing "I cannot see images" response or an API error.

---
## Bad Example
```php
public function analyze(UploadedFile $file): string {
    $block = new ImageBlock(/* ... */);
    return $this->agent->prompt($block);
    // May fail if model doesn't support vision
}
```

---
## Good Example
```php
public function analyze(UploadedFile $file): string {
    if (!$this->provider->supports('vision')) {
        throw new VisionNotSupportedException(
            'Selected model does not support image input'
        );
    }
    $block = new ImageBlock(/* ... */);
    return $this->agent->prompt($block);
}
```

---
## Exceptions
When using the same model consistently and its vision capability is verified at deployment time, the check may be done once at startup.

---
## Consequences Of Violation
Model returns "I cannot see images", wasted API call, confusing user-facing error.

---

## Prevent SSRF via Image URLs

---
## Category
Security

---
## Rule
Validate and restrict image URLs to prevent Server-Side Request Forgery (SSRF) when accepting URL-based image inputs; never allow users to submit internal or private network URLs.

---
## Reason
If the provider downloads images from URLs, an attacker could submit URLs pointing to internal services (metadata endpoints, cloud instance metadata, internal APIs) and exfiltrate the results through the LLM response.

---
## Bad Example
```php
$block = new ImageBlock(
    data: $request->input('image_url'), // User-provided URL
    source: ImageSource::Url,
);
// No validation — potential SSRF vector
```

---
## Good Example
```php
$url = $request->input('image_url');

if (!filter_var($url, FILTER_VALIDATE_URL)) {
    throw new InvalidUrlException();
}

$host = parse_url($url, PHP_URL_HOST);
$resolvedIps = dns_get_record($host, DNS_A);

foreach ($resolvedIps as $record) {
    if (filter_var($record['ip'], FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE) === false) {
        throw new SsrfBlockedException('Private IP addresses are not allowed');
    }
}

$block = new ImageBlock(data: $url, source: ImageSource::Url);
```

---
## Exceptions
When images are only provided via file upload (not URL), SSRF validation is unnecessary.

---
## Consequences Of Violation
SSRF attacks against internal infrastructure, data exfiltration through LLM provider, lateral movement risk.

---

## Limit Multiple Images Per Request

---
## Category
Cost | Performance

---
## Rule
Limit the number of images sent in a single request to a maximum appropriate for the model (typically 5-10); never send large batches of high-resolution images simultaneously.

---
## Reason
Each image consumes significant tokens (255-2000+ depending on resolution and detail level). Multiple high-resolution images can rapidly exhaust the context window and dramatically increase costs.

---
## Bad Example
```php
// Sending 20 high-res images in one request
$blocks = array_map(fn($img) => new ImageBlock(
    data: $img, detail: ImageDetail::High
), $images);
return $this->agent->prompt($blocks);
// Likely exceeds context window, huge cost
```

---
## Good Example
```php
$blocks = array_map(fn($img) => new ImageBlock(
    data: $img, detail: ImageDetail::Low
), array_slice($images, 0, 5));
return $this->agent->prompt($blocks);
```

---
## Exceptions
Batch document processing systems with explicit per-job cost budgets may send more images with careful token accounting.

---
## Consequences Of Violation
Context window overflow, excessive token consumption, 10-100x higher than necessary costs.
