<script lang="ts">
  import { currentTheme } from '../../stores/themeStore';

  const appInfo = {
    name: 'Velt',
    version: '0.2.0',
    description: 'A modern, minimal notepad built with Tauri, Svelte, and CodeMirror.',
    repository: 'https://github.com/altagen/velt',
    license: 'MIT',
    authors: ['Altagen'],
    year: new Date().getFullYear(),
  };
</script>

<div class="about-section">
  <div class="about-header">
    <div class="about-logo">
      <img src="/velt-logo.png" alt="Velt Logo" />
    </div>
    <div class="about-title">
      <h2 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">{appInfo.name}</h2>
      <span class="version-badge" style="background-color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}; color: {$currentTheme?.editor?.background || '#1e1e1e'}">
        v{appInfo.version}
      </span>
    </div>
  </div>

  <p class="about-description" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
    {appInfo.description}
  </p>

  <div class="about-cards">
    <div
      class="about-card"
      style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
    >
      <h4 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">License</h4>
      <div class="license-content" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
        <p class="license-type" style="color: {$currentTheme?.ui?.accentPrimary || '#00d4aa'}">{appInfo.license} License</p>
        <p class="license-text">
          Copyright © {appInfo.year} {appInfo.authors.join(', ')}
        </p>
        <p class="license-text">
          Permission is hereby granted, free of charge, to any person obtaining a copy
          of this software and associated documentation files (the "Software"), to deal
          in the Software without restriction, including without limitation the rights
          to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
          copies of the Software, and to permit persons to whom the Software is
          furnished to do so, subject to the following conditions:
        </p>
        <p class="license-text">
          The above copyright notice and this permission notice shall be included in all
          copies or substantial portions of the Software.
        </p>
        <p class="license-text license-disclaimer">
          THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
          IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
          FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
        </p>
      </div>
    </div>

    <div
      class="about-card"
      style="background-color: {$currentTheme?.editor?.background || '#1e1e1e'}; border-color: {$currentTheme?.ui?.border || '#3e3e42'}"
    >
      <h4 style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Built With</h4>
      <div class="tech-stack">
        <div class="tech-item">
          <span class="tech-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Tauri</span>
          <span class="tech-desc" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Desktop framework</span>
        </div>
        <div class="tech-item">
          <span class="tech-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Rust</span>
          <span class="tech-desc" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Backend</span>
        </div>
        <div class="tech-item">
          <span class="tech-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">Svelte</span>
          <span class="tech-desc" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">UI framework</span>
        </div>
        <div class="tech-item">
          <span class="tech-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">CodeMirror 6</span>
          <span class="tech-desc" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Editor engine</span>
        </div>
        <div class="tech-item">
          <span class="tech-name" style="color: {$currentTheme?.ui?.textColor || '#d4d4d4'}">TypeScript</span>
          <span class="tech-desc" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">Language</span>
        </div>
      </div>
    </div>
  </div>

  <div class="about-footer" style="color: {$currentTheme?.ui?.textSecondary || '#858585'}">
    <p>Made with ❤️ by the Velt team</p>
  </div>
</div>

<style>
  .about-section {
    padding: 32px;
    max-width: 700px;
    margin: 0 auto;
  }

  .about-header {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 24px;
  }

  .about-logo {
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .about-logo img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .about-title {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .about-title h2 {
    margin: 0;
    font-size: 28px;
    font-weight: 600;
  }

  .version-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
    width: fit-content;
  }

  .about-description {
    font-size: 15px;
    line-height: 1.6;
    margin: 0 0 32px 0;
  }

  .about-cards {
    display: flex;
    flex-direction: column;
    gap: 20px;
    margin-bottom: 32px;
  }

  .about-card {
    border: 1px solid;
    border-radius: 8px;
    padding: 20px;
  }

  .about-card h4 {
    margin: 0 0 16px 0;
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .license-content {
    font-size: 13px;
    line-height: 1.6;
  }

  .license-type {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 12px 0;
  }

  .license-text {
    margin: 0 0 12px 0;
  }

  .license-text:last-child {
    margin-bottom: 0;
  }

  .license-disclaimer {
    font-style: italic;
    opacity: 0.8;
  }

  .tech-stack {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
  }

  .tech-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .tech-name {
    font-size: 14px;
    font-weight: 500;
  }

  .tech-desc {
    font-size: 12px;
  }

  .about-footer {
    text-align: center;
    font-size: 13px;
  }

  .about-footer p {
    margin: 0;
  }
</style>
