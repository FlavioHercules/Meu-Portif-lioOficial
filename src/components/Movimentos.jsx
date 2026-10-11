import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import { supabase } from '../lib/supabase';
import { findExerciseByName, findExercisesInWorkout, loadAiWorkout, readAiWorkout } from '../services/aiWorkoutStorage';
import { notifyWorkoutCompleted } from '../services/notifications';

function currentTimestamp() {
  return new Date().toISOString();
}

export default function Movimentos({ userId, onOpenNotif, onOpenConfig }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('movimentos');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestedOnly, setShowSuggestedOnly] = useState(false);
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [aiWorkout, setAiWorkout] = useState(() => readAiWorkout(userId));
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingSession, setIsUpdatingSession] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadLibrary = async () => {
      const [exerciseResult, workoutResult] = await Promise.all([
        supabase
          .from('exercises')
          .select('id, name, category, muscle_group, equipment, equipment_options, difficulty, modality, objectives, muscles, movement_pattern, unilateral, impact_level, instructions, progressions, regressions, video_url, demo_image_url')
          .order('name'),
        supabase
          .from('workout_sessions')
          .select('id, status, scheduled_for, workout_title, duration_min, plan_inputs, started_at, completed_at')
          .eq('user_id', userId)
          .order('scheduled_for', { ascending: false, nullsFirst: false }),
      ]);
          const savedAiWorkout = await loadAiWorkout(userId).catch(() => readAiWorkout(userId));

      if (!isActive) return;

      if (exerciseResult.error || workoutResult.error) {
        setErrorMessage('Não foi possível carregar a biblioteca. Confira as tabelas e a migração do Supabase.');
      }
      setExercises(exerciseResult.data || []);
      setWorkouts(workoutResult.data || []);
      setAiWorkout(savedAiWorkout);
      setIsLoading(false);
    };

    loadLibrary();
    return () => {
      isActive = false;
    };
  }, [userId]);

  const categories = activeTab === 'movimentos'
    ? [...new Set(exercises.map((exercise) => exercise.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'pt-BR'))
    : [
        { label: 'Planejados', value: 'planned' },
        { label: 'Em andamento', value: 'in_progress' },
        { label: 'Concluídos', value: 'completed' },
      ];
  const normalizedSearch = searchTerm.trim().toLocaleLowerCase('pt-BR');
  const suggestedExercises = aiWorkout ? findExercisesInWorkout(aiWorkout.content, exercises) : [];
  const suggestedExerciseIds = new Set(suggestedExercises.map((exercise) => exercise.id));
  const filteredExercises = exercises.filter((exercise) => {
    const matchesCategory = selectedCategory === 'todos' || exercise.category?.toLocaleLowerCase('pt-BR') === selectedCategory;
    const searchableText = [exercise.name, exercise.category, exercise.muscle_group, exercise.equipment, exercise.modality, exercise.description, ...(exercise.objectives || []), ...(exercise.muscles || [])].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
    return matchesCategory
      && (!normalizedSearch || searchableText.includes(normalizedSearch))
      && (!showSuggestedOnly || suggestedExerciseIds.has(exercise.id));
  });
  const filteredWorkouts = workouts.filter((workout) => {
    const exercisesInPlan = workout.plan_inputs?.exercise_plan || [];
    const searchableText = [workout.workout_title, workout.status, ...exercisesInPlan.map((exercise) => exercise.name)].filter(Boolean).join(' ').toLocaleLowerCase('pt-BR');
    return (!normalizedSearch || searchableText.includes(normalizedSearch))
      && (selectedCategory === 'todos' || workout.status === selectedCategory);
  });
  const categoryOptions = activeTab === 'movimentos'
    ? [{ label: 'Todos', value: 'todos' }, ...categories.map((category) => ({ label: category, value: category.toLocaleLowerCase('pt-BR') }))]
    : [{ label: 'Todos', value: 'todos' }, ...categories];
  const completedWorkouts = workouts.filter((workout) => workout.status === 'completed');
  const completedExerciseCount = completedWorkouts.reduce((total, workout) => total + (workout.plan_inputs?.exercise_plan?.length || 0), 0);
  const completedMinutes = completedWorkouts.reduce((total, workout) => total + (workout.duration_min || 0), 0);
  const recentWorkouts = [...completedWorkouts]
    .sort((first, second) => (second.completed_at || '').localeCompare(first.completed_at || ''))
    .slice(0, 4);

  const updateWorkoutStatus = async (workout, status) => {
    setIsUpdatingSession(workout.id);
    setErrorMessage('');
    const timestamp = currentTimestamp();
    const updates = status === 'in_progress'
      ? { status, started_at: timestamp }
      : { status, completed_at: timestamp };
    const { data, error } = await supabase
      .from('workout_sessions')
      .update(updates)
      .eq('id', workout.id)
      .eq('user_id', userId)
      .select('id, status, scheduled_for, workout_title, duration_min, plan_inputs, started_at, completed_at')
      .single();

    if (error) {
      setErrorMessage('Não foi possível atualizar o treino. Tente novamente.');
    } else {
      setWorkouts((current) => current.map((item) => item.id === data.id ? data : item));
      if (status === 'completed') {
        try {
          await notifyWorkoutCompleted(userId, workout);
        } catch {
          setErrorMessage('Treino atualizado, mas não foi possível criar a notificação.');
        }
      }
    }
    setIsUpdatingSession(null);
  };

  const renderExerciseCard = (exercise) => (
    <article key={exercise.id} style={styles.exerciseCard}>
      <div style={styles.exerciseMedia}>
        {exercise.video_url ? (
          <video controls playsInline preload="metadata" poster={exercise.demo_image_url || undefined} style={styles.exerciseVideo} aria-label={`Demonstração de ${exercise.name}`}>
            <source src={exercise.video_url} />
            Seu navegador não suporta vídeos HTML5.
          </video>
        ) : exercise.demo_image_url ? (
          <img src={exercise.demo_image_url} alt={`Demonstração de ${exercise.name}`} loading="lazy" style={styles.exerciseImage} />
        ) : (
          <div style={styles.exerciseArtwork} aria-label="Vídeo de demonstração ainda não cadastrado">
            <span aria-hidden="true">▶</span>
            <span>Vídeo de demonstração</span>
          </div>
        )}
      </div>
      <h3 style={styles.exerciseName}>{exercise.name}</h3>
      <span style={styles.exerciseMeta}>{[exercise.muscle_group || exercise.category, exercise.difficulty, exercise.modality].filter(Boolean).join(' · ')}</span>
      <span style={styles.exerciseEquipment}>{exercise.equipment || 'Equipamento não informado'}</span>
      <button type="button" onClick={() => setSelectedExercise(exercise)} style={styles.exerciseDetailsButton}>Ver instruções</button>
    </article>
  );

  const displayedExercise = selectedExercise || exercises.find((exercise) => exercise.id === searchParams.get('exercise'));
  const closeExerciseDialog = () => {
    setSelectedExercise(null);
    if (searchParams.has('exercise')) {
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete('exercise');
        return next;
      }, { replace: true });
    }
  };

  return (
    <div style={styles.appContainer}>
      <style>{`
        @media (max-width: 900px) {
          .movements-dashboard { grid-template-columns: minmax(0, 1fr) !important; padding: 16px !important; }
          .movements-hero { grid-template-columns: minmax(0, 1fr) !important; }
          .movements-filter { align-items: stretch !important; }
          .movements-category-pills { flex-wrap: wrap; }
        }
      `}</style>
      {/* 1. Navbar Superior */}
      <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />

      {/* 2. Conteúdo do Dashboard (Layout em Grid idêntico à imagem) */}
      <main className="movements-dashboard" style={styles.dashboardGrid}>
        
        {/* ================= COLUNA ESQUERDA ================= */}
        <section style={styles.leftColumn}>
          
          {/* Banner Principal: MOVIMENTOS INTELIGENTES. TREINOS MAIS EFICIENTES. */}
          <div className="movements-hero" style={styles.heroCard}>
            <div style={styles.heroContent}>
              <span style={styles.heroTag}>— MOVIMENTOS + TREINOS</span>
              <h1 style={styles.heroTitle}>
                MOVIMENTOS INTELIGENTES.<br />
                <span style={styles.heroGradient}>TREINOS MAIS EFICIENTES.</span>
              </h1>
              <p style={styles.heroDesc}>
                Acesse nossa biblioteca de movimentos e treinos personalizados para evoluir de forma segura e consistente.
              </p>

              <div style={styles.heroFeatures}>
                <div style={styles.featureBadge}>
                  <span style={styles.featureIcon}>🛡️</span>
                  <div>
                    <div style={styles.featureTitle}>Movimentos corretos</div>
                    <div style={styles.featureSub}>com guia visual</div>
                  </div>
                </div>

                <div style={styles.featureBadge}>
                  <span style={styles.featureIcon}>🛡️</span>
                  <div>
                    <div style={styles.featureTitle}>Treinos personalizados</div>
                    <div style={styles.featureSub}>para seus objetivos</div>
                  </div>
                </div>

                <div style={styles.featureBadge}>
                  <span style={styles.featureIcon}>📈</span>
                  <div>
                    <div style={styles.featureTitle}>Acompanhamento</div>
                    <div style={styles.featureSub}>da sua evolução</div>
                  </div>
                </div>

                <div style={styles.featureBadge}>
                  <span style={styles.featureIcon}>⚡</span>
                  <div>
                    <div style={styles.featureTitle}>Mais resultados</div>
                    <div style={styles.featureSub}>com menos risco</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Espaço para Imagem / Vídeo Superior */}
            <div style={styles.avatarBox}>
              <div>
                <div style={{ color: '#00e0ff', fontSize: '26px', fontWeight: 900 }}>{exercises.length}</div>
                <div style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>movimentos no catálogo</div>
                <div style={{ color: '#00e0ff', fontSize: '18px', fontWeight: 900, marginTop: '14px' }}>{workouts.length}</div>
                <div style={{ color: '#94a3b8', fontSize: '10px', textTransform: 'uppercase' }}>sessões na sua agenda</div>
              </div>
            </div>
          </div>

          {/* Barra de Filtros e Pesquisa */}
          <div className="movements-filter" style={styles.filterBarCard}>
            <div style={styles.toggleGroup}>
              <button
                type="button"
                aria-pressed={activeTab === 'movimentos'}
                onClick={() => { setActiveTab('movimentos'); setSelectedCategory('todos'); setShowSuggestedOnly(false); }}
                style={{
                  ...styles.toggleBtn,
                  ...(activeTab === 'movimentos' ? styles.toggleBtnActive : {})
                }}
              >
                <span>🏋️</span> Movimentos
              </button>
              <button
                type="button"
                aria-pressed={activeTab === 'treinos'}
                onClick={() => { setActiveTab('treinos'); setSelectedCategory('todos'); setShowSuggestedOnly(false); }}
                style={{
                  ...styles.toggleBtn,
                  ...(activeTab === 'treinos' ? styles.toggleBtnActive : {})
                }}
              >
                <span>📅</span> Treinos
              </button>
            </div>

            <div style={styles.searchBox}>
              <span style={{ color: '#64748b', fontSize: '14px' }}>🔍</span>
              <input
                type="text"
                placeholder={activeTab === 'movimentos' ? 'Buscar por nome, músculo ou equipamento...' : 'Buscar nos seus treinos...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div className="movements-category-pills" style={styles.categoryPills}>
              {categoryOptions.map(({ label, value }) => {
                const isSel = selectedCategory === value;
                return (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={isSel}
                    onClick={() => setSelectedCategory(value)}
                    style={{
                      ...styles.pillBtn,
                      ...(isSel ? styles.pillBtnActive : {})
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {errorMessage && <p role="alert" style={styles.errorMessage}>{errorMessage}</p>}

          {aiWorkout && (
            <section style={styles.sectionCard} aria-labelledby="today-workout-title">
              <div style={styles.sectionHeader}>
                <div>
                  <span id="today-workout-title" style={styles.sectionTitleText}>TREINO DE HOJE</span>
                  <p style={styles.resultCount}>
                    Preparado pela Artemis · {aiWorkout.createdAt ? new Date(aiWorkout.createdAt).toLocaleDateString('pt-BR') : 'Salvo neste dispositivo'}
                  </p>
                </div>
                <button
                  type="button"
                  aria-pressed={showSuggestedOnly}
                  onClick={() => {
                    setActiveTab('movimentos');
                    setSelectedCategory('todos');
                    setSearchTerm('');
                    setShowSuggestedOnly((current) => !current);
                  }}
                  style={styles.suggestionFilterButton}
                >
                  {showSuggestedOnly ? 'Mostrar biblioteca completa' : 'Ver só esses movimentos'}
                </button>
              </div>
              <div style={styles.recommendedResponse}>{aiWorkout.content}</div>
              <div style={styles.suggestedExercisesHeader}>
                <h3 style={styles.suggestedExercisesTitle}>Exercícios da biblioteca</h3>
                <span style={styles.suggestedExercisesCount}>{suggestedExercises.length}</span>
              </div>
              {suggestedExercises.length ? (
                <div style={styles.exerciseGrid}>{suggestedExercises.map(renderExerciseCard)}</div>
              ) : (
                <p style={styles.workoutMeta}>Os nomes sugeridos não coincidiram com os exercícios cadastrados. A recomendação completa continua disponível acima.</p>
              )}
            </section>
          )}

          {activeTab === 'movimentos' ? (
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <span style={styles.sectionTitleText}>BIBLIOTECA DE MOVIMENTOS</span>
                  <p style={styles.resultCount}>{isLoading ? 'Carregando catálogo...' : `${filteredExercises.length} movimento(s)`}</p>
                </div>
              </div>
              {filteredExercises.length ? (
                <div style={styles.exerciseGrid}>
                  {filteredExercises.map(renderExerciseCard)}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <h3>{isLoading ? 'Buscando movimentos' : exercises.length ? 'Nenhum resultado' : 'Catálogo sem movimentos'}</h3>
                  <p>{isLoading ? 'A biblioteca aparecerá aqui em instantes.' : exercises.length ? 'Tente outro termo ou categoria.' : 'Cadastre exercícios na tabela exercises do Supabase para exibi-los aqui.'}</p>
                </div>
              )}
            </section>
          ) : (
            <section style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div>
                  <span style={styles.sectionTitleText}>SEUS TREINOS E SESSÕES</span>
                  <p style={styles.resultCount}>{isLoading ? 'Carregando agenda...' : `${filteredWorkouts.length} sessão(ões)`}</p>
                </div>
                <Link to="/" style={styles.seeMoreLink}>Montar rotina na Home →</Link>
              </div>
              {filteredWorkouts.length ? (
                <div style={styles.workoutList}>
                  {filteredWorkouts.map((workout) => {
                    const statusLabel = { planned: 'Planejado', in_progress: 'Em andamento', completed: 'Concluído', canceled: 'Cancelado' }[workout.status] || workout.status;
                    const exercisePlan = workout.plan_inputs?.exercise_plan || [];
                    const dateLabel = workout.scheduled_for
                      ? new Date(`${workout.scheduled_for}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })
                      : 'Sem data';
                    return (
                      <article key={workout.id} style={styles.workoutCard}>
                        <div style={styles.workoutHeader}>
                          <div>
                            <h3 style={styles.workoutName}>{workout.workout_title || 'Treino'}</h3>
                            <p style={styles.workoutMeta}>{dateLabel} · {workout.duration_min || '—'} min · {statusLabel}</p>
                          </div>
                          {workout.status === 'planned' && <button type="button" disabled={isUpdatingSession === workout.id} onClick={() => updateWorkoutStatus(workout, 'in_progress')} style={styles.sessionButton}>{isUpdatingSession === workout.id ? 'Atualizando...' : 'Iniciar treino'}</button>}
                          {workout.status === 'in_progress' && <button type="button" disabled={isUpdatingSession === workout.id} onClick={() => updateWorkoutStatus(workout, 'completed')} style={styles.sessionButton}>{isUpdatingSession === workout.id ? 'Salvando...' : 'Concluir treino'}</button>}
                          {workout.status === 'completed' && <span style={styles.completedLabel}>✓ Concluído</span>}
                        </div>
                        {exercisePlan.length > 0 ? (
                          <ol style={styles.exercisePlan}>
                            {exercisePlan.map((exercise, index) => {
                              const catalogExercise = exercises.find((item) => item.id === exercise.exercise_id)
                                || findExerciseByName(exercise.name, exercises);
                              return (
                                <li key={`${exercise.name}-${index}`}>
                                  {catalogExercise ? <Link to={`/movimentos?exercise=${encodeURIComponent(catalogExercise.id)}`} style={styles.exercisePlanLink}>{exercise.name}</Link> : exercise.name}
                                  <span> {exercise.sets} × {exercise.reps}</span>
                                </li>
                              );
                            })}
                          </ol>
                        ) : <p style={styles.workoutMeta}>Os exercícios desta sessão ainda não foram registrados.</p>}
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div style={styles.emptyState}>
                  <h3>{isLoading ? 'Buscando sessões' : workouts.length ? 'Nenhum resultado' : 'Sua agenda está vazia'}</h3>
                  <p>{isLoading ? 'Suas sessões aparecerão aqui em instantes.' : workouts.length ? 'Altere o termo ou o status selecionado.' : 'Monte uma rotina na Home para ver seus treinos aqui.'}</p>
                  {!isLoading && !workouts.length && <Link to="/" style={styles.emptyAction}>Ir para a Home</Link>}
                </div>
              )}
            </section>
          )}

          <div style={styles.footerBanner}>
            <div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>USE SEUS DADOS PARA MONTAR UMA ROTINA</div>
              <div style={{ fontSize: '10px', color: '#94a3b8' }}>As sessões criadas na Home aparecem na sua agenda.</div>
            </div>
            <Link to="/" style={styles.actionButton}>Abrir Home <span>→</span></Link>
          </div>

        </section>


        {/* ================= COLUNA DIREITA (Sidebar) ================= */}
        <aside style={styles.rightColumn}>
          
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>📈</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>SEU PROGRESSO</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={styles.progressCircle}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#00e0ff' }}>{completedWorkouts.length}</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Treinos concluídos</div>
                <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.3' }}>Contagem baseada nas sessões registradas.</div>
              </div>
            </div>

            <div style={styles.progressStatsGrid}>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>📋</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{completedWorkouts.length}</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Treinos concluídos</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>🏋️</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{completedExerciseCount}</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Movimentos realizados</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>⏱️</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{Math.floor(completedMinutes / 60)}h {completedMinutes % 60}min</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Tempo total de treino</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>📅</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{workouts.filter((workout) => workout.status === 'planned' || workout.status === 'in_progress').length}</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Sessões abertas</div>
              </div>
            </div>
          </div>

          {/* Últimos Treinos */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🕒</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>ÚLTIMOS TREINOS</span>
              </div>
              <button type="button" onClick={() => { setActiveTab('treinos'); setSelectedCategory('completed'); }} style={styles.seeMoreLink}>Ver concluídos ›</button>
            </div>

            {recentWorkouts.length ? recentWorkouts.map((workout) => (
              <div key={workout.id} style={styles.recentItem}>
                <span style={{ fontSize: '16px' }}>✓</span>
                <div style={{ flex: 1, marginLeft: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{workout.workout_title || 'Treino'}</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>{workout.duration_min || 0} min · {workout.completed_at ? new Date(workout.completed_at).toLocaleDateString('pt-BR') : 'Concluído'}</div>
                </div>
              </div>
            )) : <p style={styles.emptySidebarText}>Seus treinos concluídos aparecerão aqui.</p>}
          </div>

          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>📚</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>CATÁLOGO</span>
            </div>
            <p style={styles.emptySidebarText}>{exercises.length} movimentos disponíveis em {categories.length} categorias.</p>
            <Link to="/" style={styles.sidebarLink}>Montar rotina na Home →</Link>
          </div>

        </aside>

      </main>
      {displayedExercise && (
        <div className="safe-overlay" role="presentation" onClick={closeExerciseDialog} style={styles.modalBackdrop}>
          <section role="dialog" aria-modal="true" aria-labelledby="exercise-dialog-title" onClick={(event) => event.stopPropagation()} style={styles.exerciseDialog}>
            <button type="button" aria-label="Fechar detalhes" onClick={closeExerciseDialog} style={styles.closeDialogButton}>×</button>
            {displayedExercise.demo_image_url && <img src={displayedExercise.demo_image_url} alt={displayedExercise.name} style={styles.dialogImage} />}
            <p style={styles.dialogEyebrow}>{displayedExercise.category}{displayedExercise.muscle_group ? ` · ${displayedExercise.muscle_group}` : ''}</p>
            <h2 id="exercise-dialog-title" style={styles.dialogTitle}>{displayedExercise.name}</h2>
            {displayedExercise.description && <p style={styles.dialogDescription}>{displayedExercise.description}</p>}
            <dl style={styles.exerciseDetails}>
              <div><dt>Dificuldade</dt><dd>{displayedExercise.difficulty || 'Não informada'}</dd></div>
              <div><dt>Equipamento</dt><dd>{displayedExercise.equipment || 'Não informado'}</dd></div>
              <div><dt>Modalidade</dt><dd>{displayedExercise.modality || 'Não informada'}</dd></div>
              <div><dt>Impacto</dt><dd>{displayedExercise.impact_level || 'Não informado'}</dd></div>
            </dl>
            {displayedExercise.instructions?.length > 0 && <div style={styles.exerciseGuidance}><h3>Instruções</h3><ol>{displayedExercise.instructions.map((instruction, index) => <li key={`${index}-${instruction}`}>{instruction}</li>)}</ol></div>}
            {displayedExercise.progressions?.length > 0 && <div style={styles.exerciseGuidance}><h3>Progressões</h3><p>{displayedExercise.progressions.join(' · ')}</p></div>}
            {displayedExercise.regressions?.length > 0 && <div style={styles.exerciseGuidance}><h3>Variações mais simples</h3><p>{displayedExercise.regressions.join(' · ')}</p></div>}
          </section>
        </div>
      )}
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
    gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 340px)',
    gap: '20px',
    padding: '24px',
    maxWidth: '1450px',
    margin: '0 auto'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  heroCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '22px',
    display: 'grid',
    gridTemplateColumns: '1.3fr 1fr',
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
    marginBottom: '6px'
  },
  heroTitle: {
    fontSize: '22px',
    fontWeight: 900,
    lineHeight: '1.1',
    margin: '0 0 8px 0',
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
    lineHeight: '1.4',
    margin: '0 0 12px 0'
  },
  heroFeatures: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
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
    fontSize: '12px'
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
  avatarBox: {
    position: 'relative',
    height: '130px',
    backgroundColor: '#04060b',
    borderRadius: '12px',
    border: '1px dashed rgba(0, 162, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  avatarPlaceholderContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  cornerTL: { position: 'absolute', top: 4, left: 4, width: 5, height: 5, borderTop: '2px solid #00e0ff', borderLeft: '2px solid #00e0ff' },
  cornerTR: { position: 'absolute', top: 4, right: 4, width: 5, height: 5, borderTop: '2px solid #00e0ff', borderRight: '2px solid #00e0ff' },
  cornerBL: { position: 'absolute', bottom: 4, left: 4, width: 5, height: 5, borderBottom: '2px solid #00e0ff', borderLeft: '2px solid #00e0ff' },
  cornerBR: { position: 'absolute', bottom: 4, right: 4, width: 5, height: 5, borderBottom: '2px solid #00e0ff', borderRight: '2px solid #00e0ff' },

  filterBarCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap'
  },
  toggleGroup: {
    display: 'flex',
    backgroundColor: '#04060b',
    border: '1px solid rgba(0, 100, 200, 0.3)',
    borderRadius: '10px',
    padding: '3px'
  },
  toggleBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#94a3b8',
    padding: '6px 12px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  toggleBtnActive: {
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    color: '#fff',
    boxShadow: '0 0 10px rgba(0,224,255,0.4)'
  },
  searchBox: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.3)',
    borderRadius: '10px',
    padding: '6px 12px',
    gap: '8px',
    minWidth: 0
  },
  searchInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '11px',
    outline: 'none',
    width: '100%'
  },
  categoryPills: {
    display: 'flex',
    gap: '6px'
  },
  pillBtn: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#94a3b8',
    cursor: 'pointer'
  },
  pillBtnActive: {
    backgroundColor: '#00e0ff',
    color: '#050508',
    borderColor: '#00e0ff'
  },

  sectionCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '18px 20px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '14px'
  },
  sectionTitleText: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: '#e2e8f0'
  },
  seeMoreLink: {
    fontSize: '11px',
    color: '#94a3b8',
    cursor: 'pointer'
  },
  horizontalCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 140px), 1fr))',
    gap: '10px'
  },
  miniCard: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '12px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    cursor: 'pointer'
  },
  miniCardImgBox: {
    position: 'relative',
    height: '65px',
    backgroundColor: '#04060b',
    borderRadius: '8px',
    border: '1px dashed rgba(0, 162, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '8px'
  },
  trainingCardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))',
    gap: '10px'
  },
  trainingCardItem: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '12px',
    padding: '12px',
    cursor: 'pointer'
  },
  footerBanner: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  actionButton: {
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
    boxShadow: '0 0 15px rgba(0, 224, 255, 0.3)'
  },

  sideCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '16px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  progressCircle: {
    width: '56px',
    height: '56px',
    borderRadius: '50%',
    border: '3px solid rgba(0, 224, 255, 0.2)',
    borderTopColor: '#00e0ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0e1b'
  },
  progressStatsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '8px'
  },
  progStatBox: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.15)',
    borderRadius: '10px',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  recentItem: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.15)',
    borderRadius: '10px',
    padding: '8px 10px',
    marginBottom: '6px'
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
    height: '100%',
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    borderRadius: '3px'
  },
  resultCount: {
    color: '#64748b',
    fontSize: '10px',
    margin: '5px 0 0'
  },
  errorMessage: {
    padding: '12px 14px',
    backgroundColor: 'rgba(127, 29, 29, 0.25)',
    border: '1px solid rgba(248, 113, 113, 0.35)',
    color: '#fecaca',
    fontSize: '12px'
  },
  exerciseGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
    gap: '10px'
  },
  recommendedResponse: {
    marginBottom: '18px',
    padding: '16px 18px',
    borderLeft: '3px solid #00b8d9',
    backgroundColor: '#080c16',
    color: '#e2e8f0',
    fontFamily: '"Segoe UI", "Noto Sans", sans-serif',
    fontSize: '16px',
    lineHeight: '1.7',
    whiteSpace: 'pre-wrap',
    overflowWrap: 'anywhere'
  },
  suggestionFilterButton: {
    border: '1px solid rgba(0, 224, 255, 0.35)',
    borderRadius: '8px',
    padding: '9px 12px',
    backgroundColor: 'transparent',
    color: '#67e8f9',
    fontSize: '13px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  suggestedExercisesHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '9px',
    marginBottom: '12px'
  },
  suggestedExercisesTitle: {
    margin: 0,
    color: '#e2e8f0',
    fontSize: '15px',
    fontWeight: 800
  },
  suggestedExercisesCount: {
    minWidth: '24px',
    padding: '3px 7px',
    borderRadius: '12px',
    backgroundColor: 'rgba(0, 224, 255, 0.12)',
    color: '#67e8f9',
    fontSize: '12px',
    fontWeight: 700,
    textAlign: 'center'
  },
  exerciseCard: {
    minWidth: 0,
    border: '1px solid rgba(0, 100, 200, 0.2)',
    backgroundColor: '#0b0e1b',
    padding: '10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    textAlign: 'left',
    cursor: 'pointer',
    color: '#fff'
  },
  exerciseMedia: {
    width: '100%',
    aspectRatio: '16 / 9',
    overflow: 'hidden',
    marginBottom: '10px',
    backgroundColor: '#04060b'
  },
  exerciseVideo: {
    display: 'block',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    backgroundColor: '#04060b'
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  exerciseArtwork: {
    width: '100%',
    height: '100%',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    background: 'linear-gradient(135deg, #10253a, #07101a 65%, #12281f)',
    color: '#82e8ee',
    fontSize: '10px',
    fontWeight: 700
  },
  exerciseName: {
    fontSize: '12px',
    fontWeight: 800,
    marginBottom: '4px'
  },
  exerciseMeta: {
    color: '#94a3b8',
    fontSize: '10px',
    marginBottom: '4px'
  },
  exerciseEquipment: {
    color: '#64748b',
    fontSize: '9px'
  },
  exerciseDetailsButton: {
    marginTop: '10px',
    border: '1px solid rgba(0, 224, 255, 0.35)',
    borderRadius: '8px',
    backgroundColor: 'transparent',
    color: '#67e8f9',
    padding: '7px 9px',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  emptyState: {
    border: '1px dashed rgba(100, 116, 139, 0.35)',
    padding: '28px 18px',
    textAlign: 'center',
    color: '#94a3b8'
  },
  emptyStateTitle: {
    color: '#fff',
    fontSize: '14px',
    fontWeight: 800
  },
  workoutList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  workoutCard: {
    border: '1px solid rgba(0, 100, 200, 0.2)',
    backgroundColor: '#0b0e1b',
    padding: '14px'
  },
  workoutHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px'
  },
  workoutName: {
    color: '#fff',
    fontSize: '13px',
    fontWeight: 800,
    margin: 0
  },
  workoutMeta: {
    color: '#94a3b8',
    fontSize: '10px',
    margin: '5px 0 0'
  },
  sessionButton: {
    border: '1px solid rgba(0, 224, 255, 0.45)',
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    color: '#a5f3fc',
    padding: '8px 10px',
    fontSize: '10px',
    fontWeight: 800,
    cursor: 'pointer'
  },
  completedLabel: {
    color: '#6ee7b7',
    fontSize: '10px',
    fontWeight: 800
  },
  exercisePlan: {
    borderTop: '1px solid rgba(100, 116, 139, 0.2)',
    margin: '12px 0 0',
    padding: '10px 0 0 18px',
    color: '#cbd5e1',
    fontSize: '11px',
    lineHeight: 1.8
  },
  exercisePlanLink: {
    color: '#67e8f9',
    textDecoration: 'underline',
    textUnderlineOffset: '3px'
  },
  emptyAction: {
    display: 'inline-flex',
    marginTop: '14px',
    color: '#67e8f9',
    fontSize: '11px',
    fontWeight: 800,
    textDecoration: 'none'
  },
  emptySidebarText: {
    color: '#94a3b8',
    fontSize: '10px',
    lineHeight: 1.5
  },
  sidebarLink: {
    display: 'inline-block',
    marginTop: '10px',
    color: '#67e8f9',
    fontSize: '10px',
    fontWeight: 700,
    textDecoration: 'none'
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto'
  },
  exerciseDialog: {
    position: 'relative',
    width: 'min(100%, 560px)',
    maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 32px)',
    overflowY: 'auto',
    border: '1px solid rgba(0, 224, 255, 0.35)',
    backgroundColor: '#070913',
    padding: '24px',
    color: '#fff'
  },
  closeDialogButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '32px',
    height: '32px',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    backgroundColor: '#070913',
    color: '#fff',
    fontSize: '22px',
    cursor: 'pointer'
  },
  dialogImage: {
    width: '100%',
    maxHeight: '260px',
    objectFit: 'cover',
    marginBottom: '16px'
  },
  dialogEyebrow: {
    color: '#67e8f9',
    fontSize: '10px',
    fontWeight: 800,
    textTransform: 'uppercase'
  },
  dialogTitle: {
    fontSize: '22px',
    fontWeight: 900,
    margin: '7px 0 10px'
  },
  dialogDescription: {
    color: '#cbd5e1',
    fontSize: '13px',
    lineHeight: 1.65
  },
  exerciseGuidance: {
    marginTop: '16px',
    color: '#cbd5e1',
    fontSize: '12px',
    lineHeight: 1.6
  },
  exerciseDetails: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '10px',
    margin: '18px 0'
  },
  videoLink: {
    display: 'inline-flex',
    border: '1px solid rgba(0, 224, 255, 0.4)',
    padding: '9px 12px',
    color: '#a5f3fc',
    fontSize: '11px',
    fontWeight: 800,
    textDecoration: 'none'
  }
};