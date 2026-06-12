/* ============================================================
   PAINEL DE TAXAS — lógica
   Carrega as taxas salvas (ou as padrão do taxas.js),
   monta o formulário e grava via /api/taxas.
   ============================================================ */
(function () {
  "use strict";

  const CAMPOS = [
    ["debito", "Débito"],
    ["credito", "Crédito à vista"],
    ["parcelado2a6", "Parcelado 2 a 6x"],
    ["parcelado7a12", "Parcelado 7 a 12x"],
    ["parcelado13a18", "Parcelado 13 a 18x"]
  ];

  const $ = (id) => document.getElementById(id);
  const elForm = $("formulario");
  const elAviso = $("aviso");
  const elBtn = $("btnSalvar");

  /* ---------- identidade ---------- */
  $("marcaNome").textContent = CONFIG.nomeEmpresa;
  if (CONFIG.logo) {
    const img = $("marcaLogo");
    img.src = CONFIG.logo;
    img.alt = CONFIG.nomeEmpresa;
    img.hidden = false;
  }

  /* ---------- conversões % ---------- */
  // decimal (0.0139) → texto pt-BR ("1,39")
  const paraTexto = (d) =>
    (d * 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    });
  // texto ("1,39" ou "1.39") → decimal (0.0139)
  function paraDecimal(txt) {
    const n = parseFloat(String(txt).trim().replace(",", "."));
    return isFinite(n) ? n / 100 : NaN;
  }

  /* ---------- formulário ---------- */
  function montarFormulario(dados) {
    elForm.innerHTML = "";

    dados.tabelas.forEach((tabela, i) => {
      const nome = CONFIG.tabelas[i].nome; // nomes fixos, vêm do taxas.js
      const cartao = document.createElement("section");
      cartao.className = "cartao";
      cartao.innerHTML =
        "<h2>" + nome + "</h2>" +
        '<div class="grade">' +
        CAMPOS.map(
          ([chave, rotulo]) =>
            '<div class="taxa"><label for="t' + i + "_" + chave + '">' +
            rotulo +
            '</label><div class="caixa"><input id="t' + i + "_" + chave +
            '" inputmode="decimal" value="' +
            paraTexto(tabela.taxas[chave]) +
            '" /><span>%</span></div></div>'
        ).join("") +
        "</div>";
      elForm.appendChild(cartao);
    });

    const cartaoAnt = document.createElement("section");
    cartaoAnt.className = "cartao";
    cartaoAnt.innerHTML =
      "<h2>Antecipação</h2>" +
      '<div class="grade"><div class="taxa">' +
      '<label for="antecipacao">Taxa ao mês</label>' +
      '<div class="caixa"><input id="antecipacao" inputmode="decimal" value="' +
      paraTexto(dados.antecipacao) +
      '" /><span>% a.m.</span></div></div></div>';
    elForm.appendChild(cartaoAnt);
  }

  function lerFormulario() {
    const dados = {
      antecipacao: paraDecimal($("antecipacao").value),
      tabelas: CONFIG.tabelas.map((_, i) => ({
        taxas: Object.fromEntries(
          CAMPOS.map(([chave]) => [
            chave,
            paraDecimal($("t" + i + "_" + chave).value)
          ])
        )
      }))
    };
    const valores = [
      dados.antecipacao,
      ...dados.tabelas.flatMap((t) => Object.values(t.taxas))
    ];
    if (valores.some((v) => !isFinite(v) || v < 0 || v >= 1)) return null;
    return dados;
  }

  /* ---------- carregar ---------- */
  async function carregar() {
    let dados = {
      antecipacao: CONFIG.antecipacao,
      tabelas: CONFIG.tabelas.map((t) => ({ taxas: { ...t.taxas } }))
    };
    try {
      const r = await fetch("/api/taxas", { cache: "no-store" });
      if (r.ok) {
        const salvo = await r.json();
        if (salvo && salvo.tabelas) dados = salvo;
      }
    } catch (e) {
      /* sem API (ambiente local) — usa padrão do taxas.js */
    }
    montarFormulario(dados);
  }

  /* ---------- salvar ---------- */
  async function salvar() {
    elAviso.className = "aviso";
    const dados = lerFormulario();
    if (!dados) {
      elAviso.className = "aviso erro";
      elAviso.textContent =
        "Confira os valores: use números entre 0 e 99, ex.: 1,39";
      return;
    }
    const senha = $("senha").value;
    if (!senha) {
      elAviso.className = "aviso erro";
      elAviso.textContent = "Digite a senha de administrador.";
      return;
    }

    elBtn.disabled = true;
    elAviso.textContent = "Salvando…";
    try {
      const r = await fetch("/api/taxas", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": senha
        },
        body: JSON.stringify(dados)
      });
      if (r.ok) {
        elAviso.className = "aviso ok";
        elAviso.textContent =
          "✓ Taxas salvas! O simulador já está usando os novos valores.";
      } else if (r.status === 401) {
        elAviso.className = "aviso erro";
        elAviso.textContent = "Senha incorreta.";
      } else {
        const corpo = await r.json().catch(() => ({}));
        elAviso.className = "aviso erro";
        elAviso.textContent =
          "Não foi possível salvar (" + (corpo.erro || r.status) + "). Tente novamente.";
      }
    } catch (e) {
      elAviso.className = "aviso erro";
      elAviso.textContent = "Falha de conexão. Tente novamente.";
    } finally {
      elBtn.disabled = false;
    }
  }

  elBtn.addEventListener("click", salvar);
  carregar();
})();
