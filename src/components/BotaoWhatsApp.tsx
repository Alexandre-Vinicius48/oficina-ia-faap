import { Icone } from "@/components/Icones";
import { OFICINA } from "@/config/oficina";

/**
 * Botao de WhatsApp.
 *
 * Detalhes que importam para o publico da oficina:
 *  · a mensagem ja vem escrita. Quem tem dificuldade com o celular costuma
 *    travar diante de uma conversa em branco, sem saber o que dizer;
 *  · o numero aparece escrito no botao, para quem prefere ligar ou salvar
 *    o contato a mao em vez de abrir o aplicativo;
 *  · abre em outra aba, e o texto avisa isso a quem usa leitor de tela;
 *  · o verde e mais escuro que o oficial do WhatsApp de proposito: o tom
 *    da marca (#25D366) rende apenas 1,98:1 com texto branco, ilegivel para
 *    quem enxerga pouco. Este chega a 7,6:1 e continua sendo lido como
 *    "verde do WhatsApp".
 */

/** 11932538479 -> (11) 93253-8479 */
function formatarNumero(digitos: string): string {
  const d = digitos.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digitos;
}

export function enderecoWhatsApp(): string | null {
  const numero = (OFICINA.contato.whatsapp ?? "").replace(/\D/g, "");
  if (numero.length < 10) return null;

  const texto = encodeURIComponent(OFICINA.contato.mensagemWhatsapp ?? "");
  // 55 é o código do Brasil, acrescentado aqui para o link funcionar de
  // qualquer país — inclusive para quem tem o celular com chip estrangeiro.
  return `https://wa.me/55${numero}${texto ? `?text=${texto}` : ""}`;
}

export function BotaoWhatsApp({
  rotulo = "Falar no WhatsApp",
  className = "",
  comNumero = true,
}: {
  rotulo?: string;
  className?: string;
  comNumero?: boolean;
}) {
  const endereco = enderecoWhatsApp();
  if (!endereco) return null;

  const numero = formatarNumero(OFICINA.contato.whatsapp);

  return (
    <a
      href={endereco}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-3 rounded-2xl bg-[#146039] px-7 py-4 text-[1.12rem] font-extrabold text-white shadow-sm transition hover:bg-[#0f4a2c] ${className}`}
    >
      <Icone nome="whatsapp" className="h-7 w-7 shrink-0" />
      <span className="flex flex-col items-start leading-tight">
        {rotulo}
        {comNumero && (
          <span className="text-[0.95rem] font-semibold opacity-95">
            {numero}
          </span>
        )}
      </span>
      <span className="sr-only">(abre o WhatsApp em outra aba)</span>
    </a>
  );
}
