"use client";

import * as React from "react";

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      className = "",
      checked,
      defaultChecked,
      onChange,
      onCheckedChange,
      ...rest
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type="checkbox"
        className={
          "h-4 w-4 rounded border border-input bg-background text-primary " +
          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary " +
          "disabled:cursor-not-allowed disabled:opacity-50 " +
          className
        }
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={(e) => {
          onChange?.(e);
          onCheckedChange?.(e.target.checked);
        }}
        {...rest}
      />
    );
  }
);
Checkbox.displayName = "Checkbox";
