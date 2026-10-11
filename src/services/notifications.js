import { supabase } from '../lib/supabase';

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDateOffset(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export async function createWorkoutReminders(userId) {
  const today = new Date();
  const todayKey = toDateKey(today);
  const startDateKey = toDateKey(getDateOffset(today, -7));
  const { data: sessions, error: sessionsError } = await supabase
    .from('workout_sessions')
    .select('id, scheduled_for, workout_title, duration_min')
    .eq('user_id', userId)
    .eq('status', 'planned')
    .gte('scheduled_for', startDateKey)
    .lte('scheduled_for', todayKey);

  if (sessionsError) throw sessionsError;
  if (!sessions?.length) return;

  const reminders = sessions.map((session) => {
    const isToday = session.scheduled_for === todayKey;
    const workoutTitle = session.workout_title || 'seu treino';
    const duration = session.duration_min ? ` Reserve cerca de ${session.duration_min} minutos.` : '';
    const dateLabel = new Date(`${session.scheduled_for}T12:00:00`).toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'long',
    });

    return {
      user_id: userId,
      workout_session_id: session.id,
      source_key: `workout-reminder:${session.id}`,
      category: 'Treinos',
      icon: isToday ? '🏋️' : '⏰',
      title: isToday ? 'Seu treino é hoje' : 'Treino pendente',
      description: isToday
        ? `${workoutTitle} está na sua agenda para hoje.${duration} Abra a MotionFit para começar.`
        : `${workoutTitle}, marcado para ${dateLabel}, ainda está como planejado.${duration} Retome ou reorganize sua agenda na MotionFit.`,
    };
  });

  const { error } = await supabase
    .from('notifications')
    .upsert(reminders, { onConflict: 'user_id,source_key', ignoreDuplicates: true });

  if (error) throw error;
}

export async function notifyWorkoutCompleted(userId, workout) {
  const reminderKey = `workout-reminder:${workout.id}`;
  const { error: reminderError } = await supabase
    .from('notifications')
    .delete()
    .eq('user_id', userId)
    .eq('source_key', reminderKey);

  if (reminderError) throw reminderError;

  const duration = workout.duration_min ? ` em ${workout.duration_min} minutos` : '';
  const { error } = await supabase
    .from('notifications')
    .upsert({
      user_id: userId,
      workout_session_id: workout.id,
      source_key: `workout-completed:${workout.id}`,
      category: 'Treinos',
      icon: '✅',
      title: 'Treino concluído',
      description: `Mandou bem! Você concluiu ${workout.workout_title || 'seu treino'}${duration}. Cada sessão conta para sua evolução.`,
    }, { onConflict: 'user_id,source_key', ignoreDuplicates: true });

  if (error) throw error;
}
