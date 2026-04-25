# AI Analysis Prompt Template

Please do a deep analysis of {skillName} skill call records.

## Summary Statistics
{summary}

## Full Records
{records}

## Analysis Requirements

1. **Error Classification**: Classify failed calls (success=false) into:
   - **P0**: Crash/blocker - causes complete failure
   - **P1**: Functional error - incorrect behavior but can bypass
   - **P2**: Spec/compatibility issue
   - **P3**: Optimization suggestion

2. **Urgency Assessment**: 
   - For P0 errors: suggest immediate fix (auto-apply)
   - For P1-P3: can accumulate multiple improvements

3. **Improvement Suggestions**: Generate specific improvement list with:
   - Unique ID (e.g., "P0-1", "P2-3")
   - Severity level
   - Problem description
   - Suggested fix (include code examples if modifying js files)
   - Target files to modify (e.g., ["git-helper.js", "git-operations.md"])
   - Change type for version bump: "MAJOR", "MINOR", or "PATCH"

4. **Impact Assessment**:
   - Which improvements affect user experience?
   - Which are internal refactoring?
   - Suggest appropriate version bump type

## Output Format

**Important**: Return ONLY pure JSON (no markdown wrapping):

```json
{
  "needsImprovement": boolean,
  "urgentFixNeeded": boolean,
  "summary": "Brief analysis summary",
  "improvements": [
    {
      "id": "P0-1",
      "severity": "P0",
      "description": "Detailed problem description",
      "suggestion": "Fix suggestion with code example if applicable",
      "targetFiles": ["path/to/file.js", "path/to/file.md"],
      "changeType": "PATCH"
    }
  ]
}
```

## Notes for AI

- If `needsImprovement` is false, return empty improvements array
- If `urgentFixNeeded` is true, prioritize these fixes
- Be specific in suggestions - include actual code snippets for js file modifications
- For md file changes, describe what sections/paragraphs to add/modify
- Consider that P0 fixes should trigger immediate upgrade (PATCH version bump)
- Multiple P1-P3 improvements can be accumulated until threshold reached
