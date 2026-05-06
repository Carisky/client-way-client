import { execFileSync } from "node:child_process";

const port = process.argv[2];

if (!port || process.platform !== "win32") {
  process.exit(0);
}

const output = execFileSync("powershell.exe", [
  "-NoProfile",
  "-Command",
  `Get-NetTCPConnection -LocalPort ${Number(port)} -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique`,
]).toString();

const pids = output
  .split(/\s+/)
  .map((value) => Number(value.trim()))
  .filter(Boolean);

for (const pid of pids) {
  try {
    process.kill(pid, "SIGTERM");
  } catch {
    execFileSync("taskkill.exe", ["/PID", String(pid), "/F"], { stdio: "ignore" });
  }
}
