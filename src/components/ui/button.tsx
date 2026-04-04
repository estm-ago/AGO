import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

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

export { Button, buttonVariants, ActionButton }
