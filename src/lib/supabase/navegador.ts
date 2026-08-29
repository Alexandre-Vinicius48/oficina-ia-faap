"use client";

import { createBrowserClient } from "@supabase/ssr";
import { chavePublicaSupabase, urlSupabase } from "@/lib/env";

/**
 * Cliente do navegador. Usa apenas a chave PUBLICA (anon).
 * Serve unicamente para o login do administrador e para encerrar a sessao.
 * Nenhuma leitura de inscricoes acontece por aqui: a chave publica nao tem
 * permissao nenhuma sobre a tabela (ver 0001_init.sql, secao 5.1).
 */
let cliente: ReturnType<typeof createBrowserClient> | null = null;

export function supabaseNavegador() {
  if (!cliente) {
    cliente = createBrowserClient(urlSupabase(), chavePublicaSupabase());
  }
  return cliente;
}
