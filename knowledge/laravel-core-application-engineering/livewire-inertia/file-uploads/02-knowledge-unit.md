# Livewire File Uploads

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire File Uploads
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Livewire handles file uploads through `wire:model` on file input elements. Files are uploaded asynchronously (streamed to the server), stored in a temporary directory, and presented as `TemporaryUploadedFile` instances in the component. The component can then process (validate, persist) the uploaded file. Progress tracking is provided via `wire:loading` on upload events.

The engineering value is AJAX file upload without JavaScript. The developer defines a public property with the `WithFileUploads` trait (v2) or a simple public property (v3), and Livewire handles the multipart upload, temporary storage, and file validation.

---

## Core Concepts

### Basic Upload

```php
use Livewire\Component;
use Livewire\WithFileUploads;

class UploadAvatar extends Component
{
    use WithFileUploads;  // Not needed in v3

    public $avatar; // TemporaryUploadedFile instance after upload

    public function save(): void
    {
        $this->validate(['avatar' => 'image|max:1024']);
        $user->update(['avatar' => $this->avatar->store('avatars', 'public')]);
    }
}
```

```blade
<input type="file" wire:model="avatar">

@if ($avatar)
    <img src="{{ $avatar->temporaryUrl() }}">
@endif

<button wire:click="save">Upload</button>
```

### Multiple File Upload

```php
public array $photos = [];

public function save(): void
{
    foreach ($this->photos as $photo) {
        $photo->store('photos', 'public');
    }
}
```

```blade
<input type="file" wire:model="photos" multiple>
```

---

## Mental Models

### The Temporary Bucket

When a file is selected, Livewire immediately uploads it to a temporary directory on the server — like tossing it into a bucket. The component gets a reference (`TemporaryUploadedFile`) to the file in the bucket. When the component saves, it moves the file from the bucket to its permanent location.

### The Preview Window

`$file->temporaryUrl()` provides a temporary, signed URL to the uploaded file. This allows previewing images before the form is submitted. The URL expires after a configurable time.

---

## Internal Mechanics

### Upload Flow

1. User selects file
2. Livewire JavaScript uploads the file to a temporary endpoint (`/livewire/upload-file`)
3. File is stored in `livewire-tmp/` directory (configurable)
4. Component's property is set to a `TemporaryUploadedFile` instance
5. Component re-renders

### TemporaryUploadedFile

`TemporaryUploadedFile` extends Symfony's `UploadedFile`. It provides:
- `temporaryUrl()` — signed URL for preview (images only)
- `store(path, disk)` — move to permanent storage
- `getFilename()` — original filename
- `getSize()` — file size
- `getMimeType()` — MIME type

### Configuration

File upload settings in `config/livewire.php`:

```php
'temporary_file_upload' => [
    'disk' => 'local',         // Temporary storage disk
    'rules' => 'file|max:1024', // Default validation rules
    'directory' => 'livewire-tmp', // Temp directory
    'middleware' => 'throttle:5,1', // Rate limit uploads
],
```

---

## Patterns

### Image Preview

```blade
<input type="file" wire:model="photo">

@if ($photo)
    <img src="{{ $photo->temporaryUrl() }}" class="preview">
@endif

<button wire:click="save">Upload</button>
```

### Upload Progress

```blade
<div wire:loading wire:target="photo">Uploading...</div>

<div wire:loading wire:target="photo" class="progress">
    <div class="progress-bar" style="width: 100%;"></div>
    {{-- Livewire shows indefinite progress; for determinate, use Alpine --}}
</div>
```

### File Validation

```php
protected $rules = [
    'avatar' => 'required|image|max:1024|dimensions:min_width=100,min_height=100',
    'document' => 'required|file|mimes:pdf,doc,docx|max:5120',
];
```

### Clean Up Temporary Files

```php
public function removePhoto(): void
{
    $this->photo->delete(); // Remove temporary file
    $this->photo = null;
}
```

---

## Architectural Decisions

### WithFileUploads Trait

In Livewire v2, the `WithFileUploads` trait was required. In v3, it's optional — but imports are still recommended for backward compatibility and explicit intent.

### Temporary URL Security

`temporaryUrl()` generates a signed URL valid for a limited time. This prevents unauthorized access to uploaded files before the form is submitted.

---

## Tradeoffs

| Concern | Livewire Upload | Direct Form Upload | Dropzone/JS Upload |
|---|---|---|---|
| JavaScript | Minimal | None | Required |
| Real-time preview | Yes (temporaryUrl) | No (requires server round-trip) | Yes (FileReader) |
| Progress tracking | Indefinite only | Browser native | Determinate (XHR) |
| File validation | Server-side | Server-side | Client + Server |
| Multiple files | Single + multiple | Single per input | Drag-and-drop |

---

## Performance Considerations

File uploads are streamed to the server (not loaded into memory). The temporary file is stored on the configured disk. For large files (>10MB), configure the temporary disk to use a local filesystem (not cloud storage) for fast writes.

---

## Production Considerations

### Set File Upload Rules in Config

Configure global file upload validation in `livewire.php`:

```php
'temporary_file_upload' => [
    'rules' => 'file|max:51200', // 50MB max globally
],
```

### Clean Up Orphaned Files

Temporary files that are not moved to permanent storage become orphaned. Configure cleanup:

```php
// Scheduler
$schedule->command('livewire:clean-uploaded-files')->daily();
```

### Rate Limit Uploads

Prevent abuse:

```php
'temporary_file_upload' => [
    'middleware' => 'throttle:10,1', // 10 uploads per second
],
```

---

## Common Mistakes

### Forgetting to Validate Files

Files are uploaded before validation. If validation fails later, the file is already on the server (in temp directory). Always validate before allowing the user to upload, or clean up failed uploads.

### Using temporaryUrl() for Non-Images

`temporaryUrl()` only works for files the web server can serve (images, PDFs). It will not work for videos, archives, or other binary formats that the web server cannot render inline.

### Not Cleaning Up Temporary Files

Without `livewire:clean-uploaded-files` scheduled, old temporary files accumulate. Set up the cleanup command.

---

## Failure Modes

### Upload Exceeds Server Limits

If `upload_max_filesize` or `post_max_size` in PHP configuration is smaller than the file being uploaded, the upload fails silently. Test with expected file sizes.

### Temporary Disk Full

If the temporary disk fills up, new uploads fail. Monitor disk usage on the temporary filesystem.

---

## Ecosystem Usage

Livewire file uploads integrate with Laravel's filesystem configuration, validation rules, and storage disks. The `WithFileUploads` trait and `TemporaryUploadedFile` class are part of the Livewire core package. Cleanup commands (`livewire:clean-uploaded-files`) integrate with Laravel's scheduler.

## Related Knowledge Units

- **Data Binding** (this workspace) — wire:model for file inputs
- **Validation** (this workspace) — file validation rules
- **Loading States** (this workspace) — upload progress indicators
- **Actions and Events** (this workspace) — processing uploaded files

---

## Research Notes

- Livewire v3 removed the requirement for `WithFileUploads` trait — file uploads work with plain public properties
- `temporaryUrl()` generates a signed URL via `URL::temporarySignedRoute()`
- The upload endpoint is at `/livewire/upload-file` — it's automatically registered
- Default temporary file expiration is 24 hours (configurable)
