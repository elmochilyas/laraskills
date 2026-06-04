## Use queue() for All Media Generation

---
## Category
Performance | Scalability

---
## Rule
Always dispatch image generation and audio transcription/creation to a queue using `->queue()`; never call media generation synchronously in an HTTP request.

---
## Reason
Image generation takes 5-30 seconds and audio processing is CPU-bound. Synchronous execution blocks the PHP-FPM worker for the entire duration, exhausting the worker pool and causing request timeouts.

---
## Bad Example
```php
// Blocks worker for 10-30 seconds
$imageUrl = $imageAgent->prompt('Generate a product photo');
return response()->json(['url' => $imageUrl]);
```

---
## Good Example
```php
// Dispatch to queue, notify user when complete
$imageAgent->queue('Generate a product photo for order #42');
// User receives notification with image URL
```

---
## Exceptions
Short TTS snippets (under 2 seconds) for real-time voice feedback may use synchronous calls if worker capacity is adequate.

---
## Consequences Of Violation
Worker pool exhaustion, degraded application responsiveness, HTTP timeouts for interactive requests.

---

## Cache Generated Media by Prompt Hash

---
## Category
Performance | Cost

---
## Rule
Cache image generation results using a deterministic hash of the prompt and parameters; never regenerate identical media without checking the cache first.

---
## Reason
Image generation is 10-100x more expensive than text tokens per call (DALL-E 3 costs $0.040/image). Caching identical prompts avoids paying for redundant generation and reduces latency for repeated requests.

---
## Bad Example
```php
public function generateProductImage(string $description): string {
    return $this->imageAgent->prompt($description);
    // Generates every time, even for identical descriptions
}
```

---
## Good Example
```php
public function generateProductImage(string $description): string {
    $cacheKey = 'image_' . md5($description);
    return Cache::remember($cacheKey, 86400, function () use ($description) {
        return $this->imageAgent->prompt($description);
    });
}
```

---
## Exceptions
When prompts contain user-specific context (e.g., "a photo of user #42") caching may be inappropriate; use a partial cache key that excludes dynamic parts.

---
## Consequences Of Violation
Unnecessary API costs, slower response times, provider rate limit exhaustion.

---

## Handle Content Policy Rejection Gracefully

---
## Category
Reliability | Security

---
## Rule
Always catch content policy rejection errors from media generation providers and return a user-friendly message; never let provider policy rejections surface as unhandled exceptions.

---
## Reason
Image and audio providers enforce content policies that may reject seemingly benign prompts. Unhandled rejections crash the request and confuse users. Graceful handling logs the prompt for review and offers the user an alternative.

---
## Bad Example
```php
public function generateImage(string $prompt): string {
    return $this->imageAgent->prompt($prompt);
    // Provider policy rejection throws unhandled exception
}
```

---
## Good Example
```php
public function generateImage(string $prompt): ?string {
    try {
        return $this->imageAgent->prompt($prompt);
    } catch (ContentFilteredException $e) {
        Log::warning('Image generation rejected by provider', ['prompt' => $prompt]);
        return null; // Return null, UI shows friendly message
    }
}
```

---
## Exceptions
No common exceptions. Content policy handling should always be implemented for media generation endpoints.

---
## Consequences Of Violation
Broken user experience, unhandled 400 errors, no visibility into why generation failed.

---

## Store Generated Media on Cloud Storage

---
## Category
Scalability | Maintainability

---
## Rule
Store generated images and audio on cloud storage (S3, GCS) behind a CDN; never store generated media only on local disk.

---
## Reason
Local disk storage is ephemeral — media is lost on redeployment, cannot scale across multiple web servers, and creates a bottleneck for serving large files. Cloud storage provides durability, scalability, and CDN delivery.

---
## Bad Example
```php
$path = storage_path('app/public/generated/' . $filename);
Image::make($data)->save($path);
$url = asset('storage/generated/' . $filename);
```

---
## Good Example
```php
Storage::disk('s3')->put('generated/' . $filename, $data);
$url = Storage::disk('s3')->url('generated/' . $filename);
```

---
## Exceptions
Development environments may use local disk for simplicity.

---
## Consequences Of Violation
Lost media on redeployment, 404 errors for users, inability to scale horizontally, slow media delivery.

---

## Configure Provider-Specific Parameters Explicitly

---
## Category
Reliability | Framework Usage

---
## Rule
Always pass provider-specific parameters (size, quality, style, voice, format) explicitly when generating media; never rely on provider defaults without verifying they match the use case.

---
## Reason
Each provider uses different defaults for image size, quality, audio voice, and format. Relying on defaults may produce output unsuitable for the application (wrong size, poor quality, wrong voice).

---
## Bad Example
```php
$response = Ai::call(messages: [
    ['role' => 'user', 'content' => 'Generate an image of a cat']
]);
// Uses provider defaults — may be wrong size/quality
```

---
## Good Example
```php
$response = Ai::call(messages: [
    ['role' => 'user', 'content' => 'Generate an image of a cat']
], parameters: [
    'size' => '1024x1024',
    'quality' => 'hd',
    'style' => 'vivid',
]);
```

---
## Exceptions
When using the same provider consistently and defaults are verified to match requirements, explicit parameters may be omitted in non-critical paths.

---
## Consequences Of Violation
Incorrect image dimensions, poor quality output, wrong audio voice, user dissatisfaction.

---

## Implement Rate Limiting for Media Endpoints

---
## Category
Security | Cost

---
## Rule
Apply rate limiting to image and audio generation endpoints; never expose media generation without usage controls.

---
## Reason
Media generation is 10-100x more expensive than text. Without rate limiting, a single user or attacker can exhaust the budget or hit provider rate limits, affecting all users.

---
## Bad Example
```php
Route::post('/generate-image', [ImageController::class, 'generate']);
// No rate limiting — unlimited expensive generation
```

---
## Good Example
```php
Route::post('/generate-image', [ImageController::class, 'generate'])
    ->middleware('throttle:10,60'); // 10 images per 60 minutes
```

---
## Exceptions
Internal/admin endpoints with trusted users may use higher or no limits with budget monitoring.

---
## Consequences Of Violation
Budget exhaustion, provider rate limit hits, service degradation for legit users, potential abuse.
