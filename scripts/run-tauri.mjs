import { execFileSync, spawn } from "node:child_process";
import { delimiter, dirname, join } from "node:path";
import { homedir } from "node:os";

const cargoBin = join(homedir(), ".cargo", "bin");
const nodeBin = dirname(process.execPath);
const nodeModulesBin = join(import.meta.dirname, "..", "node_modules", ".bin");
const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
const env = {
  ...process.env,
  [pathKey]: [nodeBin, nodeModulesBin, cargoBin, process.env[pathKey] ?? ""].join(delimiter),
};

const tauriArgs = process.argv.slice(2);
const tauriBin = join(import.meta.dirname, "..", "node_modules", "@tauri-apps", "cli", "tauri.js");

if (process.platform === "win32" && tauriArgs[0] === "dev") {
  try {
    execFileSync(process.execPath, [join(import.meta.dirname, "free-port.mjs"), "1420"], {
      stdio: "ignore",
    });
  } catch {
    // If cleanup fails, let Tauri/Vite report the actual port error.
  }
}

const command = process.execPath;
const args = [tauriBin, ...tauriArgs];

const child = spawn(command, args, {
  env,
  stdio: "inherit",
  shell: false,
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 1);
});
