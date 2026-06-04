# Anti-Patterns â€” Response Compression
## Metadata
| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Response Structures |
| Knowledge Unit | Response Compression |
| Difficulty | Foundation |
| Category | Architecture |
| Author | ECC AI Agent |
| Last Updated | 2026-06-03 |
---

## Anti-Pattern Inventory
| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|-----------|
| No Compression on Large Responses | High | Medium | Responses >1KB not compressed, wasting bandwidth |
| Compressing Already-Compressed Data | Medium | Medium | Double-compressing responses (e.g., gzip on images) |
| Compression Without Content-Type Check | Medium | Medium | Compressing all content types including binary that's already compressed |
| Missing Accept-Encoding Handling | Medium | Medium | Ignoring client's Accept-Encoding header |
| Compression Level Too High | Low | Medium | Maximum compression level used, trading CPU for minimal size gain |

## Repository-Wide Anti-Patterns
| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| No Compression Configuration | Server doesn't configure compression at any layer | Wasted bandwidth on all responses |
| Application-Level Compression Only | Compression applied in PHP instead of web server | Slower responses, higher CPU usage |

## Anti-Pattern Details

### AP-RCO-01: No Compression on Large Responses
**Description**: Large JSON responses (>1KB) sent without compression.
**Root Cause**: Compression not configured at any level (app, middleware, web server).
**Impact**: 3-10x larger responses, slower client downloads, higher bandwidth costs.
**Detection**: Response headers lack Content-Encoding: gzip.
**Solution**: Enable compression at web server level (Nginx/Apache) or use middleware.

### AP-RCO-02: Compressing Already-Compressed Data
**Description**: Application compresses data that's already in a compressed format (images, archives).
**Root Cause**: Global compression applied without content-type filtering.
**Impact**: Wasted CPU cycles with no size reduction.
**Detection**: Binary responses being gzipped.
**Solution**: Skip compression for already-compressed content types.

### AP-RCO-03: Missing Accept-Encoding Handling
**Description**: Server compresses responses without checking if client supports compression.
**Root Cause**: Assuming all clients accept gzip encoding.
**Impact**: Some clients may not be able to decompress responses.
**Detection**: No Accept-Encoding header check before compression.
**Solution**: Check Accept-Encoding header. Only compress if client supports it.
