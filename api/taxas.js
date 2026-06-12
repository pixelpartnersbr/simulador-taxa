/* ============================================================
   API DE TAXAS — função serverless do Vercel
   GET  /api/taxas → devolve as taxas salvas no painel
   POST /api/taxas → grava novas taxas (exige senha)

   Requisitos no painel do Vercel (uma vez só):
   1. Storage → Create Database → Blob → conectar ao projeto
   2. Settings → Environment Variables → ADMIN_PASSWORD
   ============================================================ */
import { put, list } from '@vercel/blob';

const CAMINHO = 'config/taxas.json';
const CHAVES_TAXA = [
  'debito',
  'credito',
  'parcelado2a6',
  'parcelado7a12',
  'parcelado13a18'
];

function taxaValida(v) {
  return typeof v === 'number' && isFinite(v) && v >= 0 && v < 1;
}

function payloadValido(dados) {
  if (!dados || typeof dados !== 'object') return false;
  if (!taxaValida(dados.antecipacao)) return false;
  if (!Array.isArray(dados.tabelas) || dados.tabelas.length !== 2) return false;
  return dados.tabelas.every(
    (t) =>
      t &&
      t.taxas &&
      CHAVES_TAXA.every((c) => taxaValida(t.taxas[c]))
  );
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'GET') {
    try {
      const { blobs } = await list({ prefix: CAMINHO, limit: 1 });
      if (!blobs.length) {
        return res.status(404).json({ erro: 'nenhuma-taxa-salva' });
      }
      // query única para furar o cache da CDN do Blob
      const r = await fetch(blobs[0].url + '?v=' + Date.now());
      const dados = await r.json();
      return res.status(200).json(dados);
    } catch (e) {
      return res.status(500).json({ erro: 'falha-na-leitura' });
    }
  }

  if (req.method === 'POST') {
    const senha = req.headers['x-admin-password'];
    if (!process.env.ADMIN_PASSWORD) {
      return res
        .status(500)
        .json({ erro: 'ADMIN_PASSWORD não configurada no Vercel' });
    }
    if (senha !== process.env.ADMIN_PASSWORD) {
      return res.status(401).json({ erro: 'senha-incorreta' });
    }

    const dados = req.body;
    if (!payloadValido(dados)) {
      return res.status(400).json({ erro: 'dados-invalidos' });
    }

    // grava apenas os campos esperados (ignora qualquer extra)
    const limpo = {
      antecipacao: dados.antecipacao,
      tabelas: dados.tabelas.map((t) => ({
        taxas: Object.fromEntries(
          CHAVES_TAXA.map((c) => [c, t.taxas[c]])
        )
      })),
      atualizadoEm: new Date().toISOString()
    };

    try {
      await put(CAMINHO, JSON.stringify(limpo), {
        access: 'public',
        addRandomSuffix: false,
        allowOverwrite: true,
        contentType: 'application/json'
      });
      return res.status(200).json({ ok: true });
    } catch (e) {
      return res.status(500).json({ erro: 'falha-ao-gravar' });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ erro: 'metodo-nao-permitido' });
}
