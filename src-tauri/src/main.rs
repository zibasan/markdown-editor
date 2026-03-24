#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use rfd::{FileDialog, MessageDialog, MessageLevel};
use serde::Serialize;
use std::fs;
use std::path::{Path, PathBuf};
#[cfg(target_os = "windows")]
use std::process::Command;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FilePayload {
    path: String,
    name: String,
    content: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
struct FolderPayload {
    folder_path: String,
    files: Vec<FilePayload>,
}

fn to_file_payload(path: &Path) -> Result<FilePayload, String> {
    let content = fs::read_to_string(path).map_err(|e| e.to_string())?;
    let name = path
        .file_name()
        .and_then(|value| value.to_str())
        .ok_or_else(|| "Invalid file name".to_string())?
        .to_string();

    Ok(FilePayload {
        path: path.to_string_lossy().to_string(),
        name,
        content,
    })
}

#[tauri::command]
fn save_file(content: String, default_path: Option<String>) -> Result<Option<String>, String> {
    if let Some(path_str) = &default_path {
        let path = Path::new(path_str);
        if path.is_absolute() {
            fs::write(path, &content).map_err(|e| e.to_string())?;
            return Ok(Some(path_str.clone()));
        }
    }
    let mut dialog = FileDialog::new().add_filter("Markdown / Text", &["md", "txt"]);

    if let Some(path) = default_path {
        let file_name = Path::new(&path)
            .file_name()
            .and_then(|value| value.to_str())
            .unwrap_or("untitled.md")
            .to_string();
        dialog = dialog.set_file_name(file_name);
    }

    let selected_path = dialog.save_file();
    let Some(path) = selected_path else {
        return Ok(None);
    };

    fs::write(&path, content).map_err(|e| e.to_string())?;

    Ok(Some(path.to_string_lossy().to_string()))
}

#[tauri::command]
fn open_file_dialog() -> Result<Option<FilePayload>, String> {
    let selected_file = FileDialog::new()
        .add_filter("Markdown / Text", &["md", "txt"])
        .pick_file();

    let Some(path) = selected_file else {
        return Ok(None);
    };

    to_file_payload(&path).map(Some)
}

#[tauri::command]
fn open_file_path(file_path: String) -> Result<Option<FilePayload>, String> {
    let path = PathBuf::from(file_path);

    if !path.exists() || !path.is_file() {
        return Ok(None);
    }

    to_file_payload(&path).map(Some)
}

#[tauri::command]
fn open_folder_dialog(mode: Option<String>) -> Result<Option<FolderPayload>, String> {
    let _mode = mode.unwrap_or_else(|| "open".to_string());
    let selected_folder = FileDialog::new().pick_folder();

    let Some(folder_path) = selected_folder else {
        return Ok(None);
    };

    let mut files: Vec<FilePayload> = vec![];

    for entry in fs::read_dir(&folder_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if !path.is_file() {
            continue;
        }

        let ext = path
            .extension()
            .and_then(|value| value.to_str())
            .map(|value| value.to_ascii_lowercase());

        if ext.as_deref() != Some("md") && ext.as_deref() != Some("txt") {
            continue;
        }

        files.push(to_file_payload(&path)?);
    }

    files.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(Some(FolderPayload {
        folder_path: folder_path.to_string_lossy().to_string(),
        files,
    }))
}

#[tauri::command]
fn show_about(app: tauri::AppHandle) -> bool {
    let version = app.package_info().version.to_string();
    MessageDialog::new()
        .set_level(MessageLevel::Info)
        .set_title("Markdown Editor")
        .set_description(&format!(
            "Markdown Editor\nVersion {}\nCopyright © 2026 zibasan",
            version
        ))
        .show();

    true
}

#[tauri::command]
fn register_file_association() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let exe_path = std::env::current_exe().map_err(|e| e.to_string())?;
        let command_value = format!("\"{}\" \"%1\"", exe_path.to_string_lossy());

        let status1 = Command::new("reg")
            .args([
                "add",
                "HKCU\\Software\\Classes\\.md",
                "/ve",
                "/d",
                "MarkdownEditorFile",
                "/f",
            ])
            .status()
            .map_err(|e| e.to_string())?;

        let status2 = Command::new("reg")
            .args([
                "add",
                "HKCU\\Software\\Classes\\MarkdownEditorFile\\shell\\open\\command",
                "/ve",
                "/d",
                &command_value,
                "/f",
            ])
            .status()
            .map_err(|e| e.to_string())?;

        Ok(status1.success() && status2.success())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

#[tauri::command]
fn unregister_file_association() -> Result<bool, String> {
    #[cfg(target_os = "windows")]
    {
        let status = Command::new("reg")
            .args(["delete", "HKCU\\Software\\Classes\\.md", "/f"])
            .status()
            .map_err(|e| e.to_string())?;

        Ok(status.success())
    }
    #[cfg(not(target_os = "windows"))]
    {
        Ok(false)
    }
}

#[tauri::command]
fn minimize_window(window: tauri::Window) -> Result<(), String> {
    window.minimize().map_err(|e| e.to_string())
}

#[tauri::command]
fn toggle_maximize_window(window: tauri::Window) -> Result<(), String> {
    let maximized = window.is_maximized().map_err(|e| e.to_string())?;
    if maximized {
        window.unmaximize().map_err(|e| e.to_string())
    } else {
        window.maximize().map_err(|e| e.to_string())
    }
}

#[tauri::command]
fn close_window(window: tauri::Window) -> Result<(), String> {
    window.close().map_err(|e| e.to_string())
}

#[tauri::command]
async fn download_update(version: String) -> Result<(), String> {
    // フロントエンドにバージョン情報をログ出力
    println!("Update {} is available and ready to install", version);
    Ok(())
}

#[tauri::command]
async fn install_update(_app: tauri::AppHandle) -> Result<(), String> {
    // Tauriの updater プラグインで自動的に更新がインストールされる
    // フロントエンド側で relaunch を呼び出して再起動
    Ok(())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_process::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .invoke_handler(tauri::generate_handler![
            save_file,
            open_file_dialog,
            open_file_path,
            open_folder_dialog,
            show_about,
            register_file_association,
            unregister_file_association,
            minimize_window,
            toggle_maximize_window,
            close_window,
            download_update,
            install_update,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
