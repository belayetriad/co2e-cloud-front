import clsx from "clsx";
import React from "react";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline";
};
export default function Button({
  className,
  variant = "primary",
  ...props
}: Props) {
  const base =
    "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition";
  const styles = {
    primary: "bg-primary text-white hover:opacity-90 disabled:opacity-50",
    ghost: "bg-transparent hover:bg-muted",
    outline: "border border-border hover:bg-muted",
  }[variant];
  return <button className={clsx(base, styles, className)} {...props} />;
}
