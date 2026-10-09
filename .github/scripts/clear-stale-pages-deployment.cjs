// Recover the deployment left running by the former, overlapping Pages workflows.
module.exports = async function clearStaleDeployment({
  github, context, core, deploymentId,
  wait = () => new Promise(resolve => setTimeout(resolve, 5000)),
}) {
  const parameters = { ...context.repo, deploymentId };
  const terminal = new Set([
    "succeed", "deployment_failed", "deployment_content_failed",
    "deployment_cancelled", "deployment_lost",
  ]);
  const status = async () => {
    try {
      const { data } = await github.request(
        "GET /repos/{owner}/{repo}/pages/deployments/{deploymentId}", parameters,
      );
      return data.status;
    } catch (error) {
      if (error.status === 404) return "not_found";
      throw error;
    }
  };
  const finished = value => value === "not_found" || terminal.has(value);
  if (finished(await status())) {
    core.info("The earlier Pages deployment is no longer active.");
    return;
  }
  core.info(`Cancelling the earlier Pages deployment ${deploymentId}.`);
  try {
    await github.request(
      "POST /repos/{owner}/{repo}/pages/deployments/{deploymentId}/cancel", parameters,
    );
  } catch (error) {
    // It may finish between the status check and the cancellation request.
    if (![400, 404, 409].includes(error.status) || !finished(await status())) throw error;
    return;
  }
  for (let attempt = 0; attempt < 12; attempt++) {
    if (finished(await status())) {
      core.info("The earlier Pages deployment has stopped; publishing can proceed.");
      return;
    }
    await wait();
  }
  throw new Error(`Pages deployment ${deploymentId} has not stopped after 60 seconds. Retry this workflow after GitHub finishes cancelling it.`);
};
