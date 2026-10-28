import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { askArtemis } from '../services/artemisApi';
import { loadArtemisMessages, saveArtemisMessage } from '../services/aiWorkoutStorage';
import './ArtemisChat.css';

const exerciseTopicPattern = /\b(treinos?|exerc[ií]cios?|movimentos?|muscula[cç][aã]o|treinar|peito|costas|pernas?|ombros?|bra[cç]os?|b[ií]ceps|tr[ií]ceps|abd[oô]men|gl[uú]teos?|cardio)\b/i;

function normalizeExerciseName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function renderMessageContent(content, exercises, messageId) {
  const exercisesById = new Map(exercises.map((exercise) => [exercise.id, exercise]));
  const nameCounts = new Map();
  exercises.forEach((exercise) => {
    const normalizedName = normalizeExerciseName(exercise.name);
    nameCounts.set(normalizedName, (nameCounts.get(normalizedName) || 0) + 1);
  });
  const uniqueExercises = exercises
    .filter((exercise) => exercise.name && nameCounts.get(normalizeExerciseName(exercise.name)) === 1)
    .sort((first, second) => second.name.length - first.name.length);
  const uniqueExercisesByName = new Map(uniqueExercises.map((exercise) => [normalizeExerciseName(exercise.name), exercise]));
  const namePattern = uniqueExercises.length
    ? new RegExp(`(${uniqueExercises.map((exercise) => escapeRegExp(exercise.name)).join('|')})`, 'giu')
    : null;
  let linkIndex = 0;

  const renderPlainText = (text) => {
    if (!namePattern) return text;
    return text.split(namePattern).map((part) => {
      const exercise = uniqueExercisesByName.get(normalizeExerciseName(part));
      if (!exercise) return part;
      linkIndex += 1;
      return <Link key={`${messageId}-name-${linkIndex}`} className="artemis-chat__exercise-link" to={`/movimentos?exercise=${encodeURIComponent(exercise.id)}`}>{part}</Link>;
    });
  };

  const markerPattern = /\[\[exercicio:([0-9a-f-]{36})\|([^\]]+)\]\]/gi;
  const renderedParts = [];
  let cursor = 0;
  let marker;
  while ((marker = markerPattern.exec(content))) {
    renderedParts.push(...renderPlainText(content.slice(cursor, marker.index)));
    const exercise = exercisesById.get(marker[1]);
    if (exercise && normalizeExerciseName(exercise.name) === normalizeExerciseName(marker[2])) {
      linkIndex += 1;
      renderedParts.push(<Link key={`${messageId}-id-${linkIndex}`} className="artemis-chat__exercise-link" to={`/movimentos?exercise=${encodeURIComponent(exercise.id)}`}>{exercise.name}</Link>);
    } else {
      renderedParts.push(marker[2]);
    }
    cursor = markerPattern.lastIndex;
  }
  renderedParts.push(...renderPlainText(content.slice(cursor)));
  return renderedParts;
}

const initialMessages = [
  {
    id: 'welcome',
    role: 'assistant',
    content: 'Olá! Sou a Artemis. Como posso ajudar você na sua jornada de treino?',
  },
];

export default function ArtemisChat({
  userId,
  exerciseCatalog = [],
  disabled = false,
}) {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [voiceStatus, setVoiceStatus] = useState('idle');
  const [voiceMessage, setVoiceMessage] = useState('');
  const [spokenResponsesEnabled, setSpokenResponsesEnabled] = useState(true);
  const recognitionRef = useRef(null);
  const utteranceRef = useRef(null);
  const submissionRef = useRef(false);
  const spokenResponsesRef = useRef(true);

  const Recognition = typeof window !== 'undefined'
    ? window.SpeechRecognition || window.webkitSpeechRecognition
    : null;
  const speechSynthesisAvailable = typeof window !== 'undefined'
    && 'speechSynthesis' in window
    && typeof window.SpeechSynthesisUtterance === 'function';

  useEffect(() => () => {
    const recognition = recognitionRef.current;
    recognitionRef.current = null;
    if (recognition) {
      recognition.onstart = null;
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      recognition.abort();
    }
    const utterance = utteranceRef.current;
    utteranceRef.current = null;
    if (utterance) {
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
    }
    if (typeof window !== 'undefined') window.speechSynthesis?.cancel();
  }, []);

  useEffect(() => {
    let isActive = true;

    loadArtemisMessages(userId)
      .then((savedMessages) => {
        if (isActive) setMessages(savedMessages);
      })
      .catch(() => {
        if (!isActive) return;
        setErrorMessage('Não foi possível carregar seu histórico da Artemis. Confira a conexão e a migração do Supabase.');
        setHasError(true);
      })
      .finally(() => {
        if (isActive) setIsLoadingHistory(false);
      });

    return () => {
      isActive = false;
    };
  }, [userId]);

  const sendQuestion = async (rawQuestion, { speak = spokenResponsesEnabled } = {}) => {
    const pergunta = rawQuestion.trim();
    if (!pergunta || submissionRef.current || isLoadingHistory || disabled) return;
    submissionRef.current = true;
    recognitionRef.current?.stop();

    const recentContext = messages.slice(-6).map((message) => message.content).join(' ');
    const includeCatalog = exerciseTopicPattern.test(`${recentContext} ${pergunta}`);
    if (includeCatalog && !exerciseCatalog.length) {
      setErrorMessage('Não consegui carregar o catálogo de exercícios da MotionFit. Aguarde um instante e tente novamente.');
      setHasError(true);
      setVoiceStatus(speak ? 'error' : 'idle');
      submissionRef.current = false;
      return;
    }

    const temporaryId = `${Date.now()}-pending-user`;
    setMessages((currentMessages) => [
      ...currentMessages,
      { id: temporaryId, role: 'user', content: pergunta },
    ]);
    setQuestion('');
    setHasError(false);
    setErrorMessage('');
    setIsLoading(true);
    if (speak) {
      setVoiceStatus('processing');
      setVoiceMessage('Processando sua pergunta...');
    }

    try {
      const savedQuestion = await saveArtemisMessage(userId, {
        role: 'user',
        message_type: 'chat',
        content: pergunta,
      });
      setMessages((currentMessages) => currentMessages.map((message) => message.id === temporaryId ? savedQuestion : message));

      const historico = messages.slice(-6).map(({ role, content }) => ({
        role,
        content: content.slice(-1000),
      }));
      const catalogContext = includeCatalog
        ? [
            'CATÁLOGO DE EXERCÍCIOS MOTIONFIT (registros reais do banco):',
            JSON.stringify(exerciseCatalog.map((exercise) => ({
              id: exercise.id,
              nome: exercise.name,
              categoria: exercise.category,
              grupo_muscular: exercise.muscle_group,
              equipamento: exercise.equipment,
              dificuldade: exercise.difficulty,
            }))),
            'Ao montar um treino, use exclusivamente exercícios deste catálogo. Responda de forma curta: introdução de uma frase e de 4 a 6 exercícios. Para cada exercício use exatamente [[exercicio:UUID|Nome cadastrado]] seguido de séries, repetições e descanso. Copie UUID e nome do mesmo registro. Não inclua explicações longas nem invente exercícios, nomes ou IDs. Se não houver opções compatíveis, diga isso em uma frase.',
          ].join('\n')
        : '';
      const perguntaParaArtemis = catalogContext ? `${pergunta}\n\n${catalogContext}` : pergunta;
      const resposta = await askArtemis(perguntaParaArtemis, historico, {
        responseFormat: includeCatalog ? 'catalog' : 'text',
      });
      if (includeCatalog && /\[\[exercicio:[^\]]*$/.test(resposta.trim())) {
        throw new Error('A resposta da Artemis chegou incompleta. Tente enviar a pergunta novamente.');
      }

      try {
        const savedResponse = await saveArtemisMessage(userId, {
          role: 'assistant',
          message_type: 'chat',
          content: resposta,
        });
        setMessages((currentMessages) => [...currentMessages, savedResponse]);
      } catch {
        setMessages((currentMessages) => [...currentMessages, { id: `${Date.now()}-unsaved-assistant`, role: 'assistant', content: resposta }]);
        setErrorMessage('A Artemis respondeu, mas não foi possível salvar a resposta na sua conta.');
        setHasError(true);
      }

      if (speak && spokenResponsesRef.current && speechSynthesisAvailable) {
        const utterance = new SpeechSynthesisUtterance(
          resposta.replace(/\[\[exercicio:[0-9a-f-]{36}\|([^\]]+)\]\]/gi, '$1'),
        );
        utterance.lang = 'pt-BR';
        const portugueseVoice = window.speechSynthesis.getVoices().find((voice) => /^pt(-|_)/i.test(voice.lang));
        if (portugueseVoice) utterance.voice = portugueseVoice;
        utterance.onstart = () => setVoiceStatus('speaking');
        utterance.onend = () => {
          utteranceRef.current = null;
          setVoiceStatus('idle');
        };
        utterance.onerror = () => {
          utteranceRef.current = null;
          setVoiceStatus('error');
          setVoiceMessage('Não foi possível reproduzir a resposta em voz alta.');
        };
        utteranceRef.current = utterance;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } else if (speak) {
        setVoiceStatus('idle');
        setVoiceMessage(speechSynthesisAvailable ? '' : 'Este navegador não oferece síntese de voz.');
      }
    } catch (error) {
      setMessages((currentMessages) => currentMessages.filter((message) => message.id !== temporaryId));
      setErrorMessage(error.message || 'Não foi possível salvar sua pergunta ou conectar com a Artemis. Tente novamente.');
      setHasError(true);
      if (speak) {
        setVoiceStatus('error');
        setVoiceMessage(error.message || 'Não foi possível processar sua pergunta por voz.');
      }
    } finally {
      setIsLoading(false);
      submissionRef.current = false;
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    void sendQuestion(question);
  };

  const handleMicrophoneClick = () => {
    if (!Recognition) {
      setVoiceStatus('error');
      setVoiceMessage('O reconhecimento de voz não é compatível com este navegador.');
      return;
    }
    if (voiceStatus === 'listening') {
      recognitionRef.current?.stop();
      setVoiceStatus('idle');
      return;
    }
    if (isLoading || isLoadingHistory || disabled || submissionRef.current) return;

    const recognition = new Recognition();
    recognition.lang = 'pt-BR';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;
    setVoiceMessage('');
    recognition.onstart = () => setVoiceStatus('listening');
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript || '')
        .join(' ')
        .trim();
      if (transcript) {
        setQuestion(transcript);
        void sendQuestion(transcript, { speak: true });
      }
    };
    recognition.onerror = (event) => {
      const messages = {
        'not-allowed': 'Permita o acesso ao microfone nas configurações do navegador.',
        'service-not-allowed': 'O navegador bloqueou o serviço de reconhecimento de voz.',
        'audio-capture': 'Nenhum microfone disponível foi encontrado.',
        'no-speech': 'Nenhuma fala foi detectada. Tente novamente.',
        network: 'Falha de rede durante o reconhecimento de voz.',
      };
      setVoiceStatus('error');
      setVoiceMessage(messages[event.error] || 'Ocorreu um erro no reconhecimento de voz.');
    };
    recognition.onend = () => {
      recognitionRef.current = null;
      setVoiceStatus((currentStatus) => currentStatus === 'listening' ? 'idle' : currentStatus);
    };
    try {
      recognition.start();
    } catch {
      setVoiceStatus('error');
      setVoiceMessage('Não foi possível iniciar o microfone. Tente novamente.');
    }
  };

  const stopSpeaking = () => {
    const utterance = utteranceRef.current;
    utteranceRef.current = null;
    if (utterance) {
      utterance.onstart = null;
      utterance.onend = null;
      utterance.onerror = null;
    }
    window.speechSynthesis?.cancel();
    setVoiceStatus('idle');
  };

  const toggleSpokenResponses = (event) => {
    const enabled = event.target.checked;
    spokenResponsesRef.current = enabled;
    setSpokenResponsesEnabled(enabled);
    if (!enabled) stopSpeaking();
  };

  const voiceStatusLabel = {
    listening: 'OUVINDO',
    processing: 'PROCESSANDO',
    speaking: 'FALANDO',
    error: 'ERRO DE VOZ',
  }[voiceStatus];

  return (
    <section className="artemis-chat" aria-labelledby="artemis-chat-title">
      <div className="artemis-chat__header">
        <div>
          <span className="artemis-chat__eyebrow">ASSISTENTE DE TREINO</span>
          <h2 id="artemis-chat-title" className="artemis-chat__title">Converse com a Artemis</h2>
        </div>
        <span className="artemis-chat__status"><span className="artemis-chat__status-dot" /> ARTEMIS IA</span>
      </div>

      <div className="artemis-chat__messages" aria-live="polite" aria-relevant="additions text">
        {isLoadingHistory ? (
          <p className="artemis-chat__message-text" role="status">Carregando conversa salva...</p>
        ) : (messages.length ? messages : initialMessages).map((message) => (
          <div
            key={message.id}
            className={`artemis-chat__row artemis-chat__row--${message.role}`}
          >
            <div className={`artemis-chat__message artemis-chat__message--${message.role}`}>
              <span className="artemis-chat__author">
                {message.role === 'user' ? 'VOCÊ' : 'ARTEMIS'}
              </span>
              <p className="artemis-chat__message-text">{message.role === 'assistant' ? renderMessageContent(message.content, exerciseCatalog, message.id) : message.content}</p>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="artemis-chat__row" role="status">
            <div className="artemis-chat__message artemis-chat__message--assistant">
              <span className="artemis-chat__author">ARTEMIS</span>
              <p className="artemis-chat__message-text">Artemis está pensando...</p>
            </div>
          </div>
        )}
      </div>

      {hasError && (
        <p className="artemis-chat__error" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="artemis-chat__voice-controls">
        <button
          className={`artemis-chat__voice-button${voiceStatus === 'listening' ? ' is-listening' : ''}`}
          type="button"
          onClick={handleMicrophoneClick}
          disabled={!Recognition || disabled || isLoading || isLoadingHistory}
          aria-label={voiceStatus === 'listening' ? 'Parar de ouvir' : 'Fazer pergunta por voz'}
          title={Recognition ? 'Fazer pergunta por voz' : 'Reconhecimento de voz incompatível com este navegador'}
        >
          <span aria-hidden="true">◉</span>
          {voiceStatus === 'listening' ? 'Parar de ouvir' : 'Falar'}
        </button>
        <label className="artemis-chat__speech-toggle">
          <input
            type="checkbox"
            checked={spokenResponsesEnabled}
            onChange={toggleSpokenResponses}
            disabled={!speechSynthesisAvailable}
          />
          Respostas faladas
        </label>
        {voiceStatus === 'speaking' && (
          <button className="artemis-chat__stop-speaking" type="button" onClick={stopSpeaking}>
            Interromper fala
          </button>
        )}
        {voiceStatusLabel && <span className={`artemis-chat__voice-status is-${voiceStatus}`} role="status">{voiceStatusLabel}</span>}
      </div>
      {(voiceMessage || !Recognition) && (
        <p className="artemis-chat__voice-message" role={voiceStatus === 'error' ? 'alert' : 'status'}>
          {voiceMessage || 'Reconhecimento de voz não compatível com este navegador.'}
        </p>
      )}

      <form className="artemis-chat__form" onSubmit={handleSubmit}>
        <textarea
          className="artemis-chat__input"
          aria-label="Escreva sua pergunta para a Artemis"
          placeholder="Pergunte sobre seus treinos..."
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault();
              event.currentTarget.form.requestSubmit();
            }
          }}
          disabled={disabled || isLoading || isLoadingHistory}
          rows={2}
        />
        <button className="artemis-chat__send" type="submit" disabled={disabled || isLoading || isLoadingHistory || !question.trim()}>
          {isLoading ? 'Enviando...' : 'Enviar'}
          <span aria-hidden="true">→</span>
        </button>
      </form>
      <span className="artemis-chat__hint">Enter para enviar · Shift + Enter para nova linha</span>
    </section>
  );
}