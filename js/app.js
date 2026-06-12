/* ============================================================
   LÓGICA DO SIMULADOR — não é necessário editar este arquivo.
   As taxas ficam em js/taxas.js.

   A matemática replica exatamente a planilha
   "SIMULADOR Recebimento na hora", incluindo os
   arredondamentos do Excel (ROUND 4 e 6 casas).
   ============================================================ */
(function () {
  "use strict";

  /* ---------- matemática (idêntica à planilha) ---------- */

  // ROUND do Excel (meio para longe do zero; valores aqui são positivos)
  function round(x, casas) {
    const f = Math.pow(10, casas);
    return Math.round(x * f) / f;
  }

  // Componente de antecipação por nº de parcelas (fórmula PRICE da planilha)
  function taxaAntecipacao(n) {
    const a = CONFIG.antecipacao;
    if (a <= 0) return 0;
    const coef = round((a / (1 - 1 / Math.pow(1 + a, n))) * n - 1, 4);
    return round(1 - round(1 / (1 + coef), 6), 4);
  }

  // MDR conforme a faixa de parcelas
  function mdrParcelado(taxas, n) {
    if (n <= 6) return taxas.parcelado2a6;
    if (n <= 12) return taxas.parcelado7a12;
    return taxas.parcelado13a18;
  }

  // Taxa efetiva total (MDR + antecipação) para n parcelas
  function taxaEfetiva(taxas, n) {
    return taxaAntecipacao(n) + mdrParcelado(taxas, n);
  }

  /* ---------- formatação ---------- */

  const fmtBRL = new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
  const moeda = (v) => fmtBRL.format(v);
  const pct = (v) =>
    (v * 100).toLocaleString("pt-BR", { maximumFractionDigits: 2 }) + "%";

  /* ---------- estado ---------- */

  let modo = "comprador"; // "comprador" | "lojista"
  let acrescimo = CONFIG.acrescimos[0] ?? 0;
  let valor = CONFIG.valorInicial || 0; // em reais

  /* ---------- elementos ---------- */

  const $ = (id) => document.getElementById(id);
  const elValor = $("valor");
  const elRecibos = $("recibos");
  const elResumo = $("resumo");
  const elChips = $("chips");
  const elBlocoAcrescimo = $("blocoAcrescimo");
  const elRotuloValor = $("rotuloValor");

  /* ---------- identidade ---------- */

  function aplicarIdentidade() {
    document.title = CONFIG.nomeEmpresa + " — Simulador de Taxas";
    $("marcaNome").textContent = CONFIG.nomeEmpresa;

    if (CONFIG.logo) {
      const img = $("marcaLogo");
      img.src = CONFIG.logo;
      img.alt = CONFIG.nomeEmpresa;
      img.hidden = false;
    }
    if (CONFIG.whatsapp) {
      const btn = $("btnWhats");
      btn.href =
        "https://wa.me/" +
        CONFIG.whatsapp.replace(/\D/g, "") +
        "?text=" +
        encodeURIComponent(CONFIG.mensagemWhatsapp || "");
      btn.hidden = false;
    }
  }

  /* ---------- máscara de moeda ---------- */

  function aoDigitar() {
    const digitos = elValor.value.replace(/\D/g, "").slice(0, 12);
    valor = digitos ? parseInt(digitos, 10) / 100 : 0;
    elValor.value = digitos
      ? valor.toLocaleString("pt-BR", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      : "";
    render();
  }

  /* ---------- chips de acréscimo ---------- */

  function montarChips() {
    elChips.innerHTML = "";
    CONFIG.acrescimos.forEach((a) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "chip" + (a === acrescimo ? " is-ativo" : "");
      b.setAttribute("role", "radio");
      b.setAttribute("aria-checked", a === acrescimo ? "true" : "false");
      b.textContent = "R" + Math.round(a * 100);
      b.title = a === 0 ? "Sem acréscimo" : "Acréscimo de " + pct(a);
      b.addEventListener("click", () => {
        acrescimo = a;
        montarChips();
        render();
      });
      elChips.appendChild(b);
    });
  }

  /* ---------- abas ---------- */

  function trocarModo(novo) {
    modo = novo;
    document.querySelectorAll(".aba").forEach((aba) => {
      const ativa = aba.dataset.modo === modo;
      aba.classList.toggle("is-ativa", ativa);
      aba.setAttribute("aria-selected", ativa ? "true" : "false");
    });
    elBlocoAcrescimo.hidden = modo !== "comprador";
    elRotuloValor.textContent =
      modo === "comprador"
        ? "Valor que deseja receber"
        : "Valor que será vendido";
    render();
  }

  /* ---------- cálculo das linhas ---------- */

  // Modo comprador: quanto VENDER para receber o valor desejado
  function linhasComprador(taxas, base) {
    const linhas = [
      {
        rotulo: "Débito",
        principal: base / (1 - taxas.debito),
        parcela: null,
        avista: true
      },
      {
        rotulo: "Crédito",
        principal: base / (1 - taxas.credito),
        parcela: null,
        avista: true
      }
    ];
    for (let n = 2; n <= CONFIG.maxParcelas; n++) {
      const venda = base / (1 - taxaEfetiva(taxas, n));
      linhas.push({ rotulo: n + "x", principal: venda, parcela: venda / n });
    }
    return linhas;
  }

  // Modo lojista: quanto RECEBE assumindo o custo da taxa
  function linhasLojista(taxas, venda) {
    const linhas = [
      {
        rotulo: "Débito",
        principal: venda * (1 - taxas.debito),
        parcela: null,
        avista: true
      },
      {
        rotulo: "Crédito",
        principal: venda * (1 - taxas.credito),
        parcela: null,
        avista: true
      }
    ];
    for (let n = 2; n <= CONFIG.maxParcelas; n++) {
      const recebe = venda * (1 - taxaEfetiva(taxas, n));
      linhas.push({ rotulo: n + "x", principal: recebe, parcela: recebe / n });
    }
    return linhas;
  }

  /* ---------- renderização ---------- */

  function render() {
    // resumo
    if (valor <= 0) {
      elResumo.innerHTML = "Digite um valor para simular.";
      elRecibos.innerHTML = "";
      return;
    }
    const base = modo === "comprador" ? valor * (1 + acrescimo) : valor;
    if (modo === "comprador") {
      elResumo.innerHTML =
        acrescimo > 0
          ? "Receber <strong>" +
            moeda(valor) +
            "</strong> + acréscimo de <strong>" +
            pct(acrescimo) +
            "</strong> (" +
            moeda(valor * acrescimo) +
            ") = base de <strong>" +
            moeda(base) +
            "</strong>"
          : "Valores de venda para receber <strong>" +
            moeda(valor) +
            "</strong> integralmente, na hora.";
    } else {
      elResumo.innerHTML =
        "Quanto você recebe, na hora, vendendo <strong>" +
        moeda(valor) +
        "</strong> e assumindo o custo das taxas.";
    }

    // recibos
    const colunaPrincipal = modo === "comprador" ? "Venda" : "Você recebe";
    elRecibos.innerHTML = "";

    CONFIG.tabelas.forEach((tabela) => {
      const linhas =
        modo === "comprador"
          ? linhasComprador(tabela.taxas, base)
          : linhasLojista(tabela.taxas, base);

      const corpo = linhas
        .map((l) => {
          return (
            "<tr" + (l.avista ? ' class="avista"' : "") + ">" +
            "<td>" + l.rotulo + "</td>" +
            '<td class="destaque">' + moeda(l.principal) + "</td>" +
            "<td>" + (l.parcela === null ? "—" : moeda(l.parcela)) + "</td>" +
            "</tr>"
          );
        })
        .join("");

      const artigo = document.createElement("article");
      artigo.className = "recibo";
      artigo.innerHTML =
        '<header class="recibo__cabecalho">' +
        '<span class="recibo__bandeira">' + tabela.nome + "</span>" +
        '<span class="recibo__via">— via do lojista —</span>' +
        "</header>" +
        "<table>" +
        "<thead><tr><th>Parcelas</th><th>" + colunaPrincipal + "</th><th>Parcela</th></tr></thead>" +
        "<tbody>" + corpo + "</tbody>" +
        "</table>";
      elRecibos.appendChild(artigo);
    });
  }

  /* ---------- inicialização ---------- */

  aplicarIdentidade();
  montarChips();

  document.querySelectorAll(".aba").forEach((aba) =>
    aba.addEventListener("click", () => trocarModo(aba.dataset.modo))
  );
  elValor.addEventListener("input", aoDigitar);

  // valor inicial
  if (valor > 0) {
    elValor.value = valor.toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }
  trocarModo("comprador");

  /* ---------- taxas salvas no painel (/admin.html) ---------- */
  // Busca as taxas gravadas pela API. Se não existir nada salvo
  // (ou em ambiente local), mantém os padrões do js/taxas.js.
  (async function carregarTaxasSalvas() {
    try {
      const r = await fetch("/api/taxas", { cache: "no-store" });
      if (!r.ok) return;
      const salvo = await r.json();
      if (!salvo || !Array.isArray(salvo.tabelas)) return;
      salvo.tabelas.forEach((t, i) => {
        if (CONFIG.tabelas[i] && t && t.taxas) {
          CONFIG.tabelas[i].taxas = { ...CONFIG.tabelas[i].taxas, ...t.taxas };
        }
      });
      if (isFinite(salvo.antecipacao)) CONFIG.antecipacao = salvo.antecipacao;
      render();
    } catch (e) {
      /* sem API — segue com os padrões */
    }
  })();
})();
