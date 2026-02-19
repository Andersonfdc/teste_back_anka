import { spawnSync } from "node:child_process";

const composeArgs = [
  "compose",
  "-f",
  "docker/compose.qa.yml",
  "--env-file",
  "docker/.env.example",
];

function run(command, args) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });

  if (result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function dockerCompose(args) {
  run("docker", [...composeArgs, ...args]);
}

function runNodeScript(scriptPath) {
  run("node", [scriptPath]);
}

async function main() {
  const keepUp = process.env.QA_KEEP_UP === "true";

  try {
    dockerCompose(["up", "-d", "postgres", "redis", "localstack"]);
    dockerCompose(["run", "--rm", "migrate-seed"]);
    dockerCompose(["run", "--rm", "init-s3"]);
    dockerCompose(["up", "-d", "--build", "backend"]);
    dockerCompose(["run", "--rm", "qa-runner", "node", "scripts/run-newman.mjs"]);
    dockerCompose([
      "run",
      "--rm",
      "k6-runner",
      "run",
      "--summary-trend-stats",
      "avg,min,med,max,p(90),p(95),p(99)",
      "--summary-export",
      "/work/k6/reports/smoke-summary.json",
      "/work/k6/scenarios/smoke.js",
    ]);
    dockerCompose([
      "run",
      "--rm",
      "k6-runner",
      "run",
      "--summary-trend-stats",
      "avg,min,med,max,p(90),p(95),p(99)",
      "--summary-export",
      "/work/k6/reports/load-summary.json",
      "/work/k6/scenarios/load.js",
    ]);
    dockerCompose([
      "run",
      "--rm",
      "-e",
      "STRESS_STAGE_1_VUS=20",
      "-e",
      "STRESS_STAGE_2_VUS=40",
      "-e",
      "STRESS_STAGE_3_VUS=60",
      "-e",
      "STRESS_STAGE_4_VUS=90",
      "-e",
      "STRESS_P95_MS=3500",
      "-e",
      "STRESS_P99_MS=6000",
      "k6-runner",
      "run",
      "--summary-trend-stats",
      "avg,min,med,max,p(90),p(95),p(99)",
      "--summary-export",
      "/work/k6/reports/stress-summary.json",
      "/work/k6/scenarios/stress.js",
    ]);
    runNodeScript("scripts/generate-k6-evidence.mjs");

    console.log("✅ Local QA pipeline finished successfully");
  } finally {
    if (!keepUp) {
      dockerCompose(["down", "-v"]);
    }
  }
}

main().catch((error) => {
  console.error("❌ Local QA pipeline failed", error);
  process.exit(1);
});
