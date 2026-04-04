import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-primary/90",
        destructive:
          "bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : "button"

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

type ThemeMode = "system" | "light" | "dark";
const ThemeButton = () => {
  // 1. 初始化狀態：優先讀取 localStorage，若無則預設為 system
  const [mode, setMode] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem("theme") as ThemeMode;
    return saved || "system";
  });

  // 2. 當 mode 改變時，更新 HTML 標籤與 localStorage
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    // 處理系統模式的函式
    const applySystemTheme = () => {
      if (mediaQuery.matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    };

    if (mode === "system")
    {
      localStorage.removeItem("theme"); // 清除自訂設定，回歸系統
      applySystemTheme();
      
      // 💡 監聽作業系統的深淺色變化 (如果使用者在系統設定裡切換，畫面會即時跟著變)
      mediaQuery.addEventListener("change", applySystemTheme);
      return () => mediaQuery.removeEventListener("change", applySystemTheme);
    }
    else if (mode === "light")
    {
      localStorage.setItem("theme", "light");
      root.classList.remove("dark");
    }
    else if (mode === "dark")
    {
      localStorage.setItem("theme", "dark");
      root.classList.add("dark");
    }
  }, [mode]);

  // 點擊按鈕的循環邏輯：系統 -> 亮色 -> 暗色 -> 系統...
  const cycleMode = () =>
  {
    if (mode === "system") setMode("light");
    else if (mode === "light") setMode("dark");
    else setMode("system");
  };

  // 根據目前模式，回傳對應的 Tailwind 背景顏色 class
  const getModeStyle = () => {
    switch (mode) {
      case "light":
        return "bg-black"; // 亮色模式：純黑圓形
      case "system":
        return "bg-white"; // 系統模式：純白圓形
      case "dark":
      default:
        // 暗色模式：利用漸層做出「左黑右白」的各半效果
        return "bg-[linear-gradient(135deg,#fff_50%,#000_50%)]"; 
    }
  };

  return (
    <button
      onClick={cycleMode}
      className={`
        w-5 h-5 rounded-full border-2 border-gray-500
        shadow-sm transition-transform hover:scale-110 focus:outline-none 
        ${getModeStyle()}
      `}
    />
  );
};

interface ActionButtonProps {
  onClick: () => void;
  className?: string;
  color?: "green" | "red" | "blue" | "gray";
  disabled?: boolean;
  children: React.ReactNode;
}
const ActionButton = ({ 
  onClick,
  className = "",
  color = "green",
  disabled = false,
  children
}: ActionButtonProps) => {
  // 基礎樣式
  const baseStyle = [
    // 基本外觀與動畫
    "border-2 rounded px-1 transition-colors",
    // 禁用狀態 (Disabled) 的樣式
    "disabled:opacity-50 disabled:cursor-not-allowed",
    "disabled:border-gray-400 disabled:text-gray-400"
  ].join(" ");

  const colorVariants = {
    green: "border-green-500 text-green-500 hover:bg-green-50",
    red:   "border-red-500 text-red-500 hover:bg-red-50",
    blue:  "border-blue-500 text-blue-500 hover:bg-blue-50",
    gray:  "border-gray-500 text-gray-500 hover:bg-gray-100",
  };
  const colorStyle = colorVariants[color] || colorVariants.green;

  return (
    <button
      className={`${baseStyle} ${colorStyle} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export { Button, ThemeButton, buttonVariants, ActionButton }
