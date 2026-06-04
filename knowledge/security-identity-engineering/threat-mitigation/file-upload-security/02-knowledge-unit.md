# Metadata

Domain: Security & Identity Engineering
Subdomain: Threat Mitigation
Knowledge Unit: File upload validation and secure storage
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Secure file upload requires validation at multiple layers: MIME type (not just extension), file size, content scanning, and storage outside the web root. Laravel's validation rules (`mimes:pdf`, `max:10240`) provide MIME-based type checking. For storage, use private disks (not `public/`) for sensitive uploads, serve files via signed URLs or streams, and scan uploads for malware. The layered defense: validate MIME + size → scan for malware → store outside web root → serve via controlled endpoint → CSP prevents execution of uploaded HTML/JS.

---

# Core Concepts

- **MIME Type Validation**: `mimes:pdf,docx` rules validate by MIME type, not extension. The file's binary signature determines the MIME, preventing extension-spoofed uploads (e.g., .php file renamed to .pdf).
- **Size Validation**: `max:10240` (10MB) limits file upload size. PHP config `upload_max_filesize` and `post_max_size` must also be set.
- **Disk Separation**: Public uploads (avatars) go to `public/` disk. Private uploads (documents, CSVs) go to `local` disk or S3 with private ACL.
- **Serving Private Files**: Never serve private files directly via URL. Use streams: `return response()->file(storage_path('app/'.$path))` or `return response()->download($path)`. `Storage::download()` or `Storage::response()` for private disks.
- **Malware Scanning**: Third-party services (ClamAV, S3 Object Lambda) scan uploads before storage. Reject infected files.

---

# Mental Models

- **Defense in Layers**: File upload security is not one check but a pipeline. Validate → Scan → Store → Serve — each layer catches what the previous missed.
- **Extension is Meaningless**: A file's `.pdf` extension does not make it safe. The extension check is UX, not security. MIME type (magic bytes) is the validation boundary.

---

# Internal Mechanics

- Laravel's `mimes:pdf` rule uses Symfony's MIME type guesser which reads the file's magic bytes (first bytes of the file). It does NOT check the extension.
- `uploaded_file` validation: `max:2048` (KB) checks `UploadedFile->getSize()`. The file must be a valid `UploadedFile` instance (not a string path).
- Files stored via `$file->store('avatars', 's3')` are moved to the configured disk. Temporary file in `php://tmp` is cleaned up.
- `$file->storeAs('path', 'filename.ext', 'disk')` stores with explicit filename — use for keeping original names (but sanitize them).

---

# Patterns

## Multi-Layer Upload Validation Pattern
- **Purpose**: Defense-in-depth for file type verification.
- **Implementation**: Form Request validates `mimes:pdf,docx|max:10240`. Controller/Service calls `$file->isValid()` check. Third step: pass file to a dedicated validation service that inspects binary content.
- **Benefits**: Type spoofing caught at MIME layer. Oversized files caught at size layer. Malware caught at content layer.

## Private File Serving via Streamed Response
- **Purpose**: Serve private files without exposing them in public URL.
- **Implementation**: `return Storage::disk('private')->response($path)`. Route protected by `auth` and authorization middleware.
- **Benefits**: Only authenticated, authorized users can access files. Attackers cannot guess file URLs.

## Malware Scanning Pipeline
- **Purpose**: Detect and reject uploaded malware.
- **Implementation**: Upload to a staging location → call ClamAV API (`php-clamav` or `clamd`) → if infected, delete and return error → if clean, move to permanent storage.
- **Benefits**: Infected files never reach permanent storage.
- **Tradeoffs**: Scanning adds latency (ClamAV: ~1-5s per file). Queue the scan for larger files.

---

# Architectural Decisions

| Decision | Context | Recommendation |
|---|---|---|
| Public vs private disk | Avatar vs document upload | Public disk + URL for non-sensitive content; Private disk + streamed response for sensitive content |
| Local storage vs S3 vs cloud | Scalability and durability | S3 for production (durability, CDN, signed URLs). Local for dev |
| File validation in Form Request vs dedicated service | Simple vs complex validation | Form Request for basic validation; Dedicated service for multi-step validation (scan, virus check, format conversion) |

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| MIME-based validation catches extension spoofing | MIME guesser is not infallible — some file types have ambiguous magic bytes | PDFs with embedded scripts may pass MIME check but contain harmful content |
| Private disk protects files from direct access | Requires authenticated file-serving endpoint | Every file read goes through PHP — higher server load than direct Nginx serving |
| Malware scanning protects users | Scanning latency and false positives | Legitimate files may be flagged as malware; tune scanning sensitivity |

---

# Performance Considerations

- File uploads require PHP to buffer the entire file in memory. `memory_limit` must accommodate max upload size. For large files (100MB+), consider direct-to-S3 uploads.
- MIME type reading is fast (reads first 4KB of file). Size check is instant.
- Malware scanning (ClamAV) is CPU-intensive. Queue scans for production. Redis or SQS for scan jobs.
- Serving files via Laravel streams reads the file to the response. For large files, use `X-Sendfile` (Apache/Nginx) or S3 pre-signed URLs.

---

# Production Considerations

- **PHP Config**: `upload_max_filesize`, `post_max_size`, `max_file_uploads`, `memory_limit`, `max_input_time` must be configured per application requirements.
- **Filename Sanitization**: `$file->hashName()` generates a random filename — safer than using the original name. If original name is needed, store it in a separate DB column.
- **S3 Signed URLs**: For S3, use `Storage::temporaryUrl($path, $expiration)` for time-limited file access instead of streaming through Laravel.
- **CSP for Uploaded Content**: If serving uploaded HTML/images, add CSP header to prevent script execution from user content.

---

# Common Mistakes

- **Validating by extension only**: `$request->validate(['file' => 'required|extensions:pdf'])` — checks extension, not MIME type. Use `mimes:pdf`.
- **Storing uploaded files under public disk**: Files are accessible directly via URL. Anyone with the URL can access the file, regardless of authorization.
- **Not sanitizing filenames**: `$file->storeAs('uploads', $request->file->getClientOriginalName())` — an attacker can upload `../../etc/passwd` as filename. Use `store()` (auto-generated name) or sanitize with `Str::slug()`.
- **Serving private files from public URL**: File stored on `local` disk but somehow accessible via `/storage/uploads/file.pdf` (a symlink). The file is readable by anyone.
- **Not scanning for malware**: Any uploaded file type can contain malware. PDFs with JavaScript, Office macros, ZIP bombs. Scan everything.

---

# Failure Modes

- **Race Condition on MIME Check**: File passes MIME check but is replaced between validation and storage (symlink attack in temp directory). Mitigation: validate and store in the same request — do not accept file paths from client.
- **PHP Upload Size Limit Exceeded**: User uploads a 12MB file but `upload_max_filesize = 10M`. PHP rejects the file without Laravel validation running. The user gets a generic error.
- **Disk Full**: Storage disk fills up. Uploads fail silently (IOException from filesystem). Monitor disk space.
- **Malware False Positive**: A legitimate PDF is flagged by antivirus. User cannot upload their required document. Provide a manual review path.
- **S3 Credentials Expired**: S3 temporary credentials expire during a large upload. File partially uploaded. Implement retry logic.

---

# Related Knowledge Units

- Prerequisites: Storage configuration (disks, drivers), Form Request validation rules
- Related: Signed URLs (for serving private files), CSP nonce/script-src (for uploaded HTML content)
- Advanced Follow-up: Direct-to-S3 uploads (presigned URLs), Malware scanning with ClamAV, VirusTotal API integration, File type transformation (PDF to images for preview)

## Ecosystem Usage
- **Laravel RateLimiter**: Illuminate\Cache\RateLimiter facade provides named rate limit definitions; the 	hrottle middleware applies limits to routes. Named limits support per-user, per-IP, and custom segmenters.
- **Laravel Form Request Validation**: Illuminate\Foundation\Http\FormRequest base class provides uthorize() and ules() methods; integrates with the Validator facade for automatic input validation on controller methods.
- **Laravel Crypt/Mcrypt**: Crypt::encryptString() and Crypt::decryptString() use AES-256-CBC or AES-256-GCM encryption with the application key. The Crypt facade wraps the framework's encrypter singleton.
- **Laravel Signed URLs**: URL::signedRoute() generates HMAC-signed URLs with optional expiration timestamps; the ValidateSignature middleware verifies signatures on incoming requests.
- **File upload security**: Illuminate\Http\UploadedFile provides getClientOriginalExtension(), getMimeType(), store(), storeAs() methods; validation rules (mimes:csv,txt, max:10240) enforce upload restrictions.
- **Spatie Rate Limited Job Middleware**: Community package providing rate-limited job execution middleware; uses Laravel's RateLimiter facade for distributed rate limiting across multiple workers.
- **Advanced rate limiting patterns**: Plan-aware throttling adjusts rate limits based on user subscription tier; uses RateLimiter::for() with per-tier limit definitions and 	hrottle middleware with dynamic limit resolution.
- **Dependency auditing**: composer audit and community packages like enlightn/enlightn scan dependencies for known vulnerabilities; oave/security-advisories blocks known-vulnerable packages from installation.

## Research Notes
- Laravel rate limiting was significantly enhanced in Laravel 12 with the introduction of named rate limiters that can reference other limiters for inheritance — RateLimiter::for('api', fn() => RateLimiter::for('global')->by('ip')).
- The 	hrottle middleware uses dynamic rate limit resolution when a Closure is passed — the limit is re-evaluated on every request, allowing per-user rate limit overrides based on subscription tier or trust level.
- Signed URLs in Laravel use HMAC-SHA256 with the application key — the signature includes all query parameters and the expires timestamp, providing tamper-proof URL validation without server-side state.
- File upload validation in Laravel 12+ includes built-in SVG upload protection (svg validation rule) that checks for embedded scripts and event handlers in SVG files.
- The Crypt facade uses serialization for encrypting objects and arrays — this introduces a potential unserialization vulnerability if an attacker can control the encrypted data; use Crypt::encryptString() for simple values.
- Form Request validation executes in the middleware pipeline before the controller — the prepareForValidation() hook allows preprocessing input before validation, useful for normalizing data format.
- Plan-aware throttling patterns use RateLimiter::for() with dynamic limit resolution based on the authenticated user's plan — the 	hrottle middleware accepts a RateLimiter::limiter() callback for complex limit definitions.
- Community rate limiting packages (spatie/laravel-rate-limited-job-middleware) extend rate limiting to queued jobs, not just HTTP requests — this prevents downstream API rate limit violations during batch job processing.

## Internal Mechanics
- **RateLimiter Resolution**: RateLimiter::for('login', fn(, ) => Limit::perMinute(5)) registers a named limiter. The 	hrottle middleware resolves the limiter by name at runtime, applies the limit, and returns a 429 Too Many Requests response with Retry-After header when exceeded.
- **Signed URL Generation**: URL::signedRoute('verify', ['id' => ->id], expires: 3600) → collects route name, parameters, and expiration → builds URL → computes HMAC-SHA256 signature over the URL string using APP_KEY → appends ?signature=<hash> to the URL. The ValidateSignature middleware re-computes the hash and compares using hash_equals().
- **Crypt Facade Encryption Flow**: Crypt::encrypt('value') → generates random IV (16 bytes for AES-256-CBC) → serializes the value → encrypts with AES-256-CBC using APP_KEY as encryption key → computes HMAC-SHA256 for integrity → JSON-encodes the payload ({iv, value, mac, tag}). Decryption reverses the process and verifies the MAC.
- **Form Request Validation Flow**: Custom form request class extends Illuminate\Foundation\Http\FormRequest → middleware pipeline calls FormRequest->authorize() → if false, returns 403 Forbidden → if true, calls FormRequest->rules() → FormRequest->validator() validates the request data against rules → if validation fails, throws ValidationException with error bag → if passes, the validated data is available via $request->validated().
- **File Upload Processing**: Uploaded file arrives as Symfony\Component\HttpFoundation\File\UploadedFile → $request->file('document') returns UploadedFile instance → $file->store('uploads') moves file to configured filesystem disk → MIME type is detected by Symfony's MimeTypeGuesser (not by client-provided content-type).
- **Dependency Audit Flow**: composer audit reads composer.lock → matches each package/version against the Security Advisories Database → returns list of known vulnerabilities with CVE IDs, severity, and advisory URLs. The command fails with exit code 1 when vulnerabilities match.
