# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | File Upload Testing |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | HTTP test helpers, Storage facade, Validation rules |
| Related KUs | Storage fake testing, Validation testing, Security testing |
| Source | domain-analysis.md K021 |

# Overview

File upload testing validates that uploaded files are correctly received, validated, stored, and processed. Laravel provides `UploadedFile::fake()` to create test files without actual disk I/O and `Storage::fake()` to intercept file storage operations. File upload testing is critical for security (malicious file uploads are a common attack vector) and data integrity. The combination of fake files and fake storage enables fast, deterministic upload tests without real filesystem dependencies.

# Core Concepts

- **`UploadedFile::fake()`**: Creates an `UploadedFile` with a fake temporary file. Methods: `fake($name)`, `image($name, $width, $height)`, `create($name, $size)`.
- **`Storage::fake($disk)`**: Replaces a storage disk with an in-memory fake.
- **File validation**: Test file size, MIME type, extension, dimensions.
- **Image dimensions**: `UploadedFile::image()` creates fake images with specified dimensions.
- **File existence assertions**: `Storage::disk('s3')->assertExists('file.pdf')`, `assertMissing()`.
- **File download testing**: `$this->get('/download/1')->assertDownload('file.pdf')`.

# When To Use

- For every file upload endpoint in the application
- When testing file validation rules (size, MIME, dimensions)
- When testing image processing or file transformation
- For file download endpoints
- For security testing of file upload boundaries

# When NOT To Use

- For testing real cloud storage integration (use separate integration tests)
- For testing file content correctness (use separate file processing tests)
- When the test doesn't involve file handling (don't add fake file overhead)
- For testing virus scanning (requires real filesystem and scanner)

# Best Practices (WHY)

- **Always call `Storage::fake()` before upload tests**: Without it, files go to the real filesystem. Tests accumulate real files, CI disks fill up, and tests are slower.
- **Test each validation rule with an invalid file**: Valid file type → passes. Wrong MIME type → fails. Wrong extension → fails. Too large → fails. Too small → fails. Each rule needs a dedicated invalid test case.
- **Test file storage and existence**: Sending a file and getting 200 doesn't mean it was stored. Assert `Storage::disk('s3')->assertExists($path)` to verify storage.
- **Test image dimensions separately**: If images must be 300x300, test with the correct size and with incorrect sizes. Use `UploadedFile::fake()->image('photo.jpg', 200, 300)` for wrong dimensions.
- **Test full upload-download lifecycle**: Upload a file, verify storage, then test download. `$this->get('/download/1')->assertDownload('original-name.jpg')` verifies the complete flow.

# Architecture Guidelines

- **`Storage::fake('s3')` vs Real S3**: Use fake for speed and determinism. Real S3 in separate integration tests.
- **`UploadedFile::fake()->image()` vs `create()`**: Use `image()` for dimension validation. `create()` for non-image files.
- **Local vs cloud storage**: Both use same `FilesystemAdapter` interface. Switch disk name for coverage.
- **Security-first approach**: File upload is the most common web vulnerability vector. Test security boundaries thoroughly.

# Performance Considerations

- Fake file creation: <1ms per file. No disk I/O.
- Image dimension detection: Reads fake image header. Negligible.
- Multiple file uploads: 10 files add ~2ms total.
- Storage fakes are in-memory: Large files (>10MB) increase memory pressure.

# Security Considerations

- File upload is a critical security boundary. Always validate server-side MIME type (not just extension).
- Test that renamed executables (image.php.jpg) are rejected.
- Test that extremely large files are rejected.
- Test that path traversal filenames (../../../etc/passwd) are sanitized.
- Test that files cannot overwrite existing system files.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only testing with valid files | Happy path is easier | Invalid file types pass through; security vulnerability | Test each validation rule with an invalid file |
| Forgetting Storage::fake() | Tests run against real disk | Real files accumulate; CI disk fills up; tests slower | Always call Storage::fake() before upload tests |
| Testing file uploads via unit tests | Testing UploadedFile in isolation | Misses request parsing, middleware, validation integration | Use feature tests (HTTP) for file upload testing |
| Not testing file type validation | Assuming extension check is enough | .exe renamed to .pdf passes validation | Validate server-side MIME type, not just extension |
| Not cleaning up fake temp files | Thousands of tests creating temp files | Temp directory exhaustion | Use RefreshDatabase or clean up in tearDown() |

# Anti-Patterns

- **Uploading to real cloud storage in tests**: Actually uploading to S3/R2 in test suite. Instead, use `Storage::fake()` for all tests and test cloud integration separately.
- **No invalid file tests**: Only testing the happy path for file uploads. Instead, test each validation rule with an invalid file.
- **Testing file content via fake files**: Fake files don't have real content. Validate content in separate processing tests.
- **Ignoring MIME type validation**: Only checking file extension. Renamed executables bypass extension-only validation.

# Examples

```php
// Valid file upload with storage verification
public function test_user_can_upload_avatar()
{
    Storage::fake('s3');

    $this->actingAs(User::factory()->create())
        ->post('/api/avatar', [
            'avatar' => UploadedFile::fake()->image('avatar.jpg', 300, 300),
        ])->assertOk();

    Storage::disk('s3')->assertExists('avatars/avatar.jpg');
}

// Invalid file rejection
public function test_non_image_files_are_rejected()
{
    Storage::fake('s3');

    $this->actingAs(User::factory()->create())
        ->post('/api/avatar', [
            'avatar' => UploadedFile::fake()->create('document.pdf', 100),
        ])->assertStatus(422)
        ->assertJsonValidationErrors('avatar');
}

// File download verification
public function test_user_can_download_uploaded_file()
{
    Storage::fake('local');
    $file = UploadedFile::fake()->create('report.pdf', 100);
    $path = Storage::putFile('reports', $file);

    $this->get('/download/report.pdf')
        ->assertDownload('report.pdf');
}
```

# Related Topics

- **Prerequisites**: HTTP test helpers, Storage facade, Validation rules
- **Related**: Storage fake testing, Validation testing, Security testing
- **Advanced**: Direct cloud storage upload testing, Chunked upload testing, Virus scanning integration

# AI Agent Notes

- When testing file uploads, always use `Storage::fake()` and `UploadedFile::fake()`. Real filesystem tests are slower, accumulate files, and may have CI permission issues.
- Test file type validation with both extension and MIME type. A file named `evil.php.jpg` should be tested against both validation rules.
- For image dimension validation, use `UploadedFile::fake()->image()` with explicit width and height.
- Remember to test the full lifecycle: upload → store → read → download → delete.

# Verification

- [ ] Storage::fake() is used in all upload tests
- [ ] UploadedFile::fake() creates test files (no real filesystem I/O)
- [ ] Each validation rule is tested with an invalid file
- [ ] Server-side MIME type validation is tested
- [ ] File existence is asserted after upload
- [ ] File download is tested for stored files
- [ ] Image dimension validation is tested where applicable
- [ ] Security boundaries (path traversal, renamed executables) are tested
