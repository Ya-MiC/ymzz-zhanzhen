# Red Team 審查發現（針對 main 分支）

## 發現 R-001：monitor --daemon 未正確接上常駐迴路（嚴重）

`cli.py` 中 `monitor` 子命令的 `set_defaults(func=cmd_monitor)`，因此 `python -m wuyong monitor --daemon` 實際上只執行單次 `run_monitor_once`，而不會進入 `cmd_daemon_monitor` 的 6 小時輪詢迴路。`cmd_daemon_monitor` 已定義但從未被 `set_defaults` 參照。

預期行為：`--daemon` 進入常駐輪詢（interval + 抖動，Ctrl+C 停止）。

## 建議修正
在 `cmd_monitor` 內部判斷 `args.daemon`，若為真則分派至 `cmd_daemon_monitor`。
