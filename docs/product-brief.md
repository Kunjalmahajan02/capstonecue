# CapstoneCue — product and validation brief

## Product hypothesis

**CapstoneCue** is a demo-day preflight and rehearsal workspace for students shipping a software capstone. In the final stretch before review, it brings submission evidence together:

- a capstone checklist with status and reviewer-openable evidence links;
- public GitHub and Vercel reachability checks;
- a real three-minute rehearsal timer with timed cues;
- a six-slide pitch outline and panel question prompts;
- a confirmed-account metric that never counts seeded demo data.

The main job is not to replace code hosting or a full project planner. It is to help a student catch submission problems and deliver a focused demo in the last days before review.

## User and problem

**First user:** an individual student or small team with a web app due for capstone review or demo day.

**Problem hypothesis:** students may finish the product but lose time assembling proof and rehearsing the live handoff. GitHub, the public app, database evidence, signup results, slides, and the live demo can be in separate places. A missing or inaccessible artifact can weaken an otherwise working submission.

The user's earlier 30/100 result and supplied Project 5 rubric make this personally relevant. They do not prove that other students share the problem or would use CapstoneCue.

## Competitive scan and positioning

This is a quick public-web scan, not an exhaustive competitor, domain, or trademark review.

- **LaunchProof** already names a launch-readiness and security product for AI-built websites ([product](https://trylaunchproof.com/), [documentation](https://trylaunchproof.com/docs/)). CapstoneCue avoids that name and does not position itself as a security scanner.
- **RubricTrail** is a close adjacent product: it turns assignment briefs and rubrics into an evidence-linked student plan ([project README](https://github.com/Sion612/rubrictrail)). A generic rubric-to-checklist claim would overlap with it. CapstoneCue narrows its first job to the end-of-project demo-day handoff: public-link preflight, timed rehearsal, and reviewer materials.
- **GitHub Projects** already provides customizable tables, boards, roadmaps, charts, and issue-linked planning ([GitHub Docs](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)). CapstoneCue should complement existing planning workflows rather than compete as another task board.
- **Canvas Enhanced Rubrics** supports instructor-created grading rubrics attached to assignments and other graded work ([Instructure guide](https://community.instructure.com/en/kb/articles/661577-unknown)). CapstoneCue is student-facing and focused on proving a public software demo works.

These alternatives show the surrounding categories and the overlap risk. They do not establish a validated market gap or prove CapstoneCue is unique. Test this positioning with capstone students and mentors before making stronger claims.

## Validation plan

Before making a market-size or product-market-fit claim:

1. Interview 3–5 students who have presented a software capstone or demo.
2. Ask how they prepared their last submission. Do not pitch the solution first.
3. Record which evidence was hard to assemble, what they already use, and whether demo rehearsal was a problem.
4. Show the prototype and ask each participant to complete one setup and one link check.
5. Count a user only after they personally create and confirm an account. Keep interviews, visits, and signups separate.

**Current validation status:** no external student interviews or user signups are claimed yet. The founder cannot rely on an existing group of ten invitees. A public signup flow and a channel-by-channel launch plan help, but cannot create real users without distribution.

## Capstone acceptance mapping

- Original idea: problem statement and competitor/validation plan are visible; distinctiveness remains a hypothesis until tested.
- Live public product: deploy the full app and pitch page to Vercel.
- Functional database: Supabase Auth and Postgres with row-level security; checklist CRUD must persist after refresh.
- User traction: show only confirmed account counts; the 10-person target stays open until real users arrive.
- 5–7 slide pitch: six-slide pitch page is included.
- Three-minute live demo: rehearsal timer, cue order, and run sheet are included.
- Industry panel: question prompts and evidence-focused answer guidance are included.
- GitHub and deployment links: provide the complete source repository and public Vercel URL after both are live.

## Technical direction

- React + TypeScript + Vite
- Supabase Auth and Postgres, with per-user RLS policies
- Supabase Realtime for cross-tab checklist updates
- Vercel static hosting and a Node.js function for restricted public-link checks
- Browser uses only the Supabase public anon key; never expose a service-role key

Required Vercel environment values: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.

Apply supabase/schema.sql to the Supabase project before creating an account. See the root README for setup steps.

## Source of project requirements

The Project 5 screenshot supplied by the user lists the capstone checklist, demo-day requirements, and late-submission context. It is the rubric reference for this build, not an independent product instruction.

