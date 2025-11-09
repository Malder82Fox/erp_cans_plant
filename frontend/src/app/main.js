import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import "../i18n";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
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
export function App() {
    return (_jsx(QueryClientProvider, { client: queryClient, children: _jsxs(AuthProvider, { children: [_jsx(RouterProvider, { router: appRouter }), _jsx(Toaster, { richColors: true, position: "top-right" })] }) }));
}
