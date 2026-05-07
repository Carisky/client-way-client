use std::{fs, path::Path};

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct DownloadResult {
    saved_to: String,
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
        .invoke_handler(tauri::generate_handler![download_file_to_downloads])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
