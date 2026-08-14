"use client";

/**
 * TanStack Query client provider.
 *
 * Wrapped in its own file so the root layout (a Server Component)
 * can import it without becoming a Client Component itself.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create a new QueryClient per render so each server request
  // gets its own cache and different users don't share state.
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Do not retry on 4xx errors (auth failures, not-found, etc.)
            retry: (failureCount, error) => {
              if (error instanceof Error && "status" in error) {
                const status = (error as Error & { status: number }).status;
                if (status >= 400 && status < 500) return false;
              }
              return failureCount < 2;
            },
            // 30 seconds stale time — appropriate for low-change CHS data
            staleTime: 30_000,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
