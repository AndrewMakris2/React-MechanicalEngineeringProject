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
  variables: z.array(z.string()),
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

const DiagramElementSchema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('body'),
    id: z.string(),
    shape: z.enum(['block', 'point', 'beam']),
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
    direction: z.enum(['cw', 'ccw']),
  }),
  z.object({
    kind: z.literal('support'),
    at: z.string(),
    supportType: z.enum(['pin', 'roller', 'fixed']),
  }),
])

const DiagramSpecSchema = z.object({
  type: z.enum(['fbd', 'none']),
  elements: z.array(DiagramElementSchema),
  notes: z.string().nullable().optional(),
})

const UnitsParsedSchema = z.object({
  quantity: z.string(),
  value: z.string().nullable().optional(),
  units: z.string().nullable().optional(),
})

const UnitsIssueSchema = z.object({
  issue: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  tip: z.string(),
})

const ConfidenceSchema = z.object({
  parsing: z.number().min(0).max(1),
  domain: z.number().min(0).max(1),
  units: z.number().min(0).max(1),
})

export const ResultSchema = z.object({
  detectedDomain: z.enum(['statics', 'dynamics', 'thermo', 'fluids', 'unknown']),
  problemSummary: z.string(),
  knowns: z.array(KnownVarSchema),
  unknowns: z.array(UnknownVarSchema),
  assumptions: z.array(AssumptionSchema),
  governingEquations: z.array(GoverningEquationSchema),
  solutionOutline: z.array(SolutionStepSchema),
  commonMistakes: z.array(CommonMistakeSchema),
  diagramSpec: DiagramSpecSchema,
  units: z.object({
    parsed: z.array(UnitsParsedSchema),
    issues: z.array(UnitsIssueSchema),
  }),
  confidence: ConfidenceSchema,
})

export type Result = z.infer<typeof ResultSchema>
export type KnownVar = z.infer<typeof KnownVarSchema>
export type UnknownVar = z.infer<typeof UnknownVarSchema>
export type DiagramElement = z.infer<typeof DiagramElementSchema>
export type DiagramSpec = z.infer<typeof DiagramSpecSchema>
export type UnitsIssue = z.infer<typeof UnitsIssueSchema>