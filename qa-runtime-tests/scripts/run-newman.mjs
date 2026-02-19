import fs from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import newman from "newman";
import pg from "pg";

dotenv.config({ path: path.join(process.cwd(), ".env") });

const reportsDir = path.join(process.cwd(), "newman", "reports");
fs.mkdirSync(reportsDir, { recursive: true });

const collectionPath = path.join(
  process.cwd(),
  "newman",
  "collections",
  "anka-api.postman_collection.json",
);
const baseEnvPath = path.join(
  process.cwd(),
  "newman",
  "environments",
  "local.postman_environment.json",
);
const bootstrapEnvPath = path.join(reportsDir, "bootstrap.environment.json");
const runtimeEnvPath = path.join(reportsDir, "runtime.environment.json");

function ensureVar(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

async function waitForApi(url, timeoutMs = 60000) {
  const deadline = Date.now() + timeoutMs;
  const healthUrl = `${url}/api/v1/health`;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(healthUrl);
      if (response.ok) {
        return;
      }
    } catch {
      // ignore and retry
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error(`API not ready at ${healthUrl} after ${timeoutMs}ms`);
}

function upsertEnvValue(environment, key, value) {
  const variable = environment.values.find((item) => item.key === key);
  if (variable) {
    variable.value = value;
    return;
  }
  environment.values.push({ key, value, enabled: true });
}

function runNewman({ folder, environment, exportEnvironment, reportBaseName }) {
  return new Promise((resolve, reject) => {
    const jsonReportPath = path.join(reportsDir, `${reportBaseName}.json`);
    const junitReportPath = path.join(reportsDir, `${reportBaseName}.junit.xml`);
    const htmlReportPath = path.join(reportsDir, `${reportBaseName}.html`);

    newman.run(
      {
        collection: collectionPath,
        environment,
        folder,
        reporters: ["cli", "json", "junit", "htmlextra"],
        reporter: {
          json: {
            export: jsonReportPath,
          },
          junit: {
            export: junitReportPath,
          },
          htmlextra: {
            export: htmlReportPath,
            title: `QA API Report - ${folder}`,
            browserTitle: `QA API Report - ${folder}`,
            logs: false,
          },
        },
        exportEnvironment,
      },
      (error, summary) => {
        if (error) {
          reject(error);
          return;
        }

        if (summary.run.failures.length > 0) {
          reject(new Error(`Newman failures in folder ${folder}`));
          return;
        }

        resolve(summary);
      },
    );
  });
}

async function fetchOtpCode(challengeId) {
  const dbHost = ensureVar("DB_HOST");
  const dbPort = Number(ensureVar("DB_PORT"));
  const dbName = ensureVar("DB_NAME");
  const dbUser = ensureVar("DB_USER");
  const dbPassword = ensureVar("DB_PASSWORD");

  const client = new pg.Client({
    host: dbHost,
    port: dbPort,
    database: dbName,
    user: dbUser,
    password: dbPassword,
  });

  await client.connect();

  try {
    const result = await client.query(
      "SELECT code FROM public.verification_codes WHERE id = $1 LIMIT 1",
      [challengeId],
    );

    if (result.rowCount === 0) {
      throw new Error(`OTP not found for challengeId=${challengeId}`);
    }

    return result.rows[0].code;
  } finally {
    await client.end();
  }
}

async function main() {
  const baseUrl = ensureVar("API_BASE_URL");
  const apiKey = ensureVar("API_KEY");
  const testUserEmail = ensureVar("TEST_USER_EMAIL");
  const testUserPassword = ensureVar("TEST_USER_PASSWORD");

  await waitForApi(baseUrl);

  const environment = JSON.parse(fs.readFileSync(baseEnvPath, "utf-8"));
  upsertEnvValue(environment, "baseUrl", baseUrl);
  upsertEnvValue(environment, "apiKey", apiKey);
  upsertEnvValue(environment, "testUserEmail", testUserEmail);
  upsertEnvValue(environment, "testUserPassword", testUserPassword);

  await runNewman({
    folder: "Bootstrap",
    environment,
    exportEnvironment: bootstrapEnvPath,
    reportBaseName: "bootstrap-report",
  });

  const bootstrapEnvironment = JSON.parse(
    fs.readFileSync(bootstrapEnvPath, "utf-8"),
  );

  const challengeVar = bootstrapEnvironment.values.find(
    (item) => item.key === "challengeId",
  );

  if (!challengeVar?.value) {
    throw new Error("challengeId not exported from Newman bootstrap run");
  }

  const otpCode = await fetchOtpCode(challengeVar.value);
  upsertEnvValue(bootstrapEnvironment, "otpCode", otpCode);
  fs.writeFileSync(runtimeEnvPath, JSON.stringify(bootstrapEnvironment, null, 2));

  await runNewman({
    folder: "AuthFlow",
    environment: runtimeEnvPath,
    exportEnvironment: undefined,
    reportBaseName: "auth-flow-report",
  });

  console.log("✅ Newman API tests completed successfully");
}

main().catch((error) => {
  console.error("❌ Newman execution failed", error);
  process.exit(1);
});
