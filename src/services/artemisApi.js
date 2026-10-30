import { supabase } from '../lib/supabase';

const maxHistoryMessages = 100;

export class ArtemisApiError extends Error {
  constructor(message, code = 'assistant_unavailable', status = 0) {
    super(message);
    this.name = 'ArtemisApiError';
    this.code = code;
    this.status = status;
  }
}

function getApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_ARTEMIS_API_URL?.trim();
  if (!import.meta.env.DEV) return '';
  return (configuredUrl || 'http://localhost:5000').replace(/\/+$/, '');
}

async function authenticatedHeaders() {
  if (!supabase) {
    throw new ArtemisApiError('O serviço de autenticação não está configurado.', 'authentication_required');
  }
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new ArtemisApiError('Não foi possível verificar sua sessão.', 'authentication_unavailable');
  if (!data.session?.access_token) {
    throw new ArtemisApiError('Entre na sua conta para usar a Artemis.', 'authentication_required', 401);
  }
  return { Authorization: `Bearer ${data.session.access_token}` };
}

async function readResponse(response) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ArtemisApiError(
      data?.erro || data?.error?.message || 'Não foi possível conversar com a Artemis.',
      data?.codigo || data?.error?.code || 'assistant_unavailable',
      response.status,
    );
  }
  return data;
}

async function requestArtemis(path, options = {}) {
  const apiBaseUrl = getApiBaseUrl();
  const headers = await authenticatedHeaders();
  const controller = new AbortController();
  const timeoutMs = path === '/perguntas' ? 7 * 60 * 1000 : 15000;
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: { ...headers, ...options.headers },
      signal: controller.signal,
    });
    return await readResponse(response);
  } catch (error) {
    if (error instanceof ArtemisApiError) throw error;
    const isTimeout = error?.name === 'AbortError';
    throw new ArtemisApiError(
      isTimeout ? 'A Artemis demorou para responder. Tente novamente.' : 'Não foi possível conectar à Artemis. Verifique sua conexão e tente novamente.',
      isTimeout ? 'request_timeout' : 'connection_error',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function askArtemis(pergunta, historico = [], options = {}) {
  const data = await requestArtemis('/perguntas', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      pergunta,
      historico: historico.slice(-maxHistoryMessages),
      response_format: options.responseFormat || 'text',
      validation: options.validation,
    }),
  });

  if (typeof data?.resposta !== 'string' || !data.resposta.trim()) {
    throw new ArtemisApiError('A Artemis retornou uma resposta inválida.', 'invalid_assistant_response');
  }

  return data.resposta;
}