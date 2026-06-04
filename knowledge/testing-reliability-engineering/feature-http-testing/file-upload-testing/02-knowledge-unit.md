# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Feature & HTTP Testing
Knowledge Unit: File Upload Testing
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
File upload testing validates that uploaded files are correctly received, validated, stored, and processed. Laravel provides `UploadedFile::fake()` to create test files without actual disk I/O and `Storage::fake()` to intercept file storage operations. File upload testing is critical for security (malicious file uploads are a common attack vector) and data integrity. The combination of fake files and fake storage enables fast, deterministic upload tests without real filesystem dependencies.

# Core Concepts
- **`UploadedFile::fake()`**: Creates an `UploadedFile` instance with a fake temporary file. Methods: `fake($name)`, `image($name, $width, $height)`, `create($name, $size)`.
- **`Storage::fake($disk)`**: Replaces a storage disk with an in-memory fake. All filesystem operations use an in-memory array.
- **File validation testing**: Use fake files with various sizes, MIME types, and extensions to test validation rules.
- **Image dimensions**: `UploadedFile::image()` creates fake image files with specified dimensions.
- **File existence assertions**: `Storage::disk('s3')->assertExists('file.pdf')`, `assertMissing('file.pdf')`.
- **Multiple file uploads**: Send arrays of fake files for batch upload testing.
- **File download testing**: `$this->get('/download/1')->assertDownload('file.pdf')`.

# Mental Models
- **Fake file as lightweight stand-in**: Has real path, size, and MIME detection capabilities, but no real filesystem storage.
- **Fake storage as in-memory array**: `Storage::fake('s3')` stores files in a PHP array. No S3 API calls.
- **Upload validation as security boundary**: Test file type, size, name, content, dimensions. Most common web vulnerability vector.
- **Storage disk abstraction**: Controller doesn't care about local vs S3 vs fake. Filesystem abstraction enables consistent testing.

# Internal Mechanics
- **`UploadedFile::fake()`**: Creates temporary file via `sys_get_temp_dir()`. Image fakes write valid minimal image binary headers for MIME detection.
- **`Storage::fake()`**: Creates `FilesystemAdapter` backed by temporary directory. Cleaned on adapter destruction.
- **MIME detection**: Uses Symfony MIME type guesser on the fake file content.
- **Request integration**: `UploadedFile` instances are auto-converted to Symfony objects in the request.
- **`assertDownload()`**: Checks response headers for `Content-Disposition: attachment` and optional filename.

# Patterns
- **Pattern: Valid file upload + storage verification**
  - Purpose: Test that valid files are accepted and stored correctly
  - Benefits: Covers the happy path completely
  - Tradeoffs: Only tests valid scenarios
  - Implementation: `Storage::fake('s3'); $this->post('/uploads', ['file' => UploadedFile::fake()->image('photo.jpg')])->assertOk(); Storage::disk('s3')->assertExists('photos/photo.jpg')`

- **Pattern: Invalid file rejection**
  - Purpose: Test invalid files rejected with appropriate errors
  - Benefits: Security boundary coverage
  - Tradeoffs: Many invalid types to test
  - Implementation: Test wrong extension, wrong MIME, too large, too small, empty, malicious name

- **Pattern: Image dimension validation**
  - Purpose: Test dimension validation rules
  - Benefits: Ensures image processing assumptions
  - Tradeoffs: Only dimension, not content
  - Implementation: `UploadedFile::fake()->image('photo.jpg', 2000, 100)` for too-wide image

- **Pattern: File download verification**
  - Purpose: Test full upload-storage-download lifecycle
  - Benefits: End-to-end file handling coverage
  - Tradeoffs: Assumes file was stored correctly
  - Implementation: Upload file, get stored path, `$this->get('/download/'.$id)->assertDownload('original-name.jpg')`

# Architectural Decisions
- **`Storage::fake('s3')` vs Real S3**: Use fake for speed and determinism. Real S3 in separate integration tests.
- **`UploadedFile::fake()->image()` vs `create()`**: Use `image()` for dimension validation. `create()` for non-image files.
- **Local vs cloud storage testing**: Both use same FilesystemAdapter interface. Switch disk name for coverage.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fake files are fast and deterministic | May miss real filesystem edge cases (permissions, disk full) | Layer real filesystem tests for critical paths |
| Storage fakes prevent accidental cloud costs | Fake behavior may differ from S3/R2 in edge cases | Document known fake/real differences |
| Image dimension validation is precise | Only tests metadata, not visual correctness | Add visual regression for UI-critical images |
| Download assertions are simple | Don't verify file content integrity | Supplement with checksum assertions for critical files |

# Performance Considerations
- Fake file creation: <1ms per file. No disk I/O for storage operations.
- Image dimension detection: Reads fake image header. Negligible.
- Multiple file uploads: 10 files add ~2ms total. No meaningful overhead.
- Storage fakes are in-memory: Large files (>10MB) increase memory pressure. Trim in test setup.

# Production Considerations
- **Security: File type validation**: Always validate server-side MIME type, not just extension. Test that renamed executables are rejected.
- **File size limits**: Set `upload_max_filesize` and `post_max_size` in PHP config. Test with files at the boundary.
- **Virus scanning**: Production file uploads should pass through virus scanning. Not testable via fakes; test integration separately.
- **File cleanup**: Test that temporary and failed upload files are cleaned up. Storage fakes make this testable.
- **CDN/cloud storage**: Test that files are publicly accessible after upload (if intended). Storage fakes don't test URL generation.

# Common Mistakes
- **Mistake: Only testing with valid files**
  - Why: Happy path is easier
  - Why harmful: Invalid file types pass through; security vulnerability
  - Better: Test each validation rule with an invalid file

- **Mistake: Forgetting Storage::fake()**
  - Why: Tests run against real disk
  - Why harmful: Real files accumulate; CI disk fills up; tests are slower
  - Better: Always call `Storage::fake()` before upload tests

- **Mistake: Testing file uploads via unit tests**
  - Why: Testing UploadedFile logic in isolation
  - Why harmful: Misses request parsing, middleware, and validation integration
  - Better: Use feature tests (HTTP) for file upload testing

# Failure Modes
- **Temporary file exhaustion**: `UploadedFile::fake()` creates temp files. Thousands of tests can exhaust temp directory. Use `RefreshDatabase` or clean up in `tearDown()`.
- **MIME type misdetection**: Symfony MIME guesser may detect fake image type differently than browser would. Test both fake and real file scenarios.
- **Storage fake assertion race conditions**: Parallel tests writing to same fake disk cause false assertions. Use per-test unique paths.
- **File upload size limit in PHP**: `post_max_size` in `php.ini` may be lower than application limit. Tests with large files fail unexpectedly.

# Ecosystem Usage
- **Laravel core**: All upload-related Laravel features (avatars, file manager, attachments) use `UploadedFile::fake()` in their test suites.
- **Laravel Media Library (Spatie)**: Test file uploads to media library using `Storage::fake()` and `UploadedFile::fake()->image()`.
- **Laravel LiveWire**: File uploads in LiveWire components use `UploadedFile::fake()` with `Storage::fake()`.
- **Laravel Nova**: Resource file uploads tested with fake files and storage.

# Related Knowledge Units
- **Prerequisites**: HTTP test helpers, Storage facade, Validation rules
- **Related Topics**: Storage fake testing, Validation testing, Security testing
- **Advanced Follow-up**: Direct cloud storage upload testing, Chunked upload testing, Virus scanning integration

# Research Notes
- Laravel's HTTP test helpers (get(), post(), put(), delete()) provide a full-stack testing experience without starting a web server — requests flow through the kernel internally
- Response assertions (ssertStatus(), ssertJson(), ssertSee()) are chainable and provide clear failure messages for debugging test failures
- Pest's higher-order expectations (expect()->toBeOk()) provide a more expressive syntax than PHPUnit's $response->assertOk()
- Test datasets (#[DataProvider]) reduce boilerplate when testing multiple input variations for validation and API endpoint testing
- Exception handling testing requires intercepting Laravel's exception handler to assert specific exceptions are thrown with expected messages
