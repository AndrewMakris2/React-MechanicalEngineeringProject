interface PromptOptions {
  problemText: string
  subject: string
  allowFullSolution: boolean
  generateDiagram: boolean
  runUnitsCheck: boolean
}

export function buildPrompt(opts: PromptOptions): string {
  return `You are an expert engineering tutor. Analyze the following engineering problem and return ONLY valid JSON matching the exact schema below. No markdown, no explanation outside the JSON, no code fences.

RULES:
1. Return ONLY raw JSON — no text before or after.
2. Do NOT invent numbers or values not present in the problem.
3. ${opts.allowFullSolution ? 'You MAY include final numeric answers in solutionOutline.details.' : 'Do NOT include final numeric answers in solutionOutline.details. Show setup and method only.'}
4. ${opts.generateDiagram && (opts.subject === 'statics' || opts.subject === 'dynamics' || opts.subject === 'auto') ? 'Generate a diagramSpec for a Free Body Diagram with appropriate elements.' : 'Set diagramSpec.type to "none" and diagramSpec.elements to [].'}
5. ${opts.runUnitsCheck ? 'Populate units.parsed and units.issues with thorough dimensional analysis.' : 'Set units.parsed to [] and units.issues to [].'}
6. All confidence scores must be between 0.0 and 1.0.
7. For diagramSpec body elements: x, y are SVG coordinates (canvas 500x400); w, h are dimensions in pixels.
8. For diagramSpec force elements: fx, fy are force vector components in display units (scale to ~60-100px max arrow length).

SUBJECT HINT: ${opts.subject === 'auto' ? 'Auto-detect from content' : opts.subject}

PROBLEM:
${opts.problemText}

REQUIRED JSON SCHEMA:
{
  "detectedDomain": "statics" | "dynamics" | "thermo" | "fluids" | "unknown",
  "problemSummary": string,
  "knowns": [{ "name": string, "symbol": string|null, "value": string|null, "units": string|null, "notes": string|null }],
  "unknowns": [{ "name": string, "symbol": string|null, "units": string|null, "notes": string|null }],
  "assumptions": [{ "assumption": string, "whyItMatters": string|null }],
  "governingEquations": [{ "equation": string, "whenToUse": string|null, "variables": string[] }],
  "solutionOutline": [{ "step": number, "title": string, "details": string }],
  "commonMistakes": [{ "mistake": string, "avoidanceTip": string }],
  "diagramSpec": {
    "type": "fbd" | "none",
    "elements": [...],
    "notes": string|null
  },
  "units": {
    "parsed": [{ "quantity": string, "value": string|null, "units": string|null }],
    "issues": [{ "issue": string, "severity": "low"|"medium"|"high", "tip": string }]
  },
  "confidence": { "parsing": number, "domain": number, "units": number }
}
`
}