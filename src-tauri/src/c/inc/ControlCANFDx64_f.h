// bindgen src/c/inc/ControlCANFDx64_f.h -o src/models/WSFdCan/fdcan_c.rs
#include <stdint.h>

// 原廠標頭檔缺失的 Windows 資料型別
typedef unsigned int UINT;
typedef unsigned char BYTE;
typedef unsigned short USHORT;
typedef unsigned char UCHAR;
typedef unsigned long DWORD;
typedef unsigned long ULONG;
typedef void* PVOID;
typedef int INT;
typedef char CHAR;
typedef uint64_t UINT64;

// 最後再引入目標硬體的標頭檔
#include "ControlCANFDx64.h"
