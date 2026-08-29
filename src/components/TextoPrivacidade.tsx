import { Icone } from "@/components/Icones";

const ITENS = [
  {
    icone: "check" as const,
    titulo: "Para que servem seus dados",
    texto:
      "Nome, CPF, RG, celular e e-mail são usados apenas para identificar você, confirmar sua matrícula, organizar a turma e avisar sobre a oficina.",
  },
  {
    icone: "cadeado" as const,
    titulo: "Ninguém vê sua inscrição",
    texto:
      "Seus dados não aparecem em nenhuma página pública do site. Nenhum outro participante consegue ver a sua inscrição.",
  },
  {
    icone: "pessoas" as const,
    titulo: "Quem tem acesso",
    texto:
      "Somente as pessoas responsáveis pela organização da oficina, com login e senha próprios.",
  },
  {
    icone: "escudo" as const,
    titulo: "Não vendemos nem divulgamos",
    texto:
      "Seus dados não são vendidos, compartilhados com outras empresas nem usados para propaganda.",
  },
  {
    icone: "escrita" as const,
    titulo: "Você pode corrigir ou apagar",
    texto:
      "Basta pedir à organização da oficina para corrigir uma informação errada ou apagar sua inscrição. Atendemos o pedido.",
  },
];

export function TextoPrivacidade() {
  return (
    <div className="space-y-5">
      <p className="text-[1.1rem] leading-relaxed text-tinta">
        Levamos o cuidado com as suas informações a sério. Veja de forma simples
        o que fazemos com os dados que você digita na inscrição:
      </p>

      <ul className="space-y-4">
        {ITENS.map((item) => (
          <li
            key={item.titulo}
            className="flex gap-4 rounded-2xl border-2 border-borda bg-white p-5"
          >
            <span className="mt-1 shrink-0 text-marca-600">
              <Icone nome={item.icone} className="h-7 w-7" />
            </span>
            <span>
              <strong className="block text-[1.1rem] font-extrabold text-tinta">
                {item.titulo}
              </strong>
              <span className="mt-1 block text-[1.05rem] leading-relaxed text-tinta-suave">
                {item.texto}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <p className="text-[1rem] leading-relaxed text-tinta-suave">
        Este tratamento de dados segue a Lei Geral de Proteção de Dados
        (Lei nº 13.709/2018). Os dados ficam guardados apenas enquanto forem
        necessários para a organização desta oficina.
      </p>
    </div>
  );
}
