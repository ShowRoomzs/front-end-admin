import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import "./index.css";
import App from "./App.tsx";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/common/lib/queryClient.ts";
import { CookiesProvider } from "react-cookie";
import { TOAST_OPTIONS } from "@/common/constants/toast.ts";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <CookiesProvider>
        <QueryClientProvider client={queryClient}>
          <Toaster position="top-right" toastOptions={TOAST_OPTIONS} />
          <App />
        </QueryClientProvider>
      </CookiesProvider>
    </BrowserRouter>
  </StrictMode>
);
