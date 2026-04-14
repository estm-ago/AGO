use std::{env, fs};
use std::path::PathBuf;

fn main() {
    // Tauri 預設建置指令
    tauri_build::build();

    // 取得當前 src-tauri 的目錄路徑
    let dir = env::var("CARGO_MANIFEST_DIR").unwrap();
    // 指向我們剛剛建立的 lib 資料夾 (請確保有在 src-tauri 下建立 lib 資料夾並放入 .lib 檔)
    let lib_path = PathBuf::from(&dir).join("src/c/lib");

    // 告訴 Rust 編譯器去哪裡尋找 .lib 檔案
    println!("cargo:rustc-link-search=native={}", lib_path.display());

    // 告訴編譯器要連結的函式庫名稱 (注意：不需要寫 .lib 副檔名)
    println!("cargo:rustc-link-lib=static=ControlCANFDx64");
    
    // 設定當這些檔案有變動時，才重新觸發 build.rs 編譯，節省編譯時間
    println!("cargo:rerun-if-changed=src/c/lib/ControlCANFDx64.lib");
    println!("cargo:rerun-if-changed=src/c/inc/ControlCANFDx64.h");

    // 指定 DLL 來源路徑
    let dll_src = PathBuf::from(&dir).join("src/c/bin/ControlCANFDx64.dll");
    
    // 讓腳本監聽這個 DLL，如果有更新就會重新打包
    println!("cargo:rerun-if-changed={}", dll_src.display());

    // 取得 Rust 編譯過程中的暫存輸出目錄 (OUT_DIR)
    if let Ok(out_dir) = env::var("OUT_DIR") {
        let out_path = PathBuf::from(out_dir);
        
        // OUT_DIR 的路徑通常長這樣： target/debug/build/專案名-雜湊/out
        // 我們利用 ancestors().nth(3) 往上退 3 層目錄，回到 target/debug/ (也就是 .exe 產生的位置)
        if let Some(target_dir) = out_path.ancestors().nth(3) {
            let dll_dest = target_dir.join("ControlCANFD.dll");
            
            // 執行複製
            if let Err(e) = fs::copy(&dll_src, &dll_dest) {
                println!("cargo:warning=無法複製 DLL 檔案: {}", e);
            }
        }
    }
}
