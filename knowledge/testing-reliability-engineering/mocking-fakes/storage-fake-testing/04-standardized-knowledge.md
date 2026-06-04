# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Mocking, Fakes & Test Doubles |
| Knowledge Unit | Storage Fake Testing |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Laravel fakes, Filesystem configuration, File upload testing |
| Related KUs | Laravel fakes, File upload testing, HTTP Client faking |
| Source | domain-analysis.md K035 |

# Overview

Storage fake testing replaces filesystem operations (local disk, S3, R2, FTP) with in-memory storage, enabling fast, deterministic assertions about file creation, existence, reading, deletion, and visibility without real disk I/O or cloud costs. `Storage::fake('s3')` is the standard approach for testing file upload, file processing, file deletion, and file URL generation. Storage fakes prevent test pollution from leftover files and eliminate dependency on cloud storage services.

# Core Concepts

- **`Storage::fake($disk)`**: Replaces a storage disk with an in-memory implementation.
- **`assertExists($path)`**: Asserts a file exists on the faked disk.
- **`assertMissing($path)`**: Asserts a file does not exist.
- **`assertDirectoryEmpty($path)`**: Asserts a directory contains no files.
- **File operations**: `put()`, `get()`, `delete()`, `exists()`, `copy()`, `move()`, `makeDirectory()`, `deleteDirectory()`.
- **Visibility**: `getVisibility()`, `setVisibility()` on supported drivers.
- **URL generation**: `url()`, `temporaryUrl()` for public and temporary URLs.
- **Multi-disk faking**: `Storage::fake(['s3', 'local'])` fakes multiple disks simultaneously.

# When To Use

- For every file upload endpoint (verify files are stored correctly)
- For file processing workflows (import, export, image manipulation)
- For file deletion operations (verify cleanup)
- For testing storage visibility settings (public vs private files)
- For testing file URL generation

# When NOT To Use

- For testing cloud-specific features (versioning, lifecycle policies, replication)
- For testing real S3 signed URLs (`Storage::temporaryUrl()` returns null on fakes)
- For testing very large files (>100MB) that may hit memory limits
- For testing filesystem permissions that differ by OS (Linux vs Windows)

# Best Practices (WHY)

- **Always match the disk name exactly**: `Storage::fake('s3')` must match `Storage::disk('s3')` in your code. Disk names are case-sensitive. Mismatch = fake not applied.
- **Fake all disks used in the operation**: If code writes to `s3` and `local`, use `Storage::fake(['s3', 'local'])`. Unfaked disks go to the real filesystem.
- **Always specify the disk in assertions**: `Storage::fake('s3')` followed by `Storage::assertExists('file.txt')` asserts on the default disk (not 's3'). Use `Storage::disk('s3')->assertExists('file.txt')`.
- **Don't assert on URL format**: `Storage::url()` on faked disks returns local-style URLs, not cloud URLs. Test URL generation as a separate concern.
- **Verify file content**: `assertExists()` only checks existence. Use `Storage::disk('s3')->get('file.txt')` and assert content to verify data integrity.

# Architecture Guidelines

- **`Storage::fake('s3')` vs real S3**: Use fake for unit/feature tests. Use real S3 in dedicated integration tests for cloud-specific behavior.
- **Disk name matching**: Use exact config key from `config/filesystems.php`. Case-sensitive.
- **URL assertions**: `Storage::url()` on fake returns local URLs. Test cloud URL generation separately.
- **Temporary URLs**: `temporaryUrl()` returns null on faked disks.

# Performance Considerations

- Fake initialization: <1ms per disk.
- File `put()`: <0.5ms per small file (<1MB).
- File `get()`: <0.3ms per small file.
- `assertExists()`: <0.1ms.
- Large files (10MB): ~5ms. Much faster than real S3 (~50-200ms).
- Multiple files: 100 files adds ~50ms.

# Security Considerations

- Storage fakes prevent accidental file storage in real cloud storage during tests. Critical for avoiding cloud costs and data leaks.
- Ensure test files don't contain real sensitive data.
- Test that private files are not publicly accessible (vérify visibility settings).

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Disk name mismatch | `Storage::fake('s3')` but code uses `Storage::disk('public')` | Fake not applied; files go to real disk | Match exact disk name from code |
| Not faking all disks used | Only faking the primary disk | Secondary operations hit real filesystem | `Storage::fake(['s3', 'local', 'backups'])` |
| Asserting on Storage facade after faking different disk | `Storage::fake('s3'); Storage::put(...)` uses default disk | Default disk not faked; file goes to real default disk | Always specify disk: `Storage::disk('s3')->put(...)` |
| Expecting cloud URLs on fake | Code checks URL format | Fake returns local URL; test may pass incorrectly | Test URL generation as separate concern |
| Not verifying file content | `assertExists()` only checks existence | File may have wrong content | Also assert file content: `Storage::get('file.txt')` |

# Anti-Patterns

- **Real cloud storage in tests**: Actually uploading to S3/R2 in test suite. Slow, costly, and requires network. Use `Storage::fake()`.
- **No disk specification**: Using `Storage::fake('s3')` but then asserting via `Storage::assertExists()` (uses default disk, not s3). Always use `Storage::disk('s3')`.
- **URL assertions on fake**: Asserting `Storage::url()` returns a cloud URL. It returns a local path. Test this separately.
- **Not verifying file cleanup**: Only testing file creation, not deletion. Storage bloat goes undetected.

# Examples

```php
// File upload to cloud disk
public function test_avatar_upload_stored_on_s3()
{
    Storage::fake('s3');
    $file = UploadedFile::fake()->image('avatar.jpg', 300, 300);

    $this->actingAs($user)
        ->post('/avatar', ['avatar' => $file])
        ->assertOk();

    Storage::disk('s3')->assertExists('avatars/'.$file->hashName());
}

// File content verification
public function test_export_csv_has_correct_content()
{
    Storage::fake('local');

    $this->actingAs($user)->get('/export/users');

    $content = Storage::disk('local')->get('exports/users.csv');
    $this->assertStringContainsString('email,created_at', $content);
    $this->assertStringContainsString($user->email, $content);
}

// File deletion verification
public function test_old_avatar_is_deleted_on_update()
{
    Storage::fake('s3');
    $oldFile = UploadedFile::fake()->image('old.jpg');
    $oldPath = $user->updateAvatar($oldFile);

    $newFile = UploadedFile::fake()->image('new.jpg');
    $this->actingAs($user)->put('/avatar', ['avatar' => $newFile]);

    Storage::disk('s3')->assertMissing($oldPath);
}

// Multi-disk operations
public function test_file_copied_from_local_to_s3()
{
    Storage::fake(['local', 's3']);
    Storage::disk('local')->put('tmp/report.pdf', 'content');

    $this->actingAs($user)->post('/publish-report');

    Storage::disk('s3')->assertExists('reports/report.pdf');
    Storage::disk('local')->assertMissing('tmp/report.pdf');
}
```

# Related Topics

- **Prerequisites**: Laravel fakes, Filesystem configuration, File upload testing
- **Related**: Laravel fakes, File upload testing, HTTP Client faking
- **Advanced**: Custom filesystem drivers, Cloud storage integration testing, CDN URL generation testing

# AI Agent Notes

- The most common storage fake mistake is disk name mismatch. Always triple-check that `Storage::fake('X')` matches `Storage::disk('X')` in your code.
- Use `Storage::fake(['disk1', 'disk2'])` when code interacts with multiple disks. A single unfaked disk means real filesystem I/O.
- `Storage::url()` on fakes does NOT return cloud URLs. If your code depends on cloud URL format, test that separately or write a custom fake that generates cloud-like URLs.

# Verification

- [ ] `Storage::fake()` is used for all storage operations in tests
- [ ] Disk name in `Storage::fake()` matches the disk name in code
- [ ] All disks used in the operation are faked
- [ ] Storage assertions specify the disk (`Storage::disk('s3')->assertExists()`)
- [ ] File content is verified, not just existence
- [ ] File deletion/cleanup is tested
- [ ] URL generation is tested separately from storage fakes
- [ ] Multi-disk operations fake all participating disks
