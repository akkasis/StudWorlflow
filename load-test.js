import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 15,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(95)<2500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "https://skillent.ru";

const PUBLIC_PAGES = [
  "/",
  "/marketplace",
  "/help",
  "/login",
  "/signup",
  "/privacy",
  "/terms",
];

function randomItem(items) {
  return items[Math.floor(Math.random() * items.length)];
}

export default function () {
  const pagePath = randomItem(PUBLIC_PAGES);
  const pageRes = http.get(`${BASE_URL}${pagePath}`);

  check(pageRes, {
    [`${pagePath} returns 200`]: (res) => res.status === 200,
  });

  const marketplaceRes = http.get(`${BASE_URL}/marketplace?q=математика`);
  check(marketplaceRes, {
    "marketplace search returns 200": (res) => res.status === 200,
  });

  sleep(1);
}
