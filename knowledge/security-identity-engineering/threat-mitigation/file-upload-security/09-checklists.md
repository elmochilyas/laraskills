# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Threat Mitigation
**Knowledge Unit:** File upload validation and secure storage
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: No File Size Limit**: No `max` rule on file uploads â€” disk space at risk
- [ ] Prevent anti-pattern: Executable Extensions Allowed**: php, exe, sh not blocked
- [ ] Prevent anti-pattern: Files in Database BLOB**: Performance and scalability issues
- [ ] MIME type validated server-side (not just extension)
- [ ] File size limits set in validation and `php.ini`
- [ ] Files stored outside web root (private disk)
- [ ] Filenames sanitized via `hashName()`
- [ ] Executable extensions blocked (php, exe, sh, py)
- [ ] Avoid: Mistake
- [ ] Avoid: Only validating file extension
- [ ] Avoid: Storing files in public web root

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Upload validation Form Request with `file`, `mimes`, `max`, `dimensions` (images) rules
- Store files using `$file->store('path', 'disk')` â€” use named disks for different storage backends
- Private files: store on `local` or `s3` private disk; serve via `Storage::temporaryUrl()` or custom download controller
- Public files: store on `public` disk; access via `/storage/` symlink
- File naming: `$file->hashName()` for safe, unique names
- Thumbnails: use image intervention or cloud image processing for resizing

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] MIME type validated server-side (not just extension)
- [ ] - [ ] File size limits set in validation and `php.ini`
- [ ] - [ ] Files stored outside web root (private disk)
- [ ] - [ ] Filenames sanitized via `hashName()`

# Performance Checklist
- File upload speed depends on file size and network bandwidth â€” set reasonable limits
- Image processing (resize, thumbnail) adds CPU load â€” process asynchronously via queue
- Storage reads: local disk is fastest; S3 adds network latency
- Malware scanning: ClamAV adds latency â€” scan asynchronously after upload
- CDN for public files: CloudFront, Cloudflare for global distribution

# Security Checklist
- **MIME Type Spoofing**: A file named `image.jpg` can contain PHP code. Always validate MIME server-side via file content, not extension.
- **Path Traversal**: `../` in filename can write outside the intended directory. Use `$file->hashName()` or `basename()` to sanitize.
- **Executable Uploads**: Prevent PHP, EXE, SH, and other executable file types. Validate extension + MIME.
- **Malware Uploads**: Scan files with ClamAV or third-party API (VirusTotal) for malware.
- **Storage Access Control**: Private files must not be accessible via direct URL. Use signed URLs or authentication.
- **EXIF Data**: Images may contain GPS coordinates and camera metadata. Strip EXIF on upload for privacy.

# Reliability Checklist
- [ ] Ensure: File upload security in Laravel involves validating files on input (MIME type, s...

# Testing Checklist
- [ ] MIME type validated server-side (not just extension)
- [ ] File size limits set in validation and `php.ini`
- [ ] Files stored outside web root (private disk)
- [ ] Filenames sanitized via `hashName()`
- [ ] Executable extensions blocked (php, exe, sh, py)
- [ ] Private files served via signed URLs or auth-protected routes
- [ ] Avoid: Mistake
- [ ] Avoid: Only validating file extension
- [ ] Avoid: Storing files in public web root

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: No File Size Limit**: No `max` rule on file uploads â€” disk space at risk
- [ ] Prevent: Executable Extensions Allowed**: php, exe, sh not blocked
- [ ] Prevent: Files in Database BLOB**: Performance and scalability issues
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Only validating file extension
- [ ] Avoid mistake: Storing files in public web root
- [ ] Avoid mistake: Using original file name
- [ ] Avoid mistake: No malware scanning

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- No File Size Limit**: No `max` rule on file uploads â€” disk space at risk
- Executable Extensions Allowed**: php, exe, sh not blocked
- Files in Database BLOB**: Performance and scalability issues
## Skills
- Secure File Uploads with Server-Side Validation and Private Storage


