import { Probot } from "probot";

export = (app: Probot) => {
  app.on("pull_request_review_comment.created", async (context) => {
    const { comment, repository, pull_request, organization } = context.payload;

    console.log({
      owner: organization?.node_id,
      repo: repository.node_id,
      body: comment.body,
      issue_number: pull_request.number,
    });

    if (organization) {
      context.octokit.issues.createComment({
        owner: organization.node_id,
        repo: repository.node_id,
        body: comment.body,
        issue_number: pull_request.number,
      });
    }
  });
};
