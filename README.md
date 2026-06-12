# Simulador de Taxas — Recebimento na Hora

Site estático que replica a planilha **SIMULADOR Recebimento na hora** com dois modos:

| Modo | Equivale na planilha | O que faz |
|---|---|---|
| **Cálculo Comprador** | Abas `VENDA R0` a `VENDA R10` | Informa quanto **vender** (com acréscimo opcional de 0% a 10%) para receber o valor desejado integralmente |
| **Cálculo Lojista** | Aba `ASSUMINDO O CUSTO` | Informa quanto o lojista **recebe** assumindo o custo das taxas |

A matemática (MDR por faixa de parcelas + antecipação de 1,41% a.m. via fórmula PRICE) reproduz a planilha **com os mesmos arredondamentos do Excel** — os resultados batem centavo a centavo.

## Estrutura

```
index.html        ← página
css/styles.css    ← visual (cores da marca no topo do arquivo, em :root)
js/taxas.js       ← ★ TAXAS E CONFIGURAÇÕES — único arquivo que o cliente edita
js/app.js         ← lógica de cálculo (não mexer)
```

## Como editar as taxas (cliente)

1. Acesse o repositório no GitHub
2. Abra `js/taxas.js` e clique no lápis (**Edit this file**)
3. Altere os números — taxas em decimal com ponto: `1,39% → 0.0139`
4. **Commit changes** → o Vercel publica sozinho em ~1 minuto

No mesmo arquivo também se configura: nome da empresa, logo, WhatsApp, acréscimos disponíveis (R0–R10) e número máximo de parcelas.

## Deploy (GitHub + Vercel)

```bash
git init
git add .
git commit -m "Simulador de taxas"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/simulador-taxas.git
git push -u origin main
```

No Vercel: **Add New → Project → importe o repositório**. Framework preset: **Other** (site estático, sem build). Deploy.

A cada commit na `main`, o Vercel atualiza o site automaticamente.

## Personalização visual

As cores ficam nas variáveis CSS no início de `css/styles.css` (`:root`). Para adequar à marca do cliente, basta trocar `--tinta` (fundo), `--verde` (destaque) e `--papel` (cards de resultado).
