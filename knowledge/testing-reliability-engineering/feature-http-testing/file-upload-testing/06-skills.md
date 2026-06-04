# Skill: Test File Upload End-to-End

## Purpose
Write comprehensive file upload tests covering validation rules, storage verification, download lifecycle, and security boundaries using fakes.

## When To Use
- Adding or modifying file upload endpoints
- Implementing file validation rules (MIME type, size, dimensions)
- Testing file download/retrieval functionality
- Security testing for file upload endpoints

## When NOT To Use
- Testing real cloud storage integration (use separate integration tests)
- Testing file content correctness (use separate processing tests)
- Virus scanning integration (requires real scanner)

## Prerequisites
- File upload route and controller implemented
- Validation rules defined for file uploads
- Storage disk configured (local, S3, etc.)

## Inputs
- Upload route and validation rules (MIME types, max size, dimensions)
- File types accepted and rejected
- Storage disk and path configuration

## Workflow
1. Call `Storage::fake($diskName)` at the start of each test to intercept storage operations
2. Create test files with `UploadedFile::fake()->image('photo.jpg', 300, 300)` for images or `UploadedFile::fake()->create('document.pdf', 100)` for other files
3. Test each validation rule with a dedicated invalid file: wrong MIME type, wrong extension, too large, too small, wrong dimensions
4. Assert file existence after upload with `Storage::disk('s3')->assertExists($path)` — a 200 response doesn't guarantee storage
5. Test the full lifecycle: upload → verify storage → download → assert download returns correct filename and content type
6. Test security boundaries: path traversal filenames (`../../../etc/passwd`), extremely large files, executable types (`.php`, `.exe`, `.sh`)
7. Test server-side MIME type validation (not just extension) — renamed executables must be rejected

## Validation Checklist
- [ ] `Storage::fake()` used in all upload tests
- [ ] `UploadedFile::fake()` creates test files (no real filesystem I/O)
- [ ] Each validation rule tested with a dedicated invalid file
- [ ] Server-side MIME type validation tested (not just extension)
- [ ] File existence asserted after upload (`assertExists`)
- [ ] Upload-download lifecycle tested end-to-end
- [ ] Security boundaries tested (path traversal, large files, executables)
- [ ] Image dimension validation tested where applicable

## Common Failures
- Forgetting `Storage::fake()` — real files accumulate, CI disks fill up
- Only testing with valid files — invalid file types bypass validation
- Testing extension-only without MIME type — renamed executables pass
- Asserting HTTP 200 but not verifying file was actually stored
- Not testing the download path — upload works but download returns 404

## Decision Points
- `UploadedFile::image()` for dimension validation vs `UploadedFile::create()` for non-image files
- Test each validation rule separately vs combined invalid tests (dedicated tests are clearer)
- Fake storage for all tests vs real cloud storage in separate integration suite

## Performance Considerations
- Fake file creation: <1ms per file — no disk I/O
- `Storage::fake()` is in-memory — large files (>10MB) increase memory pressure
- Image dimension detection reads fake image header — negligible cost

## Security Considerations
- File upload is a critical security boundary — always validate server-side MIME type
- Test renamed executables (`image.php.jpg`) are rejected
- Test path traversal filenames are sanitized
- Test extremely large files are rejected (DoS prevention)
- Test files cannot overwrite existing system files

## Related Rules (from 05-rules.md)
- Rule 1: Always use `Storage::fake()` and `UploadedFile::fake()` in upload tests
- Rule 2: Test each validation rule with a dedicated invalid file
- Rule 3: Assert file existence after upload, not just HTTP status
- Rule 4: Test server-side MIME type validation, not just extension
- Rule 5: Test the full upload-download lifecycle
- Rule 6: Test security boundaries (path traversal, large files, executables)

## Success Criteria
- All validation rules tested with valid and invalid files
- Uploaded files are verified stored at correct paths
- Download returns correct file with correct metadata
- Security boundaries prevent malicious file uploads
