import http from "k6/http";
import { check, sleep } from "k6";

const BASE_URL = __ENV.BASE_URL || "http://backend:3333";
const API_KEY = __ENV.API_KEY || "dev-api-key";
const TEST_USER_EMAIL = __ENV.TEST_USER_EMAIL || "murilo@ankatech.com.br";
const TEST_USER_PASSWORD = __ENV.TEST_USER_PASSWORD || "password";

export const options = {
  vus: 1,
  iterations: 5,
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(95)<800"],
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
    "challengeId exists": (r) => {
      try {
        return Boolean(JSON.parse(r.body).challengeId);
      } catch {
        return false;
      }
    },
  });

  sleep(1);
}
