import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { AppRouter } from "./routes";
import { AuthProvider } from "./features/auth/AuthContext";
import "./styles/index.css";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

async function bootstrap() {
  const useMocks = import.meta.env.VITE_USE_MOCKS === "true";
  if (useMocks) {
    const { worker } = await import("./mocks/browser");
    await worker.start({ onUnhandledRequest: "bypass" });
  }

  // Pages de prévisualisation design (/__design*) : mode maquette + dev uniquement.
  // En production, VITE_USE_MOCKS n'est pas défini et import.meta.env.DEV est false :
  // cette branche est éliminée à la compilation et le module n'est jamais embarqué.
  if (
    useMocks &&
    import.meta.env.DEV &&
    window.location.pathname.startsWith("/__design")
  ) {
    const { renderDesignPreview } =
      await import("./features/design-preview/preview");
    renderDesignPreview();
    return;
  }

  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <AppRouter />
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </React.StrictMode>,
  );
}

bootstrap();
