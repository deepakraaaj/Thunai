import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    rules: {
      // Intentional client hydration, animation and browser-capability effects.
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/purity": "off",
      // The caregiver subscription intentionally calls the latest function
      // declared in the component body.
      "react-hooks/immutability": "off",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts"]),
]);
