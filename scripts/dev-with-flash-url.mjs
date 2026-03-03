#!/usr/bin/env node
import { spawn } from "node:child_process";

const args = process.argv.slice(2);
const port = getPort(args) ?? process.env.PORT ?? "3000";
const host = getHost(args) ?? "localhost";
const browserHost = normalizeBrowserHost(host);
const flashUrl = `http://${browserHost}:${port}/flash`;

console.log(`  - Flash:        ${flashUrl}`);

const nextBin = process.platform === "win32" ? "next.cmd" : "next";
const child = spawn(nextBin, ["dev", ...args], {
  // We pipe output so we can detect "Ready in ..." and only then open the browser.
  stdio: ["inherit", "pipe", "pipe"],
  env: process.env,
});

let hasOpenedBrowser = false;
let readinessTail = "";

child.stdout.on("data", (chunk) => {
  process.stdout.write(chunk);
  maybeOpenBrowser(chunk.toString());
});

child.stderr.on("data", (chunk) => {
  process.stderr.write(chunk);
  maybeOpenBrowser(chunk.toString());
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("error", (error) => {
  console.error(error);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

function maybeOpenBrowser(textChunk) {
  if (hasOpenedBrowser) {
    return;
  }

  // Output arrives in arbitrary chunk boundaries, so we keep a short tail buffer.
  // This avoids missing "Ready in" if it is split across two chunks.
  const combinedOutput = readinessTail + textChunk;
  readinessTail = combinedOutput.slice(-160);

  if (!/\bready in\b/i.test(combinedOutput)) {
    return;
  }

  hasOpenedBrowser = true;
  openBrowser(flashUrl);
}

function openBrowser(url) {
  const command = getBrowserCommand(url);

  if (!command) {
    console.warn(`Could not auto-open browser. Open this URL manually: ${url}`);
    return;
  }

  const opener = spawn(command.bin, command.args, {
    detached: true,
    stdio: "ignore"
  });

  opener.on("error", () => {
    console.warn(`Could not auto-open browser. Open this URL manually: ${url}`);
  });

  opener.unref();
}

function getBrowserCommand(url) {
  if (process.platform === "darwin") {
    return { bin: "open", args: [url] };
  }

  if (process.platform === "win32") {
    return { bin: "cmd", args: ["/c", "start", "", url] };
  }

  if (process.platform === "linux") {
    return { bin: "xdg-open", args: [url] };
  }

  return null;
}

function normalizeBrowserHost(value) {
  // Next can listen on 0.0.0.0, but browsers need a routable hostname.
  if (value === "0.0.0.0" || value === "::") {
    return "localhost";
  }

  return value;
}

function getPort(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "-p" || arg === "--port") {
      return argv[i + 1];
    }

    if (arg.startsWith("--port=")) {
      return arg.slice("--port=".length);
    }
  }

  return null;
}

function getHost(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];

    if (arg === "-H" || arg === "--hostname") {
      return argv[i + 1];
    }

    if (arg.startsWith("--hostname=")) {
      return arg.slice("--hostname=".length);
    }
  }

  return null;
}
