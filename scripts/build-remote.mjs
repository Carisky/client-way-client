import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptDir, "..");
const tauriConfigPath = join(clientRoot, "src-tauri", "tauri.conf.json");
const cargoPath = join(clientRoot, "src-tauri", "Cargo.toml");
const packagePath = join(clientRoot, "package.json");
const updaterDir = join(clientRoot, "dist-updater");
const bundleDir = join(clientRoot, "src-tauri", "target", "release", "bundle");

function exec(commandName, args, options = {}) {
  const file = process.platform === "win32" && commandName === "npm" ? "cmd.exe" : commandName;
  const commandArgs =
    process.platform === "win32" && commandName === "npm" ? ["/d", "/c", "npm.cmd", ...args] : args;

  return execFileSync(file, commandArgs, {
    cwd: clientRoot,
    stdio: options.stdio ?? "inherit",
    encoding: options.encoding,
    env: {
      ...process.env,
      ...options.env,
    },
  });
}

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function parseRepositoryFromRemote(remote) {
  const trimmed = remote.trim();
  const match =
    trimmed.match(/^git@github\.com:([^/]+\/[^.]+)(?:\.git)?$/) ??
    trimmed.match(/^https:\/\/github\.com\/([^/]+\/[^.]+)(?:\.git)?$/);

  return match?.[1] ?? "";
}

function getRepository() {
  if (process.env.GITHUB_REPOSITORY) {
    return process.env.GITHUB_REPOSITORY;
  }

  try {
    const remote = execFileSync("git", ["config", "--get", "remote.origin.url"], {
      cwd: clientRoot,
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });

    return parseRepositoryFromRemote(remote);
  } catch {
    return "";
  }
}

function walkFiles(path) {
  if (!existsSync(path)) {
    return [];
  }

  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    const nextPath = join(path, entry.name);
    return entry.isDirectory() ? walkFiles(nextPath) : [nextPath];
  });
}

function syncVersions(version, repository) {
  const config = readJson(tauriConfigPath);
  const pubkey = process.env.TAURI_UPDATER_PUBKEY ?? config.plugins?.updater?.pubkey;

  if (!pubkey || pubkey.includes("CHANGE_ME")) {
    throw new Error(
      "Missing updater public key. Generate it with `npm run tauri -- signer generate -w .tauri/client-way.key`, then set TAURI_UPDATER_PUBKEY or paste the public key into src-tauri/tauri.conf.json."
    );
  }

  config.version = version;
  config.bundle = {
    ...config.bundle,
    active: true,
    createUpdaterArtifacts: true,
  };
  config.plugins = {
    ...config.plugins,
    updater: {
      ...config.plugins?.updater,
      pubkey,
      endpoints: [`https://github.com/${repository}/releases/latest/download/latest.json`],
    },
  };
  writeJson(tauriConfigPath, config);

  const cargo = readFileSync(cargoPath, "utf8").replace(/^version = ".*"$/m, `version = "${version}"`);
  writeFileSync(cargoPath, cargo);
}

function buildLatestJson(version, repository, msiPath, signaturePath) {
  const tag = `v${version}`;
  const msiName = basename(msiPath);
  const signature = readFileSync(signaturePath, "utf8").trim();
  const latestJsonPath = join(updaterDir, "latest.json");

  mkdirSync(updaterDir, { recursive: true });
  writeJson(latestJsonPath, {
    version,
    notes: `Release ${tag}`,
    pub_date: new Date().toISOString(),
    platforms: {
      "windows-x86_64": {
        signature,
        url: `https://github.com/${repository}/releases/download/${tag}/${encodeURIComponent(msiName)}`,
      },
    },
  });

  return latestJsonPath;
}

function findBuildArtifacts() {
  const files = walkFiles(bundleDir);
  const msiPath = files.find((file) => file.toLowerCase().endsWith(".msi"));
  const signaturePath =
    files.find((file) => file.toLowerCase().endsWith(".msi.sig")) ??
    files.find((file) => file.toLowerCase().endsWith(".sig"));

  if (!msiPath) {
    throw new Error(`MSI artifact was not found in ${bundleDir}`);
  }

  if (!signaturePath) {
    throw new Error(
      `Updater signature was not found in ${bundleDir}. Make sure TAURI_SIGNING_PRIVATE_KEY is set before running build:remote.`
    );
  }

  return { msiPath, signaturePath };
}

function publishRelease(version, assets) {
  const tag = `v${version}`;
  const ghArgs = ["release", "view", tag];
  let releaseExists = true;

  try {
    exec("gh", ghArgs, { stdio: "ignore" });
  } catch {
    releaseExists = false;
  }

  if (releaseExists) {
    exec("gh", ["release", "upload", tag, ...assets, "--clobber"]);
    return;
  }

  exec("gh", [
    "release",
    "create",
    tag,
    ...assets,
    "--title",
    tag,
    "--notes",
    `Release ${tag}`,
    "--latest",
  ]);
}

const packageJson = readJson(packagePath);
const version = packageJson.version;
const repository = getRepository();

if (!repository) {
  throw new Error("Cannot resolve GitHub repository. Set GITHUB_REPOSITORY=owner/repo before running build:remote.");
}

syncVersions(version, repository);

exec("npm", ["run", "tauri", "--", "build", "--bundles", "msi"]);

const { msiPath, signaturePath } = findBuildArtifacts();
const latestJsonPath = buildLatestJson(version, repository, msiPath, signaturePath);

publishRelease(version, [msiPath, signaturePath, latestJsonPath]);

console.log(`Published v${version} to https://github.com/${repository}/releases/tag/v${version}`);
