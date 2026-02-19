import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://backend:3333";
const API_KEY = __ENV.API_KEY || "dev-api-key";
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL || "murilo@ankatech.com.br";
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || "password";
const STRESS_STAGE_1_VUS = Number(__ENV.STRESS_STAGE_1_VUS || 20);
const STRESS_STAGE_2_VUS = Number(__ENV.STRESS_STAGE_2_VUS || 40);
const STRESS_STAGE_3_VUS = Number(__ENV.STRESS_STAGE_3_VUS || 60);
const STRESS_STAGE_4_VUS = Number(__ENV.STRESS_STAGE_4_VUS || 90);
const STRESS_FAIL_RATE = Number(__ENV.STRESS_FAIL_RATE || 0.1);
const STRESS_P95_MS = Number(__ENV.STRESS_P95_MS || 3500);
const STRESS_P99_MS = Number(__ENV.STRESS_P99_MS || 6000);

export const options = {
  scenarios: {
    api_stress: {
      executor: "ramping-vus",
      startVUs: 5,
      stages: [
        { duration: "30s", target: STRESS_STAGE_1_VUS },
        { duration: "30s", target: STRESS_STAGE_2_VUS },
        { duration: "30s", target: STRESS_STAGE_3_VUS },
        { duration: "30s", target: STRESS_STAGE_4_VUS },
        { duration: "20s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: [`rate<${STRESS_FAIL_RATE}`],
    http_req_duration: [`p(95)<${STRESS_P95_MS}`, `p(99)<${STRESS_P99_MS}`],
  },
};

export default function () {
  const loginRes = http.post(
    `${BASE_URL}/api/v1/auth/login`,
    JSON.stringify({ email: TEST_USER_EMAIL, password: TEST_USER_PASSWORD }),
    {
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
    },
  );

  check(loginRes, {
    "login acceptable": (r) => r.status === 200 || r.status === 429,
  });

  sleep(0.3);
}
