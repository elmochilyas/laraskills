# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Mocking & Fakes
**Knowledge Unit:** Storage Fake Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always match the disk name exactly between `Storage::fake()` and application code
- [ ] Apply rule: Fake all disks used in the operation
- [ ] Apply rule: Always specify the disk in storage assertions
- [ ] Apply rule: Verify file content, not just existence
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `Storage::fake()` is called with the correct disk name
- [ ] File existence is asserted after upload operations
- [ ] File content is verified when processing transforms data
- [ ] File deletion is verified with `assertMissing()`
- [ ] Directory state is asserted when relevant
- [ ] Avoid: Mistake
- [ ] Avoid: Disk name mismatch
- [ ] Avoid: Not faking all disks used

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`Storage::fake('s3')` vs real S3**: Use fake for unit/feature tests. Use real S3 in dedicated integration tests for cloud-specific behavior.
- **Disk name matching**: Use exact config key from `config/filesystems.php`. Case-sensitive.
- **URL assertions**: `Storage::url()` on fake returns local URLs. Test cloud URL generation separately.
- **Temporary URLs**: `temporaryUrl()` returns null on faked disks.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always match the disk name exactly between `Storage::fake()` and application code
- [ ] Follow rule: Fake all disks used in the operation
- [ ] Follow rule: Always specify the disk in storage assertions
- [ ] Follow rule: Verify file content, not just existence
- [ ] Follow rule: Test URL generation separately from storage fakes
- [ ] - [ ] `Storage::fake()` is called with the correct disk name
- [ ] - [ ] File existence is asserted after upload operations
- [ ] - [ ] File content is verified when processing transforms data
- [ ] - [ ] File deletion is verified with `assertMissing()`

# Performance Checklist
- Fake initialization: <1ms per disk.
- File `put()`: <0.5ms per small file (<1MB).
- File `get()`: <0.3ms per small file.
- `assertExists()`: <0.1ms.
- Large files (10MB): ~5ms. Much faster than real S3 (~50-200ms).
- Multiple files: 100 files adds ~50ms.

# Security Checklist
- Storage fakes prevent accidental file storage in real cloud storage during tests. Critical for avoiding cloud costs and data leaks.
- Ensure test files don't contain real sensitive data.
- Test that private files are not publicly accessible (vÃ©rify visibility settings).

# Reliability Checklist
- [ ] Ensure: Storage fake testing replaces filesystem operations (local disk, S3, R2, FTP) wi...
- [ ] Verify: Always match the disk name exactly between `Storage::fake()` and application code
- [ ] Verify: Fake all disks used in the operation
- [ ] Verify: Always specify the disk in storage assertions
- [ ] Verify: Verify file content, not just existence

# Testing Checklist
- [ ] `Storage::fake()` is called with the correct disk name
- [ ] File existence is asserted after upload operations
- [ ] File content is verified when processing transforms data
- [ ] File deletion is verified with `assertMissing()`
- [ ] Directory state is asserted when relevant
- [ ] Download responses are verified with `assertDownload()`
- [ ] Avoid: Mistake
- [ ] Avoid: Disk name mismatch
- [ ] Avoid: Not faking all disks used

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always match the disk name exactly between `Storage::fake()` and application code
- [ ] Apply: Fake all disks used in the operation
- [ ] Apply: Always specify the disk in storage assertions
- [ ] Apply: Verify file content, not just existence

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Disk name mismatch
- [ ] Avoid mistake: Not faking all disks used
- [ ] Avoid mistake: Asserting on Storage facade after faking different disk
- [ ] Avoid mistake: Expecting cloud URLs on fake

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
- Always match the disk name exactly between `Storage::fake()` and application code
- Fake all disks used in the operation
- Always specify the disk in storage assertions
- Verify file content, not just existence
- Test URL generation separately from storage fakes
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Filesystem Operations with Storage Fake


