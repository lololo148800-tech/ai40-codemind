# AI40 Studio and Data Connectors

AI Studio routes a goal to the most appropriate existing AI40 workflow. It distinguishes between a workflow that is ready now, a brief that prepares a later media job, and an external connector that still needs user-authorized access. This distinction is deliberate: a card never claims to have generated media, read a private account or executed a repository change until there is evidence of that action.

| Goal | AI40 path | Actual result now |
|---|---|---|
| Code, bots, apps, AI systems | Agent Runbook, local review, Test Lab and CI | Plan, review, evidence and approval boundary |
| Websites and public links | Link Explorer and public website analysis | Limited public HTML analysis and user-selected link trail |
| Images, audio, video, slides and data | Create-mode brief | Prompt/specification; a separate available server job must be explicitly run |
| Fresh GitHub, Google, Manus or social data | Connector status centre | Minimal-scope connection plan, never hidden OAuth or scraping |

The connector status centre has no token field in the mobile bundle. GitHub, browser, Google, Manus, Telegram and social-service links show their least-privilege next step and a clear boundary. Private content needs the service's official connector or a user-authorized browser session; CAPTCHA, paywalls, login barriers and third-party session data are not bypassed.
