import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import unusedImports from "eslint-plugin-unused-imports";
import { dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    plugins: { "unused-imports": unusedImports },
    rules: {
      // Imports sem uso são removidos pelo `eslint --fix`.
      "unused-imports/no-unused-imports": "error",
      // TypeScript rules
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "@typescript-eslint/no-unused-disable-directive": "off",

      // React rules
      "react-hooks/exhaustive-deps": "off",
      // Padrão antigo (setState em effect) usado em várias telas; fica como aviso até migrar.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "off",
      "react/no-unescaped-entities": "off",
      "react/display-name": "off",
      "react/prop-types": "off",
      "react-compiler/react-compiler": "off",

      // Next.js rules
      "@next/next/no-img-element": "off",
      "@next/next/no-html-link-for-pages": "off",

      // General JavaScript rules
      "prefer-const": "off",
      "no-unused-vars": "off",
      "no-console": "off",
      "no-debugger": "off",
      "no-empty": "off",
      "no-irregular-whitespace": "off",
      "no-case-declarations": "off",
      "no-fallthrough": "off",
      "no-mixed-spaces-and-tabs": "off",
      "no-redeclare": "off",
      "no-undef": "off",
      "no-unreachable": "off",
      "no-useless-escape": "off",
    },
  },
  {
    // ---- Fronteira backend / frontend -------------------------------------
    // O código de navegador nunca pode importar o servidor (segredos, banco,
    // hashing). Só conversa com ele via HTTP (src/client/api.ts).
    files: [
      "src/components/**/*.{ts,tsx}",
      "src/stores/**/*.{ts,tsx}",
      "src/hooks/**/*.{ts,tsx}",
      "src/client/**/*.{ts,tsx}",
      "src/app/page.tsx",
      "src/app/layout.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/server/*", "**/server/*", "server-only"],
              message:
                "Frontend não pode importar código de src/server. Use src/client/api.ts (HTTP) ou src/shared (tipos/formatação).",
            },
          ],
        },
      ],
    },
  },
  {
    // O servidor não conhece UI nem estado de cliente.
    files: ["src/server/**/*.{ts,tsx}", "src/app/api/**/*.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/components/*", "@/stores/*", "@/hooks/*", "@/client/*"],
              message: "Backend não pode importar código de UI/cliente. Compartilhe apenas via src/shared.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["node_modules/**", ".next/**", "out/**", "build/**", "next-env.d.ts", "skills"],
  },
];

export default eslintConfig;
