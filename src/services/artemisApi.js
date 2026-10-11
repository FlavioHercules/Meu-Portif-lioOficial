const apiBaseUrl = (
  import.meta.env.VITE_ARTEMIS_API_URL || 'http://localhost:5000'
).trim().replace(/\/+$/, '');
const maxHistoryMessages = 100;

export async function askArtemis(pergunta, historico = [], options = {}) {
  const response = await fetch(`${apiBaseUrl}/perguntas`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pergunta,
      historico: historico.slice(-maxHistoryMessages),
      response_format: options.responseFormat,
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(data?.erro || 'Não foi possível conversar com a Artemis.');
  }

  if (typeof data?.resposta !== 'string' || !data.resposta.trim()) {
    throw new Error('A Artemis retornou uma resposta inválida.');
  }

  return data.resposta;
}