import { OFICINA } from "@/config/oficina";

/**
 * Secao de videos da pagina inicial.
 *
 * Decisoes pensadas no publico da oficina:
 *  · NAO toca sozinho. Video que comeca do nada assusta, consome dados de
 *    quem esta no celular e atrapalha leitores de tela;
 *  · preload="metadata" faz o navegador baixar so o cabecalho do arquivo.
 *    O video em si so e baixado se a pessoa apertar o play — a pagina abre
 *    rapido mesmo em conexao lenta;
 *  · poster mostra o primeiro quadro no lugar de um retangulo preto;
 *  · controls usa os controles nativos do navegador, que sao grandes,
 *    conhecidos e ja funcionam com teclado e leitor de tela;
 *  · playsInline evita que o iPhone abra o video em tela cheia sozinho.
 */
type Video = (typeof OFICINA.videos)[number];

export function Videos() {
  // A configuracao usa "as const", entao o tamanho da lista vira um valor
  // fixo para o TypeScript. Alargamos o tipo aqui para que a secao possa
  // sumir de verdade quando alguem deixar videos: [] no arquivo de textos.
  const lista: readonly Video[] = OFICINA.videos;
  if (lista.length === 0) return null;

  return (
    <section className="bg-white py-16 lg:py-20">
      <div className="mx-auto max-w-6xl px-5">
        <header className="mx-auto max-w-2xl text-center">
          <p className="text-[0.9rem] font-bold tracking-[0.14em] text-acolhe-700 uppercase">
            Em vídeo
          </p>
          <h2 className="mt-3 text-[1.9rem] leading-tight font-extrabold text-marca-900 sm:text-[2.3rem]">
            Conheça a oficina
          </h2>
          <p className="mt-4 text-[1.1rem] text-tinta-suave">
            Aperte o play para assistir. Os vídeos são curtos.
          </p>
        </header>

        <ul className="mx-auto mt-11 grid max-w-4xl gap-9 sm:grid-cols-2">
          {lista.map((video) => (
            <li
              key={video.arquivo}
              className="overflow-hidden rounded-3xl border-2 border-borda bg-papel-alt shadow-sm"
            >
              <video
                controls
                playsInline
                preload="metadata"
                poster={video.poster}
                aria-label={video.titulo}
                className="block aspect-[9/16] w-full bg-black object-cover"
              >
                <source src={video.arquivo} type="video/mp4" />
                Seu navegador não consegue exibir este vídeo.
              </video>

              <div className="p-6">
                <h3 className="text-[1.2rem] font-extrabold text-tinta">
                  {video.titulo}
                </h3>
                <p className="mt-2 text-[1.05rem] leading-relaxed text-tinta-suave">
                  {video.descricao}
                </p>
                <p className="mt-3 text-[0.98rem] font-semibold text-tinta-suave">
                  Duração: {video.duracao}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
