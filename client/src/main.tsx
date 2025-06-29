import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://11d1b06bcc119500f60e72f6f3dd4d2c@o4509583576006656.ingest.us.sentry.io/4509583579283456",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

createRoot(document.getElementById("root")!).render(<App />);
