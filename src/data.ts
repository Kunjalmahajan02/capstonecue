import type { Category, Criterion, Project } from './types'

export const categoryOrder: Category[] = ['Idea', 'MVP', 'Launch', 'Users', 'Pitch', 'Demo']

export const demoProject: Project = {
  id: 'demo-project',
  owner_id: 'demo-user',
  name: 'My capstone',
  idea: '',
  github_url: null,
  deployment_url: null,
  created_at: new Date().toISOString(),
}

export const demoCriteria: Criterion[] = [
  { id: 'c1', project_id: 'demo-project', owner_id: 'demo-user', title: 'Validate an original problem', description: 'Write a focused problem statement, compare existing solutions, and capture real feedback before committing to the MVP.', category: 'Idea', status: 'Not started', check_type: 'manual', evidence_url: null, sort_order: 0, updated_at: new Date().toISOString() },
  { id: 'c2', project_id: 'demo-project', owner_id: 'demo-user', title: 'Build the MVP around one core workflow', description: 'A new user can sign up, create a launch workspace, and manage a rubric with persistent evidence.', category: 'MVP', status: 'Not started', check_type: 'manual', evidence_url: null, sort_order: 1, updated_at: new Date().toISOString() },
  { id: 'c3', project_id: 'demo-project', owner_id: 'demo-user', title: 'Public product deployment responds', description: 'The production URL is public, loads without an account, and the core product is reachable.', category: 'Launch', status: 'Not started', check_type: 'deployment', evidence_url: null, sort_order: 2, updated_at: new Date().toISOString() },
  { id: 'c4', project_id: 'demo-project', owner_id: 'demo-user', title: 'Public GitHub repository is readable', description: 'The repository is public, contains the complete source, and includes setup and deployment instructions.', category: 'Launch', status: 'Not started', check_type: 'github', evidence_url: null, sort_order: 3, updated_at: new Date().toISOString() },
  { id: 'c5', project_id: 'demo-project', owner_id: 'demo-user', title: 'Functional database integration', description: 'Create and edit a requirement, reload the app, and confirm the change persisted in Postgres under row-level security.', category: 'Launch', status: 'Not started', check_type: 'database', evidence_url: null, sort_order: 4, updated_at: new Date().toISOString() },
  { id: 'c6', project_id: 'demo-project', owner_id: 'demo-user', title: 'Get the first real user signup', description: 'Verify a real person completed account signup. Demo accounts and seeded checklist data do not count.', category: 'Users', status: 'Not started', check_type: 'manual', evidence_url: null, sort_order: 5, updated_at: new Date().toISOString() },
  { id: 'c7', project_id: 'demo-project', owner_id: 'demo-user', title: 'Reach 10 real users', description: 'Track confirmed signups and where they came from. Keep this count honest and distinguish users from visits.', category: 'Users', status: 'Not started', check_type: 'manual', evidence_url: null, sort_order: 6, updated_at: new Date().toISOString() },
  { id: 'c8', project_id: 'demo-project', owner_id: 'demo-user', title: 'Prepare a 5–7 slide pitch deck', description: 'Cover the problem, customer, product, validation, launch model, current evidence, and next ask.', category: 'Pitch', status: 'Not started', check_type: 'manual', evidence_url: null, sort_order: 7, updated_at: new Date().toISOString() },
  { id: 'c9', project_id: 'demo-project', owner_id: 'demo-user', title: 'Rehearse a 3-minute live demo', description: 'Practice the core workflow, database persistence, link checks, and one honest user result.', category: 'Demo', status: 'Not started', check_type: 'manual', evidence_url: null, sort_order: 8, updated_at: new Date().toISOString() },
  { id: 'c10', project_id: 'demo-project', owner_id: 'demo-user', title: 'Prepare for the industry panel', description: 'Know your alternatives, user evidence, security model, costs, and next milestone.', category: 'Pitch', status: 'Not started', check_type: 'manual', evidence_url: null, sort_order: 9, updated_at: new Date().toISOString() },
]

export function makeStarterCriteria(projectId: string, ownerId: string): Omit<Criterion, 'id' | 'updated_at'>[] {
  return demoCriteria.map((item) => ({
    project_id: projectId,
    owner_id: ownerId,
    title: item.title,
    description: item.description,
    category: item.category,
    status: 'Not started',
    check_type: item.check_type,
    evidence_url: null,
    sort_order: item.sort_order,
  }))
}


