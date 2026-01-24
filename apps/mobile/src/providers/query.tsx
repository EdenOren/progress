import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a client with default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Stale time: 5 minutes
      staleTime: 5 * 60 * 1000,
      // Cache time: 10 minutes
      gcTime: 10 * 60 * 1000,
      // Retry failed requests once
      retry: 1,
      // Don't refetch on window focus for mobile
      refetchOnWindowFocus: false,
    },
    mutations: {
      // Retry mutations once
      retry: 1,
    },
  },
});

interface QueryProviderProps {
  children: React.ReactNode;
}

export function QueryProvider({ children }: QueryProviderProps): React.ReactElement {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export { queryClient };
