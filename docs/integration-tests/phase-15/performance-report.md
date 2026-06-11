# Phase 15 Performance Report

## Environment

| Parameter | Value |
|-----------|-------|
| Node.js | v24.15.0 |
| Platform | win32 |
| CPU | Intel(R) Core(TM) Ultra 7 155H |
| ECC Version | 1.0.0-beta.13 |
| Timestamp | 2026-06-11T22:57:51.788Z |

## Baseline (before cache)

| Metric | Cold avg (ms) | Warm avg (ms) |
|--------|--------------|--------------|
| retrieve (compact, average) | 182 | 154 |
| search (average) | 172 | 129 |
| validate | 108 | 131 |
| get_knowledge_unit | 107 | 92 |

## Cached Results

| Metric | Cold avg (ms) | Warm avg (ms) | Warm median (ms) | Improvement |
|--------|--------------|--------------|-----------------|-------------|
| retrieve (compact, average) | 228 | 66 | 67 | 57% |
| search (average) | 156 | 34 | 32 | 74% |
| validate | 119 | 10 | 6 | 92% |
| get_knowledge_unit | 114 | 3 | 3 | 97% |

## Detailed Results

### retrieve (compact)

| Query | Cold avg | Warm avg | Cold med | Warm med | Improv |
|-------|----------|----------|----------|----------|--------|
| Build CRUD REST API | 289.7 | 104.4 | 270.4 | 104.1 | 63.9% |
| Build tenant-isolated | 243.2 | 56.7 | 236.1 | 59.1 | 76.7% |
| Add Sanctum auth | 190.3 | 44.9 | 181.8 | 49.1 | 76.4% |
| Fix N+1 query | 187.0 | 57.4 | 182.0 | 56.8 | 69.3% |

### search

| Query | Cold avg | Warm avg | Cold med | Warm med | Improv |
|-------|----------|----------|----------|----------|--------|
| Build CRUD REST API | 157.9 | 32.9 | 164.7 | 29.6 | 79.2% |
| Build tenant-isolated | 151.0 | 38.1 | 137.4 | 32.9 | 74.8% |
| Add Sanctum auth | 159.5 | 29.5 | 150.7 | 29.5 | 81.5% |
| Fix N+1 query | 155.4 | 37.4 | 160.8 | 35.0 | 75.9% |

### validate

| Cold avg | Warm avg | Cold med | Warm med | Improv |
|----------|----------|----------|----------|--------|
| 119.0 | 9.6 | 119.2 | 5.8 | 91.9% |

### get_knowledge_unit

| Cold avg | Warm avg | Cold med | Warm med | Improv |
|----------|----------|----------|----------|--------|
| 113.9 | 2.6 | 100.2 | 2.7 | 97.7% |

## Methodology

- **Cold**: `clearCache()` called before each iteration. Measures full catalog load + operation.
- **Warm**: All iterations reuse warm cache. Measures operation-only time.
- **5 iterations per metric** (both cold and warm).
- **2 warmup iterations** before warm measurements.
- All measurements include Node.js startup time (relevant for CLI; MCP in long-lived processes gets near-warm performance).
