"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { useState } from "react";

/**
 * QueryProvider wraps the app with TanStack Query (React Query)
 * Provides automatic caching, request deduplication, and background refetching
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance with useState to ensure it's only created once per request
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            // Cached data is kept for 10 minutes after being unused
            gcTime: 10 * 60 * 1000,
            // Retry failed requests up to 3 times with exponential backoff
            retry: 3,
            // Don't refetch on window focus by default (prevents unnecessary API calls)
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only visible in development */}
      <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
