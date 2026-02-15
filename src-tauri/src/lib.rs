use encoding_rs::{Encoding, UTF_16BE, UTF_16LE, UTF_8, WINDOWS_1252};
use std::collections::HashSet;
use std::fs;
use std::process::Command;
use std::sync::Mutex;
use tauri::Manager;

mod config;

// State to store CLI files to open
struct CliFilesState(Mutex<Vec<String>>);

#[derive(serde::Serialize, serde::Deserialize)]
pub struct FileContent {
    content: String,
    path: String,
    encoding: String,
}

struct EncodingInfo {
    encoding: &'static Encoding,
    name: String,
    skip_bytes: usize, // Number of BOM bytes to skip
}

// Detect encoding from BOM or content
fn detect_encoding(bytes: &[u8]) -> EncodingInfo {
    // Check for UTF-8 BOM
    if bytes.len() >= 3 && bytes[0] == 0xEF && bytes[1] == 0xBB && bytes[2] == 0xBF {
        return EncodingInfo {
            encoding: UTF_8,
            name: "UTF-8-BOM".to_string(),
            skip_bytes: 3,
        };
    }
    // Check for UTF-16LE BOM
    if bytes.len() >= 2 && bytes[0] == 0xFF && bytes[1] == 0xFE {
        return EncodingInfo {
            encoding: UTF_16LE,
            name: "UTF-16LE".to_string(),
            skip_bytes: 2,
        };
    }
    // Check for UTF-16BE BOM
    if bytes.len() >= 2 && bytes[0] == 0xFE && bytes[1] == 0xFF {
        return EncodingInfo {
            encoding: UTF_16BE,
            name: "UTF-16BE".to_string(),
            skip_bytes: 2,
        };
    }

    // Default to UTF-8 (no BOM)
    EncodingInfo {
        encoding: UTF_8,
        name: "UTF-8".to_string(),
        skip_bytes: 0,
    }
}

#[tauri::command]
fn read_file_content(path: String) -> Result<FileContent, String> {
    let bytes = fs::read(&path).map_err(|e| e.to_string())?;

    let encoding_info = detect_encoding(&bytes);

    // Skip BOM bytes before decoding
    let content_bytes = &bytes[encoding_info.skip_bytes..];
    let (content, _, had_errors) = encoding_info.encoding.decode(content_bytes);

    if had_errors {
        return Err("Error decoding file with detected encoding".to_string());
    }

    Ok(FileContent {
        content: content.into_owned(),
        path,
        encoding: encoding_info.name,
    })
}

#[tauri::command]
fn write_file_content(
    path: String,
    content: String,
    encoding: Option<String>,
) -> Result<(), String> {
    let encoding_name = encoding.unwrap_or_else(|| "UTF-8".to_string());

    let (enc, add_bom): (&'static Encoding, bool) = match encoding_name.as_str() {
        "UTF-8" => (UTF_8, false),
        "UTF-8-BOM" => (UTF_8, true),
        "UTF-16LE" => (UTF_16LE, true), // UTF-16 always has BOM
        "UTF-16BE" => (UTF_16BE, true), // UTF-16 always has BOM
        "WINDOWS-1252" | "Windows-1252" | "ANSI" => (WINDOWS_1252, false),
        _ => (UTF_8, false),
    };

    let (encoded_bytes, _, had_errors) = enc.encode(&content);

    if had_errors {
        return Err("Error encoding content".to_string());
    }

    // Prepare final bytes with BOM if needed
    let final_bytes: Vec<u8> = if add_bom {
        match enc {
            _ if enc == UTF_8 => {
                // UTF-8 BOM: 0xEF 0xBB 0xBF
                let mut bytes_with_bom = vec![0xEF, 0xBB, 0xBF];
                bytes_with_bom.extend_from_slice(&encoded_bytes);
                bytes_with_bom
            }
            _ if enc == UTF_16LE => {
                // UTF-16LE BOM: 0xFF 0xFE
                let mut bytes_with_bom = vec![0xFF, 0xFE];
                bytes_with_bom.extend_from_slice(&encoded_bytes);
                bytes_with_bom
            }
            _ if enc == UTF_16BE => {
                // UTF-16BE BOM: 0xFE 0xFF
                let mut bytes_with_bom = vec![0xFE, 0xFF];
                bytes_with_bom.extend_from_slice(&encoded_bytes);
                bytes_with_bom
            }
            _ => encoded_bytes.to_vec(),
        }
    } else {
        encoded_bytes.to_vec()
    };

    fs::write(&path, final_bytes).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn get_config() -> Result<config::AppConfig, String> {
    config::load_config()
}

#[tauri::command]
fn save_app_config(config_data: config::AppConfig) -> Result<(), String> {
    config::save_config(&config_data)
}

#[tauri::command]
fn get_theme(theme_name: String) -> Result<config::Theme, String> {
    let config = config::load_config()?;
    config::load_theme(&theme_name, &config)
}

#[tauri::command]
fn get_current_theme() -> Result<config::Theme, String> {
    let config = config::load_config()?;
    config::load_current_theme(&config)
}

#[tauri::command]
fn list_available_themes() -> Result<Vec<String>, String> {
    let config = config::load_config()?;
    config::list_themes(&config)
}

#[tauri::command]
fn get_config_dir() -> Result<String, String> {
    let dir = config::get_config_dir()?;
    Ok(dir.to_string_lossy().to_string())
}

#[tauri::command]
fn save_current_theme(theme: config::Theme) -> Result<(), String> {
    config::save_current_theme(&theme)
}

#[tauri::command]
fn save_custom_theme(theme_name: String, theme: config::Theme) -> Result<(), String> {
    config::save_custom_theme(&theme_name, &theme)
}

#[tauri::command]
fn delete_theme(theme_name: String) -> Result<(), String> {
    config::delete_theme(&theme_name)
}

#[tauri::command]
fn add_recent_file(file_path: String) -> Result<(), String> {
    let mut config = config::load_config()?;

    // Remove the file if it already exists (to move it to the front)
    config.recent_files.retain(|p| p != &file_path);

    // Add to the front of the list
    config.recent_files.insert(0, file_path);

    // Keep only the last 10 files
    const MAX_RECENT_FILES: usize = 10;
    if config.recent_files.len() > MAX_RECENT_FILES {
        config.recent_files.truncate(MAX_RECENT_FILES);
    }

    config::save_config(&config)
}

#[tauri::command]
fn get_recent_files() -> Result<Vec<String>, String> {
    let config = config::load_config()?;
    Ok(config.recent_files)
}

#[tauri::command]
fn clear_recent_files() -> Result<(), String> {
    let mut config = config::load_config()?;
    config.recent_files.clear();
    config::save_config(&config)
}

#[tauri::command]
async fn create_new_window(app: tauri::AppHandle) -> Result<(), String> {
    use tauri::WebviewUrl;
    use tauri::WebviewWindowBuilder;

    // Generate a unique label for the new window
    let window_label = format!(
        "window-{}",
        std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_millis()
    );

    // Must be async: on Windows, WebView2 deadlocks when creating
    // windows from a synchronous command handler due to thread affinity.
    // Linux (WebKitGTK) and macOS (WKWebView) don't have this constraint.
    WebviewWindowBuilder::new(&app, window_label, WebviewUrl::default())
        .title("Velt")
        .inner_size(1200.0, 800.0)
        .min_inner_size(800.0, 600.0)
        .resizable(true)
        .fullscreen(false)
        .decorations(true)
        .build()
        .map_err(|e| format!("Failed to create new window: {}", e))?;

    Ok(())
}

#[tauri::command]
fn get_cli_files(state: tauri::State<CliFilesState>) -> Result<Vec<String>, String> {
    let files = state.0.lock().map_err(|e| e.to_string())?;
    Ok(files.clone())
}

#[derive(serde::Serialize, serde::Deserialize)]
pub struct ImportedFont {
    name: String,
    filename: String,
    format: String,
}

fn get_fonts_dir() -> Result<std::path::PathBuf, String> {
    let config_dir = config::get_config_dir()?;
    let fonts_dir = config_dir.join("fonts");

    // Create fonts directory if it doesn't exist
    if !fonts_dir.exists() {
        fs::create_dir_all(&fonts_dir)
            .map_err(|e| format!("Failed to create fonts directory: {}", e))?;
    }

    Ok(fonts_dir)
}

/// Common fallback fonts that are likely available on most systems
fn get_fallback_fonts() -> Vec<&'static str> {
    #[cfg(target_os = "linux")]
    return vec![
        "Cascadia Code",
        "DejaVu Sans Mono",
        "DejaVu Sans",
        "DejaVu Serif",
        "Droid Sans Mono",
        "Fira Code",
        "Fira Mono",
        "FreeMono",
        "FreeSans",
        "FreeSerif",
        "Hack",
        "IBM Plex Mono",
        "Inconsolata",
        "JetBrains Mono",
        "Liberation Mono",
        "Liberation Sans",
        "Liberation Serif",
        "Monospace",
        "Noto Mono",
        "Noto Sans",
        "Noto Serif",
        "Source Code Pro",
        "Ubuntu",
        "Ubuntu Mono",
    ];

    #[cfg(target_os = "macos")]
    return vec![
        "Courier New",
        "Helvetica",
        "Helvetica Neue",
        "Menlo",
        "Monaco",
        "San Francisco",
        "SF Mono",
        "SF Pro",
        "Times New Roman",
    ];

    #[cfg(target_os = "windows")]
    return vec![
        "Arial",
        "Calibri",
        "Cambria",
        "Cascadia Code",
        "Cascadia Mono",
        "Consolas",
        "Courier New",
        "Georgia",
        "Segoe UI",
        "Tahoma",
        "Times New Roman",
        "Verdana",
    ];

    #[cfg(not(any(target_os = "linux", target_os = "macos", target_os = "windows")))]
    return vec!["monospace", "sans-serif", "serif"];
}

#[tauri::command]
fn list_system_fonts() -> Result<Vec<String>, String> {
    let mut fonts = HashSet::new();
    let mut use_fallback = false;

    // Detect OS and use appropriate command
    #[cfg(target_os = "linux")]
    {
        // Use fc-list on Linux (fontconfig)
        // This might fail in Flatpak/sandbox environments
        match Command::new("fc-list").arg(":").arg("family").output() {
            Ok(output) if output.status.success() => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                for line in stdout.lines() {
                    let parts: Vec<&str> = line.split(':').collect();
                    if let Some(families) = parts.first() {
                        for family in families.split(',') {
                            let trimmed = family.trim();
                            if !trimmed.is_empty() {
                                fonts.insert(trimmed.to_string());
                            }
                        }
                    }
                }
            }
            _ => {
                // fc-list failed (probably sandboxed), use fallback fonts
                eprintln!(
                    "Warning: fc-list not available (sandboxed environment?), using fallback fonts"
                );
                use_fallback = true;
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        match Command::new("system_profiler")
            .arg("SPFontsDataType")
            .output()
        {
            Ok(output) if output.status.success() => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                for line in stdout.lines() {
                    let trimmed = line.trim();
                    if !trimmed.is_empty()
                        && !trimmed.starts_with("Fonts:")
                        && !trimmed.starts_with("Type:")
                        && !trimmed.starts_with("Valid:")
                        && !trimmed.starts_with("Enabled:")
                        && !trimmed.contains(':')
                    {
                        fonts.insert(trimmed.to_string());
                    }
                }
            }
            _ => {
                eprintln!("Warning: system_profiler not available, using fallback fonts");
                use_fallback = true;
            }
        }
    }

    #[cfg(target_os = "windows")]
    {
        match Command::new("powershell")
            .arg("-Command")
            .arg("[System.Reflection.Assembly]::LoadWithPartialName('System.Drawing'); (New-Object System.Drawing.Text.InstalledFontCollection).Families | ForEach-Object { $_.Name }")
            .output() {
            Ok(output) if output.status.success() => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                for line in stdout.lines() {
                    let trimmed = line.trim();
                    if !trimmed.is_empty() {
                        fonts.insert(trimmed.to_string());
                    }
                }
            }
            _ => {
                eprintln!("Warning: PowerShell font listing not available, using fallback fonts");
                use_fallback = true;
            }
        }
    }

    // If system font enumeration failed, add fallback fonts
    if use_fallback || fonts.is_empty() {
        for font in get_fallback_fonts() {
            fonts.insert(font.to_string());
        }
    }

    // Convert HashSet to sorted Vec
    let mut font_list: Vec<String> = fonts.into_iter().collect();
    font_list.sort_by_key(|a| a.to_lowercase());

    Ok(font_list)
}

#[tauri::command]
fn import_font(source_path: String) -> Result<ImportedFont, String> {
    let source = std::path::Path::new(&source_path);

    // Validate file exists
    if !source.exists() {
        return Err("Font file does not exist".to_string());
    }

    // Get file extension to determine format
    let extension = source
        .extension()
        .and_then(|e| e.to_str())
        .ok_or("Invalid file extension")?
        .to_lowercase();

    let format = match extension.as_str() {
        "ttf" => "truetype",
        "otf" => "opentype",
        "woff" => "woff",
        "woff2" => "woff2",
        _ => return Err(format!("Unsupported font format: {}", extension)),
    };

    // Get filename
    let filename = source
        .file_name()
        .and_then(|f| f.to_str())
        .ok_or("Invalid filename")?
        .to_string();

    // Extract font name from filename (remove extension)
    let name = source
        .file_stem()
        .and_then(|n| n.to_str())
        .ok_or("Invalid font name")?
        .to_string();

    // Get fonts directory
    let fonts_dir = get_fonts_dir()?;
    let dest = fonts_dir.join(&filename);

    // Copy font file to config directory
    fs::copy(source, &dest).map_err(|e| format!("Failed to copy font file: {}", e))?;

    println!("Imported font: {} -> {:?}", name, dest);

    Ok(ImportedFont {
        name,
        filename,
        format: format.to_string(),
    })
}

#[tauri::command]
fn list_imported_fonts() -> Result<Vec<ImportedFont>, String> {
    let fonts_dir = get_fonts_dir()?;
    let mut imported_fonts = Vec::new();

    // Read all font files in the fonts directory
    let entries =
        fs::read_dir(&fonts_dir).map_err(|e| format!("Failed to read fonts directory: {}", e))?;

    for entry in entries {
        let entry = entry.map_err(|e| format!("Failed to read entry: {}", e))?;
        let path = entry.path();

        if path.is_file() {
            if let Some(extension) = path.extension().and_then(|e| e.to_str()) {
                let ext_lower = extension.to_lowercase();
                let format = match ext_lower.as_str() {
                    "ttf" => "truetype",
                    "otf" => "opentype",
                    "woff" => "woff",
                    "woff2" => "woff2",
                    _ => continue, // Skip non-font files
                };

                if let (Some(filename), Some(name)) = (
                    path.file_name().and_then(|f| f.to_str()),
                    path.file_stem().and_then(|n| n.to_str()),
                ) {
                    imported_fonts.push(ImportedFont {
                        name: name.to_string(),
                        filename: filename.to_string(),
                        format: format.to_string(),
                    });
                }
            }
        }
    }

    // Sort alphabetically
    imported_fonts.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

    Ok(imported_fonts)
}

#[tauri::command]
fn get_fonts_dir_path() -> Result<String, String> {
    let fonts_dir = get_fonts_dir()?;
    Ok(fonts_dir.to_string_lossy().to_string())
}

/// Get the current platform/OS
#[tauri::command]
fn get_platform() -> String {
    #[cfg(target_os = "macos")]
    return "macos".to_string();

    #[cfg(target_os = "windows")]
    return "windows".to_string();

    #[cfg(target_os = "linux")]
    return "linux".to_string();

    #[cfg(not(any(target_os = "macos", target_os = "windows", target_os = "linux")))]
    return "unknown".to_string();
}

#[tauri::command]
fn delete_imported_font(filename: String) -> Result<(), String> {
    let fonts_dir = get_fonts_dir()?;
    let font_path = fonts_dir.join(&filename);

    if !font_path.exists() {
        return Err("Font file does not exist".to_string());
    }

    fs::remove_file(&font_path).map_err(|e| format!("Failed to delete font file: {}", e))?;

    println!("Deleted font: {}", filename);
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    run_with_files(Vec::new());
}

pub fn run_with_files(files: Vec<String>) {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_dialog::init())
        .manage(CliFilesState(Mutex::new(files)))
        .invoke_handler(tauri::generate_handler![
            read_file_content,
            write_file_content,
            get_config,
            save_app_config,
            get_theme,
            get_current_theme,
            list_available_themes,
            get_config_dir,
            save_current_theme,
            save_custom_theme,
            delete_theme,
            add_recent_file,
            get_recent_files,
            clear_recent_files,
            create_new_window,
            get_cli_files,
            list_system_fonts,
            import_font,
            list_imported_fonts,
            get_fonts_dir_path,
            delete_imported_font,
            get_platform,
        ])
        .setup(|app| {
            // Initialize config directory and default files
            if let Err(e) = config::initialize_config() {
                eprintln!("Failed to initialize config: {}", e);
            }

            // Intercept Shift+Tab (ISO_Left_Tab) at GTK level.
            // On Linux/GTK, Shift+Tab generates a different keyval (ISO_Left_Tab = 0xfe20)
            // which WebKitGTK handles internally for focus navigation before JS ever sees it.
            // We intercept it at the GTK widget level and inject a JS custom event instead.
            #[cfg(target_os = "linux")]
            {
                let main_webview = app.get_webview_window("main").unwrap();
                let _ = main_webview.with_webview(|webview| {
                    use webkit2gtk::WebViewExt;
                    use webkit2gtk::SettingsExt;
                    use gtk::prelude::WidgetExt;

                    let wk_webview = webview.inner();

                    // Also disable tab-to-links for good measure
                    if let Some(settings) = WebViewExt::settings(&wk_webview) {
                        settings.set_enable_tabs_to_links(false);
                    }

                    // Intercept ISO_Left_Tab (Shift+Tab) before WebKitGTK consumes it
                    let wk_view = wk_webview.clone();
                    #[allow(deprecated)]
                    wk_webview.connect_key_press_event(move |_, event| {
                        // ISO_Left_Tab = 0xfe20 (what GTK generates for Shift+Tab)
                        if event.keyval() == 0xfe20_u32.into() {
                            #[allow(deprecated)]
                            wk_view.run_javascript(
                                "window.dispatchEvent(new CustomEvent('native-shift-tab'))",
                                None::<&gtk::gio::Cancellable>,
                                |_| {},
                            );
                            return gtk::glib::Propagation::Stop;
                        }
                        gtk::glib::Propagation::Proceed
                    });
                });
            }

            #[cfg(debug_assertions)]
            {
                let window = app.get_webview_window("main").unwrap();
                window.open_devtools();
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
