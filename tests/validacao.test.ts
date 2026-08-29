import assert from "node:assert/strict";
import test from "node:test";

import { cpfEhValido, celularEhValido, emailEhValido } from "@/lib/validacao";
import {
  mascararCpf,
  mascararCelular,
  ocultarCpf,
  ocultarRg,
  normalizarRg,
  somenteDigitos,
} from "@/lib/format";
import { limparBusca } from "@/lib/consulta-inscritos";

test("CPF valido e aceito, com ou sem mascara", () => {
  assert.equal(cpfEhValido("529.982.247-25"), true);
  assert.equal(cpfEhValido("52998224725"), true);
  assert.equal(cpfEhValido("111.444.777-35"), true);
});

test("CPF invalido e recusado", () => {
  assert.equal(cpfEhValido("529.982.247-26"), false, "digito verificador errado");
  assert.equal(cpfEhValido("111.111.111-11"), false, "todos os digitos iguais");
  assert.equal(cpfEhValido("123"), false, "curto demais");
  assert.equal(cpfEhValido(""), false);
  assert.equal(cpfEhValido("abcdefghijk"), false);
});

test("celular precisa de DDD valido", () => {
  assert.equal(celularEhValido("(11) 98765-4321"), true);
  assert.equal(celularEhValido("1133334444"), true, "fixo com 10 digitos");
  assert.equal(celularEhValido("(01) 98765-4321"), false, "DDD inexistente");
  assert.equal(celularEhValido("11987654"), false, "curto demais");
  assert.equal(celularEhValido("11887654321"), false, "11 digitos sem o 9");
});

test("e-mail exige formato completo", () => {
  assert.equal(emailEhValido("maria@email.com"), true);
  assert.equal(emailEhValido("MARIA@EMAIL.COM"), true);
  assert.equal(emailEhValido("maria@email"), false);
  assert.equal(emailEhValido("maria.email.com"), false);
  assert.equal(emailEhValido("@email.com"), false);
});

test("mascaras montam o texto enquanto a pessoa digita", () => {
  assert.equal(mascararCpf("52998224725"), "529.982.247-25");
  assert.equal(mascararCpf("529982"), "529.982");
  assert.equal(mascararCelular("11987654321"), "(11) 98765-4321");
  assert.equal(mascararCelular("1133334444"), "(11) 3333-4444");
  assert.equal(somenteDigitos("(11) 98765-4321"), "11987654321");
});

test("CPF e RG nunca aparecem inteiros quando mascarados", () => {
  const escondido = ocultarCpf("52998224725");
  assert.equal(escondido, "***.982.247-**");
  assert.ok(!escondido.includes("529"), "os tres primeiros digitos somem");
  assert.ok(!escondido.includes("25"), "os digitos verificadores somem");

  const rg = ocultarRg("123456789");
  assert.equal(rg, "*******89");
  assert.ok(!rg.includes("1234567"));
});

test("RG e normalizado sem pontuacao e em maiusculas", () => {
  assert.equal(normalizarRg("12.345.678-x"), "12345678X");
});

test("busca remove caracteres especiais de filtro", () => {
  // Virgula e parenteses poderiam alterar o filtro enviado ao banco.
  assert.equal(limparBusca("maria,cpf.eq.123"), "maria cpf.eq.123");
  assert.equal(limparBusca("or(cpf.gt.0)"), "or cpf.gt.0");
  assert.equal(limparBusca("  joao   silva  "), "joao silva");
  assert.equal(limparBusca("a".repeat(200)).length, 60);
});
