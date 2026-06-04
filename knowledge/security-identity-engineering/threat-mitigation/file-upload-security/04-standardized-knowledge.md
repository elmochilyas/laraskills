# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | File Upload Security and Secure Storage |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

File upload security in Laravel involves validating files on input (MIME type, size, extension), storing them securely (outside web root, using private disks), and controlling access via signed URLs or authentication. Key practices: validate MIME type server-side (not trusting client-provided Content-Type), store uploads in `storage/app/` (not `public/`), use private disks with access-controlled URLs, scan uploaded content for malware, and prevent path traversal in file names.

---

## Core Concepts

- **MIME Type Validation**: Server-side validation using `$file->getMimeType()` or `mimes:pdf,doc` rule. Client-side MIME can be spoofed — always validate server-side.
- **File Size Validation**: `max:10240` (10MB) in validation rules. Also set `upload_max_filesize` and `post_max_size` in `php.ini`.
- **Storage Outside Web Root**: Files in `storage/app/` are not directly accessible via URL. Public files in `storage/app/public/` are accessible via symlink.
- **Private Disks**: Files stored on non-public disks require authentication or signed URLs for access.
- **Signed URLs for Downloads**: `Storage::temporaryUrl($path, $expiry)` generates time-limited download URLs.
- **Path Traversal Prevention**: Laravel's `$file->store()` uses the provided filename as-is — sanitize to prevent `../../etc/passwd` paths.

---

## When To Use

- Any application accepting file uploads from users
- Profile pictures, document uploads, image galleries
- File sharing, document management, media libraries
- Any scenario where file storage and access control is needed

## When NOT To Use

- Text-only applications (no file uploads)
- When using third-party file storage services that handle their own security (S3, Cloud Storage)
- Server-to-server file transfers (application-level file handling still needs validation)

---

## Best Practices

- **Validate MIME Type Server-Side**: Use `mimes:pdf,doc,docx,jpg,png` rule. Do not trust the browser's Content-Type.
- **Store Outside Web Root**: Default to `storage/app/` (private). Only use `public/` disk for files that must be publicly accessible.
- **Use Temporary URLs for Private Files**: `Storage::temporaryUrl($path, now()->addMinutes(60))` for time-limited access.
- **Sanitize File Names**: `$file->hashName()` generates a unique, safe filename. Avoid using original user-provided names.
- **Validate File Content**: For images, re-encode (strip EXIF data). For documents, use ClamAV or similar malware scanner.
- **Set PHP Limits**: Configure `upload_max_filesize`, `post_max_size`, `max_file_uploads` in `php.ini`.

---

## Architecture Guidelines

- Upload validation Form Request with `file`, `mimes`, `max`, `dimensions` (images) rules
- Store files using `$file->store('path', 'disk')` — use named disks for different storage backends
- Private files: store on `local` or `s3` private disk; serve via `Storage::temporaryUrl()` or custom download controller
- Public files: store on `public` disk; access via `/storage/` symlink
- File naming: `$file->hashName()` for safe, unique names
- Thumbnails: use image intervention or cloud image processing for resizing

---

## Performance Considerations

- File upload speed depends on file size and network bandwidth — set reasonable limits
- Image processing (resize, thumbnail) adds CPU load — process asynchronously via queue
- Storage reads: local disk is fastest; S3 adds network latency
- Malware scanning: ClamAV adds latency — scan asynchronously after upload
- CDN for public files: CloudFront, Cloudflare for global distribution

---

## Security Considerations

- **MIME Type Spoofing**: A file named `image.jpg` can contain PHP code. Always validate MIME server-side via file content, not extension.
- **Path Traversal**: `../` in filename can write outside the intended directory. Use `$file->hashName()` or `basename()` to sanitize.
- **Executable Uploads**: Prevent PHP, EXE, SH, and other executable file types. Validate extension + MIME.
- **Malware Uploads**: Scan files with ClamAV or third-party API (VirusTotal) for malware.
- **Storage Access Control**: Private files must not be accessible via direct URL. Use signed URLs or authentication.
- **EXIF Data**: Images may contain GPS coordinates and camera metadata. Strip EXIF on upload for privacy.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only validating file extension | Assuming extension = content | Malicious file uploaded as .jpg contains PHP code | Validate MIME type server-side |
| Storing files in public web root | `/public/uploads/` | Files directly accessible without auth | Store in `storage/app/` (private) |
| Using original file name | Convenience | Path traversal via `../` in name | Use `$file->hashName()` |
| No malware scanning | Trusting user uploads | Malware distribution via file upload | Scan with ClamAV (async) |
| No file size validation | Skipping max rule | Server disk filled by large uploads | Set `max` in validation + php.ini |

---

## Anti-Patterns

- **Allowing executable extensions (php, exe, sh, py)**: Risk of code execution
- **Direct URL access to private files**: Anyone with the URL can download
- **Storing files in database as BLOB**: Slows database, hard to scale — use filesystem
- **Trusting client-provided Content-Type**: Can be spoofed — always validate server-side

---

## Examples

**File upload validation Form Request:**
```php
// app/Http/Requests/StoreDocumentRequest.php
public function rules(): array
{
    return [
        'document' => [
            'required',
            'file',
            'mimes:pdf,doc,docx,xls,xlsx',
            'max:10240', // 10MB
        ],
    ];
}
```

**Secure file storage:**
```php
// Controller
public function store(StoreDocumentRequest $request)
{
    $file = $request->file('document');
    
    // Store with safe filename, outside web root
    $path = $file->store('documents', 'local'); // storage/app/documents/
    // or use hashName() explicitly
    $path = $file->storeAs('documents', $file->hashName(), 'local');
    
    return back()->with('success', 'Document uploaded');
}
```

**Temporary URL for private file:**
```php
// Download controller
public function download(Document $document)
{
    // Generate temporary URL (expires in 60 min)
    $url = Storage::disk('local')->temporaryUrl(
        $document->path,
        now()->addMinutes(60)
    );
    
    return redirect($url);
    // Or stream the file directly
    // return Storage::disk('local')->download($document->path);
}
```

---

## Related Topics

- Form Request validation
- Filesystem security
- Signed URLs
- Input validation security

---

## AI Agent Notes

- File upload security is a common vulnerability area. Validate both MIME type and extension server-side.
- Private files must not be stored in `public/` disk. Use `local` or `s3` private disks.
- Malware scanning should be async to avoid blocking the upload response.

---

## Verification

- [ ] Server-side MIME type validation (not just client Content-Type)
- [ ] File size limits set in both validation and php.ini
- [ ] Files stored outside web root (private disk)
- [ ] File names sanitized (hashName or basename)
- [ ] Executable extensions blocked (php, exe, sh, py)
- [ ] Private files served via signed URLs or auth-protected download route
- [ ] Malware scanning implemented (async)
- [ ] Image EXIF data stripped on upload
- [ ] PHP limits configured (upload_max_filesize, post_max_size)
