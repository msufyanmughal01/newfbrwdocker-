// Subscription plan definitions
// invoicesPerMonth: null = unlimited

export const PLANS = {
  standard: {
    slug: 'standard',
    name: 'Standard',
    monthlyPrice: 0,           // free
    invoicesPerMonth: 3,
    color: '#16a34a',
    description: 'Perfect for individuals getting started',
    features: [
      '3 invoices per month',
      'FBR submission (sandbox)',
      'PDF export & print',
      'Client management',
      'Basic dashboard',
    ],
  },
  growth: {
    slug: 'growth',
    name: 'Growth',
    monthlyPrice: 2500,
    invoicesPerMonth: 20,
    color: '#2563eb',
    description: 'For growing businesses with regular invoicing needs',
    features: [
      '20 invoices per month',
      'FBR production submission',
      'PDF export & print',
      'Client management',
      'Team members',
      'Priority support',
    ],
  },
  pro: {
    slug: 'pro',
    name: 'Pro',
    monthlyPrice: 6000,
    invoicesPerMonth: 100,
    color: '#7c3aed',
    description: 'For established businesses with high invoice volumes',
    features: [
      '100 invoices per month',
      'FBR production submission',
      'PDF export & print',
      'Client management',
      'Team members + Accountant access',
      'Advanced analytics',
      'Priority support',
    ],
  },
  unlimited: {
    slug: 'unlimited',
    name: 'Unlimited',
    monthlyPrice: 12500,
    invoicesPerMonth: null,
    color: '#dc2626',
    description: 'For high-volume businesses with no invoice limits',
    features: [
      'Unlimited invoices/month',
      'FBR production submission',
      'PDF export & print',
      'Client management',
      'Team members + Accountant access',
      'Advanced analytics',
      'Dedicated support',
      'Custom integrations',
    ],
  },
} as const;

export type PlanSlug = keyof typeof PLANS;

export const PLAN_LIST = Object.values(PLANS);

export function getPlan(slug: string | null | undefined) {
  return PLANS[(slug ?? 'standard') as PlanSlug] ?? PLANS.standard;
}
