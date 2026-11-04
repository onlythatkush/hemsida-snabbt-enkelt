import { z } from 'zod'
import type { ApplicationInput } from './types'
import { FAMILIES } from './families'
import { INDUSTRY_KEYWORDS } from './keywords'

const industries = Object.keys(INDUSTRY_KEYWORDS) as [keyof typeof INDUSTRY_KEYWORDS, ...(keyof typeof INDUSTRY_KEYWORDS)[]]
const families = Object.keys(FAMILIES) as [keyof typeof FAMILIES, ...(keyof typeof FAMILIES)[]]
export const DesignPlanSchema = z.object({
  mainBusiness: z.string(),
  industry: z.enum(industries),
  services: z.array(z.string()),
  targetAudience: z.array(z.string()),
  style: z.object({ tone: z.string(), colors: z.array(z.string()), imageStyle: z.string() }),
  customerGoal: z.string(),
  template: z.enum(families),
  pageStructure: z.array(z.string()),
  keywords: z.array(z.string()),
  confidence: z.number().min(0).max(1),
})
export type DesignPlan = z.infer<typeof DesignPlanSchema>

export async function analyzeApplication(app: ApplicationInput): Promise<DesignPlan> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OpenAI is not configured')
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + key, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: process.env.OPENAI_DESIGN_MODEL || 'gpt-4.1-mini',
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: 'Return only JSON with mainBusiness, industry, services, targetAudience, style (tone, colors, imageStyle), customerGoal, template, pageStructure, keywords, confidence. Use Swedish. Choose industry from ' + industries.join(', ') + '. Choose template from ' + families.join(', ') + '. Only describe services supported by the customer application. Do not confuse cleaning or moving with automotive. pageStructure must include hero, services, contact.' },
        { role: 'user', content: JSON.stringify(app) },
      ],
    }),
  })
  if (!response.ok) throw new Error('OpenAI analysis failed: ' + response.status)
  const data = await response.json()
  const plan = DesignPlanSchema.parse(JSON.parse(data.choices[0].message.content))
  if (plan.confidence < 0.85) throw new Error('Low-confidence analysis requires review')
  return plan
}
