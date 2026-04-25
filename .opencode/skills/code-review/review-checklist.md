# Review Checklist

Universal code review checklist, compatible with Codex and Claude.

## Priority Levels

- **P0**: Crash/Blocker - Fix immediately
- **P1**: Functional Error - Fix before release
- **P2**: Spec/Compatibility - Fix soon
- **P3**: Optimization - Fix when time permits

## Generic Checklist

### P0 - Crash/Blocker
- [ ] Null pointer dereference
- [ ] Undefined function/variable access
- [ ] Syntax errors
- [ ] Missing required imports
- [ ] Infinite loops
- [ ] Memory leaks (in long-running processes)

### P1 - Functional Errors
- [ ] Incorrect API parameter mapping
- [ ] Missing error handling
- [ ] Wrong event sequence
- [ ] Incorrect data transformation
- [ ] Missing fallback logic
- [ ] Parameter validation missing

### P2 - Spec/Compatibility
- [ ] API response format mismatch
- [ ] Missing required fields
- [ ] Incorrect default values
- [ ] Missing feature flags
- [ ] Deprecated API usage
- [ ] Version compatibility issues

### P3 - Optimization
- [ ] Duplicate code/functions
- [ ] Missing timeout handling
- [ ] Resource leaks (unclosed streams, etc.)
- [ ] Missing logging/debugging info
- [ ] Inefficient algorithms
- [ ] Missing input validation

## Project-Specific Checklist

### Node.js/JavaScript
- [ ] `require` vs `import` consistency
- [ ] Callback/Promise/async-await consistency
- [ ] Error handling in async functions
- [ ] Stream proper cleanup
- [ ] Event listener leaks

### API Proxy Projects
- [ ] Request/response format conversion correct
- [ ] Streaming support complete
- [ ] Error response format matches spec
- [ ] Timeout handling for upstream requests
- [ ] Client disconnect handling
- [ ] API documentation matches implementation

### DeepSeek/OpenAI API
- [ ] `reasoning_effort` mapping correct
- [ ] `thinking` mode properly configured
- [ ] `stream_options` set for usage info
- [ ] `completion_tokens_details` passed through
- [ ] `response_format` handling correct
- [ ] Tool call handling complete

## AI Collaboration Prompts

### For Codex/Claude

```
Please review [file/path] using this checklist:

1. Read the review checklist: `.opencode/skills/code-review/review-checklist.md`
2. Check P0 issues first (show stoppers)
3. Check P1 issues (functional errors)
4. Check P2 issues (spec compliance)
5. Check P3 issues (optimizations)
6. Generate prioritized issue list
7. Suggest fixes for each issue
```

### Detailed Review Prompt

```
Please do a detailed code review of [project/files]:

1. Use the review checklist at `.opencode/skills/code-review/review-checklist.md`
2. For each issue found:
   a. Mark priority (P0/P1/P2/P3)
   b. Describe the problem
   c. Show the location (file:line)
   d. Explain the impact
   e. Suggest a fix with code example
3. Output in markdown table format
4. Prioritize fixes (what to fix first)
```
