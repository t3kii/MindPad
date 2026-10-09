const { test } = require("node:test");
const assert = require("node:assert/strict");
const clearStaleDeployment = require("./clear-stale-pages-deployment.cjs");

function fixture(statuses, cancelError) {
  const calls = [];
  return {
    calls,
    options: {
      deploymentId: "old-deployment",
      context: { repo: { owner: "test-owner", repo: "test-repo" } },
      core: { info() {} },
      wait: async () => {},
      github: { async request(route, parameters) {
        calls.push({ route, parameters });
        if (route.startsWith("POST")) {
          if (cancelError) throw cancelError;
          return { data: {} };
        }
        const value = statuses.length > 1 ? statuses.shift() : statuses[0];
        if (value instanceof Error) throw value;
        return { data: { status: value } };
      } },
    },
  };
}
const httpError = status => Object.assign(new Error(`HTTP ${status}`), { status });

test("cancels the identified older deployment and waits until cancellation completes", async () => {
  const f = fixture(["deployment_in_progress", "deployment_in_progress", "deployment_cancelled"]);
  await clearStaleDeployment(f.options);
  const cancellations = f.calls.filter(call => call.route.startsWith("POST"));
  assert.equal(cancellations.length, 1);
  assert.equal(cancellations[0].parameters.deploymentId, "old-deployment");
  assert.equal(f.calls.length, 4);
});
test("does not cancel an already completed deployment", async () => {
  const f = fixture(["succeed"]);
  await clearStaleDeployment(f.options);
  assert.equal(f.calls.length, 1);
});
test("a missing historical deployment does not block publishing", async () => {
  const f = fixture([httpError(404)]);
  await clearStaleDeployment(f.options);
  assert.equal(f.calls.length, 1);
});
test("handles the older deployment finishing during the cancellation request", async () => {
  const f = fixture(["deployment_in_progress", "succeed"], httpError(400));
  await clearStaleDeployment(f.options);
});
test("surfaces permissions errors instead of silently proceeding", async () => {
  const f = fixture([httpError(403)]);
  await assert.rejects(clearStaleDeployment(f.options), /HTTP 403/);
});
test("does not publish while the earlier deployment remains active", async () => {
  const f = fixture(["deployment_in_progress"]);
  await assert.rejects(clearStaleDeployment(f.options), /has not stopped after 60 seconds/);
});
