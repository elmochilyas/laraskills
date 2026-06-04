# Skill: Configure Xdebug Profiling with cachegrind Output and KCacheGrind Analysis

## Purpose
Configure Xdebug 3 for trigger-based profiling in development/staging, generate cachegrind output files with unique PID-based filenames, analyze in KCacheGrind using flat profile, call tree, and source annotation to find line-level bottlenecks, clean up files after investigation — understanding that Xdebug is a development/staging-only tool due to 50-200% overhead and never to be used in production.

## When To Use
- Development and staging environments for deep per-request analysis
- Single-request profiling where exact measurements are needed
- Teams using PHPStorm's built-in profiler integration
- Educational purposes: understanding call graphs and inclusive/exclusive time

## When NOT To Use
- In production (50-200% overhead)
- For continuous monitoring (use Tideways or Blackfire)
- When per-request overhead must be minimal (use SPX <5%)
- When aggregated metrics across many requests are needed (Xdebug is per-request)

## Prerequisites
- Xdebug 3 installed (PECL or distro package)
- KCacheGrind (Linux) or QCacheGrind (Windows/Mac) installed
- PHP-FPM or CLI access

## Inputs
- Target endpoint URL for profiling
- Cachegrind output directory

## Workflow

### 1. Configure Xdebug 3 for Profiling
- `xdebug.mode=profile`
- `xdebug.output_dir=/tmp/profiling`
- `xdebug.profiler_output_name=cachegrind.out.%p` (include PID to prevent overwrite)
- `xdebug.start_with_request=trigger` (trigger-based, not always-on)
- Restart PHP-FPM

### 2. Trigger Profiling on Target Request
- Via GET: `?XDEBUG_PROFILE=1`
- Via cookie: `-b "XDEBUG_PROFILE=1"`
- Via POST param: include `XDEBUG_PROFILE=1` in POST body
- Always use trigger-based — never always-on even in staging

### 3. Open in KCacheGrind
- Launch: `kcachegrind /tmp/profiling/cachegrind.out.<PID>`
- Flat Profile tab: sort by Inclusive Time descending
- Double-click top function → see call graph

### 4. Follow Hot Path to Optimization Target
- In call graph: click most expensive child, repeat
- Stop at leaf function with high Self Time (exclusive time)
- Use 20% heuristic: self >20% of inclusive = optimize directly

### 5. Use Source Annotation
- Click the target function
- Switch to "Source" tab
- Lines highlighted by cost — red = most expensive
- Identify exact line(s) causing the bottleneck
- Example: line 46 `$stmt->execute()` = 370ms → optimize that query

### 6. Clean Up Cachegrind Files
- Delete files after each investigation session
- `rm /tmp/profiling/cachegrind.out.*`
- Never leave cachegrind files on disk — they accumulate and may leak internals
- Archive important before/after profiles to secured storage if needed

## Validation Checklist
- [ ] Xdebug profiling configured (trigger-based, PID in filename)
- [ ] Output directory created with appropriate permissions
- [ ] Cachegrind file generated for target endpoint
- [ ] File opened in KCacheGrind/QCacheGrind
- [ ] Hot path followed to leaf with high self time
- [ ] Source annotation viewed for line-level bottleneck
- [ ] Cachegrind files cleaned up after investigation
- [ ] No Xdebug profiling active in production configuration

## Related Rules
- Never in production (`05-rules.md:1`)
- Trigger-based, never always-on (`05-rules.md:25`)
- Unique filenames with PID (`05-rules.md:50`)
- Source annotation for line-level cost (`05-rules.md:74`)
- Clean up after each session (`05-rules.md:102`)

## Related Skills
- Inclusive vs Exclusive Time Analysis
- Callgraph Analysis Techniques
- Flame Graph Generation and Interpretation
- SPX Self-Hosted Profiling

## Success Criteria
- Xdebug configured with trigger-based profiling and PID-based filenames
- Cachegrind file generated and opened in KCacheGrind
- Hot path followed to leaf with high self time
- Source annotation identifies exact line-level bottleneck
- Files cleaned up after investigation
- Production configuration confirmed Xdebug-free
