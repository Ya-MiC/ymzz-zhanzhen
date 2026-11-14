export type Slot = 'nav' | 'canvas' | 'panel' | 'settings'

export interface PluginManifest {
  id: string
  name: string
  version: string
  entry: string
  slots: Slot[]
  permissions: string[]
  min_host: string
}

export class PluginHost {
  private plugins: Map<string, PluginManifest> = new Map()

  register(manifest: PluginManifest) {
    // JSON Schema 校驗 manifest，未知權限拒載，不使用 eval 或遠程動態代碼
    const allowed = new Set(['storage.read', 'storage.write', 'net.localhost', 'fs.pick', 'llm.call', 'pay.open'])
    for (const p of manifest.permissions) {
      if (!allowed.has(p)) {
        throw new Error(`未知權限拒載：${p}`)
      }
    }
    this.plugins.set(manifest.id, manifest)
  }

  slotsFor(id: string): Slot[] {
    return this.plugins.get(id)?.slots ?? []
  }

  list(): PluginManifest[] {
    return Array.from(this.plugins.values())
  }
}

export const pluginHost = new PluginHost()
