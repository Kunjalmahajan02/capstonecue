const timeout = (ms) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  return { controller, done: () => clearTimeout(timer) }
}

function githubRepo(input) {
  const url = new URL(input)
  if (url.protocol !== 'https:' || url.hostname.toLowerCase() !== 'github.com' || url.username || url.password || url.search || url.hash) throw new Error('Use a public https://github.com/owner/repository URL.')
  const parts = url.pathname.split('/').filter(Boolean)
  if (parts.length !== 2) throw new Error('Use a repository URL in the form github.com/owner/repository.')
  const owner = parts[0], repo = parts[1].replace(/\.git$/i, '')
  if (!/^[A-Za-z0-9-]{1,39}$/.test(owner) || !/^[A-Za-z0-9_.-]{1,100}$/.test(repo)) throw new Error('That GitHub repository path is invalid.')
  return { owner, repo }
}

function vercelDeployment(input) {
  const url = new URL(input)
  if (url.protocol !== 'https:' || !url.hostname.toLowerCase().endsWith('.vercel.app') || url.hostname.toLowerCase() === 'vercel.app' || url.username || url.password) throw new Error('Use a public https://your-project.vercel.app URL.')
  return url
}

async function checkGithub(input) {
  let path
  try { path = githubRepo(input) } catch (error) { return { ok: false, message: error.message } }
  const request = timeout(7000)
  try {
    const url = 'https://api.github.com/repos/' + encodeURIComponent(path.owner) + '/' + encodeURIComponent(path.repo)
    const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'CapstoneCue-Link-Check', 'X-GitHub-Api-Version': '2022-11-28' }, signal: request.controller.signal })
    if (response.status === 404) return { ok: false, message: 'Repository not found or not public.' }
    if (!response.ok) return { ok: false, message: 'GitHub returned HTTP ' + response.status + '.' }
    const repo = await response.json()
    if (repo.private) return { ok: false, message: 'Repository is private. Make it public for review.' }
    return { ok: true, message: 'Public repository found.', details: { defaultBranch: repo.default_branch, updatedAt: repo.updated_at } }
  } catch (error) {
    return { ok: false, message: error.name === 'AbortError' ? 'GitHub check timed out.' : 'Could not reach GitHub.' }
  } finally { request.done() }
}

async function checkDeployment(input) {
  let url
  try { url = vercelDeployment(input) } catch (error) { return { ok: false, message: error.message } }
  const request = timeout(8000)
  try {
    const response = await fetch(url.toString(), { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'CapstoneCue-Link-Check', Range: 'bytes=0-0' }, signal: request.controller.signal })
    const status = response.status
    const location = response.headers.get('location')
    if ([301, 302, 303, 307, 308].includes(status)) {
      if (!location) return { ok: false, message: 'Deployment redirected without a destination.' }
      const destination = new URL(location, url)
      if (destination.protocol !== 'https:' || !destination.hostname.toLowerCase().endsWith('.vercel.app')) return { ok: false, message: 'Deployment redirects outside vercel.app.' }
      const follow = await fetch(destination.toString(), { method: 'GET', redirect: 'manual', headers: { 'User-Agent': 'CapstoneCue-Link-Check', Range: 'bytes=0-0' }, signal: request.controller.signal })
      await follow.body?.cancel()
      return { ok: follow.status >= 200 && follow.status < 400, status: follow.status, message: follow.status >= 200 && follow.status < 400 ? 'Deployment responded.' : 'Deployment returned HTTP ' + follow.status + '.' }
    }
    await response.body?.cancel()
    return { ok: status >= 200 && status < 400, status, message: status >= 200 && status < 400 ? 'Deployment responded.' : 'Deployment returned HTTP ' + status + '.' }
  } catch (error) {
    return { ok: false, message: error.name === 'AbortError' ? 'Deployment check timed out.' : 'Could not reach the deployment.' }
  } finally { request.done() }
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST for a link check.' }) }
  const body = req.body && typeof req.body === 'object' ? req.body : {}
  if (typeof body.githubUrl !== 'string' || typeof body.deploymentUrl !== 'string') return res.status(400).json({ error: 'Enter both a public GitHub repository URL and a Vercel deployment URL.' })
  const [github, deployment] = await Promise.all([checkGithub(body.githubUrl), checkDeployment(body.deploymentUrl)])
  return res.status(200).json({ github, deployment, checkedAt: new Date().toISOString() })
}


