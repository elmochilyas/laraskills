# Skills: OpCache Memory Sizing

## Metadata
- **Domain:** Performance & Runtime Engineering
- **Subdomain:** OpCache Configuration & Preloading
- **KU:** OpCache Memory Sizing - memory_consumption, interned_strings_buffer
- **Phase:** 6 (Skill Extraction)

---

## Skill 1: Size OpCache memory_consumption for a Laravel Application

### Purpose
Correctly calculate and configure `opcache.memory_consumption` to prevent cache eviction and recompilation.

### When To Use
Configuring OpCache for any production PHP application, especially Laravel/Symfony projects with 10K+ files.

### When NOT To Use
Development environments where OpCache may be disabled; small applications (<5000 files) where 128MB default suffices.

### Prerequisites
- PHP application deployed with PHP-FPM
- Knowledge of application file count
- Access to php.ini or server configuration

### Inputs
- Application file count (approximate)
- Average compiled opcode size per file (~10KB for Laravel)
- Current `opcache.memory_consumption` value

### Workflow
1. Count served PHP files: `find app/ vendor/ -name '*.php' | wc -l`
2. Multiply file count by average compiled size (e.g., 20,000 x 10KB = 200MB)
3. Add 20% headroom: divide by 0.8 (200MB / 0.8 = 256MB)
4. Set value in `php.ini`: `opcache.memory_consumption=256`
5. Restart PHP-FPM: `sudo systemctl restart php8.x-fpm`
6. Verify after warmup: call `opcache_get_status()['memory_usage']`
7. Confirm `free_memory` > 20% of total and `cache_full` is false

### Validation Checklist
- [ ] Calculated value accounts for file count × avg compiled size + 20% headroom
- [ ] `cache_full` indicator is false after cache warmup
- [ ] Hit rate remains >99% under normal load
- [ ] `free_memory` stays above 20% of total during peak hours

### Common Failures
| Failure | Symptom | Solution |
|---------|---------|----------|
| Cache full (eviction) | `cache_full` true, hit rate <90% | Increase memory_consumption by 50% |
| Memory waste | OOM or swap usage, memory_usage.free_memory very high | Decrease to appropriate size |
| Setting max RAM | Server swap, OOM killer | Size by app need, not available RAM |

### Decision Points
- Start at 256MB for Laravel, 128MB for WordPress, 512MB+ for Magento 2
- If hit rate drops below 99%, increase by 50% and re-monitor
- If free memory <20% of total, treat as undersized

### Performance Considerations
- Every 1% decrease in hit rate increases CPU ~0.5-1%
- Preloading reduces class loading time by 1-3ms per request
- JIT requires adequate OpCache memory
- file_cache reduces cold-start latency 50-70% in containers

### Security Considerations
- Shared memory must not be accessible to untrusted processes
- No direct security impact from memory sizing

### Related Rules
- OpCache-RULE-001 (Size memory_consumption, never use defaults)
- OpCache-RULE-002 (Monitor free_memory weekly)
- OpCache-RULE-003 (Never set memory_consumption to max RAM)

### Related Skills
- Configure OpCache interned_strings_buffer
- Monitor OpCache Hit Rate
- Production Harden OpCache Settings

### Success Criteria
- Application runs with 99%+ OpCache hit rate under peak load
- `cache_full` indicator never triggers
- No memory pressure on server from OpCache allocation

---

## Skill 2: Configure OpCache interned_strings_buffer for Framework Applications

### Purpose
Set `opcache.interned_strings_buffer` to optimize string deduplication shared memory for framework-based PHP applications.

### When To Use
Any PHP application using a framework (Laravel, Symfony) with extensive class/method name strings.

### When NOT To Use
Small applications with minimal class definitions (<100 classes); default 8MB may suffice.

### Prerequisites
- PHP application deployed with PHP-FPM
- Access to php.ini configuration
- Basic understanding of OpCache interned strings

### Inputs
- Application framework (Laravel/Symfony vs WordPress vs custom)
- Number of unique string literals across application files

### Workflow
1. Start with recommended baseline: 32MB for Laravel/Symfony, 16MB for WordPress
2. Set in php.ini: `opcache.interned_strings_buffer=32`
3. Restart PHP-FPM and warm cache
4. Monitor `opcache_get_status()['interned_strings_usage']`
5. If `used_memory` approaches `buffer_size`, increment by 16MB
6. If usage is <25% of buffer, reduce by half

### Validation Checklist
- [ ] Baseline value matches framework recommendation (32MB Laravel, 16MB WordPress)
- [ ] Interned strings buffer usage stays <80% of allocated size
- [ ] No wasted memory from over-allocation (>75% unused)
- [ ] Class/method name strings are deduplicated as expected

### Common Failures
| Failure | Symptom | Solution |
|---------|---------|----------|
| Undersized buffer | Cache eviction of string entries | Increase buffer by 16MB |
| Oversized waste | Unused reserved memory | Reduce buffer if usage <25% |

### Decision Points
- Framework apps: 32MB initial, max 64MB for very large apps
- Non-framework apps: 8-16MB initial
- Always monitor usage after warmup

### Performance Considerations
- Deduplicated strings reduce per-request memory allocation
- Over-allocation permanently reserves shared memory that other processes could use
- String deduplication works across all requests, not per-request

### Security Considerations
- No direct security impact
- Interned strings are in shared memory, not process-isolated

### Related Rules
- OpCache-RULE-001 (Size memory_consumption, never use defaults)
- OpCache-RULE-002 (Monitor free_memory weekly)

### Related Skills
- Size OpCache memory_consumption
- Monitor OpCache Memory Usage
- Configure Preloading for Cold Start

### Success Criteria
- Interned strings buffer usage stays within allocated size
- No performance degradation from string deduplication limits
- Memory allocation balanced between interned strings and opcode cache
