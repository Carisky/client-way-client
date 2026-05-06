import { execFileSync } from "node:child_process";
import { delimiter, dirname, join } from "node:path";

const clientRoot = join(import.meta.dirname, "..");
const vueTscCliPath = join(clientRoot, "node_modules", "vue-tsc", "bin", "vue-tsc.js");
const viteCliPath = join(clientRoot, "node_modules", "vite", "bin", "vite.js");
const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
const env = {
  ...process.env,
  [pathKey]: [dirname(process.execPath), join(clientRoot, "node_modules", ".bin"), process.env[pathKey] ?? ""].join(delimiter),
};

execFileSync(process.execPath, [vueTscCliPath, "--noEmit"], {
  cwd: clientRoot,
  stdio: "inherit",
  env,
});

execFileSync(process.execPath, [viteCliPath, "build"], {
  cwd: clientRoot,
  stdio: "inherit",
  env,
});
