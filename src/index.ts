import { Probot } from "probot";
import { inc as semverInc } from "semver";

const botName = "version-and-merge-bot[bot]";
const isAddressingBotMatcher = new RegExp("@stdiopttybot");

type Command = "merge" | "version";
type Version = "major" | "minor" | "patch" | "prerelease";
type PrereleaseId = string;
type VersionCommand = [Command, Version];
type PrereleaseVersionCommand = [Command, Version, PrereleaseId];
interface FileData {
  content: string;
  sha: string;
}
interface PackageJSON {
  version: string;
}

function parseComment(
  comment: string
): VersionCommand | PrereleaseVersionCommand | undefined {
  const [addressing, command, version, prereleaseId] = comment.split(" ");

  if (isAddressingBotMatcher.test(addressing)) {
    if (version === "prerelease") {
      return [command as Command, version as Version, prereleaseId];
    } else {
      return [command as Command, version as Version];
    }
  }

  return;
}

export = (app: Probot) => {
  app.on("issue_comment.created", async (context) => {
    const { comment, issue, repository } = context.payload;
    const isBot = comment.user.login === botName;
    let botComment;

    try {
      const pullRequest = await context.octokit.pulls.get({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: issue.number,
      });

      const branch = pullRequest.data.head.ref;

      if (isBot) return;

      const parsed = parseComment(comment.body);

      if (parsed) {
        const [command, version, prereleaseId] = parsed;

        if (command === "version") {
          const file = await context.octokit.repos.getContent({
            owner: repository.owner.login,
            repo: repository.name,
            path: "package.json",
            ref: branch,
          });

          const data = file.data as unknown as FileData;
          const sha = data.sha;

          const json = JSON.parse(
            Buffer.from(data.content, "base64").toString()
          ) as PackageJSON;

          const { version: packageVersion } = json;
          let nextVersion;

          if (version === "prerelease" && prereleaseId) {
            nextVersion = semverInc(packageVersion, version, prereleaseId);
          } else if (version !== "prerelease") {
            nextVersion = semverInc(packageVersion, version);
          }

          const nextJson = JSON.stringify(
            {
              ...json,
              version: nextVersion,
            },
            null,
            2
          );

          const nextContent = Buffer.from(nextJson).toString("base64");

          botComment = await context.octokit.issues.createComment({
            owner: repository.owner.login,
            repo: repository.name,
            body: `Thanks @${comment.user.login}. Updating the version now.`,
            issue_number: issue.number,
          });

          await context.octokit.repos.createOrUpdateFileContents({
            owner: repository.owner.login,
            repo: repository.name,
            path: "package.json",
            message: `Set version ${nextVersion}`,
            content: nextContent,
            sha,
            branch,
          });

          if (botComment) {
            await context.octokit.issues.updateComment({
              owner: repository.owner.login,
              repo: repository.name,
              comment_id: botComment.data.id,
              body: `✅ Thanks @${comment.user.login}. Version updated to ${nextVersion}.`,
            });
          }
        }
      }
    } catch (error) {
      let githubError = error as GitHubError;

      if (githubError?.message) {
        if (botComment) {
          await context.octokit.issues.updateComment({
            owner: repository.owner.login,
            repo: repository.name,
            comment_id: botComment.data.id,
            body: `❌ Unable to update version:

\`\`\`
${githubError.message}
\`\`\`
`,
          });
        }
      }
    }
  });
};

interface GitHubError {
  message: string;
}
