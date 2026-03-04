import { z } from 'zod'

const KnownVarSchema = z.object({
  name: z.string(),
  symbol: z.string().nullable().optional(),
  value: z.string().nullable().optional(),
  units: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const UnknownVarSchema = z.object({
  name: z.string(),
  symbol: z.string().nullable().optional(),
  units: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})

const AssumptionSchema = z.object({
  assumption: z.string(),
  whyItMatters: z.string().nullable().optional(),
})

const GoverningEquationSchema = z.object({
  equation: z.string(),
  whenToUse: z.string().nullable().optional(),
  variables: z.array(z.string()).default([]),
})

const SolutionStepSchema = z.object({
  step: z.number(),
  title: z.string(),
  details: z.string(),
})

const CommonMistakeSchema = z.object({
  mistake: z.string(),
  avoidanceTip: z.string(),
})

const DiagramElementSchema = z.union([
  z.object({
    kind: z.literal('body'),
    id: z.string(),
    shape: z.enum(['block', 'point', 'beam']).default('block'),
    label: z.string(),
    x: z.number(),
    y: z.number(),
    w: z.number(),
    h: z.number(),
  }),
  z.object({
    kind: z.literal('force'),
    from: z.string(),
    label: z.string(),
    fx: z.number(),
    fy: z.number(),
  }),
  z.object({
    kind: z.literal('moment'),
    at: z.string(),
    label: z.string(),
    direction: z.enum(['cw', 'ccw']).default('cw'),
  }),
  z.object({
    kind: z.literal('support'),
    at: z.string(),
    supportType: z.enum(['pin', 'roller', 'fixed']).default('pin'),
  }),
  z.object({
    kind: z.string(),
  }).passthrough(),
])

const DiagramSpecSchema = z.object({
  type: z.enum(['fbd', 'none']).default('none'),
  elements: z.array(DiagramElementSchema).default([]),
  notes: z.string().nullable().optional(),
})

const UnitsIssueSchema = z.object({
  issue: z.string(),
  severity: z.enum(['low', 'medium', 'high']).default('low'),
  tip: z.string(),
})

const ConfidenceSchema = z.object({
  parsing: z.number().min(0).max(1).default(0.5),
  domain: z.number().min(0).max(1).default(0.5),
  units: z.number().min(0).max(1).default(0.5),
})

export const ResultSchema = z.object({
  detectedDomain: z.enum(['statics', 'dynamics', 'thermo', 'fluids', 'unknown']).default('unknown'),
  problemSummary: z.string().default(''),
  knowns: z.array(KnownVarSchema).default([]),
  unknowns: z.array(UnknownVarSchema).default([]),
  assumptions: z.array(AssumptionSchema).default([]),
  governingEquations: z.array(GoverningEquationSchema).default([]),
  solutionOutline: z.array(SolutionStepSchema).default([]),
  commonMistakes: z.array(CommonMistakeSchema).default([]),
  diagramSpec: DiagramSpecSchema.default({ type: 'none', elements: [], notes: null }),
  units: z.object({
    parsed: z.array(z.any()).default([]).transform(arr =>
      arr.map((item: unknown) => {
        if (typeof item !== 'object' || item === null) return { quantity: 'unknown', value: null, units: null }
        const i = item as Record<string, unknown>
        return {
          quantity: String(i.quantity ?? i.name ?? 'unknown'),
          value: i.value != null ? String(i.value) : null,
          units: String(i.units ?? i.unit ?? ''),
        }
      })
    ),
    issues: z.array(UnitsIssueSchema).default([]),
  }).default({ parsed: [], issues: [] }),
  confidence: ConfidenceSchema.default({ parsing: 0.5, domain: 0.5, units: 0.5 }),
})

export type Result = z.infer<typeof ResultSchema>
export type KnownVar = z.infer<typeof KnownVarSchema>
export type UnknownVar = z.infer<typeof UnknownVarSchema>
export type DiagramElement = z.infer<typeof DiagramElementSchema>
export type DiagramSpec = z.infer<typeof DiagramSpecSchema>
export type UnitsIssue = z.infer<typeof UnitsIssueSchema>