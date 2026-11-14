// ymzz-dsh-sidebar — client half
//
// 在 DSH 自帶側邊欄底部註冊「晏銘湛箴」入口（sidebar.footer.action 槽位），
// 點開右側浮層，iframe 載入語錄流應用（經 host 的 /integrations/ymzz-zhanzhen
// 路由重定向，免暴露應用地址）。顏色只用 ymzz-wenrun-design-skill tokens.css
// 的八個鎖定色與其衍生角色（色不另造）。

window.__ModuleLoader__.load({
  id: "ymzz-dsh-sidebar",
  factory: (require) => {
    const module = { exports: {} };
    const exports = module.exports;
    const React = require("react");
    const { useEffect, useState } = React;

    const ROUTE = "/integrations/ymzz-zhanzhen";
    const PANEL_ID = "ymzz-zhanzhen-panel";
    const STYLE_ID = "ymzz-zhanzhen-style";

    // 色不另造：全部取自 vendor/ymzz-wenrun-design-skill/tokens.css
    // 家族 A 淺色 bg #F8F6EF / ink #221F14 / raised #B9DDF1 / surface #F4DDE7
    // 家族 A 深色 bg #191C29 / ink #E2E4ED
    const CSS = `
.ymzz-trigger{box-sizing:border-box;display:flex;align-items:center;gap:8px;width:calc(100% + 8px);height:34px;margin:4px -4px;padding:6px 2px 6px 10px;border:0;border-radius:12px;background:transparent;color:var(--dsw-alias-label-primary);cursor:pointer;font:inherit;overflow:hidden}
.ymzz-trigger:hover{background:var(--dsw-alias-interactive-bg-hover)}
.ymzz-trigger.rail{justify-content:center;width:36px;height:36px;margin:8px 0 10px;padding:0;border-radius:50%}
.ymzz-glyph{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;background:#F4DDE7;color:#221F14;font-size:13px;font-weight:600;line-height:1;flex:none}
.ymzz-label{white-space:nowrap;overflow:hidden}
.ymzz-panel{position:fixed;z-index:900;display:flex;flex-direction:column;box-sizing:border-box;border-left:1px solid rgba(34,31,20,.18);background:#F8F6EF;color:#221F14;box-shadow:var(--dsw-shadow-lv3)}
.ymzz-header{display:flex;flex:none;align-items:center;justify-content:space-between;height:48px;padding:8px 14px 8px 18px;box-sizing:border-box}
.ymzz-title{display:flex;align-items:center;gap:10px;min-width:0}
.ymzz-name{font-weight:600;font-size:14px;letter-spacing:.02em}
.ymzz-sub{font-size:11px;opacity:.62;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ymzz-actions{display:flex;gap:8px}
.ymzz-action{border:0;border-radius:8px;background:transparent;color:inherit;cursor:pointer;padding:5px 9px;font:inherit}
.ymzz-action:hover{background:rgba(185,221,241,.55)}
.ymzz-frame{flex:1;min-height:0;border:0;background:#F8F6EF}
@media (prefers-color-scheme: dark){
  .ymzz-panel{background:#191C29;color:#E2E4ED;border-left-color:rgba(226,228,237,.18)}
  .ymzz-frame{background:#191C29}
  .ymzz-action:hover{background:rgba(159,169,143,.25)}
}
`;

    // 與 dashi-taskboard 同款：量測主欄矩形，讓面板貼著中欄右緣展開
    function centerColumnBox() {
      for (const element of document.querySelectorAll("*")) {
        for (const className of element.classList) {
          if (!className.endsWith("_centerCol")) continue;
          const rect = element.getBoundingClientRect();
          return {
            left: rect.left,
            top: rect.top,
            right: window.innerWidth - rect.right,
            bottom: window.innerHeight - rect.bottom,
          };
        }
      }
      return { left: 0, top: 0, right: 0, bottom: 0 };
    }

    function useCenterColumnBox() {
      const [box, setBox] = useState(centerColumnBox);
      useEffect(() => {
        const measure = () => setBox(centerColumnBox());
        const observer = new ResizeObserver(measure);
        const column = [...document.querySelectorAll("*")].find((element) =>
          [...element.classList].some((className) => className.endsWith("_centerCol")),
        );
        if (column) observer.observe(column);
        window.addEventListener("resize", measure);
        return () => {
          observer.disconnect();
          window.removeEventListener("resize", measure);
        };
      }, []);
      return box;
    }

    // 水滴圖標：呼應「說出去的話就是潑出去的水」
    function WaterDropIcon() {
      return React.createElement(
        "svg",
        { width: 18, height: 18, viewBox: "0 0 18 18", fill: "none", "aria-hidden": true },
        React.createElement("path", {
          d: "M9 2.2c2.6 3 4.6 5.5 4.6 8a4.6 4.6 0 1 1-9.2 0c0-2.5 2-5 4.6-8Z",
          stroke: "currentColor",
          strokeWidth: 1.35,
          strokeLinejoin: "round",
        }),
        React.createElement("path", {
          d: "M6.7 10.4a2.3 2.3 0 0 0 1.6 2.4",
          stroke: "currentColor",
          strokeWidth: 1.2,
          strokeLinecap: "round",
        }),
      );
    }

    function ZhanzhenPanel({ onClose }) {
      const box = useCenterColumnBox();
      const [generation, setGeneration] = useState(0);
      return React.createElement(
        "aside",
        {
          id: PANEL_ID,
          className: "ymzz-panel",
          style: box,
          "aria-label": "晏銘湛箴",
        },
        React.createElement(
          "div",
          { className: "ymzz-header" },
          React.createElement(
            "div",
            { className: "ymzz-title" },
            React.createElement("span", { className: "ymzz-glyph" }, "湛"),
            React.createElement(
              "div",
              null,
              React.createElement("div", { className: "ymzz-name" }, "晏銘湛箴"),
              React.createElement(
                "div",
                { className: "ymzz-sub" },
                "無無即無 · 語錄流 · AI 注解",
              ),
            ),
          ),
          React.createElement(
            "div",
            { className: "ymzz-actions" },
            React.createElement(
              "button",
              {
                type: "button",
                className: "ymzz-action",
                onClick: () => setGeneration((value) => value + 1),
                title: "重新載入",
              },
              "刷新",
            ),
            React.createElement(
              "button",
              {
                type: "button",
                className: "ymzz-action",
                onClick: onClose,
                title: "收起",
              },
              "收起",
            ),
          ),
        ),
        React.createElement("iframe", {
          key: generation,
          className: "ymzz-frame",
          src: `${ROUTE}?refresh=${generation}`,
          title: "晏銘湛箴",
        }),
      );
    }

    function ZhanzhenEntry({ wide }) {
      const [open, setOpen] = useState(false);
      return React.createElement(
        React.Fragment,
        null,
        React.createElement(
          "button",
          {
            type: "button",
            className: `ymzz-trigger${wide ? "" : " rail"}`,
            title: "晏銘湛箴",
            "aria-label": "晏銘湛箴",
            "aria-expanded": open,
            "aria-controls": PANEL_ID,
            onClick: () => setOpen((value) => !value),
          },
          React.createElement("span", { className: "ymzz-glyph" }, "湛"),
          wide && React.createElement("span", { className: "ymzz-label" }, "晏銘湛箴"),
        ),
        open && React.createElement(ZhanzhenPanel, { onClose: () => setOpen(false) }),
      );
    }

    const inject = ["slots"];

    function apply(ctx) {
      ctx.effect(() => {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.dataset.plugin = "ymzz-dsh-sidebar";
        style.textContent = CSS;
        document.head.appendChild(style);
        return () => style.remove();
      }, "ymzz-zhanzhen: styles");

      ctx.slots.inject("sidebar.footer.action", () =>
        ctx.slots.register(
          {
            name: "sidebar.footer.action",
            id: "ymzz-zhanzhen",
            order: 0,
          },
          ZhanzhenEntry,
        ),
      );
    }

    exports.apply = apply;
    exports.inject = inject;
    return module.exports;
  },
});
