import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/**
 * ===========================================================================
 * LOGOS INSTITUCIONAIS
 * ===========================================================================
 * Para exibir os logos oficiais, salve os arquivos em:
 *
 *     public/logos/faap.svg              (ou .png)
 *     public/logos/bairro-com-vida.svg   (ou .png)
 *
 * Prefira SVG: fica nitido em qualquer tamanho de tela. PNG com fundo
 * transparente tambem serve.
 *
 * Enquanto os arquivos nao existirem, o site mostra um selo tipografico
 * discreto no lugar — nada quebra e nada fica com aparencia de erro.
 * Assim que voce colocar os arquivos e reiniciar o site, os logos oficiais
 * aparecem sozinhos, sem precisar mexer em codigo.
 */

const PASTA_LOGOS = path.join(process.cwd(), "public", "logos");

function procurarArquivo(base: string): { src: string; vetor: boolean } | null {
  for (const extensao of [".svg", ".png", ".webp", ".jpg"]) {
    const caminho = path.join(PASTA_LOGOS, `${base}${extensao}`);
    try {
      if (fs.existsSync(caminho)) {
        return { src: `/logos/${base}${extensao}`, vetor: extensao === ".svg" };
      }
    } catch {
      // Sem permissao de leitura: seguimos com o selo tipografico.
    }
  }
  return null;
}

const arquivoFaap = procurarArquivo("faap");
const arquivoBairro = procurarArquivo("bairro-com-vida");

type Props = { className?: string; alturaPx?: number };

/**
 * Selo tipografico do Bairro com Vida, usado enquanto o arquivo oficial nao
 * esta na pasta public/logos.
 *
 * E um SVG unico, com largura e altura declaradas. Foi feito assim de
 * proposito: dentro de containers flex, um bloco montado com varios elementos
 * HTML pode ser espremido abaixo do proprio conteudo e cortar o texto. Um SVG
 * com dimensao definida nunca sofre esse problema — e ainda fica nitido em
 * qualquer tamanho de tela.
 */
function SeloBairro({
  alturaPx,
  className = "",
}: {
  alturaPx: number;
  className?: string;
}) {
  const proporcao = 210 / 60;

  return (
    <svg
      viewBox="0 0 210 60"
      width={Math.round(alturaPx * proporcao)}
      height={alturaPx}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="Bairro com Vida"
    >
      {/* Coracao em mosaico, nas cores da marca. */}
      <g transform="rotate(-45 30 30)">
        <rect x="12" y="12" width="16" height="16" rx="3" fill="var(--color-vida-roxo)" />
        <rect x="30" y="12" width="16" height="16" rx="3" fill="var(--color-vida-amarelo)" />
        <rect x="12" y="30" width="16" height="16" rx="3" fill="var(--color-vida-azul)" />
        <rect x="30" y="30" width="16" height="16" rx="3" fill="var(--color-vida-verde)" />
        <rect x="30" y="48" width="16" height="10" rx="3" fill="var(--color-acolhe-500)" />
        <rect x="48" y="30" width="10" height="16" rx="3" fill="var(--color-vida-laranja)" />
      </g>

      <text
        x="72"
        y="27"
        fontFamily="var(--font-titulo)"
        fontSize="21"
        fontWeight="500"
        fill="var(--color-tinta)"
      >
        bairro
      </text>
      <text
        x="72"
        y="50"
        fontFamily="var(--font-titulo)"
        fontSize="23"
        fontWeight="800"
        fill="var(--color-tinta)"
      >
        com vida
      </text>
    </svg>
  );
}

/** Logo da FAAP. */
export function LogoFaap({ className = "", alturaPx = 44 }: Props) {
  if (arquivoFaap) {
    return (
      <Image
        src={arquivoFaap.src}
        alt="FAAP — Fundação Armando Alvares Penteado"
        width={alturaPx * 3}
        height={alturaPx}
        className={`h-auto w-auto shrink-0 object-contain ${className}`}
        style={{ height: alturaPx }}
        priority
        unoptimized={arquivoFaap.vetor}
      />
    );
  }

  return (
    <svg
      viewBox="0 0 132 60"
      width={Math.round(alturaPx * (132 / 60))}
      height={alturaPx}
      className={`shrink-0 ${className}`}
      role="img"
      aria-label="FAAP"
    >
      <text
        x="0"
        y="45"
        fontFamily="var(--font-titulo)"
        fontSize="44"
        fontWeight="800"
        letterSpacing="1.5"
        fill="var(--color-marca-600)"
      >
        FAAP
      </text>
    </svg>
  );
}

/** Logo do Bairro com Vida. */
export function LogoBairro({ className = "", alturaPx = 44 }: Props) {
  if (arquivoBairro) {
    return (
      <Image
        src={arquivoBairro.src}
        alt="Bairro com Vida"
        width={alturaPx * 3}
        height={alturaPx}
        className={`h-auto w-auto shrink-0 object-contain ${className}`}
        style={{ height: alturaPx }}
        priority
        unoptimized={arquivoBairro.vetor}
      />
    );
  }

  return <SeloBairro alturaPx={alturaPx} className={className} />;
}

/**
 * Os dois logos lado a lado, separados por um tracinho — a leitura visual de
 * "isto aqui e uma parceria".
 */
export function LogosParceria({
  alturaPx = 44,
  className = "",
}: {
  alturaPx?: number;
  className?: string;
}) {
  return (
    <div className={`flex flex-wrap items-center gap-4 sm:gap-6 ${className}`}>
      <LogoFaap alturaPx={alturaPx} />
      <span
        aria-hidden="true"
        className="hidden h-10 w-px shrink-0 bg-borda sm:block"
      />
      <LogoBairro alturaPx={alturaPx} />
    </div>
  );
}

/** Selo de parceria: os dois logos dentro de um cartao, com a frase-chave. */
export function SeloParceria({ className = "" }: { className?: string }) {
  return (
    <div
      className={`inline-flex flex-col items-center gap-3 rounded-2xl border-2 border-borda bg-white/95 px-6 py-4 shadow-md backdrop-blur ${className}`}
    >
      <LogosParceria alturaPx={38} className="justify-center" />
      <p className="text-center text-[0.9rem] font-semibold tracking-wide text-tinta-suave uppercase">
        Uma parceria para inclusão digital
      </p>
    </div>
  );
}
