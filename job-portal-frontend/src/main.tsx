import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { SavedJobsProvider } from "./context/SavedJobsContext";
import "./styles/styles-index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <SavedJobsProvider>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        </SavedJobsProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
