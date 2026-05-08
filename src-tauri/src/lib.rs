use std::{
    fs,
    path::{Path, PathBuf},
    process::{Command, Stdio},
};

use tauri::{ipc::Channel, Manager, Runtime, Webview};
use tauri_plugin_updater::UpdaterExt;

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadResult {
    saved_to: String,
}

#[derive(Clone, serde::Serialize)]
#[serde(tag = "event", content = "data")]
enum PortableUpdateEvent {
    #[serde(rename_all = "camelCase")]
    Started {
        content_length: Option<u64>,
    },
    #[serde(rename_all = "camelCase")]
    Progress {
        chunk_length: usize,
    },
    Finished,
}

fn portable_update_script_path(version: &str) -> PathBuf {
    std::env::temp_dir().join(format!("client-way-portable-update-{version}.cmd"))
}

#[cfg(windows)]
fn write_portable_update_script(
    script_path: &Path,
    source_path: &Path,
    target_path: &Path,
    backup_path: &Path,
) -> Result<(), String> {
    let script = format!(
        r#"@echo off
setlocal
set "SOURCE={source}"
set "TARGET={target}"
set "BACKUP={backup}"

if not exist "%SOURCE%" exit /b 1
if not exist "%TARGET%" goto replace

for /l %%i in (1,1,60) do (
  move /y "%TARGET%" "%BACKUP%" >nul 2>nul && goto replace
  timeout /t 1 /nobreak >nul
)

exit /b 1

:replace
move /y "%SOURCE%" "%TARGET%" >nul 2>nul
if errorlevel 1 (
  move /y "%BACKUP%" "%TARGET%" >nul 2>nul
  exit /b 1
)

start "" "%TARGET%"
del "%BACKUP%" >nul 2>nul
del "%~f0" >nul 2>nul
"#,
        source = source_path.to_string_lossy(),
        target = target_path.to_string_lossy(),
        backup = backup_path.to_string_lossy(),
    );

    fs::write(script_path, script)
        .map_err(|error| format!("Failed to write portable updater script: {error}"))
}

#[tauri::command]
async fn install_portable_update<R: Runtime>(
    webview: Webview<R>,
    on_event: Channel<PortableUpdateEvent>,
) -> Result<(), String> {
    #[cfg(not(windows))]
    {
        let _ = webview;
        let _ = on_event;
        return Err("Portable self-update is only supported on Windows".to_string());
    }

    #[cfg(windows)]
    {
        let update = webview
            .updater()
            .map_err(|error| format!("Failed to initialize updater: {error}"))?
            .check()
            .await
            .map_err(|error| format!("Failed to check for updates: {error}"))?
            .ok_or_else(|| "No update is available".to_string())?;

        let current_exe = std::env::current_exe()
            .map_err(|error| format!("Failed to resolve current executable: {error}"))?;
        let current_dir = current_exe
            .parent()
            .ok_or_else(|| "Failed to resolve current executable directory".to_string())?;
        let exe_stem = current_exe
            .file_stem()
            .and_then(|name| name.to_str())
            .ok_or_else(|| "Failed to resolve current executable name".to_string())?;
        let pending_path = current_dir.join(format!("{exe_stem}-{}.pending.exe", update.version));
        let backup_path =
            current_dir.join(format!("{exe_stem}-{}.backup.exe", update.current_version));
        let script_path = portable_update_script_path(&update.version);

        let mut first_chunk = true;
        let bytes = update
            .download(
                |chunk_length, content_length| {
                    if first_chunk {
                        first_chunk = false;
                        let _ = on_event.send(PortableUpdateEvent::Started { content_length });
                    }

                    let _ = on_event.send(PortableUpdateEvent::Progress { chunk_length });
                },
                || {
                    let _ = on_event.send(PortableUpdateEvent::Finished);
                },
            )
            .await
            .map_err(|error| format!("Failed to download update: {error}"))?;

        if !bytes.starts_with(b"MZ") {
            return Err("Downloaded update is not a Windows executable".to_string());
        }

        fs::write(&pending_path, bytes)
            .map_err(|error| format!("Failed to stage portable update next to the app: {error}"))?;
        write_portable_update_script(&script_path, &pending_path, &current_exe, &backup_path)?;

        Command::new("cmd")
            .arg("/C")
            .arg("start")
            .arg("")
            .arg("/min")
            .arg(&script_path)
            .stdin(Stdio::null())
            .stdout(Stdio::null())
            .stderr(Stdio::null())
            .spawn()
            .map_err(|error| format!("Failed to start portable updater script: {error}"))?;

        webview.app_handle().cleanup_before_exit();
        std::process::exit(0);
    }
}

#[tauri::command]
async fn download_file_to_downloads(
    url: String,
    file_name: String,
    auth_token: Option<String>,
) -> Result<DownloadResult, String> {
    let safe_file_name = Path::new(&file_name)
        .file_name()
        .and_then(|name| name.to_str())
        .filter(|name| !name.trim().is_empty())
        .ok_or_else(|| "File name is invalid".to_string())?;
    let downloads_dir =
        dirs::download_dir().ok_or_else(|| "Downloads directory is unavailable".to_string())?;
    fs::create_dir_all(&downloads_dir)
        .map_err(|error| format!("Failed to prepare Downloads directory: {error}"))?;

    let target_path = downloads_dir.join(safe_file_name);
    let client = reqwest::Client::new();
    let mut request = client.get(url);

    if let Some(token) = auth_token.filter(|token| !token.trim().is_empty()) {
        request = request.bearer_auth(token);
    }

    let response = request
        .send()
        .await
        .map_err(|error| format!("Download request failed: {error}"))?;
    let status = response.status();

    if !status.is_success() {
        return Err(format!("Download failed with status {status}"));
    }

    let bytes = response
        .bytes()
        .await
        .map_err(|error| format!("Failed to read downloaded file: {error}"))?;
    fs::write(&target_path, &bytes).map_err(|error| format!("Failed to save file: {error}"))?;

    Ok(DownloadResult {
        saved_to: target_path.to_string_lossy().to_string(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            download_file_to_downloads,
            install_portable_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
