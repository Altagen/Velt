import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// Import web fonts for code editor
import '@fontsource/fira-code/400.css'
import '@fontsource/fira-code/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource/source-code-pro/400.css'
import '@fontsource/source-code-pro/700.css'
import '@fontsource/cascadia-code/400.css'
import '@fontsource/cascadia-code/700.css'
import '@fontsource/ubuntu-mono/400.css'
import '@fontsource/ubuntu-mono/700.css'

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
