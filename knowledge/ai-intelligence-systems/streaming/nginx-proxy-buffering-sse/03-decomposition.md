# Decomposition: Nginx Proxy Buffering for SSE

## Topic Overview
Nginx proxy buffering is the most common production issue for SSE streaming. Default buffering delays all token delivery until the complete response is generated â€” defeating the purpose of streaming. Configuration changes (`proxy_buffering off; X-Accel-Buffering: no`) are essential for real-time token delivery through Nginx reverse proxies.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ku-05-nginx-proxy-buffering-sse/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Nginx Proxy Buffering for SSE
- **Purpose:** Nginx proxy buffering is the most common production issue for SSE streaming. Default buffering delays all token delivery until the complete response is generated â€” defeating the purpose of streaming. Configuration changes (`proxy_buffering off; X-Accel-Buffering: no`) are essential for real-time token delivery through Nginx reverse proxies.
- **Difficulty:** Intermediate
- **Dependencies:** KU-045, KU-046

## Dependency Graph
**Depends on:**
- KU-045
- KU-046

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- `proxy_buffering off;`
- `X-Accel-Buffering: no`
- `proxy_cache off;`
- FastCGI buffering
- Chunked transfer encoding
- Connection timeout

**Out of scope:**
- KU-045 topics covered in their respective KUs
- KU-046 topics covered in their respective KUs

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization