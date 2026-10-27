import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const { loadEnvConfig } = require("@next/env");
loadEnvConfig(process.cwd(), true, { info() {}, error() {} });

if (!process.env.OPENAI_API_KEY) {
  console.error("OPENAI_API_KEY를 .env.local에 설정해주세요.");
  process.exit(1);
}

const result = spawnSync(process.execPath, [
  "node_modules/vitest/vitest.mjs", "run", "tests/features/todos/aiSchedule.live.test.js",
  "--pool=threads", "--maxWorkers=1",
], {
  stdio: "inherit",
  env: { ...process.env, RUN_OPENAI_LIVE_TEST: "1" },
});
if (result.error) console.error("검증 실행기를 시작하지 못했습니다.");
process.exit(result.status ?? 1);
