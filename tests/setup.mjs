import { registerHooks } from "node:module";
import { pathToFileURL } from "node:url";
import { existsSync } from "node:fs";
import path from "node:path";

/**
 * Ensina ao Node dois atalhos que o Next.js ja resolve sozinho:
 *   "@/alguma/coisa" -> src/alguma/coisa.ts
 *   "server-only"    -> modulo vazio (so faz sentido dentro do Next.js)
 *
 * Assim os testes rodam com o Node puro, sem instalar mais ferramentas.
 */
const raiz = path.resolve(import.meta.dirname, "..");
const vazio = pathToFileURL(path.join(import.meta.dirname, "vazio.mjs")).href;

registerHooks({
  resolve(especificador, contexto, proximo) {
    if (especificador === "server-only") {
      return { shortCircuit: true, url: vazio };
    }

    if (especificador.startsWith("@/")) {
      const base = path.join(raiz, "src", especificador.slice(2));
      const candidatos = [base, `${base}.ts`, `${base}.tsx`, path.join(base, "index.ts")];
      for (const candidato of candidatos) {
        if (existsSync(candidato)) {
          return { shortCircuit: true, url: pathToFileURL(candidato).href };
        }
      }
    }

    return proximo(especificador, contexto);
  },
});
