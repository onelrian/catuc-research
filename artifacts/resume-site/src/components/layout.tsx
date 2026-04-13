import { Link } from "wouter";
import { ThemeToggle } from "./theme-toggle";
import { useAuth } from "@workspace/auth-web";
import { Button } from "./ui/button";
import { LogIn, LogOut, LayoutDashboard, Database } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground transition-colors duration-200">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-[#1E3A8A] border border-[#CA8A04]/30 flex items-center justify-center text-primary-foreground shadow-sm group-hover:scale-105 transition-transform overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="relative z-10">
                <path d="M12 2L3 6V12C3 16.5 7.5 20.7 12 22C16.5 20.7 21 16.5 21 12V6L12 2Z" fill="#1E3A8A" stroke="#FBBF24" stroke-width="1.5"/>
                <path d="M8 11H16" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M8 14H16" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
                <path d="M8 17H12" stroke="white" stroke-width="1.5" stroke-linecap="round"/>
              </svg>
            </div>
            <div className="hidden sm:block">
              <div className="font-serif font-semibold tracking-tight text-foreground leading-tight">
                CATUC Bamenda
              </div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                Research Platform
              </div>
            </div>
          </Link>
          <nav className="flex items-center gap-4 sm:gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Surveys
            </Link>
            {user?.isAdmin && (
              <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                <LayoutDashboard className="w-4 h-4" />
                <span className="hidden sm:inline">Dashboard</span>
              </Link>
            )}

            
            <div className="h-6 w-[1px] bg-border mx-2 hidden sm:block"></div>
            
            {!isLoading && (
              isAuthenticated ? (
                <div className="flex items-center gap-3">
                  <div className="hidden md:flex flex-col items-end mr-1">
                    <span className="text-xs font-semibold leading-none">{user?.firstName} {user?.lastName}</span>
                    <span className="text-[10px] text-muted-foreground leading-none mt-1">{user?.email}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => logout()} className="gap-2 text-muted-foreground hover:text-destructive">
                    <LogOut className="w-4 h-4" />
                    <span className="hidden sm:inline">Logout</span>
                  </Button>
                </div>
              ) : (
                <Button variant="default" size="sm" onClick={() => login()} className="gap-2">
                  <LogIn className="w-4 h-4" />
                  <span>Login</span>
                </Button>
              )
            )}
            
            <ThemeToggle />
          </nav>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-8">
        {children}
      </main>
      
      <footer className="border-t bg-muted/20 py-8 mt-12">
        <div className="container mx-auto px-4 sm:px-8 text-center text-sm text-muted-foreground">
          <p>The Catholic University of Cameroon, Bamenda (CATUC)</p>
          <p className="mt-1">Department of Business and Management Sciences</p>
        </div>
      </footer>
    </div>
  );
}
