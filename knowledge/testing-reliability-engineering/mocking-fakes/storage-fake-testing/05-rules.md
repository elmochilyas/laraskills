# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Mocking, Fakes & Test Doubles
## Knowledge Unit: Storage Fake Testing

---

### Rule 1: Always match the disk name exactly between `Storage::fake()` and application code

| Field | Value |
|-------|-------|
| **Name** | Match disk names exactly |
| **Category** | Test Setup |
| **Rule** | Ensure `Storage::fake('s3')` uses the exact same disk name as `Storage::disk('s3')` in the code under test. Disk names are case-sensitive. |
| **Reason** | `Storage::fake('s3')` replaces the binding for that specific disk name. If the code uses `Storage::disk('S3')` (capitalized) but the test fakes `'s3'` (lowercase), the fake is not applied and files go to the real filesystem. |
| **Bad Example** | `Storage::fake('s3')` but code calls `Storage::disk('public')` — files go to public disk. |
| **Good Example** | Check `config('filesystems.disks')` to find the exact key and match it in `Storage::fake()`. |
| **Exceptions** | None. Disk name mismatch is the most common storage fake mistake. |
| **Consequences Of Violation** | Fake not applied. Files written to real disk or cloud storage during tests. |

---

### Rule 2: Fake all disks used in the operation

| Field | Value |
|-------|-------|
| **Name** | Fake every disk the code touches |
| **Category** | Test Setup |
| **Rule** | If code interacts with multiple disks (e.g., reads from `'local'` and uploads to `'s3'`), use `Storage::fake(['local', 's3'])`. |
| **Reason** | A single unfaked disk means real filesystem I/O for that disk's operations. Tests using that unfaked disk write real files, potentially hitting cloud storage and incurring costs. |
| **Bad Example** | `Storage::fake('s3')` but code also writes to `'local'` — local files accumulate on disk. |
| **Good Example** | `Storage::fake(['s3', 'local'])` — both disks are in-memory fakes. |
| **Exceptions** | Disks used only for reading static fixtures that should come from the real filesystem. |
| **Consequences Of Violation** | Partial faking: some operations hit real disk/cloud. File cleanup needed between tests. |

---

### Rule 3: Always specify the disk in storage assertions

| Field | Value |
|-------|-------|
| **Name** | Use `Storage::disk('s3')->assertExists()` |
| **Category** | Storage Assertion |
| **Rule** | After `Storage::fake('s3')`, use `Storage::disk('s3')->assertExists($path)` with the explicit disk name. Do not use `Storage::assertExists()` without specifying the disk. |
| **Reason** | `Storage::assertExists()` asserts on the **default** disk (usually `'local'`), not the faked disk. If you faked `'s3'` but the default is `'local'`, the assertion checks the wrong disk — it may pass (file exists on real local disk) or fail (file is actually on faked S3). |
| **Bad Example** | `Storage::fake('s3'); Storage::put('file.txt', 'content'); Storage::assertExists('file.txt');` — asserts on default, not 's3'. |
| **Good Example** | `Storage::fake('s3'); Storage::disk('s3')->put('file.txt', 'content'); Storage::disk('s3')->assertExists('file.txt');`. |
| **Exceptions** | When faking the default disk itself. |
| **Consequences Of Violation** | Assertions check the wrong disk. False positives or false negatives for file existence. |

---

### Rule 4: Verify file content, not just existence

| Field | Value |
|-------|-------|
| **Name** | Assert file content integrity |
| **Category** | Storage Assertion |
| **Rule** | After `assertExists()`, retrieve the file content via `Storage::disk('s3')->get($path)` and verify its content with string assertions. |
| **Reason** | `assertExists()` only checks that a file exists at the path. It doesn't verify file content. An export may create an empty file, or a transformation may produce wrong content — existence assertions alone miss these bugs. |
| **Bad Example** | `Storage::disk('s3')->assertExists('exports/report.csv')` — doesn't verify content. |
| **Good Example** | `$content = Storage::disk('s3')->get('exports/report.csv'); $this->assertStringContainsString('email,created_at', $content);`. |
| **Exceptions** | Tests where only file existence matters (e.g., a placeholder file). |
| **Consequences Of Violation** | Files stored with wrong content. Empty or corrupted files pass tests. |

---

### Rule 5: Test URL generation separately from storage fakes

| Field | Value |
|-------|-------|
| **Name** | Separate URL assertion from file assertion |
| **Category** | URL Testing |
| **Rule** | Do not assert on `Storage::url()` or `Storage::temporaryUrl()` values when using storage fakes. Test URL generation separately with a dedicated URL helper test. |
| **Reason** | On faked disks, `Storage::url()` returns local-style paths (e.g., `/storage/file.txt`), not the cloud CDN URLs that production code expects. `temporaryUrl()` returns `null` on faked disks. |
| **Bad Example** | `$this->assertEquals('https://cdn.example.com/file.txt', Storage::disk('s3')->url('file.txt'))` — fails on fake. |
| **Good Example** | Test file storage with fakes. Test URL generation as a separate unit test for the URL helper/service. |
| **Exceptions** | Custom disks with deterministic URL generation that matches both fake and real behavior. |
| **Consequences Of Violation** | Tests fail on fake disk because URL format differs from production. Tests may also give false confidence about URL correctness. |
