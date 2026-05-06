import { spawn } from "node:child_process";
import { delimiter, dirname, join } from "node:path";

const clientRoot = join(import.meta.dirname, "..");
const viteCliPath = join(clientRoot, "node_modules", "vite", "bin", "vite.js");
const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";

const child = spawn(process.execPath, [viteCliPath], {
  cwd: clientRoot,
  stdio: "inherit",
  shell: false,
  env: {
    ...process.env,
    [pathKey]: [dirname(process.execPath), join(clientRoot, "node_modules", ".bin"), process.env[pathKey] ?? ""].join(delimiter),
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
