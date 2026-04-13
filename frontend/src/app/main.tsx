import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import App from "./App";
import "../styles/index.css";
import { Toaster } from "react-hot-toast";
import {MatchProvider} from "@/features/match/pages/MatchContext.tsx";

ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
        <BrowserRouter>
            <QueryClientProvider client={queryClient}>
                <MatchProvider>
                    <App />
                </MatchProvider>
                <Toaster position="top-right" />
            </QueryClientProvider>
        </BrowserRouter>
    </React.StrictMode>
);