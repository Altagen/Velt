use serde::{Deserialize, Serialize};
use std::env;
use std::fs;
use std::path::{Path, PathBuf};

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AppConfig {
    pub theme: String,
    #[serde(rename = "themesDir")]
    pub themes_dir: Option<String>,
    #[serde(rename = "autoSave")]
    pub auto_save: bool,
    #[serde(rename = "autoSaveDelay")]
    pub auto_save_delay: u32,
    #[serde(rename = "recentFiles")]
    pub recent_files: Vec<String>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "default-dark".to_string(),
            themes_dir: None,
            auto_save: true,
            auto_save_delay: 1000,
            recent_files: Vec::new(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct EditorTheme {
    pub background: String,
    pub foreground: String,
    #[serde(rename = "lineHighlight")]
    pub line_highlight: String,
    pub selection: String,
    pub cursor: String,
    #[serde(rename = "selectionMatch")]
    pub selection_match: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct GutterTheme {
    pub background: String,
    pub foreground: String,
    pub border: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct UiTheme {
    #[serde(rename = "menuBar")]
    pub menu_bar: String,
    #[serde(rename = "tabBar")]
    pub tab_bar: String,
    #[serde(rename = "tabActive")]
    pub tab_active: String,
    #[serde(rename = "tabInactive")]
    pub tab_inactive: String,
    #[serde(rename = "textColor")]
    pub text_color: String,
    #[serde(rename = "textSecondary")]
    pub text_secondary: String,
    #[serde(rename = "textHoverColor")]
    pub text_hover_color: String,
    #[serde(rename = "textActiveColor")]
    pub text_active_color: String,
    pub background: String,
    pub border: String,
    pub accent: String,
    #[serde(rename = "accentHover")]
    pub accent_hover: String,
    #[serde(rename = "accentPrimary")]
    pub accent_primary: String,
    #[serde(rename = "accentPrimaryHover")]
    pub accent_primary_hover: String,
    #[serde(rename = "accentDanger")]
    pub accent_danger: String,
    #[serde(rename = "accentDangerHover")]
    pub accent_danger_hover: String,
    #[serde(rename = "iconColor")]
    pub icon_color: String,
    #[serde(rename = "iconActiveColor")]
    pub icon_active_color: String,
    #[serde(rename = "dirtyIndicator")]
    pub dirty_indicator: String,
    #[serde(rename = "sidebarActive")]
    pub sidebar_active: String,
    #[serde(rename = "sidebarActiveBorder")]
    pub sidebar_active_border: String,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct IconsTheme {
    pub file: Option<String>,
    pub folder: Option<String>,
    pub save: Option<String>,
    pub reload: Option<String>,
    pub settings: Option<String>,
    pub search: Option<String>,
    pub replace: Option<String>,
    pub close: Option<String>,
    pub warning: Option<String>,
    pub cursor: Option<String>,
    pub selection: Option<String>,
    pub wrap: Option<String>,
    pub whitespace: Option<String>,
    pub zoom: Option<String>,
    pub eol: Option<String>,
    pub encoding: Option<String>,
    pub language: Option<String>,
    pub clock: Option<String>,
    pub window: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct SyntaxTheme {
    pub keyword: Option<String>,
    pub string: Option<String>,
    pub number: Option<String>,
    pub comment: Option<String>,
    pub function: Option<String>,
    pub variable: Option<String>,
    #[serde(rename = "type")]
    pub type_: Option<String>,
    pub operator: Option<String>,
    pub punctuation: Option<String>,
    pub attribute: Option<String>,
    pub tag: Option<String>,
    pub regexp: Option<String>,
    pub builtin: Option<String>,
    pub meta: Option<String>,
    pub property: Option<String>,
    pub constant: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct HeadingStyle {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    #[serde(rename = "fontSize", skip_serializing_if = "Option::is_none")]
    pub font_size: Option<String>,
    #[serde(rename = "fontWeight", skip_serializing_if = "Option::is_none")]
    pub font_weight: Option<String>,
    #[serde(rename = "borderBottom", skip_serializing_if = "Option::is_none")]
    pub border_bottom: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub opacity: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct CodeSyntaxTheme {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub keyword: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub string: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub comment: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub number: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub function: Option<String>,
    #[serde(rename = "type", skip_serializing_if = "Option::is_none")]
    pub type_: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub attribute: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub builtin: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub regexp: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub variable: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub meta: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tag: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub operator: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub punctuation: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AdmonitionStyle {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background: Option<String>,
    #[serde(rename = "borderColor", skip_serializing_if = "Option::is_none")]
    pub border_color: Option<String>,
    #[serde(rename = "titleColor", skip_serializing_if = "Option::is_none")]
    pub title_color: Option<String>,
    #[serde(rename = "textColor", skip_serializing_if = "Option::is_none")]
    pub text_color: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub icon: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct AdmonitionsTheme {
    #[serde(rename = "borderRadius", skip_serializing_if = "Option::is_none")]
    pub border_radius: Option<String>,
    #[serde(rename = "borderWidth", skip_serializing_if = "Option::is_none")]
    pub border_width: Option<String>,
    #[serde(rename = "titleFontWeight", skip_serializing_if = "Option::is_none")]
    pub title_font_weight: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub info: Option<AdmonitionStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub warning: Option<AdmonitionStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub danger: Option<AdmonitionStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub tip: Option<AdmonitionStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<AdmonitionStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub custom: Option<std::collections::HashMap<String, AdmonitionStyle>>,
}

#[derive(Debug, Serialize, Deserialize, Clone, Default)]
pub struct MarkdownPreviewTheme {
    // General
    #[serde(skip_serializing_if = "Option::is_none")]
    pub background: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub foreground: Option<String>,
    #[serde(rename = "fontFamily", skip_serializing_if = "Option::is_none")]
    pub font_family: Option<String>,
    #[serde(rename = "fontSize", skip_serializing_if = "Option::is_none")]
    pub font_size: Option<String>,
    #[serde(rename = "lineHeight", skip_serializing_if = "Option::is_none")]
    pub line_height: Option<String>,
    #[serde(rename = "maxWidth", skip_serializing_if = "Option::is_none")]
    pub max_width: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub padding: Option<String>,

    // Links
    #[serde(rename = "linkColor", skip_serializing_if = "Option::is_none")]
    pub link_color: Option<String>,
    #[serde(rename = "linkHoverColor", skip_serializing_if = "Option::is_none")]
    pub link_hover_color: Option<String>,
    #[serde(rename = "linkDecoration", skip_serializing_if = "Option::is_none")]
    pub link_decoration: Option<String>,

    // Headings
    #[serde(rename = "headingColor", skip_serializing_if = "Option::is_none")]
    pub heading_color: Option<String>,
    #[serde(rename = "headingFontFamily", skip_serializing_if = "Option::is_none")]
    pub heading_font_family: Option<String>,
    #[serde(rename = "headingFontWeight", skip_serializing_if = "Option::is_none")]
    pub heading_font_weight: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub h1: Option<HeadingStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub h2: Option<HeadingStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub h3: Option<HeadingStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub h4: Option<HeadingStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub h5: Option<HeadingStyle>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub h6: Option<HeadingStyle>,

    // Blockquotes
    #[serde(rename = "blockquoteBorder", skip_serializing_if = "Option::is_none")]
    pub blockquote_border: Option<String>,
    #[serde(
        rename = "blockquoteBackground",
        skip_serializing_if = "Option::is_none"
    )]
    pub blockquote_background: Option<String>,
    #[serde(
        rename = "blockquoteTextColor",
        skip_serializing_if = "Option::is_none"
    )]
    pub blockquote_text_color: Option<String>,
    #[serde(
        rename = "blockquoteBorderWidth",
        skip_serializing_if = "Option::is_none"
    )]
    pub blockquote_border_width: Option<String>,

    // Code
    #[serde(rename = "codeInlineBg", skip_serializing_if = "Option::is_none")]
    pub code_inline_bg: Option<String>,
    #[serde(rename = "codeInlineColor", skip_serializing_if = "Option::is_none")]
    pub code_inline_color: Option<String>,
    #[serde(
        rename = "codeInlineFontFamily",
        skip_serializing_if = "Option::is_none"
    )]
    pub code_inline_font_family: Option<String>,
    #[serde(rename = "codeBlockBg", skip_serializing_if = "Option::is_none")]
    pub code_block_bg: Option<String>,
    #[serde(rename = "codeBlockColor", skip_serializing_if = "Option::is_none")]
    pub code_block_color: Option<String>,
    #[serde(
        rename = "codeBlockFontFamily",
        skip_serializing_if = "Option::is_none"
    )]
    pub code_block_font_family: Option<String>,
    #[serde(
        rename = "codeBlockBorderRadius",
        skip_serializing_if = "Option::is_none"
    )]
    pub code_block_border_radius: Option<String>,
    #[serde(rename = "codeSyntax", skip_serializing_if = "Option::is_none")]
    pub code_syntax: Option<CodeSyntaxTheme>,

    // Tables
    #[serde(rename = "tableBorder", skip_serializing_if = "Option::is_none")]
    pub table_border: Option<String>,
    #[serde(
        rename = "tableHeaderBackground",
        skip_serializing_if = "Option::is_none"
    )]
    pub table_header_background: Option<String>,
    #[serde(rename = "tableHeaderColor", skip_serializing_if = "Option::is_none")]
    pub table_header_color: Option<String>,
    #[serde(rename = "tableRowEvenBg", skip_serializing_if = "Option::is_none")]
    pub table_row_even_bg: Option<String>,
    #[serde(rename = "tableRowHoverBg", skip_serializing_if = "Option::is_none")]
    pub table_row_hover_bg: Option<String>,

    // HR
    #[serde(rename = "hrColor", skip_serializing_if = "Option::is_none")]
    pub hr_color: Option<String>,
    #[serde(rename = "hrStyle", skip_serializing_if = "Option::is_none")]
    pub hr_style: Option<String>,

    // Lists
    #[serde(rename = "listMarkerColor", skip_serializing_if = "Option::is_none")]
    pub list_marker_color: Option<String>,
    #[serde(rename = "taskListCheckColor", skip_serializing_if = "Option::is_none")]
    pub task_list_check_color: Option<String>,

    // Images
    #[serde(rename = "imageBorderRadius", skip_serializing_if = "Option::is_none")]
    pub image_border_radius: Option<String>,
    #[serde(rename = "imageBorder", skip_serializing_if = "Option::is_none")]
    pub image_border: Option<String>,

    // Admonitions (structured)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub admonitions: Option<AdmonitionsTheme>,
    // Legacy flat properties (backwards compat)
    #[serde(rename = "admonitionInfoBg", skip_serializing_if = "Option::is_none")]
    pub admonition_info_bg: Option<String>,
    #[serde(
        rename = "admonitionWarningBg",
        skip_serializing_if = "Option::is_none"
    )]
    pub admonition_warning_bg: Option<String>,
    #[serde(rename = "admonitionDangerBg", skip_serializing_if = "Option::is_none")]
    pub admonition_danger_bg: Option<String>,
    #[serde(rename = "admonitionTipBg", skip_serializing_if = "Option::is_none")]
    pub admonition_tip_bg: Option<String>,
    #[serde(rename = "admonitionNoteBg", skip_serializing_if = "Option::is_none")]
    pub admonition_note_bg: Option<String>,

    // KaTeX
    #[serde(rename = "katexColor", skip_serializing_if = "Option::is_none")]
    pub katex_color: Option<String>,
    #[serde(rename = "katexFontSize", skip_serializing_if = "Option::is_none")]
    pub katex_font_size: Option<String>,

    // Emphasis
    #[serde(rename = "strongColor", skip_serializing_if = "Option::is_none")]
    pub strong_color: Option<String>,
    #[serde(rename = "emphasisColor", skip_serializing_if = "Option::is_none")]
    pub emphasis_color: Option<String>,
    #[serde(
        rename = "strikethroughOpacity",
        skip_serializing_if = "Option::is_none"
    )]
    pub strikethrough_opacity: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Theme {
    pub name: String,
    pub editor: EditorTheme,
    pub gutter: GutterTheme,
    pub ui: UiTheme,
    #[serde(default)]
    pub icons: Option<IconsTheme>,
    #[serde(default)]
    pub syntax: Option<SyntaxTheme>,
    #[serde(default, rename = "markdownPreview")]
    pub markdown_preview: Option<MarkdownPreviewTheme>,
}

/// Get the Velt config directory path
/// Supports VELT_CONFIG_HOME environment variable for custom location
/// Defaults to platform-specific config directory (e.g., ~/.config/velt on Linux)
pub fn get_config_dir() -> Result<PathBuf, String> {
    // Check for custom config directory via environment variable
    if let Ok(custom_dir) = env::var("VELT_CONFIG_HOME") {
        return Ok(PathBuf::from(custom_dir));
    }

    // Fall back to platform-specific default
    let config_dir = dirs::config_dir()
        .ok_or("Could not determine config directory")?
        .join("velt");

    Ok(config_dir)
}

/// Get the themes directory path (from config or default)
pub fn get_themes_dir(config: &AppConfig) -> Result<PathBuf, String> {
    if let Some(custom_dir) = &config.themes_dir {
        Ok(PathBuf::from(custom_dir))
    } else {
        Ok(get_config_dir()?.join("themes"))
    }
}

/// Initialize config directory and default files
pub fn initialize_config() -> Result<(), String> {
    let config_dir = get_config_dir()?;
    let themes_dir = config_dir.join("themes");

    // Create directories if they don't exist
    fs::create_dir_all(&config_dir).map_err(|e| e.to_string())?;
    fs::create_dir_all(&themes_dir).map_err(|e| e.to_string())?;

    // Create default config.json if it doesn't exist
    let config_path = config_dir.join("config.json");
    if !config_path.exists() {
        let default_config = AppConfig::default();
        let config_json =
            serde_json::to_string_pretty(&default_config).map_err(|e| e.to_string())?;
        fs::write(&config_path, config_json).map_err(|e| e.to_string())?;
    }

    // Create default themes if they don't exist
    create_default_themes(&themes_dir)?;

    Ok(())
}

/// Create default theme files
fn create_default_themes(themes_dir: &Path) -> Result<(), String> {
    // Default Dark theme
    let dark_theme = Theme {
        name: "Default Dark".to_string(),
        editor: EditorTheme {
            background: "#1e1e1e".to_string(),
            foreground: "#d4d4d4".to_string(),
            line_highlight: "#2d2d30".to_string(),
            selection: "rgba(58, 110, 165, 0.3)".to_string(),
            cursor: "#ffffff".to_string(),
            selection_match: "rgba(100, 200, 100, 0.3)".to_string(),
        },
        gutter: GutterTheme {
            background: "#1e1e1e".to_string(),
            foreground: "#858585".to_string(),
            border: "#3e3e42".to_string(),
        },
        ui: UiTheme {
            menu_bar: "#2d2d30".to_string(),
            tab_bar: "#2d2d30".to_string(),
            tab_active: "#1e1e1e".to_string(),
            tab_inactive: "#2d2d30".to_string(),
            text_color: "#cccccc".to_string(),
            text_secondary: "#858585".to_string(),
            text_hover_color: "#ffffff".to_string(),
            text_active_color: "#ffffff".to_string(),
            background: "#252526".to_string(),
            border: "#3e3e42".to_string(),
            accent: "#4a9eff".to_string(),
            accent_hover: "#6eb4ff".to_string(),
            accent_primary: "#00d4aa".to_string(),
            accent_primary_hover: "#00ffcc".to_string(),
            accent_danger: "#f48771".to_string(),
            accent_danger_hover: "#ff9b87".to_string(),
            icon_color: "#858585".to_string(),
            icon_active_color: "#ffd700".to_string(),
            dirty_indicator: "#4ec9b0".to_string(),
            sidebar_active: "#1e1e1e".to_string(),
            sidebar_active_border: "#00d4aa".to_string(),
        },
        icons: Some(IconsTheme {
            file: Some("#64B5F6".to_string()),       // Light blue
            folder: Some("#FFB74D".to_string()),     // Orange
            save: Some("#81C784".to_string()),       // Green
            reload: Some("#4DD0E1".to_string()),     // Cyan
            settings: Some("#BA68C8".to_string()),   // Purple
            search: Some("#64B5F6".to_string()),     // Light blue
            replace: Some("#FFD54F".to_string()),    // Yellow
            close: Some("#9E9E9E".to_string()),      // Gray
            warning: Some("#FFB74D".to_string()),    // Orange
            cursor: Some("#42A5F5".to_string()),     // Blue
            selection: Some("#66BB6A".to_string()),  // Green
            wrap: Some("#9575CD".to_string()),       // Deep purple
            whitespace: Some("#78909C".to_string()), // Blue gray
            zoom: Some("#4FC3F7".to_string()),       // Light blue
            eol: Some("#A1887F".to_string()),        // Brown
            encoding: Some("#F06292".to_string()),   // Pink
            language: Some("#4DB6AC".to_string()),   // Teal
            clock: Some("#FFB74D".to_string()),      // Orange
            window: Some("#7986CB".to_string()),     // Indigo
        }),
        syntax: Some(SyntaxTheme {
            keyword: Some("#c678dd".to_string()),
            string: Some("#98c379".to_string()),
            number: Some("#d19a66".to_string()),
            comment: Some("#5c6370".to_string()),
            function: Some("#61afef".to_string()),
            variable: Some("#e06c75".to_string()),
            type_: Some("#e6c07b".to_string()),
            operator: Some("#56b6c2".to_string()),
            punctuation: Some("#abb2bf".to_string()),
            attribute: Some("#d19a66".to_string()),
            tag: Some("#e06c75".to_string()),
            regexp: Some("#56b6c2".to_string()),
            builtin: Some("#e6c07b".to_string()),
            meta: Some("#5c6370".to_string()),
            property: Some("#61afef".to_string()),
            constant: Some("#d19a66".to_string()),
        }),
        markdown_preview: Some(MarkdownPreviewTheme {
            // General
            background: None,
            foreground: None,
            font_family: None,
            font_size: None,
            line_height: None,
            max_width: None,
            padding: None,

            // Links
            link_color: Some("#58a6ff".to_string()),
            link_hover_color: None,
            link_decoration: None,

            // Headings
            heading_color: Some("#d4d4d4".to_string()),
            heading_font_family: None,
            heading_font_weight: None,
            h1: None,
            h2: None,
            h3: None,
            h4: None,
            h5: None,
            h6: None,

            // Blockquotes
            blockquote_border: Some("rgba(255, 255, 255, 0.2)".to_string()),
            blockquote_background: Some("rgba(255, 255, 255, 0.03)".to_string()),
            blockquote_text_color: None,
            blockquote_border_width: None,

            // Code
            code_inline_bg: Some("rgba(255, 255, 255, 0.08)".to_string()),
            code_inline_color: None,
            code_inline_font_family: None,
            code_block_bg: Some("rgba(0, 0, 0, 0.3)".to_string()),
            code_block_color: Some("#abb2bf".to_string()),
            code_block_font_family: None,
            code_block_border_radius: None,
            code_syntax: Some(CodeSyntaxTheme {
                keyword: Some("#c678dd".to_string()),
                string: Some("#98c379".to_string()),
                comment: Some("#5c6370".to_string()),
                number: Some("#d19a66".to_string()),
                function: Some("#61afef".to_string()),
                type_: Some("#e6c07b".to_string()),
                attribute: Some("#d19a66".to_string()),
                builtin: Some("#e6c07b".to_string()),
                regexp: Some("#56b6c2".to_string()),
                variable: Some("#e06c75".to_string()),
                meta: Some("#5c6370".to_string()),
                tag: Some("#e06c75".to_string()),
                operator: Some("#56b6c2".to_string()),
                punctuation: Some("#abb2bf".to_string()),
            }),

            // Tables
            table_border: Some("rgba(255, 255, 255, 0.12)".to_string()),
            table_header_background: Some("rgba(255, 255, 255, 0.06)".to_string()),
            table_header_color: None,
            table_row_even_bg: None,
            table_row_hover_bg: None,

            // HR
            hr_color: Some("rgba(255, 255, 255, 0.15)".to_string()),
            hr_style: None,

            // Lists
            list_marker_color: None,
            task_list_check_color: None,

            // Images
            image_border_radius: None,
            image_border: None,

            // Admonitions (structured)
            admonitions: Some(AdmonitionsTheme {
                border_radius: None,
                border_width: None,
                title_font_weight: None,
                info: Some(AdmonitionStyle {
                    background: Some("rgba(33, 150, 243, 0.15)".to_string()),
                    border_color: Some("#2196f3".to_string()),
                    title_color: None,
                    text_color: None,
                    icon: Some("\u{2139}\u{fe0f}".to_string()),
                }),
                warning: Some(AdmonitionStyle {
                    background: Some("rgba(230, 167, 0, 0.15)".to_string()),
                    border_color: Some("#e6a700".to_string()),
                    title_color: None,
                    text_color: None,
                    icon: Some("\u{26a0}\u{fe0f}".to_string()),
                }),
                danger: Some(AdmonitionStyle {
                    background: Some("rgba(229, 57, 53, 0.15)".to_string()),
                    border_color: Some("#e53935".to_string()),
                    title_color: None,
                    text_color: None,
                    icon: Some("\u{1f534}".to_string()),
                }),
                tip: Some(AdmonitionStyle {
                    background: Some("rgba(76, 175, 80, 0.15)".to_string()),
                    border_color: Some("#4caf50".to_string()),
                    title_color: None,
                    text_color: None,
                    icon: Some("\u{1f4a1}".to_string()),
                }),
                note: Some(AdmonitionStyle {
                    background: Some("rgba(158, 158, 158, 0.15)".to_string()),
                    border_color: Some("#9e9e9e".to_string()),
                    title_color: None,
                    text_color: None,
                    icon: Some("\u{1f4dd}".to_string()),
                }),
                custom: None,
            }),
            // Legacy flat properties (backwards compat, prefer "admonitions" above)
            admonition_info_bg: None,
            admonition_warning_bg: None,
            admonition_danger_bg: None,
            admonition_tip_bg: None,
            admonition_note_bg: None,

            // KaTeX
            katex_color: None,
            katex_font_size: None,

            // Emphasis
            strong_color: None,
            emphasis_color: None,
            strikethrough_opacity: None,
        }),
    };

    let dark_path = themes_dir.join("default-dark.json");
    if !dark_path.exists() {
        let dark_json = serde_json::to_string_pretty(&dark_theme).map_err(|e| e.to_string())?;
        fs::write(&dark_path, dark_json).map_err(|e| e.to_string())?;
    }

    // Default Light theme
    let light_theme = Theme {
        name: "Default Light".to_string(),
        editor: EditorTheme {
            background: "#ffffff".to_string(),
            foreground: "#000000".to_string(),
            line_highlight: "#f0f0f0".to_string(),
            selection: "rgba(173, 214, 255, 0.4)".to_string(),
            cursor: "#000000".to_string(),
            selection_match: "rgba(180, 215, 180, 0.4)".to_string(),
        },
        gutter: GutterTheme {
            background: "#f5f5f5".to_string(),
            foreground: "#6e6e6e".to_string(),
            border: "#e0e0e0".to_string(),
        },
        ui: UiTheme {
            menu_bar: "#f3f3f3".to_string(),
            tab_bar: "#f3f3f3".to_string(),
            tab_active: "#ffffff".to_string(),
            tab_inactive: "#ececec".to_string(),
            text_color: "#333333".to_string(),
            text_secondary: "#6e6e6e".to_string(),
            text_hover_color: "#000000".to_string(),
            text_active_color: "#000000".to_string(),
            background: "#f5f5f5".to_string(),
            border: "#e0e0e0".to_string(),
            accent: "#0066cc".to_string(),
            accent_hover: "#0052a3".to_string(),
            accent_primary: "#00a884".to_string(),
            accent_primary_hover: "#008f6f".to_string(),
            accent_danger: "#d73a2e".to_string(),
            accent_danger_hover: "#b32d24".to_string(),
            icon_color: "#6e6e6e".to_string(),
            icon_active_color: "#cc9900".to_string(),
            dirty_indicator: "#00a884".to_string(),
            sidebar_active: "#ffffff".to_string(),
            sidebar_active_border: "#0066cc".to_string(),
        },
        icons: Some(IconsTheme {
            file: Some("#1976D2".to_string()),       // Blue
            folder: Some("#F57C00".to_string()),     // Deep orange
            save: Some("#388E3C".to_string()),       // Green
            reload: Some("#0097A7".to_string()),     // Cyan
            settings: Some("#7B1FA2".to_string()),   // Purple
            search: Some("#1976D2".to_string()),     // Blue
            replace: Some("#FBC02D".to_string()),    // Yellow
            close: Some("#757575".to_string()),      // Gray
            warning: Some("#F57C00".to_string()),    // Deep orange
            cursor: Some("#1E88E5".to_string()),     // Blue
            selection: Some("#43A047".to_string()),  // Green
            wrap: Some("#5E35B1".to_string()),       // Deep purple
            whitespace: Some("#546E7A".to_string()), // Blue gray
            zoom: Some("#039BE5".to_string()),       // Light blue
            eol: Some("#6D4C41".to_string()),        // Brown
            encoding: Some("#D81B60".to_string()),   // Pink
            language: Some("#00897B".to_string()),   // Teal
            clock: Some("#F57C00".to_string()),      // Deep orange
            window: Some("#3949AB".to_string()),     // Indigo
        }),
        syntax: Some(SyntaxTheme {
            keyword: Some("#7928a1".to_string()),
            string: Some("#50a14f".to_string()),
            number: Some("#986801".to_string()),
            comment: Some("#a0a1a7".to_string()),
            function: Some("#4078f2".to_string()),
            variable: Some("#e45649".to_string()),
            type_: Some("#c18401".to_string()),
            operator: Some("#0184bc".to_string()),
            punctuation: Some("#383a42".to_string()),
            attribute: Some("#986801".to_string()),
            tag: Some("#e45649".to_string()),
            regexp: Some("#0184bc".to_string()),
            builtin: Some("#c18401".to_string()),
            meta: Some("#a0a1a7".to_string()),
            property: Some("#4078f2".to_string()),
            constant: Some("#986801".to_string()),
        }),
        markdown_preview: Some(MarkdownPreviewTheme {
            // General
            background: None,
            foreground: None,
            font_family: None,
            font_size: None,
            line_height: None,
            max_width: None,
            padding: None,

            // Links
            link_color: Some("#0066cc".to_string()),
            link_hover_color: None,
            link_decoration: None,

            // Headings
            heading_color: Some("#000000".to_string()),
            heading_font_family: None,
            heading_font_weight: None,
            h1: None,
            h2: None,
            h3: None,
            h4: None,
            h5: None,
            h6: None,

            // Blockquotes
            blockquote_border: Some("rgba(0, 0, 0, 0.15)".to_string()),
            blockquote_background: Some("rgba(0, 0, 0, 0.03)".to_string()),
            blockquote_text_color: None,
            blockquote_border_width: None,

            // Code
            code_inline_bg: Some("rgba(0, 0, 0, 0.06)".to_string()),
            code_inline_color: None,
            code_inline_font_family: None,
            code_block_bg: Some("rgba(0, 0, 0, 0.05)".to_string()),
            code_block_color: Some("#383a42".to_string()),
            code_block_font_family: None,
            code_block_border_radius: None,
            code_syntax: Some(CodeSyntaxTheme {
                keyword: Some("#7928a1".to_string()),
                string: Some("#50a14f".to_string()),
                comment: Some("#a0a1a7".to_string()),
                number: Some("#986801".to_string()),
                function: Some("#4078f2".to_string()),
                type_: Some("#c18401".to_string()),
                attribute: Some("#986801".to_string()),
                builtin: Some("#c18401".to_string()),
                regexp: Some("#0184bc".to_string()),
                variable: Some("#e45649".to_string()),
                meta: Some("#a0a1a7".to_string()),
                tag: Some("#e45649".to_string()),
                operator: Some("#0184bc".to_string()),
                punctuation: Some("#383a42".to_string()),
            }),

            // Tables
            table_border: Some("rgba(0, 0, 0, 0.12)".to_string()),
            table_header_background: Some("rgba(0, 0, 0, 0.04)".to_string()),
            table_header_color: None,
            table_row_even_bg: None,
            table_row_hover_bg: None,

            // HR
            hr_color: Some("rgba(0, 0, 0, 0.15)".to_string()),
            hr_style: None,

            // Lists
            list_marker_color: None,
            task_list_check_color: None,

            // Images
            image_border_radius: None,
            image_border: None,

            // Admonitions (structured)
            admonitions: Some(AdmonitionsTheme {
                border_radius: None,
                border_width: None,
                title_font_weight: None,
                info: Some(AdmonitionStyle {
                    background: Some("rgba(33, 150, 243, 0.1)".to_string()),
                    border_color: Some("#1976d2".to_string()),
                    title_color: None,
                    text_color: None,
                    icon: Some("\u{2139}\u{fe0f}".to_string()),
                }),
                warning: Some(AdmonitionStyle {
                    background: Some("rgba(230, 167, 0, 0.1)".to_string()),
                    border_color: Some("#f57c00".to_string()),
                    title_color: None,
                    text_color: None,
                    icon: Some("\u{26a0}\u{fe0f}".to_string()),
                }),
                danger: Some(AdmonitionStyle {
                    background: Some("rgba(229, 57, 53, 0.1)".to_string()),
                    border_color: Some("#d32f2f".to_string()),
                    title_color: None,
                    text_color: None,
                    icon: Some("\u{1f534}".to_string()),
                }),
                tip: Some(AdmonitionStyle {
                    background: Some("rgba(76, 175, 80, 0.1)".to_string()),
                    border_color: Some("#388e3c".to_string()),
                    title_color: None,
                    text_color: None,
                    icon: Some("\u{1f4a1}".to_string()),
                }),
                note: Some(AdmonitionStyle {
                    background: Some("rgba(158, 158, 158, 0.1)".to_string()),
                    border_color: Some("#757575".to_string()),
                    title_color: None,
                    text_color: None,
                    icon: Some("\u{1f4dd}".to_string()),
                }),
                custom: None,
            }),
            // Legacy flat properties (backwards compat, prefer "admonitions" above)
            admonition_info_bg: None,
            admonition_warning_bg: None,
            admonition_danger_bg: None,
            admonition_tip_bg: None,
            admonition_note_bg: None,

            // KaTeX
            katex_color: None,
            katex_font_size: None,

            // Emphasis
            strong_color: None,
            emphasis_color: None,
            strikethrough_opacity: None,
        }),
    };

    let light_path = themes_dir.join("default-light.json");
    if !light_path.exists() {
        let light_json = serde_json::to_string_pretty(&light_theme).map_err(|e| e.to_string())?;
        fs::write(&light_path, light_json).map_err(|e| e.to_string())?;
    }

    Ok(())
}

/// Load config from file
pub fn load_config() -> Result<AppConfig, String> {
    let config_path = get_config_dir()?.join("config.json");

    if !config_path.exists() {
        return Ok(AppConfig::default());
    }

    let config_content = fs::read_to_string(&config_path).map_err(|e| e.to_string())?;
    let config: AppConfig = serde_json::from_str(&config_content).map_err(|e| e.to_string())?;

    Ok(config)
}

/// Save config to file
pub fn save_config(config: &AppConfig) -> Result<(), String> {
    let config_path = get_config_dir()?.join("config.json");
    let config_json = serde_json::to_string_pretty(config).map_err(|e| e.to_string())?;
    fs::write(&config_path, config_json).map_err(|e| e.to_string())?;

    Ok(())
}

/// Load a specific theme from file by name
pub fn load_theme(theme_name: &str, config: &AppConfig) -> Result<Theme, String> {
    let themes_dir = get_themes_dir(config)?;
    let theme_path = themes_dir.join(format!("{}.json", theme_name));

    if !theme_path.exists() {
        return Err(format!("Theme '{}' not found", theme_name));
    }

    let theme_content = fs::read_to_string(&theme_path).map_err(|e| e.to_string())?;
    let theme: Theme = serde_json::from_str(&theme_content).map_err(|e| e.to_string())?;

    Ok(theme)
}

/// Load the current active theme (checks current.json first, then falls back to config)
pub fn load_current_theme(config: &AppConfig) -> Result<Theme, String> {
    let themes_dir = get_themes_dir(config)?;

    // Try current.json first
    let current_path = themes_dir.join("current.json");
    if current_path.exists() {
        let theme_content = fs::read_to_string(&current_path).map_err(|e| e.to_string())?;
        if let Ok(theme) = serde_json::from_str::<Theme>(&theme_content) {
            return Ok(theme);
        }
    }

    // Fallback to configured default theme
    load_theme(&config.theme, config)
}

/// Save the current theme to current.json
pub fn save_current_theme(theme: &Theme) -> Result<(), String> {
    let config_dir = get_config_dir()?;
    let themes_dir = config_dir.join("themes");

    // Ensure themes directory exists
    fs::create_dir_all(&themes_dir).map_err(|e| e.to_string())?;

    let current_theme_path = themes_dir.join("current.json");
    let theme_json = serde_json::to_string_pretty(theme).map_err(|e| e.to_string())?;
    fs::write(&current_theme_path, theme_json).map_err(|e| e.to_string())?;

    Ok(())
}

/// Save a custom theme with a specific name
pub fn save_custom_theme(theme_name: &str, theme: &Theme) -> Result<(), String> {
    // Prevent overwriting default themes
    if theme_name == "default-dark" || theme_name == "default-light" || theme_name == "current" {
        return Err("Cannot overwrite default themes".to_string());
    }

    let config = load_config()?;
    let themes_dir = get_themes_dir(&config)?;

    // Ensure themes directory exists
    fs::create_dir_all(&themes_dir).map_err(|e| e.to_string())?;

    let theme_path = themes_dir.join(format!("{}.json", theme_name));
    let theme_json = serde_json::to_string_pretty(theme).map_err(|e| e.to_string())?;
    fs::write(&theme_path, theme_json).map_err(|e| e.to_string())?;

    Ok(())
}

/// Delete a custom theme
pub fn delete_theme(theme_name: &str) -> Result<(), String> {
    // Prevent deleting default themes
    if theme_name == "default-dark" || theme_name == "default-light" || theme_name == "current" {
        return Err("Cannot delete default themes".to_string());
    }

    let config = load_config()?;
    let themes_dir = get_themes_dir(&config)?;
    let theme_path = themes_dir.join(format!("{}.json", theme_name));

    if !theme_path.exists() {
        return Err(format!("Theme '{}' not found", theme_name));
    }

    fs::remove_file(&theme_path).map_err(|e| e.to_string())?;

    Ok(())
}

/// List all available themes
pub fn list_themes(config: &AppConfig) -> Result<Vec<String>, String> {
    let themes_dir = get_themes_dir(config)?;

    if !themes_dir.exists() {
        return Ok(Vec::new());
    }

    let entries = fs::read_dir(&themes_dir).map_err(|e| e.to_string())?;
    let mut themes = Vec::new();

    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();

        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            if let Some(name) = path.file_stem().and_then(|s| s.to_str()) {
                themes.push(name.to_string());
            }
        }
    }

    Ok(themes)
}
