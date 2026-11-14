export const themes = [
  { id: 'yun', name: '雲', colors: ['#F8F6EF', '#B9DDF1', '#F4DDE7', '#CDBFE0'] },
  { id: 'tao', name: '陶', colors: ['#E8E3CC', '#B7C8A8', '#CBBF9E', '#A38E7A'] },
  { id: 'wu', name: '霧', colors: ['#F8F6EF', '#B9DDF1', '#E8E3CC', '#B7C8A8'] },
  { id: 'lu', name: '露', colors: ['#F8F6EF', '#F4DDE7', '#B7C8A8', '#CBBF9E'] },
  { id: 'xia', name: '霞', colors: ['#F8F6EF', '#CDBFE0', '#F4DDE7', '#A38E7A'] },
  { id: 'xi', name: '溪', colors: ['#B9DDF1', '#B7C8A8', '#E8E3CC', '#A38E7A'] },
  { id: 'chao', name: '潮', colors: ['#B9DDF1', '#CDBFE0', '#CBBF9E', '#A38E7A'] },
  { id: 'zhan', name: '湛', colors: ['#F8F6EF', '#E8E3CC', '#CBBF9E', '#A38E7A'] },
] as const

export type ThemeId = (typeof themes)[number]['id']
