import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The backend has its own project + eslint config.
    "backend/**",
  ]),
  {
    rules: {
      // React 19's strict suggestion. localStorage hydration on mount is a
      // legitimate use case (theme/preferences/i18n) and the rewritten form
      // (useSyncExternalStore, etc.) is significantly more involved. Demote
      // to warning so it surfaces in editors without blocking CI.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
]);

export default eslintConfig;
