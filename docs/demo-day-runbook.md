# CapstoneCue demo-day runbook

## Before presenting

- Replace the sample project name and problem in Workspace Settings.
- Use the Supabase-backed account, not local demo mode.
- Add and verify the public GitHub repository and Vercel URL.
- Create a test criterion, refresh the page, and show that the change persisted.
- Add evidence links that the panel can open without signing in.
- Replace every validation prompt in the six-slide pitch with actual findings.
- Record the actual confirmed account count. Do not count visits, interviews, or seeded data as signups.
- Close tabs or browser panels that reveal email addresses, keys, or private Supabase information.
- Open the public pitch page and test keyboard navigation before screen sharing.
- Run the three-minute rehearsal timer at least twice. Do not reset it during the actual demo.

## Three-minute script

### 0:00–0:25 — Problem
“Capstone reviews ask us to prove the product is public, the database works, people signed up, and the demo fits the time. Those pieces can be spread across a repository, a deployed app, screenshots, and slides. CapstoneCue tests whether one demo-day preflight can make that handoff easier.”

Only say that students have this problem broadly if interview evidence supports it.

### 0:25–1:05 — Workspace
Open Overview and Requirements. Show the project stages, the ten rubric-aligned requirements, status control, and an evidence URL. Explain that a green status is a team judgment unless a live check explicitly verifies it.

### 1:05–1:50 — Public checks
Open Settings and point to the repository and deployment links. Return to Overview and run both checks. Explain the boundary: a link response confirms reachability, not security, correct behavior, or database quality.

### 1:50–2:20 — Persistence
Change a requirement status or evidence link, refresh, and show that it remains. If the database is not configured or the save does not persist, stop and describe the gap; do not present demo mode as database evidence.

### 2:20–2:45 — User evidence
Show the email-confirmed account count and one real feedback finding. If there are no external signups or interviews, say so and state the next channel test.

### 2:45–3:00 — Close
Summarize the next milestone in one sentence and make a specific ask, such as introductions to students who have recently completed a software capstone.

## Panel questions

- **How do you know students need this?** Describe the interview sample, what they said, and what changed. If the sample is still zero, call this a hypothesis.
- **How is it different from planning software?** Show the final handoff: link preflight, three-minute rehearsal, and evidence reviewers can open. Acknowledge adjacent rubric planners.
- **How will you reach ten users?** Name a channel and report completed confirmed signups separately from outreach and visits.
- **What does a successful link check mean?** The public endpoint responded at that moment. It does not prove security, database persistence, or product quality.
- **How is user data protected?** Explain Supabase Auth, per-user row-level security, aggregate-only signup count, and that the browser never gets a service-role key.
- **What is the biggest risk?** The differentiation and willingness to use a separate capstone tool are unvalidated. Existing project and rubric tools may be sufficient.
- **How might it make money?** A free individual workflow and paid team or mentor review are hypotheses; pricing must wait for observed repeated use and willingness-to-pay tests.

## Evidence log

Use this during practice and update it after real conversations:

| Date | Participant type | Observation / quote | Product change | Follow-up |
| --- | --- | --- | --- | --- |
| Not yet collected | — | No external interview claimed | — | Recruit through one relevant channel |

Keep participant names, emails, or class details private. Obtain permission before quoting someone in a public deck.

