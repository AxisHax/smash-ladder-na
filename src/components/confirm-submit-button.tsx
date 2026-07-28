"use client";

import type { ReactNode } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import type { VariantProps } from "class-variance-authority";

type BoundAction = (formData: FormData) => Promise<void> | void;

// Wraps a single-button form with a native confirm() prompt before
// submitting — for actions that are easy to fat-finger (a stage strike, a
// won/lost report) and consequential enough that a stray tap shouldn't just
// go through silently. Needs to be a Client Component since Server
// Components can't attach onSubmit at all, even to a plain <form>.
export function ConfirmSubmitButton({
  action,
  confirmMessage,
  children,
  disabled,
  variant,
  size,
}: {
  action: BoundAction;
  confirmMessage: string;
  children: ReactNode;
  disabled?: boolean;
  variant?: VariantProps<typeof buttonVariants>["variant"];
  size?: VariantProps<typeof buttonVariants>["size"];
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <Button type="submit" variant={variant} size={size} disabled={disabled}>
        {children}
      </Button>
    </form>
  );
}
