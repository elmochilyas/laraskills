# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Mocking, Fakes & Test Doubles
Knowledge Unit: Storage Fake Testing
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Storage fake testing replaces filesystem operations (local disk, S3, R2, FTP) with in-memory storage, enabling fast, deterministic assertions about file creation, existence, reading, deletion, and visibility without real disk I/O or cloud costs. `Storage::fake('s3')` is the standard approach for testing file upload, file processing, file deletion, and file URL generation. Storage fakes prevent test pollution from leftover files and eliminate dependency on cloud storage services.

# Core Concepts
- **`Storage::fake($disk)`**: Replaces a storage disk with an in-memory implementation. All operations on `$disk` use memory instead of the real filesystem.
- **`assertExists($path)`**: Asserts a file exists on the faked disk.
- **`assertMissing($path)`**: Asserts a file does not exist.
- **`assertDirectoryEmpty($path)`**: Asserts a directory contains no files.
- **File operations**: `put()`, `get()`, `delete()`, `exists()`, `copy()`, `move()`, `makeDirectory()`, `deleteDirectory()` all work on the fake.
- **Visibility**: `getVisibility()`, `setVisibility()` work on supported drivers.
- **URL generation**: `url()`, `temporaryUrl()` for public and temporary URLs (may behave differently on real vs fake).
- **Multi-disk faking**: `Storage::fake(['s3', 'local'])` fakes multiple disks simultaneously.

# Mental Models
- **Storage fake as in-memory file cabinet**: Files are stored in a PHP array. No disk I/O. No cloud API calls.
- **Disk name matching**: The disk name in `Storage::fake('s3')` must match the disk name used in your code. `config('filesystems.disks.s3')` is the target.
- **Fake vs real behavior**: Basic file operations work identically. Edge cases (permissions, disk full, connection drops) are NOT simulated.
- **File lifecycle**: The fake starts empty. Files are created during the test. At test end, the fake is discarded. No cleanup needed.

# Internal Mechanics
- **`StorageFake::__construct()`**: Creates a `FilesystemAdapter` backed by a temporary directory (real filesystem but isolated). Not truly "in-memory"—uses a temp dir cleaned on fake destruction.
- **File storage**: Files are stored in the temp directory with their full path. `put('path/file.txt', 'content')` creates `{tempDir}/path/file.txt`.
- **`assertExists($path)`**: Checks `$this->exists($path)`. The fake checks if the temp file exists.
- **`assertMissing($path)`**: Checks `!$this->exists($path)`.
- **Visibility support**: Linux temp directories support POSIX permissions. Windows temp uses ACL. Visibility assertions may behave differently on different OS.
- **URL generation**: `url()` returns a path like `/storage/file.txt`. The fake does NOT generate S3 URLs—it follows the local disk URL convention regardless of the faked disk name.

# Patterns
- **Pattern: File upload to cloud disk**
  - Purpose: Test that uploaded files are stored on the expected cloud disk
  - Benefits: No real cloud costs; fast assertions
  - Tradeoffs: URL generation differs from real cloud disk
  - Implementation: `Storage::fake('s3'); $this->post('/avatar', ['file' => $file]); Storage::disk('s3')->assertExists('avatars/'.$file->hashName())`

- **Pattern: File deletion verification**
  - Purpose: Test that files are deleted after processing
  - Benefits: Prevents storage bloat
  - Tradeoffs: Assertion only works if application uses Storage facade
  - Implementation: `$this->delete('/files/1'); Storage::disk('s3')->assertMissing('files/sample.pdf')`

- **Pattern: File content verification**
  - Purpose: Verify the content of stored files
  - Benefits: Catches file content/encoding issues
  - Tradeoffs: Binary file comparison is exact; compression may cause mismatch
  - Implementation: `Storage::disk('s3')->assertExists('export.csv'); $this->assertEquals('header1,header2', Storage::disk('s3')->get('export.csv'))`

- **Pattern: Multi-disk file operations**
  - Purpose: Test file movement between disks (local ? S3)
  - Benefits: End-to-end file lifecycle testing
  - Tradeoffs: Must fake both source and destination disks
  - Implementation: `Storage::fake(['local', 's3']); Storage::disk('local')->put('tmp/file.pdf', $content); Storage::disk('s3')->writeStream('files/file.pdf', Storage::disk('local')->readStream('tmp/file.pdf'))`

# Architectural Decisions
- **`Storage::fake('s3')` vs real S3 in tests**: Use fake for unit/feature tests (fast, free). Use real S3 in integration tests (rare, for cloud-specific behavior).
- **Disk name matching**: Storage disk names are case-sensitive. `Storage::fake('s3')` ? `Storage::disk('S3')`. Use exact config key.
- **URL assertions**: `Storage::url()` on fake returns local-style URLs. For cloud URL assertions, test URL generation logic separately.
- **Temporary URL assertions**: `temporaryUrl()` returns null on faked disks. Test temporary URL generation as a separate concern.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Fast in-memory operations | Not truly in-memory (uses temp dir) | Temp dir is cleaned; no lasting impact |
| No cloud storage costs | URL generation differs from real cloud | Test URL generation separately |
| All file operations supported | Edge cases (permissions, disk full) not simulated | Acceptable for unit/feature tests |
| Multi-disk faking is supported | Must remember to fake all disks used | `Storage::fake(['s3', 'local', 'r2'])` for comprehensive faking |

# Performance Considerations
- Fake initialization: <1ms per disk.
- File `put()`: <0.5ms per small file (<1MB).
- File `get()`: <0.3ms per small file.
- `assertExists()`: <0.1ms (stat on temp file).
- Large files: 10MB file takes ~5ms to write/read. Still much faster than cloud S3 (~50-200ms per operation).
- Multiple files: Creating 100 files adds ~50ms. Acceptable.

# Production Considerations
- **Cloud-specific features**: S3 features like versioning, lifecycle policies, cross-region replication are not supported by fakes. Test these separately.
- **File URL generation**: If your application relies on `Storage::url()` returning cloud CDN URLs, don't use fakes for URL assertions.
- **File visibility**: Fakes use OS-level permissions. Behavior differs on Linux (POSIX) vs Windows (ACL). Test visibility on your production OS.
- **Temporary URLs**: `Storage::temporaryUrl()` returns `null` on faked disks. Test S3 signed URL generation separately.

# Common Mistakes
- **Mistake: Disk name mismatch**
  - Why: `Storage::fake('s3')` but code uses `Storage::disk('public')`
  - Why harmful: Fake is not applied; files go to real disk
  - Better: Match the exact disk name used in the code

- **Mistake: Not faking all disks used**
  - Why: Only faking the primary disk
  - Why harmful: Secondary operations (uploads to another disk) hit real filesystem
  - Better: `Storage::fake(['s3', 'local', 'backups'])` for comprehensive coverage

- **Mistake: Asserting on Storage facade after faking a different disk**
  - Why: `Storage::fake('s3'); Storage::put('file.txt', 'x');` (uses default disk, not 's3')
  - Why harmful: Default disk is not faked; file goes to real default disk
  - Better: Always specify disk: `Storage::disk('s3')->put(...)`

- **Mistake: Expecting Storage::url() to return S3 URLs on fake**
  - Why: Code returns `Storage::disk('s3')->url($path)`
  - Why harmful: Fake returns local URL; test may pass incorrectly
  - Better: Test URL generation as a separate concern with a real disk configuration

# Failure Modes
- **Disk not found**: `Storage::fake('nonexistent')` with a disk not defined in `config/filesystems.php`. Throws `InvalidArgumentException`.
- **Visibility differences on Windows**: `chmod()` behavior differs. Visibility assertions may fail on Windows CI. Use Linux for CI.
- **URL generation on non-local disks**: `Storage::disk('s3')->url()` returns `/storage/...` on fake. Real S3 returns `https://bucket.s3.amazonaws.com/...`
- **Large file memory limits**: Very large files (100MB+) with fakes may hit memory limits. Use streaming or real disk for very large files.
- **Temporary URL limitations**: `temporaryUrl()` throws `RuntimeException` on faked disks. Check without temp URL or use conditional test code.

# Ecosystem Usage
- **Laravel core**: `Storage::fake()` is used extensively in Laravel's own filesystem tests.
- **Laravel Media Library (Spatie)**: Media library file operations are tested with `Storage::fake()` for conversions, responsive images, and file cleanup.
- **Laravel LiveWire**: File upload testing uses `Storage::fake()` for temporary file storage verification.
- **Laravel Nova**: File upload fields, image cropping, and file downloads are tested via `Storage::fake()`.
- **Laravel Vapor**: Vapor's S3 integration tests use `Storage::fake()` for basic operations; real S3 for cloud-specific tests.

# Related Knowledge Units
- **Prerequisites**: Laravel fakes, Filesystem configuration, File upload testing
- **Related Topics**: Laravel fakes, File upload testing, HTTP Client faking
- **Advanced Follow-up**: Custom filesystem drivers, Cloud storage integration testing, CDN URL generation testing

# Research Notes
- Laravel's fakes (Bus, Event, Mail, Notification, Queue, Storage) provide in-memory implementations that capture dispatched jobs/events/mails for assertion without side effects
- The Http facade faking intercepts outgoing HTTP requests and returns predefined responses — critical for testing external API integrations without network calls
- Time manipulation via Carbon::setTestNow() and Pest's 	ravel() helper enables testing time-sensitive features (rate limits, subscription expirations, scheduled tasks)
- Mockery is the underlying mocking framework integrated with Laravel; $this->mock() and $this->partialMock() are the primary test helpers
- Storage fake testing confirms files are written with correct content, naming, and disk location — use Storage::fake('s3') to test S3 uploads without cloud costs
