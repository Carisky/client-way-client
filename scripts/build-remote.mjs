import { execFileSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, delimiter, dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const clientRoot = resolve(scriptDir, "..");
const tauriCliPath = join(clientRoot, "node_modules", "@tauri-apps", "cli", "tauri.js");
const tauriConfigPath = join(clientRoot, "src-tauri", "tauri.conf.json");
const cargoPath = join(clientRoot, "src-tauri", "Cargo.toml");
const packagePath = join(clientRoot, "package.json");
const productionEnvPath = join(clientRoot, ".env.production");
const updaterDir = join(clientRoot, "dist-updater");
const bundleDir = join(clientRoot, "src-tauri", "target", "release", "bundle");
const releaseDir = join(clientRoot, "src-tauri", "target", "release");

function parseEnvValue(value) {
  const trimmed = value.trim();

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).split("\\n").join("\n");
  }

  return trimmed;
}

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  return readFileSync(path, "utf8")
    .split(/\r?\n/)
    .reduce((acc, line) => {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) {
        return acc;
      }

      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);

      if (!match) {
        return acc;
      }

      acc[match[1]] = parseEnvValue(match[2]);
      return acc;
    }, {});
}

function exec(commandName, args, options = {}) {
  const file = process.platform === "win32" && commandName === "npm" ? "cmd.exe" : commandName;
  const commandArgs =
    process.platform === "win32" && commandName === "npm" ? ["/d", "/c", "npm.cmd", ...args] : args;
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  const nodeBin = dirname(process.execPath);
  const nodeModulesBin = join(clientRoot, "node_modules", ".bin");

  return execFileSync(file, commandArgs, {
    cwd: clientRoot,
    stdio: options.stdio ?? "inherit",
    encoding: options.encoding,
    env: {
      ...process.env,
      ...options.env,
      [pathKey]: [nodeBin, nodeModulesBin, process.env[pathKey] ?? ""].join(delimiter),
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

function cleanBundleArtifacts() {
  const resolvedBundleDir = resolve(bundleDir);
  const resolvedClientRoot = resolve(clientRoot);

  if (!resolvedBundleDir.startsWith(resolvedClientRoot)) {
    throw new Error(`Refusing to clean bundle directory outside client root: ${resolvedBundleDir}`);
  }

  rmSync(resolvedBundleDir, { recursive: true, force: true });
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
    active: false,
    createUpdaterArtifacts: false,
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

function buildLatestJson(version, repository, executablePath, signaturePath) {
  const tag = `v${version}`;
  const executableName = basename(executablePath);
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
        url: `https://github.com/${repository}/releases/download/${tag}/${encodeURIComponent(executableName)}`,
      },
    },
  });

  return latestJsonPath;
}

function createPortableArtifact(version) {
  const packageName = readFileSync(cargoPath, "utf8").match(/^name = "(.+)"$/m)?.[1] ?? "client";
  const builtExecutablePath = join(releaseDir, `${packageName}.exe`);

  if (!existsSync(builtExecutablePath)) {
    throw new Error(`Portable executable was not found: ${builtExecutablePath}`);
  }

  mkdirSync(updaterDir, { recursive: true });

  const portablePath = join(updaterDir, `${packageName}_${version}_x64_portable.exe`);
  const signaturePath = `${portablePath}.sig`;

  if (existsSync(portablePath)) {
    unlinkSync(portablePath);
  }

  if (existsSync(signaturePath)) {
    unlinkSync(signaturePath);
  }

  copyFileSync(builtExecutablePath, portablePath);
  exec(process.execPath, [tauriCliPath, "signer", "sign", portablePath]);

  if (!existsSync(signaturePath)) {
    throw new Error(
      `Updater signature for ${basename(portablePath)} was not found. Make sure TAURI_SIGNING_PRIVATE_KEY is set before running build:remote.`
    );
  }

  return { portablePath, signaturePath };
}

function getReleaseAssetNames(tag) {
  try {
    const output = exec("gh", ["release", "view", tag, "--json", "assets", "--jq", ".assets[].name"], {
      stdio: ["ignore", "pipe", "ignore"],
      encoding: "utf8",
    });

    return output
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function deleteStaleReleaseAssets(tag, assets) {
  const currentNames = new Set(assets.map((asset) => basename(asset)));
  const staleNames = getReleaseAssetNames(tag).filter((name) => {
    const lowerName = name.toLowerCase();
    const extension = extname(lowerName);
    const isPortableAsset =
      lowerName.includes("_portable") && (extension === ".exe" || lowerName.endsWith(".exe.sig"));
    const isLegacyMsiAsset = lowerName.endsWith(".msi") || lowerName.endsWith(".msi.sig");
    const isUpdaterAsset = name === "latest.json" || isPortableAsset || isLegacyMsiAsset;
    return isUpdaterAsset && !currentNames.has(name);
  });

  for (const name of staleNames) {
    exec("gh", ["release", "delete-asset", tag, name, "--yes"]);
  }
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
    deleteStaleReleaseAssets(tag, assets);
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
const productionEnv = loadEnvFile(productionEnvPath);

if (!repository) {
  throw new Error("Cannot resolve GitHub repository. Set GITHUB_REPOSITORY=owner/repo before running build:remote.");
}

for (const [key, value] of Object.entries(productionEnv)) {
  process.env[key] ??= value;
}

syncVersions(version, repository);

cleanBundleArtifacts();
exec(process.execPath, [tauriCliPath, "build", "--no-bundle"]);

const { portablePath, signaturePath } = createPortableArtifact(version);
const latestJsonPath = buildLatestJson(version, repository, portablePath, signaturePath);

publishRelease(version, [portablePath, signaturePath, latestJsonPath]);

console.log(`Published v${version} to https://github.com/${repository}/releases/tag/v${version}`);
