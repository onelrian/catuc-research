import { Link } from "wouter";
import { ThemeToggle } from "./theme-toggle";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background text-foreground transition-colors duration-200">
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center text-primary-foreground font-serif font-bold text-xl shadow-sm group-hover:scale-105 transition-transform">
              C
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
          <nav className="flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Surveys
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Dashboard
            </Link>
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
