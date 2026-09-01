/**
 * Icones desenhados a mao em SVG (nenhuma biblioteca externa, nenhum
 * carregamento de fora do site). Tracos grossos para boa leitura.
 */
type Props = { className?: string };

const base = "h-8 w-8";

function Svg({ children, className }: Props & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.9}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? base}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export const Icones = {
  lampada: (p: Props) => (
    <Svg {...p}>
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.5 10.9c.5.4.8 1 .8 1.6V16h5.4v-.5c0-.6.3-1.2.8-1.6A6 6 0 0 0 12 3Z" />
    </Svg>
  ),
  conversa: (p: Props) => (
    <Svg {...p}>
      <path d="M21 12a8 8 0 0 1-8 8H4l2-3a8 8 0 1 1 15-5Z" />
      <path d="M8.5 11h.01M12 11h.01M15.5 11h.01" />
    </Svg>
  ),
  escrita: (p: Props) => (
    <Svg {...p}>
      <path d="M4 20h4l10-10a2.8 2.8 0 1 0-4-4L4 16v4Z" />
      <path d="M13.5 6.5 17.5 10.5" />
    </Svg>
  ),
  imagem: (p: Props) => (
    <Svg {...p}>
      <rect x="3" y="4.5" width="18" height="15" rx="2.5" />
      <circle cx="8.5" cy="10" r="1.6" />
      <path d="m4 17 5-4.5 4.5 4 3-2.5L20 17" />
    </Svg>
  ),
  video: (p: Props) => (
    <Svg {...p}>
      <rect x="2.5" y="6" width="13" height="12" rx="2.5" />
      <path d="m15.5 10.5 6-3v9l-6-3" />
    </Svg>
  ),
  casa: (p: Props) => (
    <Svg {...p}>
      <path d="M3.5 10.5 12 4l8.5 6.5" />
      <path d="M5.5 9.8V19a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1V9.8" />
      <path d="M10 20v-5h4v5" />
    </Svg>
  ),
  escudo: (p: Props) => (
    <Svg {...p}>
      <path d="M12 3.2 5 6v5.5c0 4.2 2.9 7.6 7 9.3 4.1-1.7 7-5.1 7-9.3V6l-7-2.8Z" />
      <path d="m9 12 2 2 4-4" />
    </Svg>
  ),
  seta: (p: Props) => (
    <Svg {...p}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Svg>
  ),
  cadeado: (p: Props) => (
    <Svg {...p}>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </Svg>
  ),
  check: (p: Props) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.5 2.6 2.6L16 9.7" />
    </Svg>
  ),
  alerta: (p: Props) => (
    <Svg {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.2M12 16.3h.01" />
    </Svg>
  ),
  pessoas: (p: Props) => (
    <Svg {...p}>
      <circle cx="9" cy="8.5" r="3.2" />
      <path d="M3.2 19.5a5.8 5.8 0 0 1 11.6 0" />
      <path d="M16.2 6.2a3 3 0 0 1 0 5.9M17.5 14.4a5.6 5.6 0 0 1 3.3 5.1" />
    </Svg>
  ),
  calendario: (p: Props) => (
    <Svg {...p}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </Svg>
  ),
  planilha: (p: Props) => (
    <Svg {...p}>
      <path d="M13 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V9l-6-6Z" />
      <path d="M13 3v6h6M9 13.5h6M9 17h6" />
    </Svg>
  ),
  sair: (p: Props) => (
    <Svg {...p}>
      <path d="M10 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h4" />
      <path d="M15.5 8.5 19 12l-3.5 3.5M19 12H10" />
    </Svg>
  ),
  lupa: (p: Props) => (
    <Svg {...p}>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m20 20-4.3-4.3" />
    </Svg>
  ),
  olho: (p: Props) => (
    <Svg {...p}>
      <path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.8" />
    </Svg>
  ),
  lixeira: (p: Props) => (
    <Svg {...p}>
      <path d="M4.5 7h15M9.5 7V5.2a1.2 1.2 0 0 1 1.2-1.2h2.6a1.2 1.2 0 0 1 1.2 1.2V7" />
      <path d="M6.5 7v12.3a1.7 1.7 0 0 0 1.7 1.7h7.6a1.7 1.7 0 0 0 1.7-1.7V7" />
      <path d="M10.2 11v6M13.8 11v6" />
    </Svg>
  ),
  olhoFechado: (p: Props) => (
    <Svg {...p}>
      <path d="M3 3l18 18" />
      <path d="M10.6 6.1A9.9 9.9 0 0 1 12 6c6 0 9.5 6 9.5 6a17 17 0 0 1-3.3 3.9" />
      <path d="M6.4 7.6A16.4 16.4 0 0 0 2.5 12S6 18 12 18c1.3 0 2.5-.3 3.5-.7" />
      <path d="M9.6 9.9a2.8 2.8 0 0 0 3.9 3.9" />
    </Svg>
  ),
} satisfies Record<string, (p: Props) => React.ReactElement>;

export type NomeIcone = keyof typeof Icones;

export function Icone({ nome, className }: { nome: NomeIcone; className?: string }) {
  const Componente = Icones[nome];
  return <Componente className={className} />;
}
