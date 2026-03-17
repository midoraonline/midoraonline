import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-background text-foreground">
      <div className="text-center max-w-md">
        <p className="text-6xl font-semibold text-foreground/90 tabular-nums">
          404
        </p>
        <h1 className="mt-4 text-xl font-semibold tracking-tight">
          Page not found
        </h1>
        <p className="mt-2 text-sm text-foreground/70">
          The page you’re looking for doesn’t exist or has been moved.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center justify-center rounded-md bg-foreground text-background px-5 py-2.5 text-sm font-medium transition-colors hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-foreground/20"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
