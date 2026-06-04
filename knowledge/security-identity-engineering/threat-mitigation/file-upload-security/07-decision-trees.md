# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** File Upload Security and Secure Storage
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Storage Disk Selection | Public vs private storage disk | security, architectural |
| 2 | File Access Control Strategy | Signed URLs vs auth-protected download controllers | architectural |
| 3 | File Validation Approach | Validation rules for safe uploads | security |

---

# Architecture-Level Decision Trees

---

## Storage Disk Selection

---

## Decision Context

Choosing between public disk (`storage/app/public/`) and private disk (`storage/app/`) for uploaded files.

---

## Decision Criteria

* security
* architectural

---

## Decision Tree

Are the uploaded files meant for public access (no auth required)?
↓
YES → Public disk (with `/storage` symlink). Only for truly public files (site assets, public avatars).
NO → Private disk (default for all user uploads).

Is there any scenario where file access should be controlled?
↓
YES → Private disk (access via signed/authenticated routes)
NO → Public disk only if file access truly requires no controls

Does the file contain sensitive user data (documents, PII, private images)?
↓
YES → Private disk mandatory
NO → Evaluate: could the file become sensitive? Private disk by default.

What is the cost of a data leak?
↓
High (legal/compliance) → Private disk always
Low (public profile pictures) → Public disk acceptable

---

## Rationale

Private disk storage prevents direct URL access to files. All access goes through a controller that can enforce authentication, authorization, and rate limiting. Public disk files are accessible at `/storage/filename.ext` with no access control. The default for user uploads should always be private disk unless there is a specific, documented reason for public access.

---

## Recommended Default

**Default:** Private disk for all user uploads; public disk only for intentionally public assets (not user-generated)
**Reason:** Private disk provides access control by default. Switching from public to private later requires data migration. Starting with private is safer and easier to relax than to retrofit access controls onto publicly stored files.

---

## Risks Of Wrong Choice

- Public disk for private files: anyone with the URL can access (URLs may be guessable)
- Private disk for public files: unnecessary overhead of auth checks for every download
- Direct URL access to storage files: bypasses all validation and access control
- No backup of disk files: cloud disks (S3) may not be backed up by default

---

## Related Rules

- Store Uploaded Files Outside the Public Directory (05-rules.md)
- Scan Uploaded Files for Malware Before Storage (05-rules.md)

---

## Related Skills

- Secure File Uploads with Server-Side Validation and Private Storage (06-skills.md)

---

## File Access Control Strategy

---

## Decision Context

How to serve private files to authorized users — signed temporary URLs or authentication-protected download controllers.

---

## Decision Criteria

* architectural

---

## Decision Tree

Is the storage disk cloud-based (S3, Cloud Storage)?
↓
YES → Signed URLs via `Storage::temporaryUrl()` (cloud-native, no server load)
NO → Local disk → Auth-protected download controller (stream file through Laravel)

Is the file access one-time or time-limited?
↓
One-time download → Signed URLs (single-use, time-limited)
Repeated access → Auth-protected controller (session-based access)

Does the download need to be tracked/audited?
↓
YES → Auth-protected controller (can log each download with user info)
NO → Signed URLs (minimal server overhead)

Is the file large (> 100 MB)?
↓
YES → Auth-protected controller with streaming (avoid loading into memory)
NO → Either approach works

---

## Rationale

Signed URLs (`Storage::temporaryUrl()`) generate time-limited URLs that don't require the user to pass through the application server — ideal for S3 where files are served directly from cloud storage. Auth-protected controllers stream files through the Laravel application, enabling access logging, authorization checks, and custom download logic. Cloud disks benefit from signed URLs (no server load), while local disks require controller-based streaming.

---

## Recommended Default

**Default:** Signed URLs for cloud storage (S3); auth-protected download controller for local storage
**Reason:** Signed URLs leverage cloud storage's built-in access control without routing traffic through your application servers. For local storage, there is no alternative — the file must be streamed through a controller. Both approaches support time-limited access.

---

## Risks Of Wrong Choice

- Direct URL to cloud storage: permanent access to the file (unless bucket is private)
- Controller streaming for cloud storage: unnecessary server load, negates cloud benefits
- Signed URL for sensitive downloads: URL is accessible to anyone who has the link (mitigate with short expiry)
- No access control at all: private files are publicly accessible

---

## Related Rules

- Store Uploaded Files Outside the Public Directory (05-rules.md)
- Validate File Type by MIME, Not Extension (05-rules.md)

---

## Related Skills

- Secure File Uploads with Server-Side Validation and Private Storage (06-skills.md)

---

## File Validation Approach

---

## Decision Context

Choosing the validation rules and sanitization for uploaded files.

---

## Decision Criteria

* security

---

## Decision Tree

What file types are expected?
↓
Images (jpg, png, gif, webp) → `mimes:jpg,png,gif,webp` + `dimensions` + EXIF stripping + re-encode
Documents (pdf, doc, xls) → `mimes:pdf,doc,docx,xls,xlsx` + malware scan
Archives (zip, tar) → `mimes:zip` + malware scan + size limit (may contain executables)
Media (mp4, mp3) → `mimes:mp4,mp3` + strict size limit

Is file content re-encoding needed?
↓
YES (images) → Re-encode with Intervention/GD (strips EXIF, embedded malware)
NO (documents, archives) → Malware scanning only (cannot re-encode)

What is the maximum acceptable file size?
↓
Depends on type: images 2-5MB, documents 10-20MB, media 50-100MB
Set both in validation rule (`max:n`) and `php.ini` (`upload_max_filesize`, `post_max_size`)

Is malware scanning required?
↓
YES → ClamAV (on-prem) or cloud API (VirusTotal) — async recommended
NO → Acceptable only for trusted upload sources (internal/admin uploads)

---

## Rationale

File validation is defense-in-depth: MIME type checking, file size limits, content sanitization (re-encoding for images), and malware scanning. Each layer catches different attack vectors. MIME validation prevents type spoofing. Size limits prevent DoS. Re-encoding strips embedded threats from images. Malware scanning catches known malicious content.

---

## Recommended Default

**Default:** `mimes` + `max` validation in Form Request, `$file->hashName()` for naming, malware scanning for all uploads, EXIF stripping for images
**Reason:** The combination of MIME validation, size limits, safe naming, malware scanning, and content sanitization provides comprehensive file upload protection. Each layer addresses a specific threat: spoofing, DoS, path traversal, malware, and metadata leakage.

---

## Risks Of Wrong Choice

- Extension-only validation: PHP file renamed to `.jpg` bypasses
- No size limit: disk space exhaustion
- No malware scanning: malware distribution via uploads
- Original filename used: path traversal attack
- No EXIF stripping: GPS/device metadata leaked from images

---

## Related Rules

- Validate File Type by MIME, Not Extension (05-rules.md)
- Limit File Size per Upload Type (05-rules.md)
- Rename Uploaded Files to Prevent Path Traversal (05-rules.md)
- Serve Images Through Intervention or Sanitized Streaming (05-rules.md)

---

## Related Skills

- Secure File Uploads with Server-Side Validation and Private Storage (06-skills.md)
