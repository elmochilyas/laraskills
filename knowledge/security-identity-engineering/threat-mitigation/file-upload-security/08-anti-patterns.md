# Anti-Patterns: File Upload Security and Secure Storage

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | File Upload Security |
| Audience | Developers, Architects |

---

## Anti-Pattern Inventory

| ID | Name | Severity | Frequency | Effort to Fix |
|----|------|----------|-----------|--------------|
| AP-FU-01 | Extension-Only Validation | Critical | High | Low |
| AP-FU-02 | Files in Public Web Root | High | High | Medium |
| AP-FU-03 | Original Filename Trusted | High | High | Low |
| AP-FU-04 | No Malware Scanning | High | Medium | Medium |
| AP-FU-05 | EXIF Data Not Stripped | Medium | Medium | Low |

---

## Repository-Wide Anti-Patterns

- **No File Size Limit**: No `max` rule on file uploads — disk space at risk
- **Executable Extensions Allowed**: php, exe, sh not blocked
- **Files in Database BLOB**: Performance and scalability issues

---

## 1. Extension-Only Validation

### Category
Security · Critical

### Description
Validating file uploads by file extension only, without checking the actual MIME type of the file content.

### Why It Happens
Checking the extension is simple: `$file->getClientOriginalExtension()`. Developers may not know that extensions are trivially spoofed. A PHP shell renamed to `image.jpg` passes extension-only checks.

### Warning Signs
- Validation uses `ends_with:.jpg,.png` or regex on extension
- No `mimes:` rule in file validation
- `getClientOriginalExtension()` used for type checking
- File is stored with original extension unsanitized
- Executable extensions can pass by renaming

### Why Harmful
An attacker can upload a PHP script named `shell.jpg` — the extension check passes, but the file contains PHP code. If the file is stored in a web-accessible location, the attacker can execute the script.

### Real-World Consequences
- Attacker uploads PHP web shell renamed to `.jpg`
- Web shell executed — attacker gains server access
- Entire server compromised

### Preferred Alternative
Use `mimes:jpg,png` rule which validates MIME type by file content, not extension.

### Refactoring Strategy
1. Replace extension checks with `mimes:` validation rule
2. Use `$file->hashName()` for storage (strips original extension)

### Detection Checklist
- [ ] Is MIME type validated from file content?
- [ ] Is `mimes:` rule used instead of extension check?
- [ ] Can a renamed executable bypass validation?
- [ ] Is the original extension trusted?

### Related Rules/Skills/Trees
- Validate File Type by MIME, Not Extension (05-rules.md)
- Secure File Uploads with Server-Side Validation and Private Storage (06-skills.md)
- File Validation Approach decision tree (07-decision-trees.md)

---

## 2. Files in Public Web Root

### Category
Security · High

### Description
Storing user-uploaded files in `public/` or a subdirectory of `public/`, making them directly accessible via URL without authentication.

### Why It Happens
The default web server document root is `public/`. Storing files in `public/uploads/` is the path of least resistance — files are immediately accessible at `/uploads/filename.jpg`.

### Warning Signs
- Files stored with `$file->move(public_path('uploads'), ...)`
- Files stored in `public/uploads/` or similar
- Direct URL access to uploaded files without auth
- `Storage::disk('public')` used for user uploads
- No download controller — files accessed directly

### Why Harmful
Any file stored in `public/` is accessible to anyone who knows the URL. Private documents, personal photos, and sensitive uploads are publicly available. There is no access control, no authentication check, and no rate limiting.

### Real-World Consequences
- Private documents accessible at `/uploads/document-123.pdf`
- User profile photos accessible to anyone (URL enumeration)
- Sensitive legal documents exposed without auth
- Compliance violation: unauthenticated access to user files

### Preferred Alternative
Store files in `storage/app/` (private) and serve through an authenticated controller.

### Refactoring Strategy
1. Change storage to `$file->store('uploads', 'local')`
2. Create a download controller with authorization
3. Move existing public files to private storage
4. Update all file references

### Detection Checklist
- [ ] Are user uploads stored in `public/`?
- [ ] Can files be accessed directly via URL?
- [ ] Is there authentication before file access?
- [ ] Are private files served through a controller?
- [ ] Could URL enumeration expose other users' files?

### Related Rules/Skills/Trees
- Store Uploaded Files Outside the Public Directory (05-rules.md)
- Secure File Uploads with Server-Side Validation and Private Storage (06-skills.md)
- Storage Disk Selection decision tree (07-decision-trees.md)
- File Access Control Strategy decision tree (07-decision-trees.md)

---

## 3. Original Filename Trusted

### Category
Security · High

### Description
Using the original user-provided filename when storing uploaded files, allowing path traversal and other filesystem attacks.

### Why It Happens
The original filename seems natural — "the user saved it as `report.pdf`, so I'll store it as `report.pdf`." Developers may not consider that the filename can contain `../`, null bytes, or special characters.

### Warning Signs
- `$file->getClientOriginalName()` used in storage path
- `$file->storeAs('uploads', $file->getClientOriginalName())`
- Filename stored in database and used for retrieval
- No filename sanitization before storage

### Why Harmful
`../../etc/config.php` as a filename can overwrite configuration files. `../../../public/shell.php` creates a web-accessible PHP file. Path traversal allows writing files outside the intended directory.

### Real-World Consequences
- Attacker uploads file named `../../app/Http/Controllers/evil.php` — overwrites controller
- File named `evil.php%00.jpg` — null byte truncation creates `.php` file
- System files overwritten through path traversal

### Preferred Alternative
Use `$file->hashName()` or `Str::random()` for safe filenames.

### Refactoring Strategy
1. Replace `getClientOriginalName()` with `$file->hashName()`
2. Store original name separately if needed for display
3. Map display names to stored filenames

### Detection Checklist
- [ ] Is the original filename used in storage?
- [ ] Could `../` in filename cause path traversal?
- [ ] Are filenames sanitized before storage?
- [ ] Is `hashName()` used for storage?
- [ ] Are stored filenames predictable?

### Related Rules/Skills/Trees
- Rename Uploaded Files to Prevent Path Traversal (05-rules.md)
- Secure File Uploads with Server-Side Validation and Private Storage (06-skills.md)

---

## 4. No Malware Scanning

### Category
Security · High

### Description
Not scanning uploaded files for malware before storing or serving them to other users.

### Why It Happens
Malware scanning adds complexity (ClamAV installation, async jobs). Developers may skip it, trusting users not to upload malicious files, or assuming MIME validation is sufficient.

### Warning Signs
- No ClamAV or antivirus integration
- Files stored and served without scanning
- Uploads are directly downloadable without scanning
- Document sharing feature without malware checks
- No async job for file scanning

### Why Harmful
The application becomes a malware distribution platform. Attackers upload infected files that are then downloaded by legitimate users. This damages trust, exposes users to malware, and may have legal consequences.

### Real-World Consequences
- User uploads PDF with embedded malware — distributes to all downloaders
- Application flagged as malware source by security vendors
- Legal liability: application distributed malware

### Preferred Alternative
Implement malware scanning (ClamAV or API-based) asynchronously.

### Refactoring Strategy
1. Install ClamAV on server
2. Create async job that scans uploaded files
3. Mark infected files as quarantined
4. Notify uploader if file is infected

### Detection Checklist
- [ ] Are uploaded files scanned for malware?
- [ ] Is there a quarantine process for infected files?
- [ ] Can users download files that may contain malware?
- [ ] Is scanning done synchronously or asynchronously?
- [ ] Is there a policy for handling infected uploads?

### Related Rules/Skills/Trees
- Scan Uploaded Files for Malware Before Storage (05-rules.md)
- Secure File Uploads with Server-Side Validation and Private Storage (06-skills.md)

---

## 5. EXIF Data Not Stripped

### Category
Privacy · Medium

### Description
Storing user-uploaded images without stripping EXIF metadata, potentially exposing GPS coordinates, camera info, and other personal data.

### Why It Happens
EXIF data is invisible to users and developers. Images uploaded from smartphones contain GPS coordinates, device model, date/time, and camera settings. Developers may not know this metadata exists.

### Warning Signs
- Images uploaded from mobile devices contain GPS data
- `exif_read_data()` shows location, camera info
- No image processing/re-encoding on upload
- Images served as-is without sanitization
- Privacy policy does not mention metadata handling

### Why Harmful
Uploaded images can reveal the user's home address (GPS coordinates from photos taken at home), device information, and precise timestamps. This is a privacy violation and may expose users to physical safety risks.

### Real-World Consequences
- User uploads photo from home — GPS coordinates reveal home address
- Dating app profile photo contains GPS — user's location exposed
- Compliance violation: user metadata exposed without consent

### Preferred Alternative
Re-encode images on upload to strip EXIF data.

### Refactoring Strategy
1. Process images through Intervention Image or GD
2. Re-encode image — this strips all EXIF data
3. Store the re-encoded version

### Detection Checklist
- [ ] Are images sanitized on upload?
- [ ] Is EXIF data stripped before storage?
- [ ] Do images contain GPS or device metadata?
- [ ] Is there a privacy policy for metadata handling?
- [ ] Are images processed through Intervention or GD?

### Related Rules/Skills/Trees
- Serve Images Through Intervention or Sanitized Streaming (05-rules.md)
- Secure File Uploads with Server-Side Validation and Private Storage (06-skills.md)
