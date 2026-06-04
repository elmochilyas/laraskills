# Skill: Test Filesystem Operations with Storage Fake

## Purpose
Verify file uploads, downloads, deletions, and content assertions using Laravel's `Storage::fake()` to simulate disk operations without hitting the real filesystem.

## When To Use
- When testing file upload functionality
- When testing file download routes
- When testing file deletion logic
- When testing file processing (image resizing, CSV parsing)
- When testing disk operations for cloud storage (S3, GCS)

## When NOT To Use
- When testing the actual filesystem driver (trust Laravel)
- When testing file system quotas or disk space errors (unusual case)
- When the file itself must be physically present for a third-party library
- For testing real cloud storage interactions (use a dedicated integration test)

## Prerequisites
- `Storage::fake()` facade method
- Knowledge of the disk configuration being faked
- Understanding of `assertExists()`, `assertMissing()`, and `assertDirectoryEmpty()`

## Inputs
- Disk name to fake (matching production disk configuration)
- Files to upload (paths and content)
- Expected file paths after processing
- File content to verify

## Workflow
1. Call `Storage::fake('s3')` with the disk name matching production
2. If the disk stores files under a subdirectory, create it: `Storage::disk('s3')->makeDirectory('avatars')`
3. Execute the file operation (upload, process, delete)
4. Assert file exists: `Storage::disk('s3')->assertExists('avatars/photo.jpg')`
5. Assert file content: `Storage::disk('s3')->get('avatars/photo.jpg')` and assert on the content
6. Assert file missing: `Storage::disk('s3')->assertMissing('avatars/old.jpg')`
7. Assert directory state: `Storage::disk('s3')->assertDirectoryEmpty('temp')`
8. For file downloads, test the response: `$response->assertDownload('invoice.pdf')`

## Validation Checklist
- [ ] `Storage::fake()` is called with the correct disk name
- [ ] File existence is asserted after upload operations
- [ ] File content is verified when processing transforms data
- [ ] File deletion is verified with `assertMissing()`
- [ ] Directory state is asserted when relevant
- [ ] Download responses are verified with `assertDownload()`
- [ ] Temporary files are cleaned up (or the fake is reset between tests)

## Common Failures
- Using the wrong disk name in `Storage::fake()` — doesn't match the code's disk
- Not asserting file content — only checking existence misses content bugs
- Asserting download without checking filename or content type
- Not testing file validation (size limits, mime types, extension checks)
- Forgetting that `Storage::fake()` uses an in-memory filesystem — files don't persist across tests

## Decision Points
- Public vs local disk — use the same disk name as production
- Content assertion: `get()` vs `assertExists()` — get for content verification, assertExists for presence only
- Multiple files: assert each individually or use directory assertions for batch operations

## Performance Considerations
- `Storage::fake()` uses in-memory filesystem — much faster than real disk I/O
- Large file content (images, PDFs) is stored in memory — keep test files small
- Multiple disk assertions are efficient (in-memory lookups)
- Real file processing (image manipulation) still executes — mock or stub if slow

## Security Considerations
- Ensure uploaded file validation is tested (malicious file types, size limits)
- Test that users cannot access files they don't have permission for
- Verify that temporary files are cleaned up after processing
- Test path traversal protection (../ in filename)

## Related Rules
- [Rule: Use the Correct Disk Name](./05-rules.md)
- [Rule: Verify File Content, Not Just Existence](./05-rules.md)
- [Rule: Test File Validation Separately](./05-rules.md)

## Related Skills
- Laravel Fakes
- HTTP Client Faking
- File Upload Testing

## Success Criteria
- [ ] All filesystem operations in tests use `Storage::fake()`
- [ ] File content is verified for processing operations
- [ ] File validation (size, type, extension) is tested with invalid inputs
- [ ] Permission-based file access is tested
- [ ] Download responses are verified with `assertDownload()`
