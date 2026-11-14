export const zh = {
  nav: {
    projects: '項目',
    myThoughts: '我的思路',
    workspace: '我的工作區',
    plugins: '插件',
    automation: '自動化任務',
    settings: '設置',
  },
  brand: {
    name: '晏銘湛箴',
    intro: '無無即無，zhanranchangji（清靜經原文）|意思，説出去的話就是潑出去的水，凡是水，皆在大自然的循環中往復，用量化+標籤注解的方式，詮釋自己説過的東西。對自己的往往做注解',
  },
  settings: {
    appearance: '外觀',
    general: '一般',
    myThoughts: '我的思路',
    scoring: '量化公式',
    tags: '標籤',
    nebula: '星雲',
    shortcuts: '快捷鍵',
    plugins: '插件',
    redblue: '紅藍對抗',
    billing: '付款與用量',
    backup: '數據與備份',
  },
}

export const en = {
  nav: {
    projects: 'Projects',
    myThoughts: 'My Thoughts',
    workspace: 'Workspace',
    plugins: 'Plugins',
    automation: 'Automation',
    settings: 'Settings',
  },
  brand: {
    name: 'Yanming Zhanzhen',
    intro: '無無即無，zhanranchangji (清靜經原文) | Words spoken are water poured out; all water cycles in nature. Annotate what you say with quantification and tags. You tend to annotate yourself.',
  },
  settings: {
    appearance: 'Appearance',
    general: 'General',
    myThoughts: 'My Thoughts',
    scoring: 'Scoring Formula',
    tags: 'Tags',
    nebula: 'Nebula',
    shortcuts: 'Shortcuts',
    plugins: 'Plugins',
    redblue: 'Red/Blue Team',
    billing: 'Billing & Usage',
    backup: 'Data & Backup',
  },
}

export type Locale = 'zh-Hant' | 'zh-Hans' | 'en'

export const locales: Record<Locale, typeof zh> = {
  'zh-Hant': zh,
  'zh-Hans': zh,
  'en': en,
}
