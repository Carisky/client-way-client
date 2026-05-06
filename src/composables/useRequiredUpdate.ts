import { computed, ref } from "vue";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { check, type DownloadEvent, type Update } from "@tauri-apps/plugin-updater";

const currentVersion = ref("");
const latestVersion = ref("");
const update = ref<Update | null>(null);
const isChecking = ref(false);
const isInstalling = ref(false);
const error = ref("");
const progressText = ref("");

function formatPercent(downloaded: number, total?: number) {
  if (!total) {
    return `${Math.round(downloaded / 1024 / 1024)} MB`;
  }

  return `${Math.round((downloaded / total) * 100)}%`;
}

export function useRequiredUpdate() {
  const isRequired = computed(() => Boolean(update.value));

  async function checkForRequiredUpdate() {
    if (import.meta.env.DEV) {
      return;
    }

    isChecking.value = true;
    error.value = "";

    try {
      currentVersion.value = await getVersion();
      const availableUpdate = await check();
      update.value = availableUpdate;
      latestVersion.value = availableUpdate?.version ?? currentVersion.value;
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : String(caught);
    } finally {
      isChecking.value = false;
    }
  }

  async function installRequiredUpdate() {
    if (!update.value) {
      return;
    }

    isInstalling.value = true;
    error.value = "";
    progressText.value = "Preparing download";

    let downloaded = 0;
    let contentLength: number | undefined;

    try {
      await update.value.downloadAndInstall((event: DownloadEvent) => {
        if (event.event === "Started") {
          contentLength = event.data.contentLength;
          downloaded = 0;
          progressText.value = "Downloading update";
        }

        if (event.event === "Progress") {
          downloaded += event.data.chunkLength;
          progressText.value = `Downloading update ${formatPercent(downloaded, contentLength)}`;
        }

        if (event.event === "Finished") {
          progressText.value = "Installing update";
        }
      });

      progressText.value = "Restarting application";
      await relaunch();
    } catch (caught) {
      error.value = caught instanceof Error ? caught.message : String(caught);
      isInstalling.value = false;
    }
  }

  return {
    currentVersion,
    latestVersion,
    isChecking,
    isInstalling,
    isRequired,
    error,
    progressText,
    checkForRequiredUpdate,
    installRequiredUpdate,
  };
}
