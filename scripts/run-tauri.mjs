import { spawn } from "node:child_process";
import { delimiter, join } from "node:path";
import { homedir } from "node:os";

const cargoBin = join(homedir(), ".cargo", "bin");
const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
const env = {
  ...process.env,
  [pathKey]: `${cargoBin}${delimiter}${process.env[pathKey] ?? ""}`,
};

const tauriArgs = process.argv.slice(2);

const command = process.platform === "win32" ? "cmd.exe" : "tauri";
const args =
  process.platform === "win32"
    ? ["/d", "/c", "tauri.cmd", ...tauriArgs]
    : tauriArgs;

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
