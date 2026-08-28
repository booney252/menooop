/**
 * Starts the design preview.
 *
 *   npm run preview
 *
 * A script rather than an inline env var, because `MARLOW_PREVIEW=1 next dev`
 * is a shell-ism that fails on Windows. It also checks the two things that
 * actually go wrong — Node version and a busy port — and says so in words
 * rather than leaving you with a browser that cannot reach the site.
 */
import { spawn } from "node:child_process";
import { createServer } from "node:net";

const REQUIRED_MAJOR = 20;
const major = Number(process.versions.node.split(".")[0]);
if (major < REQUIRED_MAJOR) {
  console.error(
    `\n  Marlow needs Node ${REQUIRED_MAJOR} or newer. You have ${process.version}.` +
      `\n  Install a current Node (nodejs.org, or "nvm install 22") and try again.\n`
  );
  process.exit(1);
}

function free(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port, "127.0.0.1");
  });
}

const wanted = Number(process.env.PORT ?? 3000);
let port = wanted;
while (!(await free(port)) && port < wanted + 10) port++;

if (port !== wanted) {
  console.log(`\n  Port ${wanted} is busy, using ${port} instead.`);
}

console.log(`\n  Marlow design preview → http://localhost:${port}/preview\n`);
console.log("  Every screen, no database needed. Ctrl-C to stop.\n");

const child = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["next", "dev", "-p", String(port)],
  {
    stdio: "inherit",
    env: { ...process.env, MARLOW_PREVIEW: "1" },
    shell: process.platform === "win32",
  }
);

child.on("exit", (code) => process.exit(code ?? 0));
process.on("SIGINT", () => child.kill("SIGINT"));
