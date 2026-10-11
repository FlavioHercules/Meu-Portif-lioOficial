import { supabase } from '../lib/supabase';

const storageKey = (userId) => `motionfit:ai-workout:${userId}`;

function normalizeExerciseName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function findExerciseByName(name, exercises) {
  const normalizedName = normalizeExerciseName(name);
  if (!normalizedName) return null;
  return exercises.find((exercise) => normalizeExerciseName(exercise.name) === normalizedName) || null;
}

export function readAiWorkout(userId) {
  if (!userId) return null;

  try {
    const savedWorkout = JSON.parse(localStorage.getItem(storageKey(userId)) || 'null');
    return typeof savedWorkout?.content === 'string' ? savedWorkout : null;
  } catch {
    return null;
  }
}

function cacheAiWorkout(userId, workout) {
  if (!userId) return;

  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(workout));
  } catch {
    // A storage quota or browser privacy setting should not block workout generation.
  }
}

export async function saveArtemisMessage(userId, message) {
  if (!supabase || !userId) throw new Error('Não foi possível acessar o armazenamento da sua conta.');

  const { data, error } = await supabase
    .from('artemis_messages')
    .insert({ user_id: userId, ...message })
    .select('id, role, message_type, content, created_at')
    .single();

  if (error) throw error;
  return data;
}

export async function loadArtemisMessages(userId) {
  if (!supabase || !userId) return [];

  const { data, error } = await supabase
    .from('artemis_messages')
    .select('id, role, message_type, content, created_at')
    .eq('user_id', userId)
    .eq('message_type', 'chat')
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) throw error;
  return (data || []).reverse();
}

export async function loadAiWorkout(userId) {
  if (!supabase || !userId) return readAiWorkout(userId);

  const { data, error } = await supabase
    .from('artemis_messages')
    .select('content, created_at')
    .eq('user_id', userId)
    .eq('message_type', 'workout')
    .eq('role', 'assistant')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return readAiWorkout(userId);

  const workout = { content: data.content, createdAt: data.created_at };
  cacheAiWorkout(userId, workout);
  return workout;
}

export async function saveAiWorkout(userId, workout) {
  cacheAiWorkout(userId, workout);
  const savedWorkout = await saveArtemisMessage(userId, {
    role: 'assistant',
    message_type: 'workout',
    content: workout.content,
  });
  const persistedWorkout = { content: savedWorkout.content, createdAt: savedWorkout.created_at };
  cacheAiWorkout(userId, persistedWorkout);
  return persistedWorkout;
}

export function findExercisesInWorkout(content, exercises) {
  const normalizedContent = normalizeExerciseName(content);
  const matches = exercises
    .map((exercise) => ({ exercise, normalizedName: normalizeExerciseName(exercise.name) }))
    .filter(({ normalizedName }) => normalizedName && normalizedContent.includes(normalizedName))
    .sort((first, second) => second.normalizedName.length - first.normalizedName.length);

  return matches.reduce((selected, match) => {
    if (!selected.some(({ normalizedName }) => normalizedName.includes(match.normalizedName))) {
      selected.push(match);
    }
    return selected;
  }, []).map(({ exercise }) => exercise);
}