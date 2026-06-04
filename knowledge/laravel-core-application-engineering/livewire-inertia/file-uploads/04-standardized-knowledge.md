# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire File Uploads |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Livewire handles file uploads through `wire:model` on file input elements. Files are uploaded asynchronously (streamed to the server), stored in a temporary directory, and presented as `TemporaryUploadedFile` instances in the component. The component can then process (validate, persist) the uploaded file. Progress tracking is provided via `wire:loading` on upload events. The engineering value is AJAX file upload without JavaScript.

---

## Core Concepts

- **`TemporaryUploadedFile`**: Instance created after file upload — extends Symfony's `UploadedFile`
- **Async upload**: File uploaded immediately on selection to `livewire-tmp/` directory
- **Preview**: `$file->temporaryUrl()` provides signed URL for image preview before form submission
- **Multiple files**: Array property with `wire:model="photos" multiple` for batch uploads
- **Validation**: Validate in `save()` action: `$this->validate(['avatar' => 'image|max:1024'])`

---

## When To Use

- Profile picture uploads with preview
- Document/file attachments in forms
- Image galleries and media libraries
- Any file upload that needs server-side processing

## When NOT To Use

- Simple file upload forms where standard HTML forms suffice
- Very large files (>100MB) — consider direct-to-S3 uploads
- Files that don't need server-side processing before storage

---

## Best Practices

- **Always validate file type and size** — use `image|max:1024` or similar rules before storing
- **Use `$file->store()` to move from temp to permanent** — `$file->store('avatars', 'public')`
- **Use `$file->hashName()` for safe filenames** — prevents path traversal and name collisions
- **Display previews with `$file->temporaryUrl()`** — user sees image before submitting the form
- **Clean up temporary files** — Livewire auto-cleans after 24 hours, but call `$file->delete()` if discarding
- **Set max upload size** — configure `livewire.temporary_file_upload.max_upload_size` in config

---

## Architecture Guidelines

- `WithFileUploads` trait required in Livewire v2; Livewire v3 handles uploads natively
- Upload endpoint: `/livewire/upload-file` (configurable)
- Temporary directory: `livewire-tmp/` (configurable via config)
- `TemporaryUploadedFile` provides: `temporaryUrl()`, `store()`, `getFilename()`, `getSize()`, `getMimeType()`
- Multiple files: use array property `<input type="file" wire:model="photos" multiple>`
- File validation uses standard Laravel validation rules: `file`, `image`, `mimes`, `max`, `dimensions`

---

## Performance

Files are uploaded immediately on selection, not on form submit. This means upload time is spread across the form-filling experience rather than concentrated at submission. The `livewire-tmp/` directory should have sufficient disk space. Large files should use chunked upload (Livewire v3 supports this via configuration).

---

## Security

Livewire validates file uploads server-side. The `temporaryUrl()` uses signed URLs that expire. Uploaded files are stored outside the web root. Validate MIME type server-side (not just client extension). Never trust the client-provided filename — use `hashName()`. Set reasonable file size limits.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not validating file before store | Trusting upload property | Invalid files stored | Always validate before store() |
| Using original filename | Convenience | Path traversal risk | Use `$file->hashName()` |
| No temporary URL for image preview | Skipping preview UX | User can't see uploaded image | Show `$file->temporaryUrl()` |
| Missing WithFileUploads trait (v2) | Upgrade confusion | File uploads don't work | Add trait or upgrade to v3 |
| No max file size config | Default too small/large | Upload fails or server fills up | Configure `max_upload_size` |

---

## Anti-Patterns

- **Storing directly from temp without validation**: `$file->store()` without checking rules
- **Using client filename**: `$file->getClientOriginalName()` without sanitization
- **No file type validation**: Allowing any file type to be uploaded
- **Blocking upload on form submit**: File should upload immediately, not with form data

---

## Examples

**Basic file upload:**
```php
class UploadAvatar extends Component
{
    public $avatar;

    public function save(): void
    {
        $this->validate(['avatar' => 'image|max:1024']);
        auth()->user()->update(['avatar' => $this->avatar->store('avatars', 'public')]);
    }
}
```

**Blade template with preview:**
```blade
<input type="file" wire:model="avatar">

@if ($avatar)
    <img src="{{ $avatar->temporaryUrl() }}">
@endif

<button wire:click="save">Upload</button>
```

**Multiple file upload:**
```php
public array $photos = [];

public function save(): void
{
    $this->validate(['photos.*' => 'image|max:2048']);
    foreach ($this->photos as $photo) {
        $photo->store('photos', 'public');
    }
}
```

**Loading state during upload:**
```blade
<div wire:loading wire:target="avatar">Uploading...</div>
```

---

## Related Topics

- livewire/data-binding — wire:model on file inputs
- livewire/loading-states — Upload progress indicators
- livewire/component-architecture — Component structure
- livewire/testing — Testing file uploads

---

## AI Agent Notes

- `TemporaryUploadedFile` extends Symfony's `UploadedFile` — provides all standard file methods
- Files are uploaded immediately on selection to `livewire-tmp/` directory
- `temporaryUrl()` provides signed, expiring URL for image preview
- Livewire auto-cleans temporary files after 24 hours
- Livewire v3 does not require `WithFileUploads` trait — uploads work natively
- Chunked uploads supported in Livewire v3 for large files

---

## Verification

- [ ] File type and size validation before storing
- [ ] `$file->hashName()` used for safe filenames
- [ ] Image preview shown via `temporaryUrl()`
- [ ] Max upload size configured
- [ ] File validation rules appropriate for use case
- [ ] Temporary file cleanup configured
- [ ] Loading states shown during upload
- [ ] Tests cover upload validation and storage
