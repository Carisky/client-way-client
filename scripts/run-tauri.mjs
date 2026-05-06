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
const normalizeCommandPath = (path) => path.replace(/\\/g, "/");
const getNodeCommand = () => {
  if (process.platform !== "win32") {
    return normalizeCommandPath(process.execPath);
  }

  try {
    const escapedPath = process.execPath.replace(/'/g, "''");
    const shortPath = execFileSync(
      "powershell.exe",
      [
        "-NoProfile",
        "-Command",
        `$fso = New-Object -ComObject Scripting.FileSystemObject; $fso.GetFile('${escapedPath}').ShortPath`,
      ],
      { encoding: "utf8" },
    ).trim();

    return normalizeCommandPath(shortPath || process.execPath);
  } catch {
    return normalizeCommandPath(process.execPath);
  }
};
const nodeCommand = getNodeCommand();
const commandOverrideArgs = ["dev", "build"].includes(tauriArgs[0])
  ? [
      "--config",
      JSON.stringify({
        build: {
          beforeDevCommand: `${nodeCommand} scripts/vite-dev.mjs`,
          beforeBuildCommand: `${nodeCommand} scripts/vite-build.mjs`,
        },
      }),
    ]
  : [];

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
const args = [tauriBin, ...tauriArgs, ...commandOverrideArgs];

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
