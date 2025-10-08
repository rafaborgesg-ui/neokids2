// Polyfill para crypto.randomUUID em ambientes que não o suportam
// @ts-ignore - Ignorando o erro de tipo estrito, pois o polyfill é funcionalmente correto.
if (typeof crypto !== 'undefined' && typeof crypto.randomUUID !== 'function') {
  crypto.randomUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
}

import { createRoot } from "react-dom/client";
import App from "./App"; // Remover a extensão .tsx
import "./index.css";

createRoot(document.getElementById("root")!).render(<App />);
