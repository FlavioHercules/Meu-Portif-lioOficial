import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import { supabase } from '../lib/supabase';
import { notifyWorkoutCompleted } from '../services/notifications';

const weekDays = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
const emptyResearch = {
  objective: '',
  training_preferences: [],
  experience_level: '',
  weekly_frequency: '',
  available_time: '',
  training_location: '',
  equipment: '',
};

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function currentTimestamp() {
  return new Date().toISOString();
}

async function runSupabaseQuery(query) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20000);
  try {
    return await query.abortSignal(controller.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

function startOfWeek(date) {
  const monday = new Date(date);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  return monday;
}

function sessionsPerWeek(frequency = '') {
  if (frequency.startsWith('1-2')) return 2;
  if (frequency.startsWith('3-4')) return 4;
  if (frequency.startsWith('5')) return 5;
  const match = frequency.match(/^(\d+) vez/);
  return match ? Number(match[1]) : 0;
}

function durationInMinutes(availableTime = '') {
  if (availableTime.startsWith('Até 30')) return 30;
  if (availableTime.includes('60')) return availableTime.startsWith('Mais') ? 60 : 45;
  return 45;
}

function scheduleIndexes(count) {
  const schedules = {
    1: [2],
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 5, 6],
  };
  return schedules[count] || [];
}

function routineTitles(count, preferences) {
  if (preferences.includes('Cardio') || preferences.includes('HIIT')) {
    const titles = Array.from({ length: count }, (_, index) => `Condicionamento ${String.fromCharCode(65 + index)}`);
    if (count === 7) titles[6] = 'Recuperação ativa';
    return titles;
  }
  if (count <= 2) return Array.from({ length: count }, (_, index) => `Corpo inteiro ${String.fromCharCode(65 + index)}`);
  if (count === 3) return ['Corpo inteiro A', 'Corpo inteiro B', 'Corpo inteiro C'];
  if (count === 4) return ['Membros superiores A', 'Membros inferiores A', 'Membros superiores B', 'Membros inferiores B'];
  return ['Empurrar', 'Puxar', 'Membros inferiores A', 'Membros superiores', 'Membros inferiores B', 'Mobilidade e recuperação', 'Recuperação ativa'].slice(0, count);
}

function normalizeValue(value = '') {
  return String(value ?? '').toLocaleLowerCase('pt-BR').normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function difficultyRank(value = '') {
  const normalized = normalizeValue(value);
  if (normalized.includes('avanc')) return 3;
  if (normalized.includes('inter')) return 2;
  return 1;
}

function allowedDifficulty(research) {
  if (Number(research.age) < 16) return 1;
  if (Number(research.age) < 18) return 2;
  const levelCap = difficultyRank(research.experience_level);
  const monthCap = Number(research.experience_months) < 3 ? 1 : Number(research.experience_months) < 12 ? 2 : 3;
  return Math.min(levelCap, monthCap);
}

function objectiveTags(objective = '') {
  const value = normalizeValue(objective);
  if (value.includes('emagrecer') || value.includes('composicao corporal')) return ['composicao_corporal', 'condicionamento', 'resistencia'];
  if (value.includes('massa')) return ['hipertrofia', 'forca'];
  if (value.includes('forca')) return ['forca'];
  if (value.includes('condicionamento')) return ['condicionamento', 'resistencia'];
  if (value.includes('saude') || value.includes('manter')) return ['saude', 'condicionamento', 'forca', 'mobilidade'];
  return [];
}

function equipmentMatches(exercise, research) {
  const options = (exercise.equipment_options || []).map(normalizeValue);
  const summary = normalizeValue(exercise.equipment);
  const isBodyweight = options.some((item) => item.includes('peso corporal')) || summary.includes('peso corporal');
  const isDumbbell = options.some((item) => item.includes('halter')) || summary.includes('halter');
  const isBand = options.some((item) => item.includes('elastic')) || summary.includes('elastic');
  const available = normalizeValue(research.equipment);

  if (available.includes('academia completa')) return true;
  if (available.includes('halteres')) return isBodyweight || isDumbbell || isBand;
  if (available.includes('elastico')) return isBodyweight || isBand;
  if (available.includes('peso corporal') || available.includes('sem equipamento')) return isBodyweight;
  return true;
}

function locationMatches(exercise, location = '') {
  const modality = normalizeValue(exercise.modality);
  const place = normalizeValue(location);
  if (!place || place.includes('casa e academia')) return true;
  if (place.includes('casa')) return !modality.includes('academia') || modality.includes('calistenia') || modality.includes('mobilidade');
  if (place.includes('ao ar livre')) return ['calistenia', 'cardio', 'mobilidade'].some((item) => modality.includes(item));
  return true;
}

function limitationMatches(exercise, limitations = []) {
  const name = normalizeValue(exercise.name);
  const pattern = normalizeValue(exercise.movement_pattern);
  const impact = normalizeValue(exercise.impact_level);
  const values = limitations.map(normalizeValue);
  if (!values.length || values.includes('nenhuma')) return true;

  if (values.includes('joelho') && (impact === 'alto' || /salto|jump|sprint|corrida|pistol|nordic|passada|afundo|bulgarian/.test(name))) return false;
  if (values.includes('coluna') && (/terra|stiff|good morning|ab wheel|front lever/.test(name) || pattern.includes('hinge') || impact === 'alto')) return false;
  if (values.includes('ombro') && /supino|press|handstand|pike|dips|paralela|planche|flexao/.test(name)) return false;
  if (values.includes('punho ou cotovelo') && /flexao|push-up|planche|handstand|prancha|paralela|dips/.test(name)) return false;
  if (values.includes('outra limitacao') && (impact === 'alto' || difficultyRank(exercise.difficulty) > 1)) return false;
  return true;
}

function focusCategories(title) {
  const value = normalizeValue(title);
  if (value.includes('condicionamento')) return ['cardio'];
  if (value.includes('recuperacao')) return ['mobilidade'];
  if (value.includes('inferiores')) return ['pernas e gluteos'];
  if (value.includes('empurrar')) return ['peito', 'ombros', 'triceps'];
  if (value.includes('puxar')) return ['costas', 'biceps'];
  if (value.includes('superiores')) return ['peito', 'costas', 'ombros', 'biceps', 'triceps'];
  return ['pernas e gluteos', 'peito', 'costas', 'ombros', 'core'];
}

function preferenceMatches(exercise, preferences = []) {
  if (!preferences.length) return true;
  const modality = normalizeValue(exercise.modality);
  const category = normalizeValue(exercise.category);
  return preferences.some((preference) => {
    const value = normalizeValue(preference);
    if (value === 'hiit' || value === 'cardio') return category.includes('cardio');
    if (value === 'mobilidade') return category.includes('mobilidade');
    if (value === 'musculacao') return modality.includes('academia') && !category.includes('cardio') && !category.includes('mobilidade');
    if (value === 'funcional' || value === 'esportes') return ['cardio', 'core', 'pernas e gluteos'].some((item) => category.includes(item));
    return true;
  });
}

function buildExercisePlan(research, title, catalog) {
  const objectives = objectiveTags(research.objective);
  const maxDifficulty = allowedDifficulty(research);
  const preferredCategories = focusCategories(title);
  const safeAvailable = catalog.filter((exercise) => {
    return difficultyRank(exercise.difficulty) <= maxDifficulty
      && equipmentMatches(exercise, research)
      && locationMatches(exercise, research.training_location)
      && limitationMatches(exercise, research.limitations);
  });
  const objectiveMatches = (exercise) => {
    const exerciseObjectives = exercise.objectives || [];
    return !objectives.length || !exerciseObjectives.length || exerciseObjectives.some((tag) => objectives.includes(normalizeValue(tag)));
  };
  const byObjective = safeAvailable.filter(objectiveMatches);
  const byPreference = byObjective.filter((exercise) => preferenceMatches(exercise, research.training_preferences));
  const eligible = byPreference.length >= 3 ? byPreference : byObjective.length >= 3 ? byObjective : safeAvailable;
  const ordered = [...eligible].sort((first, second) => {
    const firstFocus = preferredCategories.some((category) => normalizeValue(first.category).includes(category)) ? 0 : 1;
    const secondFocus = preferredCategories.some((category) => normalizeValue(second.category).includes(category)) ? 0 : 1;
    return firstFocus - secondFocus || first.name.localeCompare(second.name, 'pt-BR');
  });
  const selected = [];
  const usedMuscles = new Set();
  for (const exercise of ordered) {
    const primaryMuscle = normalizeValue(exercise.muscles?.[0] || exercise.muscle_group || exercise.category);
    if (usedMuscles.has(primaryMuscle) && selected.length < 4) continue;
    selected.push(exercise);
    usedMuscles.add(primaryMuscle);
    if (selected.length === 6) break;
  }

  const sets = maxDifficulty === 1 ? 2 : 3;
  const strengthFocus = objectives.includes('forca') && !objectives.includes('hipertrofia');
  return selected.map((exercise) => ({
    id: exercise.id,
    name: exercise.name,
    category: exercise.category,
    difficulty: exercise.difficulty,
    equipment: exercise.equipment,
    muscles: exercise.muscles,
    instructions: exercise.instructions,
    video_url: exercise.video_url,
    demo_image_url: exercise.demo_image_url,
    progressions: exercise.progressions,
    regressions: exercise.regressions,
    sets,
    reps: strengthFocus ? '5-8' : exercise.modality === 'Cardio' ? '8-15 min' : '8-12',
    rest_seconds: strengthFocus ? 120 : 60,
  }));
}

export default function Home({ userId, pesquisa, onPesquisaChange, onEditResearch, onOpenNotif, onOpenConfig }) {
  const [today] = useState(() => new Date());
  const [draft] = useState(() => ({
    ...emptyResearch,
    ...pesquisa,
    training_preferences: pesquisa?.training_preferences || [],
  }));
  const [sessions, setSessions] = useState([]);
  const [exerciseCatalog, setExerciseCatalog] = useState([]);
  const [activeDay, setActiveDay] = useState(weekDays[(today.getDay() + 6) % 7]);
  const [selectedTrainingDays, setSelectedTrainingDays] = useState(() => scheduleIndexes(sessionsPerWeek(pesquisa?.weekly_frequency)));
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCompleting, setIsCompleting] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadSessions = async () => {
      const allSessions = [];
      let page = 0;
      try {
        const { data: catalog, error: catalogError } = await runSupabaseQuery(supabase
          .from('exercises')
          .select('id, name, category, muscle_group, equipment, equipment_options, difficulty, modality, objectives, muscles, movement_pattern, unilateral, impact_level, instructions, progressions, regressions, video_url, demo_image_url')
          .order('name')
          .limit(1000));

        if (!isActive) return;
        if (catalogError) throw catalogError;
        setExerciseCatalog(catalog || []);

        while (isActive) {
          const { data, error } = await runSupabaseQuery(supabase
            .from('workout_sessions')
            .select('id, status, scheduled_for, workout_title, duration_min, completed_at, plan_inputs')
            .eq('user_id', userId)
            .order('scheduled_for', { ascending: false, nullsFirst: false })
            .range(page * 500, page * 500 + 499));

          if (error) throw error;
          allSessions.push(...(data || []));
          if ((data || []).length < 500) break;
          page += 1;
        }
      } catch (error) {
        if (isActive) {
          const message = error?.name === 'AbortError'
            ? 'A conexão com o Supabase demorou demais. Verifique a internet e tente novamente.'
            : 'Não foi possível carregar catálogo e rotina. Confirme se as migrações foram aplicadas e tente novamente.';
          setErrorMessage(message);
        }
      } finally {
        if (isActive) {
          setSessions(allSessions);
          setIsLoading(false);
        }
      }
    };

    loadSessions();
    return () => {
      isActive = false;
    };
  }, [userId]);

  const persistResearch = async () => {
    const { data, error } = await runSupabaseQuery(supabase
      .from('pesquisa')
      .upsert({
        user_id: userId,
        objective: draft.objective,
        training_preferences: draft.training_preferences,
        experience_level: draft.experience_level,
        age: pesquisa.age,
        experience_months: pesquisa.experience_months,
        limitations: pesquisa.limitations || [],
        gender: pesquisa.gender,
        height_cm: pesquisa.height_cm,
        weight_kg: pesquisa.weight_kg,
        weekly_frequency: draft.weekly_frequency,
        available_time: draft.available_time,
        training_location: draft.training_location,
        equipment: draft.equipment,
      }, { onConflict: 'user_id' })
      .select()
      .single());

    if (error) {
      setErrorMessage('Não foi possível salvar as preferências.');
      return null;
    }

    onPesquisaChange(data);
    return data;
  };

  const handleGenerateRoutine = async () => {
    const count = sessionsPerWeek(draft.weekly_frequency);
    if (!draft.objective || !draft.experience_level || !draft.weekly_frequency || !draft.available_time || !draft.equipment) {
      setErrorMessage('Complete as preferências antes de montar sua rotina.');
      return;
    }
    if (count === 0) {
      setErrorMessage('Selecione uma frequência semanal válida na pesquisa do perfil.');
      return;
    }
    if (selectedTrainingDays.length !== count) {
      setErrorMessage(`Selecione ${count} ${count === 1 ? 'dia' : 'dias'} para sua frequência semanal.`);
      return;
    }

    setIsGenerating(true);
    setErrorMessage('');
    setSuccessMessage('');
    try {
    const savedResearch = await persistResearch();
    if (!savedResearch) {
      return;
    }

    const monday = startOfWeek(new Date());
    const weekStart = toDateKey(monday);
    const weekEndDate = new Date(monday);
    weekEndDate.setDate(weekEndDate.getDate() + 6);
    const weekEnd = toDateKey(weekEndDate);
    const indexes = [...selectedTrainingDays].sort((first, second) => first - second);
    const titles = routineTitles(count, draft.training_preferences);
    const planInputs = {
      objective: draft.objective,
      training_preferences: draft.training_preferences,
      experience_level: draft.experience_level,
      weekly_frequency: draft.weekly_frequency,
      available_time: draft.available_time,
      training_location: draft.training_location,
      equipment: draft.equipment,
      age: pesquisa.age,
      experience_months: pesquisa.experience_months,
      limitations: pesquisa.limitations || [],
      gender: pesquisa.gender,
      height_cm: pesquisa.height_cm,
      weight_kg: pesquisa.weight_kg,
    };
    const sessionsToInsert = indexes.map((dayIndex, index) => {
      const scheduledDate = new Date(monday);
      scheduledDate.setDate(scheduledDate.getDate() + dayIndex);
      return {
        user_id: userId,
        status: 'planned',
        scheduled_for: toDateKey(scheduledDate),
        workout_title: titles[index],
        duration_min: durationInMinutes(draft.available_time),
        plan_inputs: {
          ...planInputs,
          source: 'home',
          training_day: weekDays[dayIndex],
          exercise_plan: buildExercisePlan({ ...draft, ...pesquisa }, titles[index], exerciseCatalog),
        },
      };
    });

    if (exerciseCatalog.length === 0 || sessionsToInsert.some((session) => session.plan_inputs.exercise_plan.length < 3)) {
      setErrorMessage(exerciseCatalog.length === 0
        ? 'O catálogo de exercícios está vazio. Execute a migração do catálogo no Supabase e tente novamente.'
        : 'Não encontramos exercícios suficientes e compatíveis com seu perfil. Revise equipamento, local e limitações.');
      return;
    }

    const { error: deleteError } = await runSupabaseQuery(supabase
      .from('workout_sessions')
      .delete()
      .eq('user_id', userId)
      .eq('status', 'planned')
      .or('plan_inputs->>source.eq.home,plan_inputs->>source.is.null')
      .gte('scheduled_for', weekStart)
      .lte('scheduled_for', weekEnd));

    if (deleteError) {
      setErrorMessage('Não foi possível atualizar as sessões desta semana.');
      return;
    }

    const { data, error } = await runSupabaseQuery(supabase
      .from('workout_sessions')
      .insert(sessionsToInsert)
      .select('id, status, scheduled_for, workout_title, duration_min, completed_at, plan_inputs'));

    if (error) {
      setErrorMessage('Não foi possível criar a rotina. Confirme se a migração de sessões foi aplicada no Supabase.');
      return;
    }

    setSessions((current) => [
      ...current.filter((session) => !(session.status === 'planned' && session.scheduled_for >= weekStart && session.scheduled_for <= weekEnd)),
      ...(data || []),
    ]);
    setSuccessMessage('Treinos personalizados gerados com seus objetivos, experiência, equipamentos e limitações.');
    } catch (error) {
      setErrorMessage(error?.name === 'AbortError'
        ? 'A conexão com o Supabase expirou. Verifique a internet e tente novamente.'
        : `Não foi possível preparar o treino: ${error?.message || 'erro inesperado'}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCompleteSession = async (session) => {
    setIsCompleting(session.id);
    setErrorMessage('');
    const { data, error } = await supabase
      .from('workout_sessions')
      .update({ status: 'completed', completed_at: currentTimestamp() })
      .eq('id', session.id)
      .eq('user_id', userId)
      .select('id, status, scheduled_for, workout_title, duration_min, completed_at, plan_inputs')
      .single();

    if (error) {
      setErrorMessage('Não foi possível registrar a conclusão do treino.');
    } else {
      setSessions((current) => current.map((item) => item.id === data.id ? data : item));
      try {
        await notifyWorkoutCompleted(userId, session);
      } catch {
        setErrorMessage('Treino concluído, mas não foi possível criar a notificação.');
      }
    }
    setIsCompleting(null);
  };

  const monday = startOfWeek(today);
  const selectedDayIndex = weekDays.indexOf(activeDay);
  const selectedDate = new Date(monday);
  selectedDate.setDate(selectedDate.getDate() + selectedDayIndex);
  const selectedDateKey = toDateKey(selectedDate);
  const selectedSessions = sessions.filter((session) => session.scheduled_for === selectedDateKey);
  const completedSessions = sessions.filter((session) => session.status === 'completed');
  const totalMinutes = completedSessions.reduce((total, session) => total + (session.duration_min || 0), 0);
  const activeDays = new Set(completedSessions.map((session) => session.completed_at?.slice(0, 10) || session.scheduled_for).filter(Boolean)).size;
  const weekStartKey = toDateKey(monday);
  const weekEndDate = new Date(monday);
  weekEndDate.setDate(weekEndDate.getDate() + 6);
  const weekEndKey = toDateKey(weekEndDate);
  const completedThisWeek = completedSessions.filter((session) => {
    const completedDate = session.completed_at?.slice(0, 10) || session.scheduled_for;
    return completedDate >= weekStartKey && completedDate <= weekEndKey;
  }).length;
  const weeklyTarget = sessionsPerWeek(draft.weekly_frequency);
  const weeklyProgress = weeklyTarget ? Math.min(100, Math.round((completedThisWeek / weeklyTarget) * 100)) : 0;
  const selectedDateLabel = selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  return (
    <div className="min-h-screen bg-[#050508] text-white">
      <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />
      <main className="home-dashboard mx-auto grid w-full max-w-[1400px] gap-4 p-4 md:p-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="home-primary-stack space-y-5">
          <header className="home-overview grid gap-5 rounded-2xl border border-slate-800 bg-[#070913] p-5 md:grid-cols-[minmax(0,1fr)_300px] md:items-center md:p-6">
            <div>
              <p className="mb-2 text-xs font-semibold text-cyan-200">PAINEL DE TREINO</p>
              <h1 className="text-2xl font-bold tracking-normal">Sua rotina, em um só lugar.</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">Acompanhe a semana, veja o treino do dia e ajuste sua rotina quando precisar.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-800 bg-[#0b0e1b] p-4 text-sm sm:grid-cols-3">
              <div><div className="text-xs text-slate-500">Objetivo</div><div className="mt-1 font-semibold">{pesquisa?.objective || 'Não informado'}</div></div>
              <div><div className="text-xs text-slate-500">Sexo</div><div className="mt-1 font-semibold">{pesquisa?.gender || 'Não informado'}</div></div>
              <div><div className="text-xs text-slate-500">Idade</div><div className="mt-1 font-semibold">{pesquisa?.age ? `${pesquisa.age} anos` : 'Não informada'}</div></div>
              <div><div className="text-xs text-slate-500">Altura</div><div className="mt-1 font-semibold">{pesquisa?.height_cm ? `${pesquisa.height_cm} cm` : 'Não informada'}</div></div>
              <div><div className="text-xs text-slate-500">Peso</div><div className="mt-1 font-semibold">{pesquisa?.weight_kg ? `${pesquisa.weight_kg} kg` : 'Não informado'}</div></div>
              <button type="button" onClick={onEditResearch} className="col-span-2 rounded-xl border border-cyan-500/30 px-3 py-2 text-xs font-bold text-cyan-200 transition hover:bg-cyan-400/10 sm:col-span-3">Editar pesquisa do perfil</button>
            </div>
          </header>

          <section className="home-preferences rounded-xl border border-slate-800 bg-[#070913] p-5 md:p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-cyan-200">PREFERÊNCIAS DO TREINO</p>
                <h2 className="mt-1 text-lg font-bold">{draft.objective || 'Personalize seu treino'}</h2>
                <p className="mt-1 text-sm text-slate-400">
                  {[draft.experience_level, draft.weekly_frequency, draft.available_time].filter(Boolean).join(' · ') || 'Defina seu objetivo, disponibilidade e equipamentos na área da Artemis.'}
                </p>
              </div>
              <Link to="/ia" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-cyan-400/30 px-4 py-2 text-sm font-semibold text-cyan-200 transition hover:bg-cyan-400/10">
                Editar na área da Artemis
              </Link>
            </div>
          </section>

          <section className="home-generator rounded-xl border border-cyan-300/20 bg-[#070913] p-5 md:p-6">
            <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-300">Recomendação personalizada</p><h2 className="mt-1 text-lg font-bold">Gerar meu treino</h2><p className="mt-1 text-xs text-slate-500">A seleção usa seu objetivo, nível, experiência, local, equipamentos e limitações.</p></div>
            <fieldset className="mb-4">
              <legend className="mb-2 text-xs font-semibold text-slate-300">Dias de treino ({selectedTrainingDays.length}/{weeklyTarget || 0})</legend>
              <div className="grid grid-cols-7 gap-1">
                {weekDays.map((day, index) => {
                  const isSelected = selectedTrainingDays.includes(index);
                  return <button key={day} type="button" aria-pressed={isSelected} onClick={() => setSelectedTrainingDays((current) => isSelected ? current.filter((item) => item !== index) : [...current, index].sort((first, second) => first - second))} className={`min-h-10 text-xs font-bold transition ${isSelected ? 'bg-cyan-400 text-slate-950' : 'bg-[#0b0e1b] text-slate-400 hover:text-white'}`}>{day}</button>;
                })}
              </div>
            </fieldset>
            <button type="button" disabled={isGenerating || isLoading} onClick={handleGenerateRoutine} className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-700 px-4 py-3 text-sm font-bold text-white transition hover:brightness-110 disabled:cursor-wait disabled:opacity-50 sm:w-auto">{isGenerating ? 'Preparando treino...' : 'Gerar rotina semanal'}</button>
            {errorMessage && <p role="alert" className="mt-3 text-sm text-rose-300">{errorMessage}</p>}
            {successMessage && <p role="status" className="mt-3 text-sm text-emerald-300">{successMessage}</p>}
          </section>

          <section className="home-stats grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-[#070913] p-4"><div className="text-[10px] font-bold uppercase text-slate-500">Treinos concluídos</div><div className="mt-2 text-2xl font-black">{completedSessions.length}</div></div>
            <div className="rounded-2xl border border-slate-800 bg-[#070913] p-4"><div className="text-[10px] font-bold uppercase text-slate-500">Dias ativos</div><div className="mt-2 text-2xl font-black">{activeDays}</div></div>
            <div className="rounded-2xl border border-slate-800 bg-[#070913] p-4"><div className="text-[10px] font-bold uppercase text-slate-500">Tempo registrado</div><div className="mt-2 text-2xl font-black">{totalMinutes} min</div></div>
          </section>
        </section>

        <aside className="home-sidebar-stack space-y-4">
          <section className="home-progress rounded-xl border border-slate-800 bg-[#070913] p-5">
            <div className="mb-4 flex items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Acompanhamento</p><h2 className="mt-1 font-bold">Meta semanal</h2></div><span className="text-xl font-black text-cyan-300">{weeklyProgress}%</span></div>
            <div className="h-2 overflow-hidden bg-slate-900"><div className="h-full bg-cyan-400 transition-all" style={{ width: `${weeklyProgress}%` }} /></div>
            <p className="mt-3 text-xs text-slate-400">{completedThisWeek} de {weeklyTarget || 0} treinos concluídos nesta semana.</p>
          </section>

          <section className="home-agenda rounded-xl border border-slate-800 bg-[#070913] p-5">
            <div className="mb-4 flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Agenda</p><h2 className="mt-1 font-bold">Sua rotina</h2></div><span className="text-xs text-slate-500">{isLoading ? 'Carregando' : 'Esta semana'}</span></div>
            <div className="mb-4 grid grid-cols-7 gap-1">
              {weekDays.map((day, index) => {
                const date = new Date(monday);
                date.setDate(date.getDate() + index);
                const hasSession = sessions.some((session) => session.scheduled_for === toDateKey(date));
                return <button key={day} type="button" aria-pressed={activeDay === day} onClick={() => setActiveDay(day)} className={`relative py-2 text-[11px] font-bold ${activeDay === day ? 'bg-cyan-400 text-slate-950' : 'bg-[#0b0e1b] text-slate-400 hover:text-white'}`}>{day}{hasSession && <span className={`absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${activeDay === day ? 'bg-slate-950' : 'bg-cyan-400'}`} />}</button>;
              })}
            </div>
            <p className="mb-3 text-xs capitalize text-slate-500">{selectedDateLabel}</p>
            {selectedSessions.length ? selectedSessions.map((session) => (
              <article key={session.id} className="mb-2 rounded-xl border border-slate-800 bg-[#0b0e1b] p-3 last:mb-0">
                <div className="flex items-start justify-between gap-3">
                  <div><h3 className="text-sm font-bold">{session.workout_title || 'Treino planejado'}</h3><p className="mt-1 text-xs text-slate-500">{session.duration_min || 0} min · {session.status === 'completed' ? 'Concluído' : 'Planejado'}</p></div>
                  {session.status === 'planned' && <button type="button" disabled={isCompleting === session.id} onClick={() => handleCompleteSession(session)} className="shrink-0 border border-cyan-500/40 px-2 py-1.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-400/10 disabled:opacity-50">{isCompleting === session.id ? '...' : 'Concluir'}</button>}
                  {session.status === 'completed' && <span aria-label="Treino concluído" className="text-emerald-300">✓</span>}
                </div>
                {session.plan_inputs?.exercise_plan?.length > 0 && (
                  <div className="mt-3 space-y-3 border-t border-slate-800 pt-3">
                    {session.plan_inputs.exercise_plan.map((exercise, index) => (
                      <article key={`${exercise.id || exercise.name}-${index}`} className="rounded-xl border border-slate-800 bg-[#070913] p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h4 className="text-xs font-bold">{exercise.name}</h4>
                          <span className="rounded-full bg-slate-800 px-2 py-1 text-[10px] text-slate-200">{exercise.sets} × {exercise.reps} · {exercise.rest_seconds}s</span>
                        </div>
                        {exercise.video_url && <video controls playsInline preload="metadata" poster={exercise.demo_image_url || undefined} className="mt-3 aspect-video w-full rounded-lg bg-black object-cover" aria-label={`Demonstração de ${exercise.name}`}><source src={exercise.video_url} />Seu navegador não suporta vídeos HTML5.</video>}
                        {exercise.instructions?.length > 0 && <details className="mt-2 text-[11px] text-slate-400"><summary className="cursor-pointer font-semibold text-cyan-300">Como executar</summary><ol className="mt-2 list-inside list-decimal space-y-1">{exercise.instructions.map((instruction, instructionIndex) => <li key={`${instructionIndex}-${instruction}`}>{instruction}</li>)}</ol></details>}
                      </article>
                    ))}
                  </div>
                )}
              </article>
            )) : <p className="border border-dashed border-slate-800 p-4 text-xs leading-5 text-slate-500">Nenhum treino planejado para este dia. Monte uma rotina semanal para preencher sua agenda.</p>}
          </section>

          <section className="home-next rounded-xl border border-slate-800 bg-[#070913] p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">Próxima etapa</p>
            <h2 className="mt-2 font-bold">Dados prontos para personalização</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">Objetivo, experiência, disponibilidade, equipamentos e dados do perfil ficam salvos para orientar a futura integração com IA.</p>
            <Link to="/ia" className="mt-4 inline-flex border border-cyan-500/40 px-3 py-2 text-xs font-bold text-cyan-200 hover:bg-cyan-400/10">Abrir área de treino IA</Link>
          </section>
        </aside>
      </main>
    </div>
  );
}