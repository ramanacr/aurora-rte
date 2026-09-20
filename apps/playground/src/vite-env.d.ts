/// <reference types="vite/client" />

// Allow importing any file with the ?raw Vite query suffix as a plain string.
declare module '*?raw' {
  const content: string;
  export default content;
}
