import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypeScript from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTypeScript,
  {
    // These client-only modules intentionally hydrate browser APIs or animate
    // values after mount. Scope the exception to those files instead of
    // weakening the rule for the whole application.
    files: [
      "app/caregiver/page.tsx",
      "app/conversation/page.tsx",
      "components/CountUp.tsx",
      "components/RevealText.tsx",
      "lib/use-profile.ts",
      "lib/use-speech.ts",
    ],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
  globalIgnores([".next/**", "node_modules/**", "next-env.d.ts"]),
]);
