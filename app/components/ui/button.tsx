import { type ComponentProps } from "react";
import { cn } from "~/utils/styling";

export type ButtonProps = ComponentProps<"button"> & {
  variant: "primary" | "secondary";
};

const VARIANT_CLASSES: Record<ButtonProps["variant"], string> = {
  primary:
    "bg-yellow text-dark hover:bg-dark hover:text-yellow disabled:bg-gray-400 disabled:text-white/50 disabled:cursor-not-allowed",
  secondary: "bg-white text-dark hover:bg-dark hover:text-white",
};

export default function Button({
  variant,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "border-dark font-manrope cursor-pointer rounded-full border-2 px-5 py-2.5 text-sm font-bold transition-all duration-200 hover:-translate-y-0.5",
        VARIANT_CLASSES[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
