# Simulador PayMilles — Recebimento na Hora

Site estático + painel de administração que replica a planilha **SIMULADOR Recebimento na hora** com dois modos:

| Modo | Equivale na planilha | O que faz |
|---|---|---|
| **Cálculo Comprador** | Abas `VENDA R0` a `VENDA R10` | Informa quanto **vender** (com acréscimo opcional de 0% a 10%) para receber o valor desejado integralmente |
| **Cálculo Lojista** | Aba `ASSUMINDO O CUSTO` | Informa quanto o lojista **recebe** assumindo o custo das taxas |

A matemática (MDR por faixa de parcelas + antecipação via fórmula PRICE) reproduz a planilha com os mesmos arredondamentos do Excel. Com antecipação de **1,43% a.m.**, os resultados batem 100% com as taxas publicadas em paymilles.com.br/taxas (plano BASE).

## Estrutura

```
index.html        ← simulador
admin.html        ← ★ painel onde o cliente edita as taxas (protegido por senha)
api/taxas.js      ← API serverless (lê/grava as taxas no Vercel Blob)
css/styles.css    ← visual preto & dourado (cores em :root)
js/taxas.js       ← valores padrão + identidade (nome, logo, WhatsApp)
js/app.js         ← lógica do simulador (não mexer)
js/admin.js       ← lógica do painel (não mexer)
package.json      ← dependência @vercel/blob
```

## Como o cliente edita as taxas

Acessar **`seusite.vercel.app/admin.html`**, alterar os valores (em %, ex.: `1,39`), digitar a senha e clicar em **Salvar taxas**. O simulador atualiza **na hora**, para todos os visitantes — sem redeploy, sem mexer em código.

> Os nomes das tabelas (Visa / Master, Elo & Outras) e a identidade visual continuam fixos no código; o painel altera somente os números.

## Deploy (GitHub + Vercel)

```bash
git init && git add . && git commit -m "Simulador PayMilles"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/simulador-paymilles.git
git push -u origin main
```

1. No Vercel: **Add New → Project** → importe o repositório → Deploy
2. **Storage → Create Database → Blob** → conecte ao projeto
   (isso cria automaticamente a variável `BLOB_READ_WRITE_TOKEN`)
3. **Settings → Environment Variables** → crie `ADMIN_PASSWORD` com a senha que o cliente vai usar no painel
4. **Deployments → ⋯ → Redeploy** para as variáveis valerem

Pronto: o painel em `/admin.html` já funciona.

## Observações

- Enquanto nada for salvo no painel, o simulador usa os valores padrão do `js/taxas.js` (que também funcionam como fallback).
- Para trocar a senha, basta editar `ADMIN_PASSWORD` no Vercel e fazer redeploy.
- Se quiser uma URL mais discreta para o painel, renomeie `admin.html` (ex.: `gestao-taxas-pm.html`).
- As cores ficam nas variáveis `:root` de `css/styles.css`.
