import Link from "next/link";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/**
 * Custom 404 Page.
 * Forced dynamic to prevent build-time static generation failures.
 */
export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
      <h1 className="text-6xl font-serif font-bold text-primary">404</h1>
      <h2 className="text-2xl font-semibold">Page Not Found</h2>
      <p className="text-muted-foreground max-w-md">
        The research study or dashboard page you are looking for does not exist or has been moved.
      </p>
      <Link href="/">
        <Button size="lg" className="rounded-full px-8">
          Return to Hub
        </Button>
      </Link>
    </div>
  );
}
