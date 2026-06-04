# Decomposition: file upload security

## Topic Overview

Secure file upload requires validation at multiple layers: MIME type (not just extension), file size, content scanning, and storage outside the web root. Laravel's validation rules (`mimes:pdf`, `max:10240`) provide MIME-based type checking. For storage, use private disks (not `public/`) for sensitive uploads, serve files via signed URLs or streams, and scan uploads for malware. The layered defense: validate MIME + size → scan for malware → store outside web root → serve via controlled ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
file-upload-security/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### file upload security
- **Purpose:** Secure file upload requires validation at multiple layers: MIME type (not just extension), file size, content scanning, and storage outside the web root. Laravel's validation rules (`mimes:pdf`, `max:10240`) provide MIME-based type checking. For storage, use private disks (not `public/`) for sensitive uploads, serve files via signed URLs or streams, and scan uploads for malware. The layered defense: validate MIME + size → scan for malware → store outside web root → serve via controlled ...
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Storage configuration (disks, drivers), Form Request validation rules, Related: Signed URLs (for serving private files), CSP nonce/script-src (for uploaded HTML content), Advanced Follow-up: Direct-to-S3 uploads (presigned URLs), Malware scanning with ClamAV, VirusTotal API integration, and File type transformation (PDF to images for preview)

## Dependency Graph
**Depends on:** Prerequisites: Storage configuration (disks, drivers), Form Request validation rules, Related: Signed URLs (for serving private files), CSP nonce/script-src (for uploaded HTML content), Advanced Follow-up: Direct-to-S3 uploads (presigned URLs), Malware scanning with ClamAV, VirusTotal API integration, and File type transformation (PDF to images for preview)
**Depended on by:** Knowledge units that leverage or extend file upload security patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for file upload security.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization