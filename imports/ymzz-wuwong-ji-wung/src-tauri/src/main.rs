#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::Manager;

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_sql::Builder::new().build())
        .setup(|app| {
            let app_handle = app.handle();
            let path_resolver = app_handle.path_resolver();

            // 確保本地資料目錄存在
            if let Some(data_dir) = path_resolver.app_data_dir() {
                std::fs::create_dir_all(&data_dir).ok();
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            // 知識節點 CRUD 將在此處註冊
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
