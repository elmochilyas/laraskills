# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire File Uploads
**Generated:** 2026-06-03

---

# Decision Inventory

* Livewire File Upload vs Standard HTML Form Upload
* Immediate Async Upload vs Deferred Upload on Form Submit
* TemporaryUploadedFile Direct Store vs Move After Validation

---

# Architecture-Level Decision Trees

---

## Decision 1: Livewire File Upload vs Standard HTML Form Upload

---

## Decision Context

Whether to handle file uploads via Livewire's async upload mechanism or a standard HTML form submission.

---

## Decision Criteria

* Whether the upload needs progress tracking, preview, or real-time feedback
* Whether the upload is part of a Livewire component with other interactive fields
* Whether the file is uploaded as the sole action or part of a larger form
* Whether the team prefers server-driven uploads or standard HTTP POST

---

## Decision Tree

Is the file upload part of a Livewire component with other interactive fields?
↓
YES → Use Livewire upload — `wire:model` on file input, async upload, integrated with component state
NO → Does the upload need progress tracking or image preview before form submission?
    YES → Use Livewire upload — built-in progress tracking, `temporaryUrl()` for preview
    NO → Is the upload the sole form action (single file upload page)?
        YES → Use standard HTML form — simpler, no Livewire dependency needed
        NO → Use Livewire upload — integrates with Livewire component lifecycle

---

## Rationale

Livewire file uploads provide async upload (file starts uploading immediately on selection), progress tracking, and image preview. Standard HTML forms submit all data at once, blocking the user until the upload completes. Livewire is the better UX for file uploads within interactive components.

---

## Recommended Default

**Default:** Livewire file upload for forms with file inputs. Standard HTML form only for simple, single-file upload pages.
**Reason:** Livewire provides async upload, progress tracking, and preview — significantly better UX. Standard forms force the user to wait for upload to complete before continuing.

---

## Risks Of Wrong Choice

* Standard form for multi-field form with file: Entire form blocks on file upload — poor UX
* Livewire for single file upload: Livewire overhead for a simple upload page
* No progress indicator: Large file upload with no feedback — user thinks app is stuck
* No preview: Image uploaded but user can't see it before submitting — uncertainty

---

## Related Rules

* Always Validate Before Storing

---

## Related Skills

* Implement Secure File Uploads with Preview

---

---

## Decision 2: Immediate Async Upload vs Deferred Upload on Form Submit

---

## Decision Context

Whether to upload files immediately when selected (async, default Livewire behavior) or defer upload until the form is submitted.

---

## Decision Criteria

* Whether the user should see a preview before completing the form
* Whether the file is large (slow upload that should start early)
* Whether the form requires the file to be present before submission
* Whether unused uploads (user selects, then cancels) should be cleaned up

---

## Decision Tree

Does the user need to see a preview of the selected file before submitting?
↓
YES → Immediate async upload — upload starts on selection, `temporaryUrl()` provides preview
NO → Is the file large (>5MB) where upload time is significant?
    YES → Immediate async upload — upload starts early, form submits faster when ready
    NO → Is the form simple with 1-2 fields and a single file?
        YES → Deferred upload on form submit — standard behavior, no premature uploads
        NO → Immediate async upload — starts early, doesn't block form submission

---

## Rationale

Immediate async upload provides the best UX — the file is already on the server by the time the user clicks submit. The tradeoff: files uploaded but never submitted (user navigates away) become orphaned temporary files. Livewire automatically cleans up temporary files, but it's worth considering for very large files.

---

## Recommended Default

**Default:** Immediate async upload — default Livewire behavior. Deferred upload only for very simple forms where upload speed isn't a concern.
**Reason:** Async upload provides better UX (preview, parallel upload, instant submit). Deferred upload creates a blocking wait on form submit.

---

## Risks Of Wrong Choice

* Deferred for image upload: User selects image, can't see it, submits, uploads, waits — bad UX
* Immediate for 100MB file: Upload starts on selection — if user selects wrong file, 100MB upload wasted
* No cleanup of orphaned files: Users select files and navigate away — temp directory fills
* Immediate without validation: File uploads before validation — invalid file already consumed bandwidth

---

## Related Rules

* Always Validate Before Storing

---

## Related Skills

* Implement Secure File Uploads with Preview

---

---

## Decision 3: TemporaryUploadedFile Direct Store vs Move After Validation

---

## Decision Context

Whether to store the `TemporaryUploadedFile` directly via `->store()` or move it after explicit validation.

---

## Decision Criteria

* Whether the file has been validated for type, size, and dimensions
* Whether the file needs processing before storage (resize, compress, convert)
* Whether the storage path depends on validated data (user ID, post ID)
* Whether the file should be stored immediately or after complete form validation

---

## Decision Tree

Has the file been validated (type, size, dimensions) via `$this->validate()`?
↓
YES → Is the storage path dynamic (depends on user ID or other validated data)?
    YES → Store in action method after all validations pass — `$this->validate()`, then store
    NO → Store immediately — file is validated, safe to persist
NO → Is the file in a `$rules` or `#[Rule]` validated property?
    YES → Store after validation — validate entire form, then store file
    NO → Validate first — call `$this->validate()` before `->store()`

---

## Rationale

`TemporaryUploadedFile` represents a file that has been uploaded asynchronously but not yet permanently stored. It exists in a temp directory and will be cleaned up. The permanent `->store()` should only be called after validation passes. Storing before validation means invalid files consume storage space permanently.

---

## Recommended Default

**Default:** Validate the file in `$this->validate()` rules, then call `->store()` in the action method. Never store before validation.
**Reason:** Validation ensures only valid files are permanently stored. Unvalidated file storage wastes space and risks security issues (wrong type, too large, malicious content).

---

## Risks Of Wrong Choice

* Store before validation: Invalid file permanently stored — wasted space, security risk
* Validate but don't store: File validated but never persisted — temporary file cleaned up, "upload" was pointless
* Validate type but not size: 1GB video uploaded instead of photo — storage filled
* No validation at all: Any file type accepted — executable upload, security breach

---

## Related Rules

* Always Validate Before Storing

---

## Related Skills

* Implement Secure File Uploads with Preview
