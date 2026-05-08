# Tauri + Vue + TypeScript

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

## Recommended IDE Setup

- [VS Code](https://code.visualstudio.com/) + [Vue - Official](https://marketplace.visualstudio.com/items?itemName=Vue.volar) + [Tauri](https://marketplace.visualstudio.com/items?itemName=tauri-apps.tauri-vscode) + [rust-analyzer](https://marketplace.visualstudio.com/items?itemName=rust-lang.rust-analyzer)

## Remote Windows Release

1. Generate the updater key once:

   ```bash
   npm run tauri -- signer generate -w .tauri/client-way.key
   ```

2. Put the generated public key into `src-tauri/tauri.conf.json` or export it as `TAURI_UPDATER_PUBKEY`.

3. Before publishing, set:

   ```powershell
   $env:GITHUB_REPOSITORY = "owner/repo"
   $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content .tauri\client-way.key -Raw
   ```

4. Build the production portable EXE and publish/update the GitHub release:

   ```bash
   npm run build:remote
   ```

The script uses `package.json` version for the Tauri version and release tag `vX.Y.Z`, builds with `.env.production`, uploads the portable EXE, signature, and `latest.json`. The app updates itself by replacing the portable EXE in-place, so users do not need administrator rights as long as the app folder is writable.
