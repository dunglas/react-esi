import React from "react";
import { hydrateRoot } from "react-dom/client";
import App from "./pages/App";

hydrateRoot(document.getElementById("root"), <App />);
