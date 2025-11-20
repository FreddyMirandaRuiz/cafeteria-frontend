/***************************************************************************************************
 * Polyfills para Angular y librerías Node.js
 * Este archivo se carga antes de que se ejecute la app principal.
 ***************************************************************************************************/

// ⚙️ Corrige "global is not defined"
(window as any).global = window;

// 🧩 Corrige posibles errores con process o Buffer
(window as any).process = { env: { DEBUG: undefined } };
(window as any).Buffer = (window as any).Buffer || [];
