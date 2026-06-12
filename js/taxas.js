/* ============================================================
   CONFIGURAÇÃO DO SIMULADOR — PAYMILLES
   ============================================================
   Este é o ÚNICO arquivo que você precisa editar.

   COMO EDITAR (sem programar):
   1. Acesse o repositório no GitHub
   2. Abra o arquivo  js/taxas.js
   3. Clique no ícone de lápis (Edit)
   4. Altere os números abaixo
   5. Clique em "Commit changes"
   → O Vercel publica a alteração automaticamente em ~1 minuto.

   REGRAS:
   - Taxas são escritas em DECIMAL:  1,39%  →  0.0139
   - Use PONTO como separador, nunca vírgula:  0.0315 ✔   0,0315 ✘
   - Não apague vírgulas no fim das linhas nem as chaves { }
   ============================================================ */

const CONFIG = {

  /* ---------- IDENTIDADE ---------- */
  nomeEmpresa: "PayMilles",
  // Logo branco/dourado, direto do site oficial.
  // Para usar um arquivo local, salve-o na pasta do projeto e
  // troque por: "assets/logo.png"
  logo: "https://www.paymilles.com.br/_next/image?url=%2Fassets%2Flogos%2Flogobrancaouro.png&w=384&q=100",
  // WhatsApp oficial PayMilles (somente números, com DDI).
  whatsapp: "5527995012178",
  mensagemWhatsapp: "Olá! Fiz uma simulação no site da Paymilles e quero saber mais.",

  /* ---------- TAXAS NEGOCIADAS ---------- */
  // Mesma estrutura da aba "TAXAS" da planilha.
  tabelas: [
    {
      nome: "Visa / Master",
      taxas: {
        debito: 0.0139,            // Débito ............... 1,39%
        credito: 0.0315,           // Crédito à vista ....... 3,15%
        parcelado2a6: 0.0295,      // Parcelado 2 a 6x ...... 2,95%
        parcelado7a12: 0.035,      // Parcelado 7 a 12x ..... 3,50%
        parcelado13a18: 0.035      // Parcelado 13 a 18x .... 3,50%
      }
    },
    {
      nome: "Elo & Outras",
      taxas: {
        debito: 0.016,             // Débito ............... 1,60%
        credito: 0.0344,           // Crédito à vista ....... 3,44%
        parcelado2a6: 0.031,       // Parcelado 2 a 6x ...... 3,10%
        parcelado7a12: 0.038,      // Parcelado 7 a 12x ..... 3,80%
        parcelado13a18: 0.038      // Parcelado 13 a 18x .... 3,80%
      }
    }
  ],

  // Taxa de antecipação ao mês (recebimento na hora).
  // 0.0143 reproduz EXATAMENTE as taxas publicadas em
  // paymilles.com.br/taxas (plano BASE).
  // A planilha original usava 0.0141 — se quiser voltar ao
  // valor da planilha, basta trocar o número abaixo.
  antecipacao: 0.0143,             // 1,43% a.m.

  /* ---------- OPÇÕES DO SIMULADOR ---------- */
  // Acréscimos disponíveis no "Cálculo Comprador" (R0, R2, R4...).
  // Valores em decimal: 0.02 = 2%.
  acrescimos: [0, 0.02, 0.04, 0.06, 0.08, 0.10],

  // Número máximo de parcelas exibidas (até 18).
  maxParcelas: 18,

  // Valor inicial do campo (em reais).
  valorInicial: 1000
};
