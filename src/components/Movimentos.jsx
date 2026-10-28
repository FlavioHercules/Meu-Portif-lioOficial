import React, { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from './Navbar';
import { supabase } from '../lib/supabase';
import { findExerciseByName } from '../services/aiWorkoutStorage';
import { notifyWorkoutCompleted } from '../services/notifications';

function currentTimestamp() {
  return new Date().toISOString();
}

function normalizeFilterValue(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('pt-BR');
}

const exerciseMuscleGroups = [
  { label: 'Peito', categories: ['peito'], muscles: ['peitoral', 'ombro', 'triceps'] },
  { label: 'Costas', categories: ['costas'], muscles: ['dorsais', 'romboides', 'trapezio', 'biceps'] },
  { label: 'Ombros', categories: ['ombros'], muscles: ['ombro', 'trapezio', 'triceps'] },
  { label: 'Bíceps', categories: ['biceps'], muscles: ['biceps', 'antebracos'] },
  { label: 'Tríceps', categories: ['triceps'], muscles: ['triceps', 'peitoral', 'ombro'] },
  { label: 'Antebraços', categories: ['antebracos'], muscles: ['antebracos', 'biceps'] },
  { label: 'Quadríceps', categories: ['quadriceps'], muscles: ['quadriceps', 'gluteos'] },
  { label: 'Posterior de coxa', categories: ['posterior de coxa'], muscles: ['posteriores', 'gluteos'] },
  { label: 'Glúteos', categories: ['gluteos'], muscles: ['gluteos', 'quadriceps', 'posteriores'] },
  { label: 'Panturrilhas', categories: ['panturrilhas'], muscles: ['panturrilhas'] },
  { label: 'Abdômen', categories: ['abdomen'], muscles: ['abdomen', 'obliquos', 'core'] },
];

const muscleLabels = {
  deltoides: 'Ombro',
  peitoral: 'Peitoral',
  biceps: 'Bíceps',
  triceps: 'Tríceps',
  antebracos: 'Antebraços',
  quadriceps: 'Quadríceps',
  gluteos: 'Glúteos',
  posteriores: 'Posteriores',
  panturrilhas: 'Panturrilhas',
  dorsais: 'Dorsais',
  romboides: 'Romboides',
  trapezio: 'Trapézio',
  abdomen: 'Abdômen',
  obliquos: 'Oblíquos',
  core: 'Core',
};

function exerciseMuscleKeys(exercise) {
  const muscles = exercise.muscles?.length
    ? exercise.muscles
    : (exercise.muscle_group || '').split(/[,;]|\s+e\s+/i);
  return muscles.map(normalizeFilterValue).filter(Boolean);
}

function canonicalMuscleKey(muscleKey) {
  if (muscleKey.startsWith('deltoid')) return 'ombro';
  if (muscleKey.startsWith('posterior')) return 'posteriores';
  const knownMuscles = ['peitoral', 'dorsais', 'romboides', 'trapezio', 'biceps', 'triceps', 'antebracos', 'quadriceps', 'gluteos', 'panturrilhas', 'abdomen', 'obliquos', 'core'];
  return knownMuscles.find((muscle) => muscleKey === muscle || muscleKey.startsWith(`${muscle} `)) || muscleKey;
}

function muscleLabel(muscleKey) {
  return muscleLabels[canonicalMuscleKey(muscleKey)] || muscleKey.replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase('pt-BR'));
}

export default function Movimentos({ userId, onOpenNotif, onOpenConfig }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('movimentos');
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState('todos');
  const [selectedMuscle, setSelectedMuscle] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [exercises, setExercises] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingSession, setIsUpdatingSession] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [libraryErrorMessage, setLibraryErrorMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadLibrary = async () => {
      const [exerciseResult, workoutResult] = await Promise.all([
        supabase
          .from('exercises')
          .select('id, name, category, muscle_group, equipment, difficulty, exercise_type, suggested_sets, suggested_reps, modality, objectives, muscles, movement_pattern, unilateral, impact_level, instructions, progressions, regressions, video_url, demo_image_url')
          .eq('active', true)
          .order('name'),
        supabase
          .from('workout_sessions')
          .select('id, status, scheduled_for, workout_title, duration_min, plan_inputs, started_at, completed_at')
          .eq('user_id', userId)
          .order('scheduled_for', { ascending: false, nullsFirst: false }),
      ]);

      if (!isActive) return;

      if (exerciseResult.error) {
        console.error('Falha ao carregar catálogo de exercícios do Supabase:', exerciseResult.error);
        const code = exerciseResult.error.code ? ` (${exerciseResult.error.code})` : '';
        setLibraryErrorMessage(`Falha ao carregar exercícios${code}: ${exerciseResult.error.message}`);
      } else if (workoutResult.error) {
        console.error('Falha ao carregar sessões de treino do Supabase:', workoutResult.error);
        const code = workoutResult.error.code ? ` (${workoutResult.error.code})` : '';
        setErrorMessage(`Os movimentos foram carregados, mas as sessões falharam${code}: ${workoutResult.error.message}`);
      }
      setExercises(exerciseResult.data || []);
      setWorkouts(workoutResult.data || []);
      setIsLoading(false);
    };

    loadLibrary();
    return () => {
      isActive = false;
    };
  }, [userId]);

  const exerciseCategories = [...new Map(exercises
    .map((exercise) => exercise.category?.trim())
    .filter(Boolean)
    .map((category) => [normalizeFilterValue(category), category])).entries()];
  const knownExerciseCategories = new Set(exerciseMuscleGroups.flatMap((group) => group.categories));
  const muscleGroupOptions = [
    ...exerciseMuscleGroups
      .filter((group) => exerciseCategories.some(([category]) => group.categories.includes(category)))
      .map((group) => ({ ...group, value: normalizeFilterValue(group.label) })),
    ...exerciseCategories
      .filter(([category]) => !knownExerciseCategories.has(category))
      .map(([value, label]) => ({ label, value, categories: [value], muscles: [] })),
  ];
  const workoutStatusOptions = [
    { label: 'Planejados', value: 'planned' },
    { label: 'Em andamento', value: 'in_progress' },
    { label: 'Concluídos', value: 'completed' },
    { label: 'Cancelados', value: 'canceled' },
  ];
  const selectedMuscleGroupData = muscleGroupOptions.find((group) => group.value === selectedMuscleGroup);
  const exercisesInMuscleGroup = exercises.filter((exercise) =>
    selectedMuscleGroupData?.categories.includes(normalizeFilterValue(exercise.category)));
  const availableMuscles = new Set(exercisesInMuscleGroup.flatMap(exerciseMuscleKeys).map(canonicalMuscleKey));
  const muscleOptions = selectedMuscleGroupData
    ? [...availableMuscles]
      .filter((muscle) => selectedMuscleGroupData.muscles.includes(muscle))
      .sort((first, second) => selectedMuscleGroupData.muscles.indexOf(first) - selectedMuscleGroupData.muscles.indexOf(second))
      .map((value) => ({ label: muscleLabel(value), value }))
    : [];
  const normalizedSearch = normalizeFilterValue(searchTerm);
  const filteredExercises = exercises.filter((exercise) => {
    const matchesMuscleGroup = selectedMuscleGroup === 'todos'
      || selectedMuscleGroupData?.categories.includes(normalizeFilterValue(exercise.category));
    const matchesMuscle = selectedMuscle === 'todos'
      || exerciseMuscleKeys(exercise).map(canonicalMuscleKey).includes(selectedMuscle);
    const searchableText = normalizeFilterValue([exercise.name, exercise.category, exercise.muscle_group, exercise.equipment, exercise.modality, exercise.description, ...(exercise.objectives || []), ...(exercise.muscles || [])].filter(Boolean).join(' '));
    return matchesMuscleGroup
      && matchesMuscle
      && (!normalizedSearch || searchableText.includes(normalizedSearch));
  });
  const filteredWorkouts = workouts.filter((workout) => {
    const exercisesInPlan = workout.plan_inputs?.exercise_plan || [];
    const searchableText = normalizeFilterValue([workout.workout_title, workout.status, ...exercisesInPlan.map((exercise) => exercise.name)].filter(Boolean).join(' '));
    return (!normalizedSearch || searchableText.includes(normalizedSearch))
      && (selectedCategory === 'todos' || workout.status === selectedCategory);
  });
  const categoryOptions = activeTab === 'movimentos'
    ? [{ label: 'Todos os grupos', value: 'todos' }, ...muscleGroupOptions]
    : [{ label: 'Todos', value: 'todos' }, ...workoutStatusOptions];
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
    <article key={exercise.id} className="movement-exercise-card" style={styles.exerciseCard}>
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
      <div style={styles.exerciseCardContent}>
        <span style={styles.exerciseCategory}>{exercise.category || 'Movimento'}</span>
        <h3 style={styles.exerciseName}>{exercise.name}</h3>
        <div style={styles.exerciseMeta}>
          {[exercise.exercise_type === 'composto' ? 'Composto' : 'Isolado', exercise.difficulty, exercise.modality].filter(Boolean).map((item, index) => (
            <span key={`${item}-${index}`} style={styles.exerciseMetaTag}>{item}</span>
          ))}
        </div>
        <span style={styles.exerciseEquipment}>{exercise.equipment || 'Equipamento não informado'}</span>
        <button type="button" onClick={() => setSelectedExercise(exercise)} style={styles.exerciseDetailsButton}>
          Ver exercício <span aria-hidden="true">→</span>
        </button>
      </div>
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
          .movements-filter-main { grid-template-columns: 1fr !important; }
          .movements-filter-categories,
          .movements-filter-subcategories { align-items: flex-start !important; flex-direction: column; }
        }
        @media (max-width: 640px) {
          .movements-filter { padding: 14px !important; }
          .movements-filter-main { gap: 12px !important; }
          .movements-category-pills { width: 100%; }
        }
        .movements-category-pills {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .movement-exercise-card {
          transition: transform 160ms ease, border-color 160ms ease, box-shadow 160ms ease;
        }
        .movement-exercise-card:hover {
          transform: translateY(-3px);
          border-color: rgba(0, 224, 255, 0.52) !important;
          box-shadow: 0 14px 32px rgba(0, 0, 0, 0.28), 0 0 20px rgba(0, 224, 255, 0.08);
        }
        .movement-filter-button:focus-visible,
        .movement-search-input:focus-visible {
          outline: 2px solid #00e0ff;
          outline-offset: 2px;
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
            <div className="movements-filter-main" style={styles.filterMain}>
              <div style={styles.toggleGroup}>
                <button
                  type="button"
                  aria-pressed={activeTab === 'movimentos'}
                  onClick={() => { setActiveTab('movimentos'); setSelectedCategory('todos'); setSelectedMuscleGroup('todos'); setSelectedMuscle('todos'); setSearchTerm(''); }}
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
                  onClick={() => { setActiveTab('treinos'); setSelectedCategory('todos'); setSelectedMuscleGroup('todos'); setSelectedMuscle('todos'); setSearchTerm(''); }}
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
                  className="movement-search-input"
                  type="text"
                  placeholder={activeTab === 'movimentos' ? 'Buscar por nome, músculo ou equipamento...' : 'Buscar nos seus treinos...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={styles.searchInput}
                />
                {searchTerm && (
                  <button
                    type="button"
                    aria-label="Limpar busca"
                    onClick={() => setSearchTerm('')}
                    style={styles.clearSearchButton}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            <div className="movements-filter-categories" style={styles.filterCategories}>
              <span style={styles.filterLabel}>{activeTab === 'movimentos' ? 'Grupo muscular' : 'Status do treino'}</span>
              <div className="movements-category-pills" style={styles.categoryPills}>
                {categoryOptions.map(({ label, value }) => {
                  const isSel = activeTab === 'movimentos'
                    ? selectedMuscleGroup === value
                    : selectedCategory === value;
                  return (
                    <button
                      key={value}
                      className="movement-filter-button"
                      type="button"
                      aria-pressed={isSel}
                      onClick={() => {
                        if (activeTab === 'movimentos') {
                          setSelectedMuscleGroup(value);
                          setSelectedMuscle('todos');
                        } else {
                          setSelectedCategory(value);
                        }
                      }}
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
            {activeTab === 'movimentos' && selectedMuscleGroupData && muscleOptions.length > 0 && (
              <div className="movements-filter-subcategories" style={styles.filterCategories}>
                <span style={styles.filterLabel}>Músculo específico</span>
                <div className="movements-category-pills" style={styles.categoryPills}>
                  {[{ label: 'Todos', value: 'todos' }, ...muscleOptions].map(({ label, value }) => {
                    const isSel = selectedMuscle === value;
                    return (
                      <button
                        key={value}
                        className="movement-filter-button"
                        type="button"
                        aria-pressed={isSel}
                        onClick={() => setSelectedMuscle(value)}
                        style={{
                          ...styles.pillBtn,
                          ...(isSel ? styles.pillBtnActive : {}),
                        }}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {(libraryErrorMessage || errorMessage) && (
            <p role="alert" style={styles.errorMessage}>{libraryErrorMessage || errorMessage}</p>
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
                  <h3>{isLoading ? 'Buscando movimentos' : libraryErrorMessage ? 'Não foi possível carregar o catálogo' : exercises.length ? 'Nenhum resultado' : 'Catálogo sem movimentos'}</h3>
                  <p>{isLoading ? 'A biblioteca aparecerá aqui em instantes.' : libraryErrorMessage ? 'Veja o erro acima para identificar a coluna, permissão ou migração pendente.' : exercises.length ? 'Tente outro termo ou categoria.' : 'A consulta funcionou, mas não há exercícios ativos. Aplique a migração 20261015_curated_exercise_library.sql no Supabase.'}</p>
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
            <p style={styles.emptySidebarText}>{exercises.length} movimentos disponíveis em {exerciseCategories.length} categorias.</p>
            <Link to="/" style={styles.sidebarLink}>Montar rotina na Home →</Link>
          </div>

        </aside>

      </main>
      {displayedExercise && (
        <div className="safe-overlay" role="presentation" onClick={closeExerciseDialog} style={styles.modalBackdrop}>
          <section role="dialog" aria-modal="true" aria-labelledby="exercise-dialog-title" onClick={(event) => event.stopPropagation()} style={styles.exerciseDialog}>
            <button type="button" aria-label="Fechar detalhes" onClick={closeExerciseDialog} style={styles.closeDialogButton}>×</button>
            {displayedExercise.video_url ? (
              <video controls autoPlay playsInline preload="auto" poster={displayedExercise.demo_image_url || undefined} style={styles.dialogImage} aria-label={`Demonstração de ${displayedExercise.name}`}>
                <source src={displayedExercise.video_url} />
                Seu navegador não suporta vídeos HTML5.
              </video>
            ) : displayedExercise.demo_image_url ? (
              <img src={displayedExercise.demo_image_url} alt={displayedExercise.name} style={styles.dialogImage} />
            ) : null}
            <p style={styles.dialogEyebrow}>{displayedExercise.category}{displayedExercise.muscle_group ? ` · ${displayedExercise.muscle_group}` : ''}</p>
            <h2 id="exercise-dialog-title" style={styles.dialogTitle}>{displayedExercise.name}</h2>
            {displayedExercise.description && <p style={styles.dialogDescription}>{displayedExercise.description}</p>}
            <dl style={styles.exerciseDetails}>
              <div><dt>Grupo muscular</dt><dd>{displayedExercise.muscle_group || displayedExercise.category}</dd></div>
              <div><dt>Categoria</dt><dd>{displayedExercise.exercise_type === 'composto' ? 'Composto' : 'Isolado'}</dd></div>
              <div><dt>Dificuldade</dt><dd>{displayedExercise.difficulty || 'Não informada'}</dd></div>
              <div><dt>Equipamento</dt><dd>{displayedExercise.equipment || 'Não informado'}</dd></div>
              <div><dt>Sugestão inicial</dt><dd>{displayedExercise.suggested_sets || 3} séries · {displayedExercise.suggested_reps || '8-12'} repetições</dd></div>
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
    padding: '18px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: '16px'
  },
  filterMain: {
    display: 'grid',
    gridTemplateColumns: 'auto minmax(0, 1fr)',
    alignItems: 'center',
    gap: '14px'
  },
  filterCategories: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
    paddingTop: '14px',
    borderTop: '1px solid rgba(148, 163, 184, 0.12)'
  },
  filterLabel: {
    flex: '0 0 auto',
    color: '#64748b',
    fontSize: '11px',
    fontWeight: 700,
    letterSpacing: '0.04em',
    textTransform: 'uppercase'
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
    minWidth: 0,
    minHeight: '42px'
  },
  searchInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '11px',
    outline: 'none',
    width: '100%'
  },
  clearSearchButton: {
    flex: '0 0 auto',
    border: 0,
    background: 'transparent',
    color: '#94a3b8',
    fontSize: '20px',
    lineHeight: 1,
    padding: '2px 4px',
    cursor: 'pointer'
  },
  categoryPills: {
    display: 'flex',
    gap: '7px',
    minWidth: 0
  },
  pillBtn: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    borderRadius: '999px',
    padding: '8px 13px',
    fontSize: '11px',
    fontWeight: 700,
    color: '#94a3b8',
    cursor: 'pointer',
    transition: 'background-color 140ms ease, border-color 140ms ease, color 140ms ease'
  },
  pillBtnActive: {
    backgroundColor: 'rgba(0, 224, 255, 0.13)',
    color: '#67e8f9',
    border: '1px solid rgba(0, 224, 255, 0.55)'
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
    gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 220px), 1fr))',
    gap: '16px'
  },
  exerciseCard: {
    minWidth: 0,
    overflow: 'hidden',
    border: '1px solid rgba(148, 163, 184, 0.16)',
    borderRadius: '15px',
    background: 'linear-gradient(160deg, #111827 0%, #090d18 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'stretch',
    textAlign: 'left',
    color: '#fff',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.18)'
  },
  exerciseMedia: {
    width: '100%',
    aspectRatio: '16 / 10',
    overflow: 'hidden',
    backgroundColor: '#04060b',
    borderBottom: '1px solid rgba(148, 163, 184, 0.12)'
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
    background: 'radial-gradient(ellipse at 50% 20%, rgba(0, 224, 255, 0.16), transparent 55%), linear-gradient(135deg, #111c2c, #080d17 65%, #10271f)',
    color: '#a5f3fc',
    fontSize: '11px',
    fontWeight: 700
  },
  exerciseCardContent: {
    minWidth: 0,
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    flex: 1
  },
  exerciseCategory: {
    maxWidth: '100%',
    marginBottom: '8px',
    padding: '4px 8px',
    overflow: 'hidden',
    border: '1px solid rgba(0, 224, 255, 0.22)',
    borderRadius: '999px',
    backgroundColor: 'rgba(0, 224, 255, 0.08)',
    color: '#67e8f9',
    fontSize: '10px',
    fontWeight: 700,
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  exerciseName: {
    width: '100%',
    margin: '0 0 10px',
    color: '#f8fafc',
    fontSize: '16px',
    fontWeight: 800,
    lineHeight: 1.3
  },
  exerciseMeta: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '6px',
    marginBottom: '12px'
  },
  exerciseMetaTag: {
    borderRadius: '6px',
    backgroundColor: 'rgba(148, 163, 184, 0.1)',
    padding: '4px 7px',
    color: '#cbd5e1',
    fontSize: '10px',
    lineHeight: 1.2
  },
  exerciseEquipment: {
    minHeight: '16px',
    color: '#94a3b8',
    fontSize: '11px'
  },
  exerciseDetailsButton: {
    width: '100%',
    marginTop: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    border: '1px solid rgba(0, 224, 255, 0.3)',
    borderRadius: '9px',
    backgroundColor: 'rgba(0, 224, 255, 0.08)',
    color: '#a5f3fc',
    padding: '10px 12px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    transition: 'background-color 140ms ease'
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