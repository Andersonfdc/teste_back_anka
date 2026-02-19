import fs from "node:fs";
import path from "node:path";

const reportsDir = path.join(process.cwd(), "k6", "reports");
const scenarios = [
  { key: "smoke", file: "smoke-summary.json" },
  { key: "load", file: "load-summary.json" },
  { key: "stress", file: "stress-summary.json" },
];

function safeMetric(summary, metricName, nestedKey) {
  const metric = summary.metrics?.[metricName];
  if (!metric) return null;

  if (nestedKey) {
    if (metric[nestedKey] !== undefined) {
      return metric[nestedKey];
    }

    if (nestedKey === "rate" && metric.value !== undefined) {
      return metric.value;
    }

    if (metric.values?.[nestedKey] !== undefined) {
      return metric.values[nestedKey];
    }
  }

  if (!nestedKey) {
    if (metric.value !== undefined) {
      return metric.value;
    }

    if (metric.values?.value !== undefined) {
      return metric.values.value;
    }
  }

  return null;
}

function normalizePercent(value) {
  if (typeof value !== "number") return "N/A";
  return `${(value * 100).toFixed(2)}%`;
}

function normalizeMs(value) {
  if (typeof value !== "number") return "N/A";
  return `${value.toFixed(2)} ms`;
}

function loadSummaries() {
  const loaded = [];

  for (const scenario of scenarios) {
    const filePath = path.join(reportsDir, scenario.file);
    if (!fs.existsSync(filePath)) {
      continue;
    }

    const summary = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    loaded.push({ scenario: scenario.key, summary });
  }

  return loaded;
}

function toHtml(loaded) {
  const rows = loaded
    .map(({ scenario, summary }) => {
      const httpReqFailed = safeMetric(summary, "http_req_failed", "rate");
      const p95 = safeMetric(summary, "http_req_duration", "p(95)");
      const p99 = safeMetric(summary, "http_req_duration", "p(99)");
      const checks = safeMetric(summary, "checks", "rate");
      const reqs = safeMetric(summary, "http_reqs", "count");

      return `
        <tr>
          <td>${scenario}</td>
          <td>${typeof reqs === "number" ? reqs : "N/A"}</td>
          <td>${normalizePercent(checks)}</td>
          <td>${normalizePercent(httpReqFailed)}</td>
          <td>${normalizeMs(p95)}</td>
          <td>${normalizeMs(p99)}</td>
        </tr>`;
    })
    .join("\n");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>k6 Consolidated Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 24px; }
    table { border-collapse: collapse; width: 100%; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background: #f4f4f4; }
    h1 { margin-bottom: 8px; }
    p { color: #555; }
  </style>
</head>
<body>
  <h1>k6 Consolidated Report</h1>
  <p>Generated at ${new Date().toISOString()}</p>
  <table>
    <thead>
      <tr>
        <th>Scenario</th>
        <th>Requests</th>
        <th>Checks Pass Rate</th>
        <th>HTTP Failed Rate</th>
        <th>HTTP Duration p95</th>
        <th>HTTP Duration p99</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>
</body>
</html>`;
}

function toJUnitXml(loaded) {
  let tests = 0;
  let failures = 0;

  const testCases = loaded
    .map(({ scenario, summary }) => {
      const checksRate = safeMetric(summary, "checks", "rate");
      const failRate = safeMetric(summary, "http_req_failed", "rate");
      const p95 = safeMetric(summary, "http_req_duration", "p(95)");

      const scenarioTests = [
        {
          name: `${scenario}.checks_rate`,
          pass: typeof checksRate === "number" ? checksRate >= 0.99 : false,
          value: normalizePercent(checksRate),
          expected: ">= 99%",
        },
        {
          name: `${scenario}.http_req_failed_rate`,
          pass: typeof failRate === "number" ? failRate <= 0.1 : false,
          value: normalizePercent(failRate),
          expected: "<= 10%",
        },
        {
          name: `${scenario}.http_req_duration_p95`,
          pass: typeof p95 === "number" ? p95 <= 6000 : false,
          value: normalizeMs(p95),
          expected: "<= 6000 ms",
        },
      ];

      return scenarioTests
        .map((testCase) => {
          tests += 1;
          if (!testCase.pass) {
            failures += 1;
          }

          if (testCase.pass) {
            return `  <testcase classname="k6.${scenario}" name="${testCase.name}"/>`;
          }

          return `  <testcase classname="k6.${scenario}" name="${testCase.name}">\n    <failure message="expected ${testCase.expected}, got ${testCase.value}"/>\n  </testcase>`;
        })
        .join("\n");
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<testsuite name="k6-runtime-tests" tests="${tests}" failures="${failures}">
${testCases}
</testsuite>`;
}

function main() {
  fs.mkdirSync(reportsDir, { recursive: true });
  const loaded = loadSummaries();

  if (loaded.length === 0) {
    console.log("No k6 summary files found, skipping consolidated reports");
    return;
  }

  const html = toHtml(loaded);
  const junit = toJUnitXml(loaded);

  fs.writeFileSync(path.join(reportsDir, "k6-consolidated-report.html"), html);
  fs.writeFileSync(path.join(reportsDir, "k6-consolidated-report.junit.xml"), junit);

  console.log("✅ k6 consolidated reports generated");
}

main();
