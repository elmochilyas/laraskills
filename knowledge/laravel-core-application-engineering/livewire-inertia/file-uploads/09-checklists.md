# Livewire File Uploads — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire File Uploads
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Livewire v3 installed (no `WithFileUploads` trait needed)
- [ ] Temporary upload directory configured (`livewire-tmp/`)
- [ ] Max upload size configured in `livewire.temporary_file_upload.max_upload_size`
- [ ] `php.ini` upload limits appropriate (`upload_max_filesize`, `post_max_size`)

## Implementation Checklist
- [ ] File type and size validation before storing
- [ ] `$file->hashName()` used for safe filenames
- [ ] Image preview shown via `temporaryUrl()`
- [ ] Max upload size configured
- [ ] File validation rules appropriate for use case
- [ ] Temporary file cleanup configured
- [ ] Loading states shown during upload
- [ ] Tests cover upload validation and storage
- [ ] `$file->store()` moves from temp to permanent storage

## Verification Checklist
- [ ] File uploads immediately on selection (not on form submit)
- [ ] `TemporaryUploadedFile` instance available in component
- [ ] `temporaryUrl()` provides signed, expiring URL for image preview
- [ ] Multiple file uploads work via array property with `wire:model="photos" multiple`
- [ ] `$file->store('avatars', 'public')` stores file correctly
- [ ] Files stored outside web root before validation
- [ ] Loading state shows during upload (`<div wire:loading wire:target="avatar">`)

## Security Checklist
- [ ] File validation rules enforce type, size, and MIME server-side
- [ ] `$file->hashName()` used to prevent path traversal
- [ ] `temporaryUrl()` uses signed URLs that expire
- [ ] MIME type validated server-side (not just client extension)
- [ ] Client-provided filename is never trusted
- [ ] Reasonable file size limits set
- [ ] Temporary files auto-clean after 24 hours (Livewire default)
- [ ] `$file->delete()` called if discarding an upload

## Performance Checklist
- [ ] Upload time is spread across form-filling (not concentrated at submit)
- [ ] `livewire-tmp/` directory has sufficient disk space
- [ ] Chunked uploads configured for large files (Livewire v3)
- [ ] No blocking of upload on form submit — files upload immediately
- [ ] Multiple simultaneous uploads are handled efficiently

## Production Readiness Checklist
- [ ] File type and size validation covers all expected file types
- [ ] Image preview works before form submission
- [ ] Temporary URL expiration is appropriate for UX flow
- [ ] Loading state provides meaningful feedback to user
- [ ] Error states handled (file too large, wrong type, upload failure)
- [ ] Cleanup of discarded uploads works correctly

## Common Mistakes to Avoid
- [ ] Not validating file before store — invalid files stored
- [ ] Using original filename — path traversal risk
- [ ] No temporary URL for image preview — user can't see uploaded image
- [ ] Missing `WithFileUploads` trait (Livewire v2) — file uploads don't work
- [ ] No max file size config — upload fails or server fills up
- [ ] Storing directly from temp without validation
- [ ] No file type validation — allowing any file type
- [ ] Blocking upload on form submit — defeats purpose of async upload
