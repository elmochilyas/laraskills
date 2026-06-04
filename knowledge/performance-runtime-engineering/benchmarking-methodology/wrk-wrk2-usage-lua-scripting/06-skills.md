# Skill: Write wrk/wrk2 Lua Scripts with Custom Requests, Auth, and Response Handling

## Purpose
Write custom Lua scripts for wrk/wrk2 to simulate complex HTTP interactions — Dynamic URL generation, authentication token extraction and reuse, request pipelining, response body verification, and threshold-based rate progression — enabling realistic user journey simulation beyond single-endpoint benchmarks.

## When To Use
- wrk2 latency benchmarks requiring custom HTTP methods or headers
- Multi-step request flows (authenticate → fetch → update)
- Dynamic URL or payload generation based on request index
- Rate-limiting or connection-pool testing

## When NOT To Use
- Single-endpoint benchmarks (default wrk2 without Lua is simpler)
- Complex user journeys with think times (k6 is better suited)

## Prerequisites
- wrk2 installed (not wrk — wrk is closed-loop only)
- Lua 5.1+ runtime
- Target endpoint and expected response format

## Inputs
- Target URL pattern and HTTP method
- Authentication requirements (token endpoint, credentials)
- Request parameters or payload template
- Response verification criteria

## Workflow

### 1. Create Basic Lua Script Structure
```lua
-- Three hooks: setup, request, response
setup = function(thread)
    thread:set("counter", 0)
end

request = function()
    local counter = wrk.format("GET", "/api/endpoint")
    return counter
end

response = function(status, headers, body)
    -- optional response handling
end
```

### 2. Implement Dynamic URL Generation
- Use thread-local counter for unique URLs: `/users/${counter}`
- Read from prepared data arrays for realistic distribution
- Use `math.random` seeded per thread to avoid contention
- Example: `wrk.format("GET", "/api/products/" .. id_array[counter])`

### 3. Handle Authentication Tokens
- Extract token from auth endpoint in `setup()` function
- Add token to all subsequent requests via `wrk.headers["Authorization"]`
- Handle token refresh when receiving 401 responses in `response()` hook
- Be careful with token expiry during long benchmarks

### 4. Add Request Pipelining
- Use wrk's built-in pipelining with `-P` flag for simple cases
- For custom pipelining: return multiple formatted requests from `request()`
- Monitor latency interpretation — pipelined latency includes queuing delay

### 5. Verify Response Correctness
- Check status codes in `response()` hook
- Verify response body contains expected keys (optional, expensive)
- Track custom metrics: request latencies by endpoint pattern
- Use thread-local counters to track verification failures

### 6. Implement Rate Progression
- Start with wrk2 `--rate` at 50% of expected capacity
- Use Lua to increase rate in steps within a single run
- Monitor: output HDR histogram at each rate level
- Identify saturation point where p99 doubles

## Validation Checklist
- [ ] Lua script structure with setup, request, response hooks
- [ ] Dynamic URL generation using thread-local state
- [ ] Authentication token extraction and reuse
- [ ] Response verification with status code checking
- [ ] Rate progression to identify saturation point
- [ ] HDR histogram output enabled with `--latency`

## Related Rules
- wrk2 for latency benchmarks (`05-rules.md:1`)
- Lua for custom scenarios (`05-rules.md:28`)
- Thread-local state for thread safety (`05-rules.md:54`)
- HDR histogram output (`05-rules.md:80`)

## Related Skills
- Coordinated Omission
- Tool Selection by Layer
- k6 Scripting Thresholds Stages

## Success Criteria
- Lua script correctly implements three hooks (setup, request, response)
- Dynamic URL generation works with thread-local state
- Authentication tokens extracted and reused across requests
- Response verification tracks failures without skewing results
- Rate progression identifies saturation point
- HDR histograms produced for all rate levels
