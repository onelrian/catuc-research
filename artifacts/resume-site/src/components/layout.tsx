import { Link } from "wouter";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-xl font-semibold tracking-tight text-primary">
            Ashley Research
          </Link>
          <nav className="flex gap-4">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Available Surveys
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Researcher Dashboard
            </Link>
          </nav>
        </div>
      </header>
      
      <main className="flex-1 w-full max-w-5xl mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
