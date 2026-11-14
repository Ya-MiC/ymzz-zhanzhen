# ymzz-dsh-sidebar — 晏銘湛箴 DSH 側邊欄插件

一行安裝，重新打開 DSH，左下側邊欄就會出現「湛」字入口，點開即達語錄流、量化評分、AI 注解與 Vibe Pay 用量。

> 無無即無，zhanranchangji（《太上老君說常清靜經》）
> 說出去的話就是潑出去的水，凡是水，皆在大自然的循環中往復。

## 安裝（一行）

```bash
dsh plugin --profile <你的profile> add git+https://github.com/Ya-MiC/ymzz-dsh-sidebar.git
```

安裝後**重新打開 DSH** 即生效。不需要構建、不需要改 profile 配置文件——`cordis.patch.yml` 會自動把插件掛進 bundle。

## 配置

插件預設把側邊欄 iframe 指向本機 ymzz-server：

```bash
# 可選：指向你的晏銘湛箴 Web 版（默認 http://127.0.0.1:8080）
YMZZ_APP_URL=https://your-ymzz.example.com
```

## 卸載

```bash
dsh plugin --profile <你的profile> remove ymzz-dsh-sidebar
```

## 結構

```
ymzz-dsh-sidebar/
├── dsh.plugin.json    # 插件清單（id / main / client.main / engines.dsh）
├── cordis.patch.yml   # bundle patch：insert 一行，免手改 profile
├── package.json       # dsh.bundle.patch + dsh.client（platform: web）
├── index.js           # host 半：webServer 路由 /integrations/ymzz-zhanzhen → 307 到應用
├── client.js          # client 半：sidebar.footer.action 槽位註冊「湛」入口 + 右側浮層 iframe
├── README.md
└── LICENSE            # MIT
```

## 顏色

只用 [ymzz-wenrun-design-skill](https://github.com/Ya-MiC/ymzz-wenrun-design-skill)（MIT）tokens.css 的鎖定色：暖紙白 `#F8F6EF`、荷花粉 `#F4DDE7`、墨 `#221F14`、夜霧藍 `#191C29`、暮色字 `#E2E4ED`。色不另造。

## 授權

MIT
