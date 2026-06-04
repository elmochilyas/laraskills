# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Feature & HTTP Testing
**Knowledge Unit:** File Upload Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always use `Storage::fake()` and `UploadedFile::fake()` in upload tests
- [ ] Apply rule: Test each validation rule with a dedicated invalid file
- [ ] Apply rule: Assert file existence after upload, not just HTTP status
- [ ] Apply rule: Test server-side MIME type validation, not just extension
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `Storage::fake()` used in all upload tests
- [ ] `UploadedFile::fake()` creates test files (no real filesystem I/O)
- [ ] Each validation rule tested with a dedicated invalid file
- [ ] Server-side MIME type validation tested (not just extension)
- [ ] File existence asserted after upload (`assertExists`)
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing with valid files
- [ ] Avoid: Forgetting Storage::fake()

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`Storage::fake('s3')` vs Real S3**: Use fake for speed and determinism. Real S3 in separate integration tests.
- **`UploadedFile::fake()->image()` vs `create()`**: Use `image()` for dimension validation. `create()` for non-image files.
- **Local vs cloud storage**: Both use same `FilesystemAdapter` interface. Switch disk name for coverage.
- **Security-first approach**: File upload is the most common web vulnerability vector. Test security boundaries thoroughly.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always use `Storage::fake()` and `UploadedFile::fake()` in upload tests
- [ ] Follow rule: Test each validation rule with a dedicated invalid file
- [ ] Follow rule: Assert file existence after upload, not just HTTP status
- [ ] Follow rule: Test server-side MIME type validation, not just extension
- [ ] Follow rule: Test the full upload-download lifecycle
- [ ] Follow rule: Test security boundaries (path traversal, extremely large files, executable content)
- [ ] - [ ] `Storage::fake()` used in all upload tests
- [ ] - [ ] `UploadedFile::fake()` creates test files (no real filesystem I/O)
- [ ] - [ ] Each validation rule tested with a dedicated invalid file
- [ ] - [ ] Server-side MIME type validation tested (not just extension)

# Performance Checklist
- Fake file creation: <1ms per file. No disk I/O.
- Image dimension detection: Reads fake image header. Negligible.
- Multiple file uploads: 10 files add ~2ms total.
- Storage fakes are in-memory: Large files (>10MB) increase memory pressure.

# Security Checklist
- File upload is a critical security boundary. Always validate server-side MIME type (not just extension).
- Test that renamed executables (image.php.jpg) are rejected.
- Test that extremely large files are rejected.
- Test that path traversal filenames (../../../etc/passwd) are sanitized.
- Test that files cannot overwrite existing system files.

# Reliability Checklist
- [ ] Ensure: File upload testing validates that uploaded files are correctly received, valida...
- [ ] Verify: Always use `Storage::fake()` and `UploadedFile::fake()` in upload tests
- [ ] Verify: Test each validation rule with a dedicated invalid file
- [ ] Verify: Assert file existence after upload, not just HTTP status
- [ ] Verify: Test server-side MIME type validation, not just extension

# Testing Checklist
- [ ] `Storage::fake()` used in all upload tests
- [ ] `UploadedFile::fake()` creates test files (no real filesystem I/O)
- [ ] Each validation rule tested with a dedicated invalid file
- [ ] Server-side MIME type validation tested (not just extension)
- [ ] File existence asserted after upload (`assertExists`)
- [ ] Upload-download lifecycle tested end-to-end
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing with valid files
- [ ] Avoid: Forgetting Storage::fake()

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always use `Storage::fake()` and `UploadedFile::fake()` in upload tests
- [ ] Apply: Test each validation rule with a dedicated invalid file
- [ ] Apply: Assert file existence after upload, not just HTTP status
- [ ] Apply: Test server-side MIME type validation, not just extension

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Only testing with valid files
- [ ] Avoid mistake: Forgetting Storage::fake()
- [ ] Avoid mistake: Testing file uploads via unit tests
- [ ] Avoid mistake: Not testing file type validation

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
## Rules
- Always use `Storage::fake()` and `UploadedFile::fake()` in upload tests
- Test each validation rule with a dedicated invalid file
- Assert file existence after upload, not just HTTP status
- Test server-side MIME type validation, not just extension
- Test the full upload-download lifecycle
- Test security boundaries (path traversal, extremely large files, executable content)
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test File Upload End-to-End


