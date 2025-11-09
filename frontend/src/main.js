import { jsx as _jsx } from "react/jsx-runtime";
import "./index.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./app/main";
const rootElement = document.getElementById("root");
if (!rootElement) {
    throw new Error("Root element not found");
}
createRoot(rootElement).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
