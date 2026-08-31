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
import { preloadVision } from "./lib/vision";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

const warmVision = () => {
  void preloadVision();
};

if (document.readyState === "complete") {
  window.setTimeout(warmVision, 0);
} else {
  window.addEventListener("load", () => window.setTimeout(warmVision, 0), {
    once: true,
  });
}
