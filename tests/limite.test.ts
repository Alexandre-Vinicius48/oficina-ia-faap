import assert from "node:assert/strict";
import test from "node:test";

import { dentroDoLimite, impressaoDigital } from "@/lib/limite-requisicoes";

test("permite ate o limite e bloqueia o excedente", () => {
  const chave = `teste-${Math.random()}`;

  for (let i = 1; i <= 3; i += 1) {
    const r = dentroDoLimite(chave, 3, 60_000);
    assert.equal(r.permitido, true, `envio ${i} deveria passar`);
  }

  const excedente = dentroDoLimite(chave, 3, 60_000);
  assert.equal(excedente.permitido, false, "o quarto envio deve ser barrado");
  assert.ok(excedente.tenteEmSegundos > 0, "informa quanto tempo esperar");
});

test("a contagem recomeca quando a janela termina", async () => {
  const chave = `teste-janela-${Math.random()}`;

  assert.equal(dentroDoLimite(chave, 1, 40).permitido, true);
  assert.equal(dentroDoLimite(chave, 1, 40).permitido, false);

  await new Promise((r) => setTimeout(r, 60));

  assert.equal(
    dentroDoLimite(chave, 1, 40).permitido,
    true,
    "passada a janela, volta a aceitar",
  );
});

test("aparelhos diferentes nao atrapalham um ao outro", () => {
  const a = `teste-a-${Math.random()}`;
  const b = `teste-b-${Math.random()}`;

  assert.equal(dentroDoLimite(a, 1, 60_000).permitido, true);
  assert.equal(dentroDoLimite(a, 1, 60_000).permitido, false);
  assert.equal(dentroDoLimite(b, 1, 60_000).permitido, true, "o outro segue livre");
});

test("a impressao digital nao guarda nem revela o IP", async () => {
  const cabecalhos = new Headers({ "x-forwarded-for": "203.0.113.42, 10.0.0.1" });
  const digital = await impressaoDigital(cabecalhos);

  assert.match(digital, /^[0-9a-f]{16}$/, "e um resumo curto em hexadecimal");
  assert.ok(!digital.includes("203"), "o IP nao aparece no resultado");

  const repetida = await impressaoDigital(cabecalhos);
  assert.equal(digital, repetida, "o mesmo aparelho gera o mesmo identificador");

  const outra = await impressaoDigital(new Headers({ "x-forwarded-for": "198.51.100.7" }));
  assert.notEqual(digital, outra, "aparelhos diferentes geram identificadores diferentes");
});
