// ymzz-dsh-sidebar — host half (cordis plugin)
//
// 註冊一條 webServer 路由 /integrations/ymzz-zhanzhen，307 重定向到
// 《晏銘湛箴》Web 應用。應用地址從環境變量 YMZZ_APP_URL 讀取，
// 缺省為本機 ymzz-server（http://127.0.0.1:8080）。
// 這樣 client 端的 iframe 只需指向同源路由，不用暴露外部地址。

export const name = "ymzz-zhanzhen";
export const inject = ["webServer"];

const ROUTE = "/integrations/ymzz-zhanzhen";

function appUrl() {
  const raw = process.env.YMZZ_APP_URL?.trim();
  return raw && raw.length > 0 ? raw.replace(/\/$/, "") : "http://127.0.0.1:8080";
}

export function apply(ctx) {
  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: ROUTE,
        handler: async (_request, response) => {
          response.writeHead(307, {
            location: `${appUrl()}/`,
            "cache-control": "no-store",
          });
          response.end();
        },
      }),
    "ymzz-zhanzhen: app redirect route",
  );

  ctx.effect(
    () =>
      ctx.webServer.register({
        kind: "exact",
        path: `${ROUTE}/health`,
        handler: async (_request, response) => {
          response.writeHead(200, {
            "content-type": "application/json; charset=utf-8",
            "cache-control": "no-store",
          });
          response.end(
            JSON.stringify({
              plugin: "ymzz-dsh-sidebar",
              brand: "晏銘湛箴",
              app: appUrl(),
            }),
          );
        },
      }),
    "ymzz-zhanzhen: health route",
  );
}
