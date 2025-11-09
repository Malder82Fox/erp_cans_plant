import "../i18n";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { type JSX } from "react";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";

import { AuthProvider } from "../lib/auth";
import { appRouter } from "./routes";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1
    }
  }
});

export function App(): JSX.Element {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={appRouter} />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}
