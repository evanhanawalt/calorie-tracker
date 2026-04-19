import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import { globalIgnores } from "eslint/config";

const eslintConfig = [
  globalIgnores([
    "dist/**",
    "node_modules/**",
    ".next/**",
    ".vercel/**",
    "next-env.d.ts",
  ]),
  ...nextCoreWebVitals,
];

export default eslintConfig;
