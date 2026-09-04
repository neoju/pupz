if (import.meta.env.DEV) {
  void import("react-grab");
  void import("react-scan");
}

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "@fontsource-variable/geist";
import "@fontsource-variable/roboto-condensed";
import "./index.css";
import App from "./app";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
