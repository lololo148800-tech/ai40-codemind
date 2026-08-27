# AI40 AutoImprove Lab

AutoImprove Lab is an **owner-admin-only planning surface**, not an unrestricted self-modifying agent. The owner enters a goal, selects an improvement area and receives a candidate workflow with a transparent chat profile, risk classification, acceptance criteria and evidence requirements.

| Stage | AI40 can do | Owner-admin approval is required |
|---|---|---|
| Scope | Classify the request, choose a bounded profile and identify risk | No external action occurs |
| Candidate | Prepare a reviewable change proposal and a test plan | Before any file or repository change |
| Verify | Describe the required typecheck, lint, test and CI evidence | Before launching a privileged CI or worker task |
| Apply | Present the evidence and the decision point | Before merge, deployment, publish, data mutation or secret use |

Adaptive chat profiles are explicit task instructions used by the existing server-side assistant: **Practical dialog**, **Researcher**, **Engineer**, **Code reviewer** and **Producer**. They route response structure by the user's message and task mode; they do not introduce new tools, hidden permissions or copied proprietary prompts.

> The Lab never consumes pasted secrets, disables safeguards, runs arbitrary shell commands, changes source files, merges branches or publishes itself. These are separate, auditable operations that require specific owner-admin approval and external evidence.
