import React from "react";
export default function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={`w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none
                  focus:ring-2 focus:ring-primary/30 ${props.className ?? ""}`}
    />
  );
}
