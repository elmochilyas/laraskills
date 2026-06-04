# Skill: Implement Secure File Uploads with Preview

## Purpose

Handle file uploads in Livewire with immediate async upload, server-side validation, image preview via `temporaryUrl()`, safe storage with `hashName()`, and temporary file cleanup.

## When To Use

- Profile picture uploads with preview
- Document/file attachments in forms
- Image galleries and media libraries

## When NOT To Use

- Simple file upload forms where standard HTML forms suffice
- Very large files (>100MB) — consider direct-to-S3 uploads
- Files that don't need server-side processing before storage

## Prerequisites

- Livewire component (v3 — no `WithFileUploads` trait needed)
- Storage disk configured (usually `public`)
- Max upload size configured in `config/livewire.php`

## Inputs

- File input field definition
- Validation rules for file type, size, and dimensions
- Storage path and disk

## Workflow

1. Declare the file property in the component:
   ```php
   public $avatar; // TemporaryUploadedFile instance after selection
   ```
2. In the Blade template, add the file input with `wire:model`:
   ```blade
   <input type="file" wire:model="avatar">
   ```
3. Show image preview after selection using `temporaryUrl()`:
   ```blade
   @if ($avatar)
       <img src="{{ $avatar->temporaryUrl() }}" class="preview">
   @endif
   ```
4. Add loading state for the upload:
   ```blade
   <div wire:loading wire:target="avatar">Uploading...</div>
   ```
5. In the save action, validate file type and size before storing:
   ```php
   $this->validate(['avatar' => 'image|mimes:jpeg,png|max:2048|dimensions:min_width=100']);
   ```
6. Store using `$file->hashName()` (default) for safe filenames:
   ```php
   $path = $this->avatar->store('avatars', 'public');
   ```
7. Configure max upload size in `config/livewire.php`:
   ```php
   'temporary_file_upload' => ['max_upload_size' => 50 * 1024 * 1024],
   ```
8. Clean up discarded files in `updated` hook if user changes selection

## Validation Checklist

- [ ] File type and size validation before storing
- [ ] `$file->hashName()` used for safe filenames (default `store()` behavior)
- [ ] Image preview shown via `temporaryUrl()` after selection
- [ ] Max upload size configured in `config/livewire.php`
- [ ] File validation rules appropriate for use case
- [ ] Temporary file cleanup on discard (optional but recommended for high-traffic pages)
- [ ] Loading states shown during upload

## Common Failures

- Not validating file before store — arbitrary file types accepted
- Using client filename (`getClientOriginalName()`) — path traversal risk
- No image preview — user cannot confirm the selected file
- No max file size config — default 12MB may be too small or unlimited may exhaust disk
- Not cleaning up discarded files — orphaned files consume disk space until 24h cleanup

## Decision Points

- Use `$file->store('path', 'disk')` (defaults to hashName). Only use `storeAs` when you must preserve the original filename — store the mapping in DB
- For non-image files (PDFs, documents), show filename and size instead of a thumbnail preview

## Performance Considerations

Files are uploaded immediately on selection, not on form submit. This spreads upload time across the form-filling experience. The `livewire-tmp/` directory should have sufficient disk space. Large files should use chunked upload (Livewire v3 supports this via configuration).

## Security Considerations

Livewire validates file uploads server-side. `temporaryUrl()` uses signed URLs that expire. Validate MIME type server-side (not just client extension). Never trust client-provided filename — use `hashName()`. Set reasonable file size limits.

## Related Rules

- Always Validate Before Storing (05-rules.md)
- Use hashName for Safe Filenames (05-rules.md)
- Show Image Preview via temporaryUrl (05-rules.md)
- Configure Max Upload Size (05-rules.md)
- Clean Up Discarded Temporary Files (05-rules.md)

## Related Skills

- Implement Efficient Data Binding with Correct Modifiers (livewire/data-binding)
- Implement Real-Time Server-Side Validation (livewire/validation)
- Implement User-Friendly Loading States (livewire/loading-states)

## Success Criteria

- File uploads work immediately on selection (async, not on form submit)
- Validation correctly rejects invalid file types, sizes, and dimensions
- Image preview displays before form submission
- Files stored with safe, hashed filenames — no path traversal risk
- Max upload size configured and enforced
- Temporary files cleaned up proactively when discarded
