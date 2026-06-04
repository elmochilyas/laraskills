# Rules: File Upload Security

## Validate File Type by MIME, Not Extension
---
## Category
Security
---
## Rule
Use Laravel's `mimes:` validation rule (which checks MIME types via the file's content, not extension). Never validate solely by file extension.
---
## Reason
File extensions are easily spoofed — an attacker can rename `shell.php` to `image.jpg` and bypass extension-only validation. MIME type validation reads the file's magic bytes to determine the actual file type, making it much harder to spoof.
---
## Bad Example
```php
$request->validate(['file' => 'required|ends_with:.jpg,.png']); // Extension only — easily bypassed
```
---
## Good Example
```php
$request->validate(['file' => 'required|mimes:jpg,png|max:2048']); // MIME type validated by content
```
---
## Exceptions
No common exceptions — MIME validation is always preferred.
---
## Consequences Of Violation
Malicious file upload disguised as a safe extension.
---

## Store Uploaded Files Outside the Public Directory
---
## Category
Security
---
## Rule
Store user-uploaded files in `storage/app/` (private) and serve them through a controller that enforces authorization. Never store files directly in `public/`.
---
## Reason
Files stored in `public/` are directly accessible via URL, bypassing authorization. Anyone with the URL can view or download the file, even if the owner intended it to be private. Serving through a controller allows access checks before file delivery.
---
## Bad Example
```php
$request->file('avatar')->move(public_path('uploads'), $filename); // Public — no access control
```
---
## Good Example
```php
$path = $request->file('avatar')->store('avatars', 'local'); // Private storage
```
```php
// Controller serves file after authorization
public function show($id) {
    $file = File::findOrFail($id);
    $this->authorize('view', $file);
    return response()->file(storage_path("app/{$file->path}"));
}
```
---
## Exceptions
Truly public files (site assets, public profile images) that need no access control.
---
## Consequences Of Violation
Unauthorized file access, private files publicly available.
---

## Scan Uploaded Files for Malware Before Storage
---
## Category
Security
---
## Rule
Implement malware scanning of uploaded files (via ClamAV, Laravel Antivirus package, or cloud service) before storing or processing them.
---
## Reason
File upload endpoints are a primary vector for malware delivery. Without scanning, an attacker can upload a malicious file that infects other users who download it. Scanning (especially for document/image types) catches known malware before it enters the application.
---
## Bad Example
```php
$path = $request->file('document')->store('documents'); // No malware scan
```
---
## Good Example
```php
$file = $request->file('document');
// Scan before storage
$scanner = app(AntivirusScanner::class);
if (!$scanner->isClean($file->path())) {
    throw new \Exception('File contains malware');
}
$path = $file->store('documents');
```
---
## Exceptions
No common exceptions — file upload scanning is a security essential.
---
## Consequences Of Violation
Malware distribution through the application.
---

## Limit File Size per Upload Type
---
## Category
Security
---
## Rule
Set `max` file size validation per upload type (e.g., images at 2MB, documents at 10MB). Never set a single large limit for all types.
---
## Reason
Different file types have different reasonable size limits. A 100MB image is suspicious (likely a DoS attempt), while a 100MB video may be legitimate. Per-type limits prevent oversized uploads that could exhaust disk space or processing resources.
---
## Bad Example
```php
$request->validate(['file' => 'required|max:102400']); // 100MB limit for all types
```
---
## Good Example
```php
$rules = match ($request->input('type')) {
    'image' => 'required|mimes:jpg,png|max:2048', // 2MB
    'document' => 'required|mimes:pdf|max:10240', // 10MB
    default => 'required|max:5120', // 5MB default
};
$request->validate(['file' => $rules]);
```
---
## Exceptions
No common exceptions — per-type size limits reduce DoS risk.
---
## Consequences Of Violation
Disk space exhaustion, DoS via oversized uploads.
---

## Rename Uploaded Files to Prevent Path Traversal
---
## Category
Security
---
## Rule
Use `$file->hashName()` or `Str::random()` to generate a safe filename. Never use the original filename from the upload.
---
## Reason
The original filename may contain path traversal characters (`../../etc/passwd`), special characters that cause filesystem errors, or malicious script extensions. `hashName()` generates a safe, unique, non-predictable filename.
---
## Bad Example
```php
$path = $request->file('avatar')->storeAs('avatars', $request->file('avatar')->getClientOriginalName());
// Path traversal possibility — e.g., "../../config/app.php"
```
---
## Good Example
```php
$path = $request->file('avatar')->store('avatars'); // Uses hashName() automatically
```
---
## Exceptions
No common exceptions — original filenames must never be trusted.
---
## Consequences Of Violation
Path traversal, file overwrite, filesystem corruption.
---

## Serve Images Through Intervention or Sanitized Streaming
---
## Category
Security
---
## Rule
When serving user-uploaded images, re-encode them through a library (Intervention Image, GD) to strip EXIF data and potential embedded malware. Serve sanitized versions.
---
## Reason
Image files may contain embedded EXIF data with GPS coordinates, camera info, or malicious payloads in comment fields. Re-encoding creates a clean image without metadata. The `exif_read_data` function also carries its own DoS risk.
---
## Bad Example
```php
return response()->file(storage_path("app/{$file->path}")); // Raw file — may contain EXIF/malware
```
---
## Good Example
```php
$image = Image::make(storage_path("app/{$file->path}"));
return $image->response(); // Re-encoded — EXIF stripped
```
---
## Exceptions
Raw file downloads (e.g., PDF, ZIP) that must be served as-is.
---
## Consequences Of Violation
EXIF metadata leakage, potential image-based malware delivery.
---

## Expire Large Temporary Uploads
---
## Category
Security
---
## Rule
Configure a scheduled task to delete temporary uploads older than 24 hours. Set `filesystems.disks.local.visibility` to `private` for temp uploads.
---
## Reason
Large uploads that fail mid-process leave orphaned temporary files. These accumulate and consume disk space. Scheduled cleanup prevents disk exhaustion. Private visibility prevents accidental exposure of partial uploads.
---
## Bad Example
```php
// No cleanup — orphaned temp files accumulate
```
---
## Good Example
```php
// Kernel.php
$schedule->call(function () {
    Storage::disk('local')->delete(Storage::disk('local')
        ->files('temp', true)
        ->filter(fn ($file) => Storage::disk('local')->lastModified($file) < now()->subDay()->timestamp)
    );
})->hourly();
```
---
## Exceptions
No common exceptions — temp file cleanup is essential for disk management.
---
## Consequences Of Violation
Disk space exhaustion from orphaned temp files.
