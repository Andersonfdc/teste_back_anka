import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://backend:3333";
const API_KEY = __ENV.API_KEY || "dev-api-key";
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL || "murilo@ankatech.com.br";
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || "password";

export const options = {
  scenarios: {
    api_load: {
      executor: "ramping-vus",
      startVUs: 1,
      stages: [
        { duration: "30s", target: 10 },
        { duration: "1m", target: 20 },
        { duration: "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.03"],
    http_req_duration: ["p(95)<1200", "p(99)<1800"],
  },
};

export default function () {
  const healthRes = http.get(`${BASE_URL}/api/v1/health`);
  check(healthRes, {
    "health 200": (r) => r.status === 200,
  });

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
    "login 200": (r) => r.status === 200,
  });

  sleep(0.5);
}
