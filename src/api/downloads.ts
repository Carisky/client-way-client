import { invoke } from "@tauri-apps/api/core";
import { getAuthToken } from "./http";

declare global {
  interface Window {
    __TAURI_INTERNALS__?: unknown;
  }
}

type TauriDownloadResult = {
  savedTo: string;
};

const isTauri = () => {
  return typeof window !== "undefined" && window.__TAURI_INTERNALS__ !== undefined;
};

const downloadViaBrowser = async (url: string, fileName: string) => {
  const response = await fetch(url, {
    headers: getAuthToken() ? { Authorization: `Bearer ${getAuthToken()}` } : {},
  });

  if (!response.ok) {
    throw new Error("Download failed");
  }

  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = fileName;
  link.style.display = "none";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1_000);
};

export const downloadFileToClient = async (url: string, fileName: string) => {
  if (isTauri()) {
    return invoke<TauriDownloadResult>("download_file_to_downloads", {
      url,
      fileName,
      authToken: getAuthToken(),
    });
  }

  await downloadViaBrowser(url, fileName);
  return null;
};
