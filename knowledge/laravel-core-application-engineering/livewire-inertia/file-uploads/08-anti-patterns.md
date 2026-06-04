# Livewire File Uploads — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire File Uploads |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Storing Files Without Validation
2. Using Client-Provided Filenames
3. No Image Preview via temporaryUrl
4. No Max Upload Size Configuration
5. No Cleanup of Discarded Temporary Files

---

## Repository-Wide Anti-Patterns

- **Blocking upload on form submit**: File should upload immediately on selection, not with the form submission.
- **No file type validation**: Allowing any file type to be uploaded without MIME type checking.
- **No loading state during upload**: User has no feedback that the file is uploading.
- **Chunked uploads not configured for large files**: Large files fail or time out.

---

## Anti-Pattern 1: Storing Files Without Validation

### Category

Security

### Description

Calling `$file->store()` to permanently store an uploaded file without first validating its type, size, or dimensions via `$this->validate()`.

### Why It Happens

Developers may trust the file input's accept attribute (client-side), assume the file is safe because Livewire already temporarily stored it, or simply forget to add validation rules.

### Warning Signs

- `$this->avatar->store('avatars')` called without `$this->validate()` before it
- No validation rules for file type, size, or dimensions in the component
- Any file type can be uploaded (executables, scripts, archives)
- Validation only happens client-side via `<input accept="image/*">`

### Why Harmful

Without validation, users can upload arbitrary file types (executables, scripts, large archives) that consume disk space, pose security risks (code execution if served directly), or break downstream processing. Client-side file type checking is trivially bypassed.

### Consequences

- Arbitrary file upload — potential remote code execution
- Disk space exhaustion from oversized uploads
- Malware and virus distribution via file upload
- Downstream processing failures from unexpected file types

### Alternative

Always call `$this->validate()` with rules for file type (image, mimes), file size (max), and dimensions before storing the file.

### Refactoring Strategy

1. Identify all Livewire file upload components without validation before `store()`
2. Add `$this->validate(['avatar' => 'image|mimes:jpeg,png|max:2048'])` before the store call
3. Test that invalid files are rejected and valid files are accepted
4. Ensure error messages are displayed to the user

### Detection Checklist

- [ ] Every file upload action validates before storing
- [ ] Validation rules cover file type (mimes), size (max), and dimensions where applicable
- [ ] Invalid files are rejected with clear error messages
- [ ] Store is never called before validation

### Related Rules

- Always Validate Before Storing (05-rules.md)

### Related Skills

- Implement Secure File Uploads with Preview (06-skills.md)

### Related Decision Trees

- TemporaryUploadedFile Direct Store vs Move After Validation (07-decision-trees.md)

---

## Anti-Pattern 2: Using Client-Provided Filenames

### Category

Security

### Description

Using `$file->getClientOriginalName()` to construct the storage path or filename instead of `$file->hashName()` (the default `store()` behavior).

### Why It Happens

Developers may want to preserve the original filename for user familiarity. They use `storeAs()` with the client-provided name to give users a recognizable file in storage.

### Warning Signs

- `$file->storeAs('path', $file->getClientOriginalName())` patterns
- Filenames in storage match user-uploaded filenames
- Path traversal characters (`../`) in filenames
- Duplicate filenames causing collisions

### Why Harmful

Client-provided filenames may contain path traversal sequences (`../../etc/passwd`), special characters, or duplicate names. Using `hashName()` generates a unique, safe, collision-resistant filename that prevents path traversal attacks and filename conflicts.

### Consequences

- Path traversal — attacker overwrites system files by crafting `../../etc/config.php`
- Filename collision — two users upload `resume.pdf`, the second overwrites the first
- Special characters in filenames break URL generation or file system operations
- Security audit failures for storing user-controlled filenames

### Alternative

Use `$file->store('directory', 'disk')` which defaults to `hashName()`. If the original name must be preserved for download, store the mapping in the database rather than the filesystem.

### Refactoring Strategy

1. Search for `storeAs` and `getClientOriginalName` in file upload components
2. Replace with `$file->store('directory', 'disk')` for safe hashed filenames
3. If original names are needed for download, store them in a database column alongside the hashed path
4. Test that path traversal attacks do not succeed

### Detection Checklist

- [ ] No `getClientOriginalName()` used for storage paths
- [ ] No `storeAs()` with client-provided names
- [ ] All files stored via `$file->store()` (default hashName behavior)
- [ ] Original filenames are stored in database if needed for display
- [ ] Path traversal attempts are prevented

### Related Rules

- Use hashName for Safe Filenames (05-rules.md)

### Related Skills

- Implement Secure File Uploads with Preview (06-skills.md)

### Related Decision Trees

- Immediate Async Upload vs Deferred Upload on Form Submit (07-decision-trees.md)

---

## Anti-Pattern 3: No Image Preview via temporaryUrl

### Category

UX

### Description

Not displaying an image preview after the user selects a file, leaving the user unable to confirm their selection until after form submission.

### Why It Happens

Adding a preview requires adding a conditional `@if ($avatar)` block with `$avatar->temporaryUrl()`. Developers may not know about `temporaryUrl()` or may skip the preview as a non-essential feature.

### Warning Signs

- File input with `wire:model` but no preview image shown after selection
- User cannot see the selected image until the form is submitted
- No `@if ($avatar)` conditional rendering in the Blade template

### Why Harmful

Without a preview, users cannot confirm they selected the correct file until after the form is submitted and the page reloads. They may have selected the wrong file, the wrong crop, or a low-quality version. This leads to submission errors and re-uploads.

### Consequences

- Users submit the wrong file — must re-upload
- Poor UX — no confirmation that the file was selected correctly
- Increased form abandonment from uncertainty
- Support requests for incorrect file uploads

### Alternative

After a user selects an image file with `wire:model`, render a preview `<img src="{{ $file->temporaryUrl() }}">` in the Blade template. `temporaryUrl()` provides a signed, expiring URL for the uploaded content.

### Refactoring Strategy

1. Add `@if ($avatar)` conditional block after the file input in the template
2. Render `<img src="{{ $avatar->temporaryUrl() }}">` inside the block
3. Add styling for the preview (max-width, border, etc.)
4. For non-image files, show filename and size instead

### Detection Checklist

- [ ] Image file inputs show a preview after selection
- [ ] Preview uses `$file->temporaryUrl()`
- [ ] Loading state shown while preview is generating (upload in progress)
- [ ] Non-image files show filename and size as preview fallback
- [ ] Preview disappears when file is removed or selection is cleared

### Related Rules

- Show Image Preview via temporaryUrl (05-rules.md)

### Related Skills

- Implement Secure File Uploads with Preview (06-skills.md)

### Related Decision Trees

- Immediate Async Upload vs Deferred Upload on Form Submit (07-decision-trees.md)

---

## Anti-Pattern 4: No Max Upload Size Configuration

### Category

Performance

### Description

Not configuring `livewire.temporary_file_upload.max_upload_size` in the Livewire config, leaving the default (12MB) or allowing unlimited uploads.

### Why It Happens

The configuration is in a config file that may not be published (no `livewire.php` config file exists). Developers may not know about the setting or may forget to configure it.

### Warning Signs

- No `config/livewire.php` file published
- `max_upload_size` not set in the `temporary_file_upload` config section
- Users can upload multi-gigabyte files without error
- Temporary upload directory grows without bound

### Why Harmful

Without a configured limit, Livewire uses its default (12MB) or relies on PHP's settings. Users may attempt to upload multi-gigabyte files that exhaust disk space on the temporary upload directory, cause out-of-memory errors during validation, or take excessive time to upload.

### Consequences

- Disk exhaustion from oversized uploads
- Out-of-memory errors during file validation
- Denial of service via storage fill-up
- Slow upload times for users with no size feedback

### Alternative

Configure `livewire.temporary_file_upload.max_upload_size` to a value appropriate for the application's use case (e.g., 12MB for images, 50MB for videos). Ensure PHP's `upload_max_filesize` and `post_max_size` are set equally or higher.

### Refactoring Strategy

1. Publish the Livewire config: `php artisan livewire:publish --config`
2. Set `max_upload_size` in the `temporary_file_upload` array
3. Ensure PHP `upload_max_filesize` and `post_max_size` match or exceed the config value
4. Test that files exceeding the limit receive a clear error message

### Detection Checklist

- [ ] `config/livewire.php` exists with `max_upload_size` configured
- [ ] PHP `upload_max_filesize` is set equal to or higher than Livewire config
- [ ] PHP `post_max_size` is set equal to or higher than Livewire config
- [ ] Oversized files are rejected with a clear error message
- [ ] The configured limit matches the application's use case

### Related Rules

- Configure Max Upload Size (05-rules.md)

### Related Skills

- Implement Secure File Uploads with Preview (06-skills.md)

### Related Decision Trees

- Livewire File Upload vs Standard HTML Form Upload (07-decision-trees.md)

---

## Anti-Pattern 5: No Cleanup of Discarded Temporary Files

### Category

Performance

### Description

Not deleting temporary files when the user changes their file selection, discards an upload, or navigates away, allowing orphaned files to accumulate in the temp directory.

### Why It Happens

Livewire automatically cleans up temporary files after 24 hours. Developers may rely on this automatic cleanup and not proactively delete discarded files.

### Warning Signs

- `livewire-tmp/` directory grows large during peak usage
- Users report "disk full" errors on the upload server
- Multiple old files in `livewire-tmp/` from the same session
- No `updated` hook cleanup when a file property changes

### Why Harmful

Livewire cleans up temporary files after 24 hours. If a user selects and discards multiple files in a single session (e.g., trying different avatars), the temporary directory accumulates orphaned files that consume disk space until the daily cleanup. For high-traffic upload pages, this can fill the disk before the cleanup cycle runs.

### Consequences

- Disk space consumed by orphaned temporary files
- 24-hour cleanup cycle too slow for high-upload pages
- "Disk full" errors during peak usage
- Increased storage costs from accumulation

### Alternative

When a user changes their file selection or cancels an upload, call `$file->delete()` on the previous `TemporaryUploadedFile` to remove it from the temporary directory immediately.

### Refactoring Strategy

1. Add an `updated` hook for the file property that checks if the old file should be deleted
2. Call `$this->avatar->delete()` (if it exists and has a delete method) before assigning a new file
3. Verify that the temp directory does not accumulate orphaned files during testing

### Detection Checklist

- [ ] Discarded temporary files are deleted proactively
- [ ] `updated` hooks for file properties clean up old files
- [ ] `livewire-tmp/` directory does not grow unboundedly during testing
- [ ] File deletion works correctly (file is not in use)
- [ ] High-traffic upload pages have explicit cleanup

### Related Rules

- Clean Up Discarded Temporary Files (05-rules.md)

### Related Skills

- Implement Secure File Uploads with Preview (06-skills.md)

### Related Decision Trees

- Immediate Async Upload vs Deferred Upload on Form Submit (07-decision-trees.md)
