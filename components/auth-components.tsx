"use client";

import { signIn, signOut } from "next-auth/react";
import { Button } from "./ui/button";
import { LogIn, LogOut } from "lucide-react";

export function LoginButton() {
  return (
    <Button variant="default" size="sm" onClick={() => signIn("google")} className="gap-2">
      <LogIn className="w-4 h-4" />
      <span>Login</span>
    </Button>
  );
}

export function LogoutButton() {
  return (
    <Button variant="ghost" size="sm" onClick={() => signOut()} className="gap-2 text-muted-foreground hover:text-destructive">
      <LogOut className="w-4 h-4" />
      <span className="hidden sm:inline">Logout</span>
    </Button>
  );
}
