# Decision Trees — File Upload Testing

## Decision Tree 1: File Upload Validation Testing

```
What validation rules need to be tested for this file upload?
│
├── MIME type validation
│   └── Test: accepted type passes, rejected type fails
│       Pass: `UploadedFile::fake()->image('photo.jpg')` → assertOk
│       Fail: `UploadedFile::fake()->create('document.pdf')` → assertStatus(422)
│
├── File size validation
│   └── Test boundaries: max-1 passes, max passes, max+1 fails
│       For `max:2048`: create 2047KB, 2048KB, 2049KB files
│       `UploadedFile::fake()->create('photo.jpg', $sizeInKilobytes)`
│
├── Image dimension validation
│   └── Test: correct dimensions pass, wrong dimensions fail
│       Pass: `UploadedFile::fake()->image('photo.jpg', 300, 300)`
│       Fail: `UploadedFile::fake()->image('photo.jpg', 200, 200)`
│
├── File count validation (max N files)
│   └── Test: N files pass, N+1 files fail
│
└── Security boundary validation
    ├── Renamed executable: `UploadedFile::fake()->create('photo.jpg.exe')` → rejected
    ├── Path traversal: filename containing `../../../etc/passwd` → sanitized
    └── Empty file: `UploadedFile::fake()->create('empty.txt', 0)` → rejected
```

## Decision Tree 2: Upload-Download Lifecycle Testing

```
What part of the file lifecycle needs testing?
│
├── Upload phase
│   └── Test: file is received and validated
│       `$this->post('/upload', ['file' => UploadedFile::fake()->image('photo.jpg')])->assertOk()`
│
├── Storage phase
│   └── Test: file exists at expected path
│       `Storage::disk('s3')->assertExists('avatars/'.$user->id.'.jpg')`
│       Sometimes assertExpectedFileSize too
│
├── Download phase
│   └── Test: file is downloadable with correct name
│       `$this->get('/download/1')->assertDownload('original-name.jpg')`
│
└── Cleanup phase (delete)
    └── Test: file is removed from storage
        `$this->delete('/upload/1')->assertOk()`
        `Storage::disk('s3')->assertMissing('avatars/'.$user->id.'.jpg')`
```

## Decision Tree 3: MIME Type vs Extension Testing

```
How should file type validation be tested?
│
├── Extension-based validation (client-side)
│   └── Test as secondary check only
│       `UploadedFile::fake()->create('script.php.jpg')` → should be rejected
│       But this is easily bypassed — don't rely on extension alone
│
└── Server-side MIME type validation (real security)
    └── Test as primary security boundary
        `UploadedFile::fake()->create('photo.jpg', 100)` — MIME is `application/octet-stream`
        If validation uses `mimes:jpg,png` → MIME mismatch → rejected
        The rename bypass doesn't work against MIME validation
```
