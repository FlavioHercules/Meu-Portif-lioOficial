import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import ArtemisChat from './ArtemisChat';
import { askArtemis, getArtemisAccess } from '../services/artemisApi';
import { findExerciseByName, loadAiWorkout, readAiWorkout, saveAiWorkout } from '../services/aiWorkoutStorage';
import { supabase } from '../lib/supabase';
import { defaultSchedule, trainingDayIndexes, weekDays } from '../utils/trainingDays';

const trainingOptions = ['Musculação', 'Funcional', 'HIIT', 'Cardio', 'Mobilidade', 'Esportes'];
const exerciseCatalogFields = 'id, name, category, muscle_group, equipment, difficulty, exercise_type, suggested_sets, suggested_reps, modality, objectives, muscles, movement_pattern, unilateral, impact_level, description';

function sessionsPerWeek(frequency = '') {
  const match = String(frequency).match(/^(\d+)/);
  return match ? Number(match[1]) : 0;
}

function frequencyForSessions(count) {
  return count ? `${count} ${count === 1 ? 'vez' : 'vezes'} por semana` : '';
}

function parseWorkoutPlan(response) {
  const jsonText = response.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let plan;
  try {
    plan = JSON.parse(jsonText);
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('A resposta da Artemis veio incompleta ou inválida. Tente gerar o treino novamente.');
    }
    throw error;
  }
  if (!Array.isArray(plan.days) || !plan.days.length) throw new Error('A Artemis não organizou os treinos por dia. Gere novamente.');
  for (const day of plan.days) {
    if (!day.title || !Array.isArray(day.exercises) || !day.exercises.length) {
      throw new Error('A resposta da Artemis veio sem exercícios organizados. Gere novamente.');
    }
  }
  return plan;
}

function formatWorkoutPlan(plan) {
  return plan.days.map((day) => [
    `${day.weekday}: ${day.title}`,
    ...day.exercises.map((exercise) => `- ${exercise.name}: ${exercise.sets} séries, ${exercise.reps} repetições, ${exercise.rest_seconds}s de descanso`),
  ].join('\n')).join('\n\n');
}

function mondayOf(date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function IA({ userId, pesquisa, onPesquisaChange, onOpenNotif, onOpenConfig }) {
  const [preferences, setPreferences] = useState(() => ({
    objective: pesquisa?.objective || '',
    training_preferences: pesquisa?.training_preferences || [],
    experience_level: pesquisa?.experience_level || '',
    weekly_frequency: pesquisa?.weekly_frequency || '',
    available_time: pesquisa?.available_time || '',
    training_location: pesquisa?.training_location || '',
    equipment: pesquisa?.equipment || 'Academia completa',
  }));
  const [workout, setWorkout] = useState(() => readAiWorkout(userId)?.content || '');
  const [workoutError, setWorkoutError] = useState('');
  const [workoutSaveError, setWorkoutSaveError] = useState('');
  const [preferencesError, setPreferencesError] = useState('');
  const [isSavingPreferences, setIsSavingPreferences] = useState(false);
  const [isGeneratingWorkout, setIsGeneratingWorkout] = useState(false);
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [artemisAccess, setArtemisAccess] = useState({ status: 'loading' });
  const [selectedTrainingDays, setSelectedTrainingDays] = useState(() => {
    const savedDays = trainingDayIndexes(pesquisa?.training_days);
    return savedDays.length === sessionsPerWeek(pesquisa?.weekly_frequency)
      ? savedDays
      : defaultSchedule(sessionsPerWeek(pesquisa?.weekly_frequency));
  });

  useEffect(() => {
    let isActive = true;

    getArtemisAccess()
      .then((access) => {
        if (!isActive) return;
        if (typeof access?.premium !== 'boolean'
          || typeof access?.free_available !== 'boolean'
          || typeof access?.free_in_progress !== 'boolean'
          || typeof access?.requires_subscription !== 'boolean') {
          throw new Error('Não foi possível interpretar o estado da sua assinatura.');
        }
        setArtemisAccess({
          ...access,
          status: access.premium ? 'premium'
            : access.requires_subscription ? 'required'
              : access.free_in_progress ? 'busy'
                : access.free_available ? 'free'
                  : 'error',
        });
      })
      .catch((error) => {
        if (isActive) setArtemisAccess({ status: 'error', error: error.message });
      });

    supabase
      .from('exercises')
      .select(exerciseCatalogFields)
      .eq('active', true)
      .order('name')
      .then(({ data, error }) => {
        if (!isActive) return;
        if (error) {
          setWorkoutError('Não foi possível carregar o catálogo de exercícios da MotionFit. Confira a conexão e as permissões da tabela exercises.');
          return;
        }
        setExerciseCatalog(data || []);
      });

    loadAiWorkout(userId)
      .then((savedWorkout) => {
        if (isActive && savedWorkout) setWorkout(savedWorkout.content);
      })
      .catch(() => {
        if (isActive) setWorkoutSaveError('Não foi possível sincronizar seu treino salvo. Confira a migração do Supabase.');
      });

    return () => {
      isActive = false;
    };
  }, [userId]);

  const refreshArtemisAccess = async () => {
    try {
      const access = await getArtemisAccess();
      if (typeof access?.premium !== 'boolean'
        || typeof access?.free_available !== 'boolean'
        || typeof access?.free_in_progress !== 'boolean'
        || typeof access?.requires_subscription !== 'boolean') {
        throw new Error('Não foi possível interpretar o estado da sua assinatura.');
      }
      setArtemisAccess({
        ...access,
        status: access.premium ? 'premium'
          : access.requires_subscription ? 'required'
            : access.free_in_progress ? 'busy'
              : access.free_available ? 'free'
                : 'error',
      });
    } catch (error) {
      setArtemisAccess({ status: 'error', error: error.message });
    }
  };

  const updatePreference = (field, value) => {
    setPreferences((current) => ({ ...current, [field]: value }));
    if (field === 'weekly_frequency') setSelectedTrainingDays(defaultSchedule(sessionsPerWeek(value)));
    setPreferencesError('');
  };

  const toggleTrainingDay = (dayIndex) => {
    const nextDays = selectedTrainingDays.includes(dayIndex)
      ? selectedTrainingDays.filter((index) => index !== dayIndex)
      : [...selectedTrainingDays, dayIndex].sort((first, second) => first - second);
    setSelectedTrainingDays(nextDays);
    setPreferences((current) => ({
      ...current,
      weekly_frequency: frequencyForSessions(nextDays.length),
    }));
    setPreferencesError('');
  };

  const persistPreferences = async () => {
    setPreferencesError('');
    if (selectedTrainingDays.length === 0) {
      setPreferencesError('Selecione pelo menos um dia de treino.');
      return null;
    }
    if (!preferences.objective || !preferences.experience_level || !preferences.weekly_frequency || !preferences.available_time || !preferences.training_location || !preferences.equipment) {
      setPreferencesError('Preencha as preferências obrigatórias antes de salvar.');
      return null;
    }
    const sessionCount = sessionsPerWeek(preferences.weekly_frequency);
    if (selectedTrainingDays.length !== sessionCount) {
      setPreferencesError(`Selecione ${sessionCount} ${sessionCount === 1 ? 'dia' : 'dias'} para sua frequência semanal.`);
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('pesquisa')
        .upsert({
          ...pesquisa,
          user_id: userId,
          objective: preferences.objective,
          training_preferences: preferences.training_preferences,
          experience_level: preferences.experience_level,
          weekly_frequency: preferences.weekly_frequency,
          training_days: [...selectedTrainingDays].sort((first, second) => first - second).map((index) => weekDays[index]),
          available_time: preferences.available_time,
          training_location: preferences.training_location,
          equipment: preferences.equipment,
        }, { onConflict: 'user_id' })
        .select()
        .single();

      if (error) {
        setPreferencesError('Não foi possível salvar as preferências. Tente novamente.');
        return null;
      }

      onPesquisaChange(data);
      return data;
    } catch {
      setPreferencesError('Não foi possível salvar as preferências. Tente novamente.');
      return null;
    }
  };

  const handleSavePreferences = async () => {
    setIsSavingPreferences(true);
    try {
      await persistPreferences();
    } finally {
      setIsSavingPreferences(false);
    }
  };

  const handleGenerateWorkout = async () => {
    const savedPreferences = await persistPreferences();
    if (!savedPreferences) {
      return;
    }

    let catalog = exerciseCatalog;
    if (!catalog.length) {
      const { data, error } = await supabase
        .from('exercises')
        .select(exerciseCatalogFields)
        .eq('active', true)
        .order('name');
      if (error) {
        setWorkoutError('Não foi possível carregar o catálogo de exercícios. Tente novamente.');
        return;
      }
      catalog = data || [];
      setExerciseCatalog(catalog);
    }
    if (!catalog.length) {
      setWorkoutError('Não há exercícios cadastrados no catálogo para montar o treino.');
      return;
    }

    setWorkoutError('');
    setIsGeneratingWorkout(true);

    let responseGenerated = false;
    try {
      const catalogForPrompt = catalog.map((exercise) => ({
        id: exercise.id,
        nome: exercise.name,
        categoria: exercise.category,
        grupo_muscular: exercise.muscle_group,
        equipamento: exercise.equipment,
        dificuldade: exercise.difficulty,
        tipo: exercise.exercise_type,
        series_sugeridas: exercise.suggested_sets,
        repeticoes_sugeridas: exercise.suggested_reps,
        modalidade: exercise.modality,
        objetivos: exercise.objectives,
        musculos: exercise.muscles,
        padrao_movimento: exercise.movement_pattern,
        unilateral: exercise.unilateral,
        impacto: exercise.impact_level,
      }));
      const exampleExercise = catalogForPrompt[0];
      const prompt = [
        'Crie um treino personalizado e prático com base nestes dados:',
        `Objetivo: ${preferences.objective}`,
        `Tipos de treino: ${preferences.training_preferences.join(', ') || 'sem preferência específica'}`,
        `Experiência: ${preferences.experience_level}`,
        `Tempo por sessão: ${preferences.available_time}`,
        `Frequência: ${preferences.weekly_frequency}`,
        `Local: ${preferences.training_location}`,
        `Equipamentos: ${preferences.equipment}`,
        `Dias escolhidos: ${[...selectedTrainingDays].sort((a, b) => a - b).map((index) => weekDays[index]).join(', ')}.`,
        `Catálogo real da tabela exercises da MotionFit. Cada opção é um registro cadastrado: ${JSON.stringify(catalogForPrompt)}`,
        'Use exclusivamente exercícios presentes no catálogo. Não invente exercícios, IDs ou nomes. Copie o id do registro para exercise_id e o nome correspondente para name.',
        'As séries e repetições sugeridas no catálogo são referências ajustáveis: adapte-as ao objetivo, experiência e tempo disponível, sem tratá-las como regras universais.',
        `Exemplo de exercício válido: ${JSON.stringify({ exercise_id: exampleExercise.id, name: exampleExercise.nome, sets: 3, reps: '8-12', rest_seconds: 60 })}.`,
        `Responda somente com JSON válido neste formato: {"days":[{"weekday":"Seg","title":"Nome do treino","duration_min":45,"exercises":[{"exercise_id":"UUID real listado no catálogo","name":"Nome exato listado no catálogo","sets":3,"reps":"8-12","rest_seconds":60}]}]}. Inclua exatamente um objeto para cada dia escolhido, mantenha os nomes dos dias exatamente como informados, e inclua pelo menos 3 exercícios em cada dia. Não use markdown nem texto fora do JSON.`,
      ].join('\n');
      const orderedDays = [...selectedTrainingDays].sort((first, second) => first - second);
      const response = await askArtemis(prompt, [], {
        responseFormat: 'json',
        validation: {
          exercise_ids: catalog.map((exercise) => exercise.id),
          weekdays: orderedDays.map((dayIndex) => weekDays[dayIndex]),
        },
      });
      responseGenerated = true;
      const plan = parseWorkoutPlan(response);
      const linkedPlan = {
        ...plan,
        days: plan.days.map((day) => ({
          ...day,
          exercises: day.exercises.map((exercise) => {
            const catalogExercise = catalog.find((item) => item.id === exercise.exercise_id)
              || findExerciseByName(exercise.name, catalog);
            if (!catalogExercise) {
              throw new Error(`A Artemis retornou "${exercise.name || 'um exercício'}", que não está no catálogo da MotionFit. Gere o treino novamente.`);
            }
            return {
              ...exercise,
              name: catalogExercise.name,
              exercise_id: catalogExercise.id,
            };
          }),
        })),
      };
      const workoutText = formatWorkoutPlan(linkedPlan);
      setWorkout(workoutText);
      setWorkoutSaveError('');
      try {
        await saveAiWorkout(userId, { content: workoutText, createdAt: new Date().toISOString() });
        const monday = mondayOf(new Date());
        const requestedDays = [...selectedTrainingDays].sort((first, second) => first - second);
        const sessionsToInsert = requestedDays.map((dayIndex, index) => {
          const day = linkedPlan.days[index];
          const scheduledDate = new Date(monday);
          scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
          return {
            user_id: userId,
            status: 'planned',
            scheduled_for: toDateKey(scheduledDate),
            workout_title: day.title,
            duration_min: Number(day.duration_min) || 45,
            plan_inputs: {
              source: 'artemis',
              training_day: weekDays[dayIndex],
              objective: preferences.objective,
              exercise_plan: day.exercises.map((exercise) => ({
                exercise_id: exercise.exercise_id,
                name: String(exercise.name),
                sets: Number(exercise.sets) || 3,
                reps: String(exercise.reps || '8-12'),
                rest_seconds: Number(exercise.rest_seconds) || 60,
              })),
            },
          };
        });
        if (plan.days.length !== requestedDays.length || plan.days.some((day, index) => day.weekday !== weekDays[requestedDays[index]])) {
          throw new Error('Os dias retornados pela Artemis não correspondem aos selecionados. Gere novamente.');
        }
        const mondayKey = toDateKey(monday);
        const sunday = new Date(monday);
        sunday.setDate(sunday.getDate() + 6);
        const { error: deleteError } = await supabase
          .from('workout_sessions')
          .delete()
          .eq('user_id', userId)
          .eq('status', 'planned')
          .contains('plan_inputs', { source: 'artemis' })
          .gte('scheduled_for', mondayKey)
          .lte('scheduled_for', toDateKey(sunday));
        if (deleteError) throw deleteError;
        const { error: insertError } = await supabase.from('workout_sessions').insert(sessionsToInsert);
        if (insertError) throw insertError;
      } catch {
        setWorkoutSaveError('O treino foi gerado, mas não foi possível salvá-lo na agenda. Confira as políticas e a migração de sessões do Supabase.');
      }
    } catch (error) {
      setWorkoutError(error.message || 'Não foi possível gerar o treino. Tente novamente.');
      if (error.code === 'subscription_required') void refreshArtemisAccess();
    } finally {
      if (responseGenerated) void refreshArtemisAccess();
      setIsGeneratingWorkout(false);
    }
  };

  if (artemisAccess.status === 'loading') {
    return (
      <div style={styles.appContainer}>
        <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />
        <main className="ia-dashboard" style={{ ...styles.dashboardGrid, gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <section style={styles.sectionCard} role="status" aria-live="polite">
            <h1 style={styles.heroTitle}>Verificando seu acesso à Artemis...</h1>
            <p style={styles.heroDesc}>Aguarde enquanto confirmamos sua gratuidade ou assinatura.</p>
          </section>
        </main>
      </div>
    );
  }

  if (artemisAccess.status === 'required') {
    return (
      <div style={styles.appContainer}>
        <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />
        <main className="ia-dashboard" style={{ ...styles.dashboardGrid, gridTemplateColumns: 'minmax(0, 1fr)' }}>
          <section style={styles.sectionCard} aria-labelledby="artemis-premium-title">
            <span style={styles.heroTag}>— ACESSO PREMIUM</span>
            <h1 id="artemis-premium-title" style={styles.heroTitle}>Sua utilização gratuita já foi usada</h1>
            <p style={styles.heroDesc}>Para continuar conversando com a Artemis ou gerar novos treinos, conheça os planos disponíveis. Seu histórico e seus treinos salvos continuam preservados.</p>
            {workout && (
              <div style={{ ...styles.sectionCard, marginTop: '20px' }}>
                <h2 style={styles.stepTitleText}>ÚLTIMO TREINO GERADO</h2>
                <p style={{ color: '#dbe4f0', lineHeight: 1.7, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>{workout}</p>
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', margin: '20px 0' }}>
              <Link to="/planos" style={styles.generateButton}>Conhecer os planos</Link>
              <button type="button" style={styles.savePreferencesButton} onClick={() => void refreshArtemisAccess()}>Verificar meu acesso novamente</button>
            </div>
            <ArtemisChat userId={userId} exerciseCatalog={exerciseCatalog} disabled onAccessChanged={() => {}} />
          </section>
        </main>
      </div>
    );
  }

  return (
    <div style={styles.appContainer}>
      {/* 1. Navbar Superior */}
      <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />

      {/* 2. Conteúdo do Dashboard (Layout em Grid idêntico à imagem) */}
      <main className="ia-dashboard" style={styles.dashboardGrid}>
        
        {/* ================= COLUNA ESQUERDA ================= */}
        <section style={styles.leftColumn}>
          
          {/* Banner Principal: SEU TREINO, INTELIGÊNCIA ARTIFICIAL */}
          <div className="ia-hero" style={styles.heroCard}>
            <div style={styles.heroContent}>
              <span style={styles.heroTag}>— TREINO IA</span>
              <h1 style={styles.heroTitle}>
                SEU TREINO,<br />
                <span style={styles.heroGradient}>INTELIGÊNCIA ARTIFICIAL.</span>
              </h1>
              <p style={styles.heroDesc}>
                A IA usa seus dados e preferências para criar um treino personalizado para você.
              </p>
              {artemisAccess.status === 'free' && (
                <p role="status" style={{ color: '#a5f3fc', fontSize: '13px', fontWeight: 700 }}>
                  Você tem uma utilização gratuita da Artemis nesta conta.
                </p>
              )}
              {artemisAccess.status === 'premium' && (
                <p role="status" style={{ color: '#a5f3fc', fontSize: '13px', fontWeight: 700 }}>
                  Seu acesso premium à Artemis está ativo.
                </p>
              )}
              {artemisAccess.status === 'busy' && (
                <p role="status" style={{ color: '#fde68a', fontSize: '13px', fontWeight: 700 }}>
                  Uma interação da Artemis já está em andamento nesta conta. Aguarde ou verifique o acesso novamente.
                  <button type="button" onClick={() => void refreshArtemisAccess()} style={styles.savePreferencesButton}>Verificar novamente</button>
                </p>
              )}
              {artemisAccess.status === 'error' && (
                <p role="alert" style={{ color: '#fde68a', fontSize: '13px' }}>
                  {artemisAccess.error || 'Não foi possível verificar o acesso agora. O servidor continuará validando sua autorização antes de cada resposta.'}
                  <button type="button" onClick={() => void refreshArtemisAccess()} style={styles.savePreferencesButton}>Tentar novamente</button>
                </p>
              )}

              <div style={styles.heroFeatures}>
                <div style={styles.featureBadge}>
                  <span style={styles.featureIcon}>🛡️</span>
                  <div>
                    <div style={styles.featureTitle}>Personalizado</div>
                    <div style={styles.featureSub}>Para o seu objetivo</div>
                  </div>
                </div>

                <div style={styles.featureBadge}>
                  <span style={styles.featureIcon}>🛡️</span>
                  <div>
                    <div style={styles.featureTitle}>Seguro</div>
                    <div style={styles.featureSub}>Com base nas suas preferências</div>
                  </div>
                </div>

                <div style={styles.featureBadge}>
                  <span style={styles.featureIcon}>📈</span>
                  <div>
                    <div style={styles.featureTitle}>Evolutivo</div>
                    <div style={styles.featureSub}>Ajusta conforme seu progresso</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <ArtemisChat
            userId={userId}
            exerciseCatalog={exerciseCatalog}
            disabled={artemisAccess.status === 'busy' || isGeneratingWorkout}
            onAccessChanged={refreshArtemisAccess}
          />

          {/* Passo 1: Informe seus dados (Selects em linha) */}
          <div style={styles.sectionCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>1</span>
              <span style={styles.stepTitleText}>PREFERÊNCIAS PARA SEU TREINO</span>
            </div>

            <div className="ia-inputs-grid" style={styles.inputsGrid}>
              <div>
                <label style={styles.inputLabel}>Objetivo</label>
                <select value={preferences.objective} onChange={(event) => updatePreference('objective', event.target.value)} style={styles.selectInput}>
                  <option value="">Selecione seu objetivo</option>
                  <option>Emagrecer</option>
                  <option>Ganhar massa muscular</option>
                  <option>Melhorar o condicionamento</option>
                  <option>Aumentar força</option>
                  <option>Ter mais saúde e disposição</option>
                  <option>Manter a forma</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Nível de experiência</label>
                <select value={preferences.experience_level} onChange={(event) => updatePreference('experience_level', event.target.value)} style={styles.selectInput}>
                  <option value="">Selecione seu nível</option>
                  <option>Iniciante</option>
                  <option>Intermediário</option>
                  <option>Avançado</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Tempo disponível</label>
                <select value={preferences.available_time} onChange={(event) => updatePreference('available_time', event.target.value)} style={styles.selectInput}>
                  <option value="">Selecione o tempo</option>
                  <option>Até 30 minutos</option>
                  <option>30-60 minutos</option>
                  <option>Mais de 60 minutos</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Frequência semanal</label>
                <select value={preferences.weekly_frequency} onChange={(event) => updatePreference('weekly_frequency', event.target.value)} style={styles.selectInput}>
                  <option value="">Selecione a frequência</option>
                  <option>1 vez por semana</option>
                  <option>2 vezes por semana</option>
                  <option>3 vezes por semana</option>
                  <option>4 vezes por semana</option>
                  <option>5 vezes por semana</option>
                  <option>6 vezes por semana</option>
                  <option>7 vezes por semana</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Local de treino</label>
                <select value={preferences.training_location} onChange={(event) => updatePreference('training_location', event.target.value)} style={styles.selectInput}>
                  <option value="">Selecione o local</option>
                  <option>Em casa</option>
                  <option>Na academia</option>
                  <option>Ao ar livre</option>
                  <option>Em casa e na academia</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Equipamentos</label>
                <select value={preferences.equipment} onChange={(event) => updatePreference('equipment', event.target.value)} style={styles.selectInput}>
                  <option value="">Selecione os equipamentos</option>
                  <option>Academia completa</option>
                  <option>Halteres em casa</option>
                  <option>Peso corporal</option>
                  <option>Elásticos</option>
                  <option>Sem equipamento</option>
                </select>
              </div>
            </div>

            <fieldset style={styles.trainingPreferences}>
              <legend style={styles.inputLabel}>Tipos de treino que você procura</legend>
              <div className="ia-training-options">
                {trainingOptions.map((training) => (
                  <label key={training} style={styles.trainingOption}>
                    <input
                      type="checkbox"
                      checked={preferences.training_preferences.includes(training)}
                      onChange={() => updatePreference('training_preferences', preferences.training_preferences.includes(training)
                        ? preferences.training_preferences.filter((item) => item !== training)
                        : [...preferences.training_preferences, training])}
                    />
                    {training}
                  </label>
                ))}
              </div>
            </fieldset>

            <fieldset style={styles.trainingPreferences}>
              <legend style={styles.inputLabel}>Dias de treino ({selectedTrainingDays.length}/7)</legend>
              <div className="ia-training-options">
                {weekDays.map((day, index) => {
                  const isSelected = selectedTrainingDays.includes(index);
                  return <button key={day} type="button" aria-pressed={isSelected} onClick={() => toggleTrainingDay(index)} style={{ ...styles.trainingDayButton, ...(isSelected ? styles.trainingDayButtonActive : {}) }}>{day}</button>;
                })}
              </div>
            </fieldset>

            {preferencesError && <p role="alert" style={{ color: '#fca5a5', fontSize: '13px' }}>{preferencesError}</p>}
            <button type="button" onClick={handleSavePreferences} disabled={isSavingPreferences || isGeneratingWorkout} style={styles.savePreferencesButton}>
              {isSavingPreferences ? 'Salvando...' : 'Salvar preferências'}
            </button>
          </div>

          {/* Passo 2: Gerar meu treino */}
          <div style={styles.sectionCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>2</span>
              <span style={styles.stepTitleText}>GERAR MEU TREINO</span>
            </div>

            <div className="ia-generate-row" style={styles.generateRow}>
              <button
                type="button"
                style={styles.generateButton}
                onClick={handleGenerateWorkout}
                disabled={isGeneratingWorkout || isSavingPreferences || artemisAccess.status === 'busy'}
                aria-busy={isGeneratingWorkout}
              >
                <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{isGeneratingWorkout ? 'Gerando treino...' : 'Gerar treino com IA'}</span>
                <span style={{ marginLeft: 'auto' }}>→</span>
              </button>

              <div style={styles.generateSubContainer}>
                <span style={{ color: '#00e0ff', fontSize: '16px' }}>⚡</span>
                <span style={styles.generateSubtext}>
                  Em poucos segundos, a IA vai criar<br />seu treino ideal com base nos seus dados.
                </span>
              </div>
            </div>
            {workoutError && <p role="alert" style={{ color: '#fca5a5', fontSize: '11px', marginBottom: 0 }}>{workoutError}</p>}
            {workoutSaveError && <p role="alert" style={{ color: '#fca5a5', fontSize: '13px', marginBottom: 0 }}>{workoutSaveError}</p>}
          </div>

          {/* Passo 3: Seu treino está pronto! */}
          <div style={styles.sectionCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>3</span>
              <span style={styles.stepTitleText}>SEU TREINO ESTÁ PRONTO!</span>
            </div>

            <div className="ia-ready-content" style={styles.readyCardContent}>
              <div style={styles.readyImageBox}>
                <div style={styles.cornerTL} />
                <div style={styles.cornerTR} />
                <div style={styles.cornerBL} />
                <div style={styles.cornerBR} />
                <span style={{ fontSize: '20px', marginBottom: '4px' }}>📸</span>
                <span style={{ color: '#00e0ff', fontSize: '11px', fontWeight: 600 }}>Espaço para imagem</span>
                <span style={{ color: '#64748b', fontSize: '9px' }}>(vídeo ou animação do treino)</span>
              </div>

              <div style={styles.readyInfoBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🤖</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>TREINO PERSONALIZADO</span>
                </div>
                <p style={{ fontFamily: '"Segoe UI", "Noto Sans", sans-serif', fontSize: '16px', color: '#dbe4f0', lineHeight: '1.7', margin: '0 0 14px 0', whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' }}>
                  {workout ? workout.split('\n').map((line, index, lines) => {
                    const exerciseLine = line.match(/^-\s+(.+?):\s(.*)$/);
                    const exercise = exerciseLine && findExerciseByName(exerciseLine[1], exerciseCatalog);
                    return (
                      <React.Fragment key={`${index}-${line}`}>
                        {exerciseLine ? (
                          <>
                            - {exercise ? <Link to={`/movimentos?exercise=${encodeURIComponent(exercise.id)}`} style={{ color: '#00e0ff', textDecoration: 'underline', textUnderlineOffset: '3px' }}>{exerciseLine[1]}</Link> : exerciseLine[1]}: {exerciseLine[2]}
                          </>
                        ) : line}
                        {index < lines.length - 1 && <br />}
                      </React.Fragment>
                    );
                  }) : 'Preencha seus dados e gere um treino personalizado com a Artemis.'}
                </p>
              </div>
            </div>
          </div>

        </section>


        {/* ================= COLUNA DIREITA (Sidebar) ================= */}
        <aside style={styles.rightColumn}>
          
          {/* Seu Progresso */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px' }}>📈</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>SEU PROGRESSO</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={styles.progressCircle}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#00e0ff' }}>0%</span>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Evolução no seu ritmo</div>
                <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.3' }}>Acompanhe seu progresso e veja seus resultados.</div>
              </div>
            </div>

            <div style={styles.progressStatItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>📋</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Treinos concluídos</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>0</span>
            </div>

            <div style={styles.progressStatItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>📅</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dias ativos</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>0</span>
            </div>

            <div style={styles.progressStatItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>⏱️</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tempo de treino</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>0 min</span>
            </div>

            <div style={{ ...styles.progressStatItem, borderBottom: 'none', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🔥</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Calorias queimadas</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>0 kcal</span>
            </div>
          </div>

          {/* Meta Atual */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>🎯</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>META ATUAL</span>
            </div>

            <div style={styles.metaImageBox}>
              <div style={styles.cornerTL} />
              <div style={styles.cornerTR} />
              <div style={styles.cornerBL} />
              <div style={styles.cornerBR} />
              <span style={{ fontSize: '20px', marginBottom: '4px' }}>📊</span>
              <span style={{ color: '#00e0ff', fontSize: '11px', fontWeight: 600 }}>Espaço para imagem</span>
              <span style={{ color: '#64748b', fontSize: '9px' }}>(gráfico ou indicador)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              <span>Sua meta: —</span>
              <span style={{ fontWeight: 700, color: '#00e0ff' }}>0%</span>
            </div>
            
            <div style={styles.progressBarBg}>
              <div style={styles.progressBarFill} />
            </div>
          </div>

          {/* Dicas da IA */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>💡</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>DICAS DA IA</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '18px', background: '#0c132c', padding: '6px', borderRadius: '8px', border: '1px solid rgba(0,162,255,0.2)' }}>🤖</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>Mantenha a constância!</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                  O progresso vem da repetição.<br />A IA está com você nessa jornada.
                </div>
              </div>
              <span style={{ color: '#64748b', fontSize: '12px', marginLeft: 'auto', alignSelf: 'center' }}>›</span>
            </div>
          </div>

        </aside>

      </main>
    </div>
  );
}

const styles = {
  appContainer: {
    width: '100%',
    minWidth: 0,
    minHeight: '100dvh',
    backgroundColor: '#050508',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
    overflowX: 'hidden'
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 340px)',
    gap: '20px',
    padding: '24px',
    maxWidth: '1450px',
    margin: '0 auto'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  heroCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr)',
    gap: '20px',
    alignItems: 'center',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  heroContent: {
    display: 'flex',
    flexDirection: 'column'
  },
  heroTag: {
    fontSize: '10px',
    color: '#00e0ff',
    fontWeight: 700,
    letterSpacing: '0.1em',
    marginBottom: '8px'
  },
  heroTitle: {
    fontSize: '24px',
    fontWeight: 900,
    lineHeight: '1.1',
    margin: '0 0 10px 0',
    letterSpacing: '-0.02em'
  },
  heroGradient: {
    background: 'linear-gradient(90deg, #00e0ff 0%, #0077ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  heroDesc: {
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.5',
    margin: '0 0 14px 0'
  },
  heroFeatures: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px'
  },
  featureBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 162, 255, 0.2)',
    padding: '6px 8px',
    borderRadius: '8px'
  },
  featureIcon: {
    fontSize: '13px'
  },
  featureTitle: {
    fontSize: '10px',
    fontWeight: 700,
    color: '#fff'
  },
  featureSub: {
    fontSize: '8px',
    color: '#64748b'
  },
  sectionCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px'
  },
  stepNumber: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#00e0ff',
    color: '#050508',
    fontSize: '11px',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepTitleText: {
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: '#e2e8f0'
  },
  inputsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: '10px'
  },
  inputLabel: {
    display: 'block',
    fontSize: '12px',
    color: '#94a3b8',
    marginBottom: '6px',
    fontWeight: 600
  },
  selectInput: {
    width: '100%',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.3)',
    borderRadius: '8px',
    padding: '9px 10px',
    color: '#fff',
    fontSize: '14px',
    outline: 'none',
    cursor: 'pointer'
  },
  trainingPreferences: {
    margin: '18px 0 0',
    padding: 0,
    border: 0,
  },
  trainingDayButton: {
    minWidth: '44px',
    minHeight: '40px',
    padding: '8px 12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: 'rgba(148, 163, 184, 0.35)',
    borderRadius: '8px',
    backgroundColor: '#0b0e1b',
    color: '#cbd5e1',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease',
  },
  trainingDayButtonActive: {
    borderColor: '#00e0ff',
    backgroundColor: '#00e0ff',
    color: '#082f36',
    boxShadow: '0 0 0 2px rgba(0, 224, 255, 0.2)',
  },
  trainingOption: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    minHeight: '42px',
    padding: '9px 12px',
    border: '1px solid rgba(148, 163, 184, 0.2)',
    borderRadius: '8px',
    backgroundColor: '#0b0e1b',
    color: '#e2e8f0',
    fontSize: '14px',
    cursor: 'pointer',
  },
  savePreferencesButton: {
    marginTop: '16px',
    border: 0,
    borderRadius: '8px',
    padding: '11px 16px',
    backgroundColor: '#67e8f9',
    color: '#082f36',
    fontSize: '14px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  generateRow: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: '20px'
  },
  generateButton: {
    flex: 1.2,
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(0, 224, 255, 0.4)'
  },
  generateSubContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1
  },
  generateSubtext: {
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.4'
  },
  readyCardContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '20px',
    alignItems: 'center'
  },
  readyImageBox: {
    position: 'relative',
    height: '110px',
    backgroundColor: '#04060b',
    borderRadius: '12px',
    border: '1px dashed rgba(0, 162, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  readyInfoBox: {
    display: 'flex',
    flexDirection: 'column'
  },
  secondaryButton: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 162, 255, 0.4)',
    color: '#fff',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '220px'
  },
  sideCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  progressCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: '3px solid rgba(0, 224, 255, 0.2)',
    borderTopColor: '#00e0ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0e1b'
  },
  progressStatItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid rgba(0, 100, 200, 0.1)'
  },
  metaImageBox: {
    position: 'relative',
    height: '100px',
    backgroundColor: '#04060b',
    borderRadius: '12px',
    border: '1px dashed rgba(0, 162, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px'
  },
  progressBarBg: {
    width: '100%',
    height: '6px',
    backgroundColor: '#0b0e1b',
    borderRadius: '3px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 100, 200, 0.2)'
  },
  progressBarFill: {
    width: '0%',
    height: '100%',
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    borderRadius: '3px'
  }
};