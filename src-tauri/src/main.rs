// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use clap::{Parser, Subcommand};
use std::env;

#[derive(Parser)]
#[command(name = "velt")]
#[command(version = env!("CARGO_PKG_VERSION"))]
#[command(about = "A modern, minimal text editor", long_about = None)]
struct Cli {
    /// File(s) to open
    #[arg(value_name = "FILE")]
    files: Vec<String>,

    #[command(subcommand)]
    command: Option<Commands>,
}

#[derive(Subcommand)]
enum Commands {
    /// Show version information
    Version,
}

fn main() {
    let cli = Cli::parse();

    // Handle version command
    if let Some(Commands::Version) = cli.command {
        println!("Velt {}", env!("CARGO_PKG_VERSION"));
        return;
    }

    // Set environment variables for Wayland compatibility
    #[cfg(target_os = "linux")]
    {
        // Check if running on Wayland and user hasn't explicitly set GDK_BACKEND
        if env::var("WAYLAND_DISPLAY").is_ok() && env::var("GDK_BACKEND").is_err() {
            // Default to X11 backend for better WebKit compatibility
            // Users can override with: GDK_BACKEND=wayland velt
            env::set_var("GDK_BACKEND", "x11");
            env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
            env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    // Filter to keep only valid file paths (not directories)
    let file_paths: Vec<String> = cli
        .files
        .into_iter()
        .filter(|path| {
            let p = std::path::Path::new(path);
            p.is_file() || !p.exists() // Allow non-existent files (new files)
        })
        .collect();

    velt_lib::run_with_files(file_paths);
}
