## Rule: Always Validate Before Storing

Validate file type, size, and MIME type server-side before calling $file->store().

---

## Category

Security

---

## Rule

In every file upload action, call $this->validate() with rules for file type (image, mimes:pdf,doc), file size (max:2048), and dimensions (dimensions:min_width=100) before storing the file. Never store without validation.

---

## Reason

Without validation, users can upload arbitrary file types (executables, scripts, large archives) that consume disk space, pose security risks, or break downstream processing. Client-side file type checking is trivially bypassed.

---

## Bad Example

`php
public function save(): void
{
    auth()->user()->update(['avatar' => ->avatar->store('avatars', 'public')]);
    // No validation — any file type accepted
}
`

---

## Good Example

`php
public function save(): void
{
    ->validate(['avatar' => 'image|mimes:jpeg,png|max:2048|dimensions:min_width=100']);
    auth()->user()->update(['avatar' => ->avatar->store('avatars', 'public')]);
}
`

---

## Exceptions

If the file is immediately passed to a virus scanner or conversion service that validates the content, minimal validation on the Livewire side is acceptable. The downstream service must still validate thoroughly.

---

## Consequences Of Violation

Security risks: arbitrary file upload, potential code execution. Storage risks: disk space exhaustion from large files.

---

## Rule: Use hashName for Safe Filenames

Always use $file->hashName() instead of the client-provided filename when storing uploaded files.

---

## Category

Security

---

## Rule

Call $file->store('directory', 'disk') without a custom filename to use the default hashed name, or explicitly call $file->hashName(). Never use $file->getClientOriginalName() to construct the storage path.

---

## Reason

Client-provided filenames may contain path traversal sequences (../../etc/passwd), special characters, or duplicate names. Using hashName() generates a unique, safe, collision-resistant filename that prevents path traversal attacks and filename conflicts.

---

## Bad Example

`php
->storeAs('avatars', ->getClientOriginalName(), 'public');
// Path traversal risk: '../../etc/evil.php' would overwrite files
`

---

## Good Example

`php
 = ->store('avatars', 'public');
// Stores as avatars/random_hash.jpg — safe
`

---

## Exceptions

If the application must preserve the original filename for download (e.g., a document management system), store the mapping in the database: store as hash, save original name in DB.

---

## Consequences Of Violation

Security risks: path traversal, file overwrite. Data loss: filename collisions overwrite existing files.

---

## Rule: Show Image Preview via temporaryUrl

Display an image preview after file selection using $file->temporaryUrl() before the form is submitted.

---

## Category

UX

---

## Rule

After a user selects an image file with wire:model, render a preview <img src="{{ ->temporaryUrl() }}"> in the Blade template. Pair this with proper loading states during upload.

---

## Reason

Without a preview, users cannot confirm they selected the correct file until after the form is submitted and the page reloads. 	emporaryUrl() provides a signed, expiring URL that displays the uploaded content without requiring a full form submission, giving immediate visual feedback.

---

## Bad Example

`lade
<input type="file" wire:model="avatar">
<button wire:click="save">Upload</button>
{{-- No preview — user cannot see selected image --}}
`

---

## Good Example

`lade
<input type="file" wire:model="avatar">
@if ()
    <img src="{{ ->temporaryUrl() }}" class="preview">
@endif
<button wire:click="save">Upload</button>
`

---

## Exceptions

For non-image files (PDFs, documents), show a filename and file size instead of a thumbnail preview.

---

## Consequences Of Violation

UX: user cannot verify file selection before submission. User errors: incorrect files uploaded and detected only after form submission.

---

## Rule: Configure Max Upload Size

Set a file size limit in the Livewire configuration to prevent oversized uploads.

---

## Category

Performance

---

## Rule

Configure livewire.temporary_file_upload.max_upload_size in the Livewire config file. Set it to a value appropriate for the application's use case (e.g., 12MB for images, 50MB for videos). Ensure PHP's upload_max_filesize and post_max_size are set equally or higher.

---

## Reason

Without a configured limit, Livewire uses its default (12MB). Users may attempt to upload multi-gigabyte files that exhaust disk space on the temporary upload directory, cause out-of-memory errors during validation, or take excessive time to upload. A configured limit provides clear, enforced boundaries.

---

## Bad Example

`php
// No max upload size configured — uses Livewire default or PHP's unlimited
`

---

## Good Example

`php
// config/livewire.php
'temporary_file_upload' => [
    'max_upload_size' => 50 * 1024 * 1024, // 50MB
],
`

---

## Exceptions

If the application handles very large files (e.g., video processing), configure chunked uploads and increase the limit. The limit must still exist — set it to the maximum legitimate file size.

---

## Consequences Of Violation

Performance risks: disk exhaustion from oversized uploads. Reliability risks: out-of-memory errors during file processing.

---

## Rule: Clean Up Discarded Temporary Files

Delete temporary files that are explicitly discarded (user cancels upload, selects different file).

---

## Category

Performance

---

## Rule

When a user changes their file selection or cancels an upload, call $file->delete() on the previous TemporaryUploadedFile to remove it from the temporary directory immediately. Do not wait for automatic 24-hour cleanup.

---

## Reason

Livewire cleans up temporary files after 24 hours. If a user selects and discards multiple files in a single session (e.g., trying different avatars), the temporary directory accumulates orphaned files that consume disk space until the daily cleanup. Proactive deletion prevents unnecessary disk usage.

---

## Bad Example

`php
public function updatedAvatar(): void
{
    // Old file remains in livewire-tmp/ until auto-cleanup
}
`

---

## Good Example

`php
public function updatedAvatar(): void
{
    if (->avatar && method_exists(->avatar, 'delete')) {
        ->avatar->delete(); // Clean up old file
    }
}
`

---

## Exceptions

If the application relies on the 24-hour auto-cleanup and has sufficient disk space, explicit deletion is optional but recommended. For high-traffic upload pages, explicit deletion is required.

---

## Consequences Of Violation

Storage risks: disk space consumed by orphaned temporary files. Cleanup overhead: 24-hour cleanup cycle may be too slow for high-upload pages.
