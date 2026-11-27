import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

export default defineConfig([
    ...nextVitals,
    ...nextTypescript,
    {
        files: ["**/*.js"],
        languageOptions: { sourceType: "commonjs" },
        rules: {
            "@typescript-eslint/no-require-imports": "off",
        },
    },
    globalIgnores([
        ".next/**",
        "out/**",
        "electron/dist/**",
        "node_modules/**",
    ]),
]);
