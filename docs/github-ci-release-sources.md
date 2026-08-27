# Verified CI and Android Release References

The future Android release workflow uses a separate manual approval path. It must not reuse the pull-request quality gate and must never commit signing credentials or upload hidden files accidentally.

| Component | Verified use in AI40 workflow | Source |
|---|---|---|
| Gradle setup | Use `gradle/actions/setup-gradle@v6`; it validates the Gradle wrapper and configures Gradle caching. | [Gradle on GitHub Actions](https://docs.gradle.org/current/userguide/github-actions.html) |
| Java setup | Configure a known Temurin JDK with `actions/setup-java`; this action sets `JAVA_HOME` and supports Gradle dependency caching. | [actions/setup-java](https://github.com/actions/setup-java) |
| Build artifacts | Upload only named APK/AAB outputs with `actions/upload-artifact`; artifacts have SHA-256 digests and hidden files are excluded by default. | [GitHub artifact guide](https://docs.github.com/en/actions/tutorials/store-and-share-data) [upload-artifact](https://github.com/actions/upload-artifact) |

The dedicated workflow will remain `workflow_dispatch` only, run static checks before any Android artifact attempt, and expose no signing step until the user supplies Android release credentials through server-side CI secrets.
