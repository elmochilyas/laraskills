# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Feature & HTTP Testing
## Knowledge Unit: File Upload Testing

---

### Rule 1: Always use `Storage::fake()` and `UploadedFile::fake()` in upload tests

| Field | Value |
|-------|-------|
| **Name** | Use fakes for all file upload tests |
| **Category** | Test Isolation |
| **Rule** | Always call `Storage::fake($disk)` and use `UploadedFile::fake()->create()` or `UploadedFile::fake()->image()` for file upload tests. |
| **Reason** | Without fakes, files are written to the real filesystem or cloud storage. Real storage accumulates files, fills CI disks, depends on cloud connectivity, and adds latency. Fakes are in-memory, deterministic, and <1ms. |
| **Bad Example** | `$this->post('/upload', ['file' => new UploadedFile(realpath('/tmp/test.txt'), ...)])` — real file on disk. |
| **Good Example** | `Storage::fake('s3'); $this->post('/upload', ['file' => UploadedFile::fake()->image('photo.jpg')])` — in-memory fake. |
| **Exceptions** | Integration tests that must verify real cloud storage behavior. These should be in a separate, explicitly marked suite. |
| **Consequences Of Violation** | Real files accumulate in storage. CI disks fill up. Tests are slower and depend on network connectivity. |

---

### Rule 2: Test each validation rule with a dedicated invalid file

| Field | Value |
|-------|-------|
| **Name** | Test every validation rule with an invalid file |
| **Category** | Validation |
| **Rule** | For each file validation rule (MIME type, size, dimensions, extension), create a separate test case with a file that violates that specific rule. |
| **Reason** | File validation is a critical security boundary. A single missing rule test means the application may accept a file it shouldn't. Each rule is an independent failure mode requiring its own test. |
| **Bad Example** | One test with a valid file — no invalid file tests at all. |
| **Good Example** | Separate tests: `test_pdf_uploads_succeed()`, `test_exe_uploads_rejected()`, `test_large_file_rejected()`, `test_wrong_dimensions_rejected()`, `test_path_traversal_rejected()`. |
| **Exceptions** | Rules that are trivially implied by other rules (e.g., testing max dimensions implicitly tests min dimensions). |
| **Consequences Of Violation** | Malicious files bypass validation. Security vulnerabilities (RCE, data exfiltration) via file upload reach production. |

---

### Rule 3: Assert file existence after upload, not just HTTP status

| Field | Value |
|-------|-------|
| **Name** | Verify file was actually stored |
| **Category** | Storage Verification |
| **Rule** | After every upload test, use `Storage::disk('s3')->assertExists($path)` to verify the file was stored at the expected location. |
| **Reason** | A 200 response does not guarantee the file was stored. The controller may return success before the storage operation completes, or the file may be stored at an unexpected path. |
| **Bad Example** | `->post('/avatar', [...])->assertOk()` — file may not be stored. |
| **Good Example** | `->post('/avatar', [...])->assertOk(); Storage::disk('s3')->assertExists('avatars/'.$user->id.'.jpg');`. |
| **Exceptions** | Upload endpoints that process files in-memory without persistent storage. |
| **Consequences Of Violation** | Uploads appear to succeed but files are not stored. Users lose uploaded content without notification. |

---

### Rule 4: Test server-side MIME type validation, not just extension

| Field | Value |
|-------|-------|
| **Name** | Validate MIME type server-side |
| **Category** | Security |
| **Rule** | Test that the server validates the file's MIME type (not just extension). Test that renamed executables (e.g., `virus.exe` renamed to `photo.jpg`) are rejected. |
| **Reason** | Extension-only validation is trivially bypassed by renaming a malicious file. Server-side MIME type detection (reading file headers) is the actual security boundary. |
| **Bad Example** | Using `mimes:jpg,png` rule — passes for a renamed `.exe` to `photo.jpg`. |
| **Good Example** | Using `mimes:jpg,png` with `UploadedFile::fake()->create('photo.jpg', 100)` where the fake's MIME type is `application/octet-stream` — rejected by MIME validation. |
| **Exceptions** | When using `excel` or `csv` where MIME types vary by operating system and browser. |
| **Consequences Of Violation** | Malicious executables uploaded as renamed images. Remote code execution vulnerability through file upload. |

---

### Rule 5: Test the full upload-download lifecycle

| Field | Value |
|-------|-------|
| **Name** | Test upload, storage, and download |
| **Category** | Lifecycle Testing |
| **Rule** | For file handling features, test the complete lifecycle: upload the file, verify storage, then verify download returns the correct file with correct metadata. |
| **Reason** | Upload, storage, and download are independent failure modes. An upload may work while download returns wrong content type, wrong filename, or 404. |
| **Bad Example** | Testing upload only — download returns 404 or wrong content type. |
| **Good Example** | Upload → `Storage::assertExists()` → download via `$this->get('/download/1')->assertDownload('original-name.pdf')`. |
| **Exceptions** | Backend-only processing where files are never downloaded by users. |
| **Consequences Of Violation** | Users can upload but cannot download their files. File corruption during storage goes undetected. |

---

### Rule 6: Test security boundaries (path traversal, extremely large files, executable content)

| Field | Value |
|-------|-------|
| **Name** | Test file upload security boundaries |
| **Category** | Security |
| **Rule** | Test at minimum: path traversal in filename (`../../../etc/passwd`), extremely large files (exceeding limits), and executable file types (`.php`, `.exe`, `.sh`). |
| **Reason** | File upload is the most common web application vulnerability. Path traversal can overwrite system files. Large files cause DoS. Executable uploads enable RCE. |
| **Bad Example** | Only testing with valid, expected files. |
| **Good Example** | `test_path_traversal_is_sanitized()`, `test_huge_file_is_rejected()`, `test_php_file_is_rejected()`. |
| **Exceptions** | None. These are mandatory security tests for any file upload endpoint. |
| **Consequences Of Violation** | Remote code execution, server compromise, data exfiltration. OWASP Top 10 file upload vulnerabilities in production. |
