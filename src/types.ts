export type Category = 'Idea' | 'MVP' | 'Launch' | 'Users' | 'Pitch' | 'Demo'
export type CriterionStatus = 'Not started' | 'In progress' | 'Ready' | 'Needs work'
export type CheckType = 'manual' | 'github' | 'deployment' | 'database'

export type Criterion = {
  id: string
  project_id: string
  owner_id: string
  title: string
  description: string
  category: Category
  status: CriterionStatus
  check_type: CheckType
  evidence_url: string | null
  sort_order: number
  updated_at: string
}

export type Project = {
  id: string
  owner_id: string
  name: string
  idea: string
  github_url: string | null
  deployment_url: string | null
  created_at: string
}

export type CheckRun = {
  id: string
  project_id: string
  owner_id: string
  status: 'passed' | 'partial' | 'failed'
  summary: string
  details: Record<string, unknown>
  created_at: string
}

export type AuthUser = { id: string; email: string }
export type SignupMetric = { id: boolean; verified_user_count: number; updated_at: string }

