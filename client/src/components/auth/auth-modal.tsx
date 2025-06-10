import { useState } from "react";
import { Button } from "@/components/ui/button";

interface AuthModalProps {
  trigger?: React.ReactNode;
  defaultMode?: "login" | "register";
  onSuccess?: () => void;
}

export function AuthModal({ trigger, defaultMode = "login" }: AuthModalProps) {
  const handleClick = () => {
    // For now, redirect to a simple authentication page
    if (defaultMode === "register") {
      window.location.href = "/register";
    } else {
      window.location.href = "/login";
    }
  };

  if (trigger) {
    return (
      <div onClick={handleClick} style={{ display: 'inline-block' }}>
        {trigger}
      </div>
    );
  }

  return (
    <Button variant="ghost" className="text-slate-700 hover:text-primary" onClick={handleClick}>
      Sign In
    </Button>
  );
}