export interface GbPlanPost {
  id: string; week: number; day: number; campaignId: string;
  title: string; objective: string; idea: string; copy: string;
  sessionId?: string; revision?: number; attemptId?: string; startedAt?: number; startSeq?: number;
  status: 'pending' | 'generating' | 'ready' | 'error'; error?: string;
}
export interface GbPlan { id: string; createdAt: number; posts: GbPlanPost[] }
export interface GbPlanInput {
  campaigns: { id: string; title: string; objective: string; audience: string; message: string; brief: string }[];
  posts: { week: number; day: number; campaignId: string; title: string; objective: string; idea: string; copy: string }[];
}

export function validateGbPlan(input: unknown, existingIds: string[]): GbPlanInput {
  if (!input || typeof input !== 'object') throw new Error('Plan inválido.')
  const value = input as GbPlanInput
  if (!Array.isArray(value.campaigns) || value.campaigns.length > 20 || !Array.isArray(value.posts) || value.posts.length !== 20) throw new Error('El plan debe contener exactamente 20 publicaciones.')
  const text = (value: unknown, max: number) => typeof value === 'string' && value.trim().length > 0 && value.length <= max
  const ids = new Set(existingIds)
  for (const campaign of value.campaigns) {
    if (!campaign || !text(campaign.id, 80) || ids.has(campaign.id) || !['title', 'objective', 'audience', 'message', 'brief'].every(key => text(campaign[key as keyof typeof campaign], key === 'brief' ? 6000 : 500))) throw new Error('Campaña nueva inválida o repetida.')
    ids.add(campaign.id)
  }
  const slots = new Set<string>()
  for (const post of value.posts) {
    if (!post || !Number.isInteger(post.week) || post.week < 1 || post.week > 4 || !Number.isInteger(post.day) || post.day < 1 || post.day > 5 || !ids.has(post.campaignId)) throw new Error('Semana, día o campaña inválidos.')
    const slot = `${post.week}:${post.day}`
    if (slots.has(slot)) throw new Error('Hay publicaciones repetidas para el mismo día.')
    slots.add(slot)
    if (!['title', 'objective', 'idea', 'copy'].every(key => text(post[key as keyof typeof post], key === 'title' ? 300 : 2000))) throw new Error('Completá título, objetivo, idea y copy de cada publicación.')
  }
  return value
}

export const GB_PLAN_PROMPT = 'Generá un plan de contenidos de cuatro semanas, cinco publicaciones de lunes a viernes por semana, sin fechas concretas. Usá las campañas existentes y proponé nuevas solo cuando aporten una idea diferente. Para cada publicación definí título, objetivo, idea de una placa individual y copy. Consultá el contexto de campañas e insumos de GB. Guardá las 20 publicaciones mediante save_gb_plan (week 1–4, day 1–5); no publiques diseños ni generes placas todavía. Si la herramienta rechaza el plan, corregilo. No afirmes que quedó guardado hasta que la herramienta lo confirme.'
