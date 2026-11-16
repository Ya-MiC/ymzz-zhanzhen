<script setup lang="ts">
import { ref, onMounted } from 'vue';

const theme = ref<'light' | 'dark'>('light');
const isDark = ref(false);

const toggleTheme = () => {
  isDark.value = !isDark.value;
  theme.value = isDark.value ? 'dark' : 'light';
  document.documentElement.setAttribute('data-mode', theme.value);
};

onMounted(() => {
  const saved = localStorage.getItem('wuwong-theme');
  if (saved === 'dark') {
    isDark.value = true;
    theme.value = 'dark';
    document.documentElement.setAttribute('data-mode', 'dark');
  }
});
</script>

<template>
  <div :class="theme">
    <header class="header">
      <div class="brand">
        <svg class="emblem" viewBox="0 0 32 32" aria-hidden="true">
          <circle cx="16" cy="16" r="14" fill="var(--accent)" />
          <path d="M8 16 Q12 8 16 16 Q20 24 24 16" fill="none" stroke="var(--on-accent)" stroke-width="2" stroke-linecap="round" />
          <text x="16" y="22" text-anchor="middle" font-family="serif" font-size="10" fill="var(--on-accent)" font-weight="bold">Y</text>
        </svg>
        <span>晏銘湛箴_無無即無</span>
      </div>
      <button class="theme-toggle" @click="toggleTheme" aria-label="切換主題">
        {{ isDark ? '☀️' : '🌙' }}
      </button>
    </header>

    <main class="main">
      <aside class="sidebar">
        <h2>會話</h2>
        <ul class="session-list">
          <li class="session-item active">當前會話</li>
          <li class="session-item">session-1420479c</li>
          <li class="session-item">session-2ae8976d</li>
        </ul>
      </aside>

      <section class="content">
        <h1>知識節點</h1>
        <div class="empty-state">
          <p>尚無知識節點，開始記錄你的第一個片段。</p>
        </div>
      </section>
    </main>
  </div>
</template>

<style>
/* 溫潤設計系統 · 應用層 tokens */
:root {
  --hit: 44px;
  --radius: 12px;
  --fs-body: 14px;
  --lh-body: 1.7;
  --font-body: "Noto Sans SC Variable", "Noto Sans SC", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;

  /* 家族 A · 淺色 · 雲箋 */
  --bg: #F8F6EF;
  --surface: #F4DDE7;
  --raised: #B9DDF1;
  --accent: #CDBFE0;
  --ink: #221F14;
  --on-accent: #221F14;
}

[data-mode="dark"] {
  --bg: #191C29;
  --surface: #1E3029;
  --raised: #4A3528;
  --accent: #9FA98F;
  --ink: #E2E4ED;
  --on-accent: #191C29;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html { text-wrap: pretty; }
body {
  margin: 0;
  background: var(--bg);
  color: var(--ink);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  line-height: var(--lh-body);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  transition: background 0.6s cubic-bezier(0.16, 1, 0.3, 1), color 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

a { color: var(--ink); text-decoration: none; }

.header {
  position: sticky;
  top: 0;
  background: var(--bg);
  border-bottom: 1px solid var(--raised);
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  z-index: 50;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 18px;
  font-weight: 700;
}

.emblem {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  min-width: var(--hit);
  min-height: var(--hit);
}

.theme-toggle {
  background: var(--surface);
  border: 1px solid var(--raised);
  color: var(--ink);
  padding: 10px 14px;
  border-radius: var(--radius);
  font-size: 14px;
  cursor: pointer;
  min-width: var(--hit);
  min-height: var(--hit);
}

.theme-toggle:hover { background: var(--raised); }

.main {
  display: flex;
  height: calc(100vh - 60px);
}

.sidebar {
  width: 260px;
  background: var(--surface);
  border-right: 1px solid var(--raised);
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.sidebar h2 {
  font-size: 16px;
  font-weight: 700;
  color: var(--ink);
}

.session-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.session-item {
  padding: 10px 14px;
  border-radius: var(--radius);
  background: var(--raised);
  color: var(--ink);
  cursor: pointer;
  font-size: 14px;
}

.session-item.active {
  background: var(--accent);
  color: var(--on-accent);
}

.session-item:hover:not(.active) {
  background: var(--accent);
  color: var(--on-accent);
}

.content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

.content h1 {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 24px;
  color: var(--ink);
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: var(--ink);
  opacity: 0.6;
  font-size: 16px;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}

@media (max-width: 768px) {
  .main {
    flex-direction: column;
  }
  .sidebar {
    width: 100%;
    height: auto;
    flex-direction: row;
    overflow-x: auto;
    padding: 12px;
  }
  .sidebar h2 { display: none; }
  .session-list {
    flex-direction: row;
    gap: 12px;
  }
  .content {
    padding: 16px;
  }
}
</style>
