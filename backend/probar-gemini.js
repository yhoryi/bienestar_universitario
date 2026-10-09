// Va en la carpeta backend/ (junto al .env).
// Uso:  node probar-gemini.js
// Muestra qué modelos Flash puede usar tu clave y cuáles responden ahora mismo.

require('dotenv').config();

const KEY = process.env.GEMINI_API_KEY;
const BASE = 'https://generativelanguage.googleapis.com/v1beta';

if (!KEY) {
  console.log('Falta GEMINI_API_KEY en el .env (¿ejecutaste esto dentro de la carpeta backend?)');
  process.exit(1);
}

const probar = async (modelo) => {
  const inicio = Date.now();
  try {
    const r = await fetch(`${BASE}/models/${modelo}:generateContent`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': KEY },
      body: JSON.stringify({
        contents: [{ parts: [{ text: 'Responde solo con la palabra: ok' }] }],
        generationConfig: { maxOutputTokens: 256, thinkingConfig: { thinkingLevel: 'low' } },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const ms = Date.now() - inicio;
    if (r.ok) return `✅ ${modelo}  (${ms} ms)`;

    const texto = await r.text();
    let mensaje = texto;
    try {
      mensaje = JSON.parse(texto).error?.message || texto;
    } catch {
      // se deja el texto tal cual
    }
    return `❌ ${modelo}  → ${r.status} (${ms} ms) ${mensaje.slice(0, 100)}`;
  } catch (e) {
    return `⏱️  ${modelo}  → ${e.name} tras ${Date.now() - inicio} ms`;
  }
};

(async () => {
  const lista = await fetch(`${BASE}/models?pageSize=200`, { headers: { 'x-goog-api-key': KEY } });

  if (!lista.ok) {
    console.log('No se pudo consultar la lista de modelos:', lista.status, (await lista.text()).slice(0, 200));
    return;
  }

  const { models = [] } = await lista.json();
  const nombres = models
    .filter((m) => (m.supportedGenerationMethods || []).includes('generateContent'))
    .map((m) => m.name.replace('models/', ''))
    .filter((n) => /^gemini-.*flash/.test(n) && !/(tts|image|live|audio|embedding|robotics|computer)/.test(n));

  console.log('\nModelos Flash disponibles para tu clave:');
  nombres.forEach((n) => console.log('  ' + n));

  console.log('\nProbando cada uno (máx. 10)...\n');
  for (const n of nombres.slice(0, 10)) {
    console.log(await probar(n));
  }

  console.log('\nUsa en tu .env los que salgan con ✅, el más rápido como GEMINI_MODEL.\n');
})();
