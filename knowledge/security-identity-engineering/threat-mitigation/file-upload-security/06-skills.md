# Skill: Secure File Uploads with Server-Side Validation and Private Storage

## Purpose
Implement secure file upload handling with server-side MIME validation, private storage outside web root, malware scanning, and signed-URL access control.

## When To Use
- Any application accepting user file uploads
- Profile pictures, document uploads, image galleries
- File sharing or document management systems

## When NOT To Use
- Text-only applications (no file uploads)
- Server-to-server file transfers (still need validation)

## Prerequisites
- Storage disk configured in `config/filesystems.php`
- Validation rules for file types and sizes

## Workflow
1. Validate MIME type server-side using `mimes:pdf,doc,jpg,png` rule (not extension-only)
2. Validate file size with `max:10240` rule and PHP `upload_max_filesize` config
3. Store files outside web root using `$file->store()` (not `move()` to `public/`)
4. Use `$file->hashName()` to prevent path traversal — never use original filename
5. Serve private files via signed URLs or auth-protected download controllers
6. Scan files for malware (ClamAV or Laravel Antivirus) asynchronously
7. Strip EXIF data from images to remove GPS/metadata on upload
8. Schedule cleanup of expired temporary uploads

## Validation Checklist
- [ ] MIME type validated server-side (not just extension)
- [ ] File size limits set in validation and `php.ini`
- [ ] Files stored outside web root (private disk)
- [ ] Filenames sanitized via `hashName()`
- [ ] Executable extensions blocked (php, exe, sh, py)
- [ ] Private files served via signed URLs or auth-protected routes
- [ ] Malware scanning implemented (async)
- [ ] EXIF data stripped from images
