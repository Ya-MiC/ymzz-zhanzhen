// MIT. Portable Windows shell. No custom registry, autorun, services, or scheduled tasks.
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]
use std::{io::{BufRead,BufReader,Read},process::{Child,Command,Stdio},sync::Mutex,time::Duration};
use tauri::Manager;
use tauri_plugin_opener::OpenerExt;
struct RuntimeProcess(Mutex<Option<Child>>);
impl Drop for RuntimeProcess {fn drop(&mut self){if let Ok(mut lock)=self.0.lock(){if let Some(mut c)=lock.take(){let _=c.kill();let _=c.wait();}}}}
#[cfg(windows)]
fn pick_workspace() -> windows::core::Result<Option<String>> {
 use windows::Win32::{System::Com::*,UI::Shell::*};
 unsafe {
  CoInitializeEx(None,COINIT_APARTMENTTHREADED).ok()?;
  let result=(|| {
   let dialog:IFileOpenDialog=CoCreateInstance(&FileOpenDialog,None,CLSCTX_INPROC_SERVER)?;
   dialog.SetOptions(FOS_PICKFOLDERS|FOS_FORCEFILESYSTEM|FOS_DONTADDTORECENT)?;
   dialog.SetTitle(windows::core::w!("選擇湛箴工作區"))?;
   if dialog.Show(None).is_err(){return Ok(None);}
   let raw=dialog.GetResult()?.GetDisplayName(SIGDN_FILESYSPATH)?;
   let selected=raw.to_string();CoTaskMemFree(Some(raw.0.cast()));Ok(Some(selected?))
  })();CoUninitialize();result
 }
}
fn main(){
 if std::env::args().any(|s|s=="--pick-workspace"){
  // Parent stdin ownership prevents an orphan native picker if the app is closed abruptly.
  if std::env::var_os("YMZZ_PICKER_PARENT_PIPE").is_some(){std::thread::spawn(||{let mut byte=[0u8;1];while std::io::stdin().read(&mut byte).unwrap_or(0)>0{}std::process::exit(0);});}
  #[cfg(windows)] {match pick_workspace(){Ok(path)=>println!("{}",serde_json::json!({"path":path})),Err(_)=>println!("{}",serde_json::json!({"path":null}))};}
  #[cfg(not(windows))] println!("{}",serde_json::json!({"path":null}));
  return;
 }
 if std::env::args().any(|s|s=="--core"){ymzz_runtime_core::stdio();return;}
 let app=tauri::Builder::default().plugin(tauri_plugin_opener::init()).setup(|app|{
  let exe=std::env::current_exe()?;let base=exe.parent().ok_or("missing executable directory")?;
  let data=std::env::var_os("YMZZ_DATA_DIR").map(std::path::PathBuf::from).unwrap_or_else(||base.join("data"));
  std::fs::create_dir_all(&data)?;
  let node=base.join(if cfg!(windows){"node.exe"}else{"node"});let entry=base.join("runtime").join("server.mjs");
  if !node.is_file()||!entry.is_file(){return Err("完整可攜套件遺失 node 或 runtime；請解壓縮完整 ZIP，而非只移動 exe。".into());}
  let mut cmd=Command::new(node);cmd.arg(entry).current_dir(base).env("YMZZ_DATA_DIR",&data).env("YMZZ_CORE_EXECUTABLE",&exe).env("YMZZ_DESKTOP_EXECUTABLE",&exe).env("YMZZ_PARENT_PIPE","1").env("YMZZ_TZ","Asia/Seoul")
   .env_remove("NODE_OPTIONS").stdin(Stdio::piped()).stdout(Stdio::piped()).stderr(Stdio::null());
  #[cfg(windows)] {use std::os::windows::process::CommandExt;cmd.creation_flags(0x08000000);}
  let mut child=cmd.spawn()?;let stdout=child.stdout.take().ok_or("missing runtime stdout")?;
  let (tx,rx)=std::sync::mpsc::channel();std::thread::spawn(move||{let mut line=String::new();let result=BufReader::new(stdout).read_line(&mut line).map(|_|line);let _=tx.send(result);});
  let startup=match rx.recv_timeout(Duration::from_secs(20)){Ok(Ok(s))=>s,_=>{let _=child.kill();return Err("本機核心未能在 20 秒內啟動。".into());}};
  let value:serde_json::Value=serde_json::from_str(&startup)?;
  let raw=value["url"].as_str().ok_or("invalid startup URL")?;let url:tauri::Url=raw.parse()?;
  if url.host_str()!=Some("127.0.0.1")||url.scheme()!="http"{let _=child.kill();return Err("runtime URL is not loopback".into());}
  // Proof channel is opt-in CI only; never persisted on a normal user's device.
  if std::env::var_os("YMZZ_SMOKE_STARTUP").is_some(){std::fs::write(data.join("startup.json"),&startup)?;}
  let allowed_origin=url.origin().ascii_serialization();
  let opener_handle=app.handle().clone();
  app.manage(RuntimeProcess(Mutex::new(Some(child))));
  let window=tauri::WebviewWindowBuilder::new(app,"main",tauri::WebviewUrl::External(url)).title("晏銘湛箴_湛箴 · 本機智能體").inner_size(1200.0,820.0).min_inner_size(360.0,560.0)
   .on_navigation(move|url|{
    if url.origin().ascii_serialization()==allowed_origin{return true;}
    if url.scheme()=="https"&&["github.com","ya-mic.github.io","bingce.yanmingx0215.filegear-sg.me","opendoc.alipay.com"].contains(&url.host_str().unwrap_or("")){
     let _=opener_handle.opener().open_url(url.as_str(),None::<&str>);
    }
    false
   });
  #[cfg(windows)] let window=window.data_directory(data.join("webview")).additional_browser_args("--force-renderer-accessibility --disable-background-networking --disable-component-update");
  window.build()?;
  Ok(())
 }).build(tauri::generate_context!()).expect("湛箴無法啟動，請確認完整可攜套件與 WebView2 已安裝");
 app.run(|handle,event|{if matches!(event,tauri::RunEvent::Exit){if let Some(state)=handle.try_state::<RuntimeProcess>(){if let Ok(mut lock)=state.0.lock(){if let Some(mut c)=lock.take(){let _=c.kill();let _=c.wait();}}}}});
}
