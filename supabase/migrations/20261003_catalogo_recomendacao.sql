begin;

alter table public.pesquisa add column if not exists age smallint;
alter table public.pesquisa add column if not exists experience_months smallint not null default 0;
alter table public.pesquisa add column if not exists limitations text[] not null default '{}';

alter table public.exercises add column if not exists modality text not null default 'Academia';
alter table public.exercises add column if not exists objectives text[] not null default '{}';
alter table public.exercises add column if not exists muscles text[] not null default '{}';
alter table public.exercises add column if not exists movement_pattern text;
alter table public.exercises add column if not exists unilateral boolean not null default false;
alter table public.exercises add column if not exists impact_level text not null default 'baixo';
alter table public.exercises add column if not exists instructions jsonb not null default '[]'::jsonb;
alter table public.exercises add column if not exists progressions text[] not null default '{}';
alter table public.exercises add column if not exists regressions text[] not null default '{}';
alter table public.exercises add column if not exists equipment_options text[] not null default '{}';
alter table public.exercises add column if not exists description text;
alter table public.exercises add column if not exists video_url text;
alter table public.exercises add column if not exists demo_image_url text;

create index if not exists idx_exercises_recommendation on public.exercises(category, difficulty, modality);

with catalogue (
  names, category, muscle_group, equipment, equipment_options, difficulty, modality,
  objectives, muscles, movement_pattern, unilateral, impact_level, description,
  instructions, progressions, regressions
) as (
  values
  (
    array['Agachamento livre', 'Leg press 45°', 'Leg press horizontal', 'Cadeira extensora', 'Mesa flexora', 'Cadeira flexora', 'Stiff', 'Levantamento terra romeno', 'Afundo', 'Passada', 'Agachamento sumô', 'Agachamento goblet', 'Hip thrust', 'Glute bridge', 'Abdução de quadril', 'Adução de quadril', 'Panturrilha em pé', 'Panturrilha sentado', 'Panturrilha no leg press']::text[],
    'Pernas e glúteos', 'Quadríceps, glúteos e posteriores', 'Academia completa', array['barra', 'halteres', 'máquinas', 'peso corporal']::text[], 'Iniciante', 'Academia e calistenia', array['forca', 'hipertrofia', 'composicao_corporal']::text[], array['quadríceps', 'glúteos', 'posteriores']::text[], 'agachamento, hinge e acessórios', false, 'moderado', 'Exercício de força para membros inferiores. Ajuste carga e amplitude à sua experiência e às suas limitações.', array['Faça algumas repetições sem carga para aquecer.', 'Mantenha o movimento controlado e use uma amplitude confortável.', 'Interrompa se sentir dor.']::text[], array['Aumente gradualmente a carga', 'Use variações unilaterais']::text[], array['Reduza a carga', 'Use apoio ou amplitude confortável']::text[]
  ),
  (
    array['Agachamento no Smith', 'Agachamento no Hack', 'Agachamento frontal', 'Levantamento terra', 'Good morning', 'Afundo no Smith', 'Bulgarian split squat', 'Coice no cabo', 'Flexão nórdica', 'Panturrilha unilateral']::text[],
    'Pernas e glúteos', 'Quadríceps, glúteos e posteriores', 'Barra, máquinas ou cabo', array['barra', 'máquinas', 'cabos']::text[], 'Intermediário', 'Academia', array['forca', 'hipertrofia']::text[], array['quadríceps', 'glúteos', 'posteriores']::text[], 'agachamento, hinge e unilateral', true, 'moderado', 'Variação de força que exige controle. Comece leve e priorize técnica antes de aumentar carga.', array['Prepare a estação e confira a amplitude livre.', 'Mantenha o tronco firme durante a repetição.', 'Interrompa se sentir dor ou perder o controle.']::text[], array['Aumente a carga de forma gradual', 'Progrida para mais amplitude controlada']::text[], array['Reduza a carga', 'Troque por uma variação estável']::text[]
  ),
  (
    array['Agachamento com pausa', 'Agachamento unilateral assistido', 'Pistol squat assistido', 'Afundo', 'Passada', 'Step-up', 'Wall sit', 'Glute bridge', 'Single-leg glute bridge', 'Panturrilha unilateral']::text[],
    'Pernas e glúteos', 'Quadríceps, glúteos e panturrilhas', 'Peso corporal', array['peso corporal', 'banco ou apoio']::text[], 'Iniciante', 'Calistenia', array['forca', 'hipertrofia', 'resistencia']::text[], array['quadríceps', 'glúteos', 'panturrilhas']::text[], 'agachamento e unilateral', true, 'moderado', 'Movimento com peso corporal. Use apoio se necessário e mantenha o equilíbrio antes de avançar.', array['Use um apoio firme quando necessário.', 'Faça cada repetição sem impulso e dentro de uma amplitude confortável.', 'Interrompa se sentir dor.']::text[], array['Reduza o apoio', 'Adicione pausa ou repetições']::text[], array['Segure em um apoio', 'Reduza a amplitude']::text[]
  ),
  (
    array['Pistol squat', 'Shrimp squat', 'Nordic curl', 'Jump squat', 'Split jump']::text[],
    'Pernas e glúteos', 'Quadríceps, glúteos e posteriores', 'Peso corporal', array['peso corporal']::text[], 'Avançado', 'Calistenia', array['forca', 'potencia']::text[], array['quadríceps', 'glúteos', 'posteriores']::text[], 'unilateral e pliometria', true, 'alto', 'Progressão avançada. Só faça se já domina uma variação mais simples e não possui limitação incompatível.', array['Aqueça e teste o movimento sem fadiga.', 'Pouse com controle nos exercícios de salto.', 'Pare ao primeiro sinal de dor.']::text[], array['Adicione carga leve', 'Aumente gradualmente o volume']::text[], array['Use apoio', 'Volte à variação bilateral']::text[]
  ),
  (
    array['Supino reto com barra', 'Supino reto com halteres', 'Supino inclinado com barra', 'Supino inclinado com halteres', 'Supino declinado', 'Chest press', 'Peck deck', 'Crucifixo com halteres', 'Crucifixo inclinado', 'Crucifixo no cabo', 'Crossover', 'Crossover alto', 'Crossover baixo']::text[],
    'Peito', 'Peitoral, deltoides e tríceps', 'Barra, halteres, máquinas ou cabos', array['barra', 'halteres', 'máquinas', 'cabos']::text[], 'Iniciante', 'Academia', array['forca', 'hipertrofia']::text[], array['peitoral', 'deltoides', 'tríceps']::text[], 'empurrar horizontal e inclinado', false, 'baixo', 'Exercício de empurrar para peitoral. Use carga controlada e não force amplitude dolorosa no ombro.', array['Ajuste banco e apoio antes de iniciar.', 'Mantenha punhos alinhados e controle a descida.', 'Interrompa se sentir dor no ombro ou peito.']::text[], array['Aumente gradualmente a carga', 'Progrida para variações livres']::text[], array['Use máquina ou halteres leves', 'Reduza a amplitude']::text[]
  ),
  (
    array['Flexão tradicional', 'Flexão inclinada', 'Flexão declinada', 'Flexão com joelhos apoiados', 'Flexão diamante', 'Flexão aberta', 'Dips/paralelas']::text[],
    'Peito', 'Peitoral, deltoides e tríceps', 'Peso corporal ou paralelas', array['peso corporal', 'banco ou apoio', 'paralelas']::text[], 'Iniciante', 'Calistenia', array['forca', 'hipertrofia', 'resistencia']::text[], array['peitoral', 'deltoides', 'tríceps']::text[], 'empurrar horizontal', false, 'moderado', 'Exercício de empurrar com peso corporal. Ajuste a inclinação para manter controle e alinhamento.', array['Apoie as mãos de forma estável.', 'Mantenha tronco alinhado e cotovelos controlados.', 'Interrompa se sentir dor.']::text[], array['Reduza a inclinação', 'Passe para flexão tradicional']::text[], array['Use parede ou apoio alto', 'Apoie os joelhos']::text[]
  ),
  (
    array['Flexão arqueiro', 'Flexão pseudo-planche', 'Flexão explosiva', 'Flexão unilateral assistida']::text[],
    'Peito', 'Peitoral, deltoides e tríceps', 'Peso corporal', array['peso corporal']::text[], 'Avançado', 'Calistenia', array['forca', 'potencia']::text[], array['peitoral', 'deltoides', 'tríceps']::text[], 'empurrar horizontal avançado', true, 'alto', 'Variação avançada de flexão. Domine a flexão tradicional e adapte à sua capacidade antes de testar.', array['Comece com poucas repetições e sem fadiga.', 'Mantenha o corpo alinhado e a descida controlada.', 'Interrompa se sentir dor.']::text[], array['Reduza gradualmente o auxílio', 'Aumente amplitude controlada']::text[], array['Volte à flexão inclinada', 'Aumente o apoio']::text[]
  ),
  (
    array['Barra fixa', 'Puxada frontal', 'Puxada supinada', 'Puxada neutra', 'Remada curvada', 'Remada unilateral', 'Remada cavalinho', 'Remada baixa', 'Remada máquina', 'Remada articulada', 'Pullover no cabo', 'Pulldown', 'Face pull', 'Encolhimento']::text[],
    'Costas', 'Dorsais, romboides e trapézio', 'Barra, halteres, máquinas ou cabos', array['barra', 'halteres', 'máquinas', 'cabos']::text[], 'Iniciante', 'Academia', array['forca', 'hipertrofia', 'postura']::text[], array['dorsais', 'romboides', 'trapézio']::text[], 'puxar vertical e horizontal', false, 'baixo', 'Exercício de puxada para costas. Mantenha a coluna confortável e evite compensar com balanço.', array['Ajuste pegada e posição antes de iniciar.', 'Puxe com controle e retorne devagar.', 'Interrompa se sentir dor.']::text[], array['Aumente carga gradualmente', 'Progrida de máquina para peso livre']::text[], array['Use apoio ou máquina assistida', 'Reduza a carga']::text[]
  ),
  (
    array['Australian pull-up', 'Pull-up', 'Chin-up', 'Neutral grip pull-up', 'Archer pull-up', 'Commando pull-up', 'Muscle-up', 'Front lever', 'Front lever raises', 'Scapular pull-up']::text[],
    'Costas', 'Dorsais, romboides e braços', 'Barra fixa ou barra baixa', array['peso corporal', 'barra fixa']::text[], 'Intermediário', 'Calistenia', array['forca', 'hipertrofia', 'calistenia']::text[], array['dorsais', 'romboides', 'bíceps']::text[], 'puxar vertical e habilidades', false, 'moderado', 'Progressão de puxada na barra. Use regressão assistida se ainda não completar repetições com boa forma.', array['Confira se a barra está firme.', 'Evite balanço e controle a descida.', 'Interrompa se sentir dor.']::text[], array['Reduza assistência', 'Adicione pausa no topo']::text[], array['Australian pull-up', 'Negativas assistidas']::text[]
  ),
  (
    array['Desenvolvimento com barra', 'Desenvolvimento com halteres', 'Desenvolvimento na máquina', 'Arnold press', 'Elevação lateral', 'Elevação lateral no cabo', 'Elevação frontal', 'Crucifixo inverso', 'Reverse pec deck', 'Face pull']::text[],
    'Ombros', 'Deltoides e trapézio', 'Barra, halteres, máquinas ou cabos', array['barra', 'halteres', 'máquinas', 'cabos']::text[], 'Iniciante', 'Academia', array['forca', 'hipertrofia']::text[], array['deltoides', 'trapézio']::text[], 'empurrar vertical e elevação', false, 'baixo', 'Exercício para ombros. Use amplitude confortável, sem compensar com a lombar.', array['Comece com carga leve.', 'Mantenha tronco estável e movimento controlado.', 'Interrompa se sentir dor.']::text[], array['Aumente carga gradualmente', 'Progrida para variação unilateral']::text[], array['Use máquina ou elástico leve', 'Reduza amplitude']::text[]
  ),
  (
    array['Pike push-up', 'Elevated pike push-up', 'Handstand hold', 'Handstand push-up', 'Wall handstand', 'Planche lean']::text[],
    'Ombros', 'Deltoides, tríceps e core', 'Peso corporal e parede', array['peso corporal', 'parede']::text[], 'Intermediário', 'Calistenia', array['forca', 'calistenia']::text[], array['deltoides', 'tríceps', 'core']::text[], 'empurrar vertical e equilíbrio', false, 'alto', 'Habilidade de calistenia. Use uma parede/apoio seguro e avance somente se dominar a progressão anterior.', array['Prepare uma área livre e apoio firme.', 'Mantenha controle da posição e saída.', 'Interrompa se sentir dor ou tontura.']::text[], array['Aumente gradualmente o tempo', 'Reduza apoio com segurança']::text[], array['Pike push-up com mãos elevadas', 'Isometria na parede']::text[]
  ),
  (
    array['Rosca direta', 'Rosca alternada', 'Rosca martelo', 'Rosca concentrada', 'Rosca Scott', 'Rosca no cabo', 'Rosca inclinada', 'Rosca spider', 'Rosca inversa']::text[],
    'Bíceps', 'Bíceps e antebraços', 'Barra, halteres, banco ou cabo', array['barra', 'halteres', 'cabos', 'banco']::text[], 'Iniciante', 'Academia', array['forca', 'hipertrofia']::text[], array['bíceps', 'antebraços']::text[], 'flexão de cotovelo', false, 'baixo', 'Exercício de braços. Mantenha cotovelos estáveis e evite impulso do tronco.', array['Use carga que permita controlar toda a repetição.', 'Mantenha punhos confortáveis.', 'Interrompa se sentir dor.']::text[], array['Aumente carga gradualmente', 'Use variação unilateral']::text[], array['Reduza carga', 'Use apoio para estabilizar o braço']::text[]
  ),
  (
    array['Australian chin-up', 'Isometria na barra', 'Negative chin-up', 'Towel chin-up']::text[],
    'Bíceps', 'Bíceps, dorsais e antebraços', 'Barra fixa ou barra baixa', array['peso corporal', 'barra fixa', 'toalha']::text[], 'Intermediário', 'Calistenia', array['forca', 'calistenia']::text[], array['bíceps', 'dorsais', 'antebraços']::text[], 'puxar vertical', false, 'moderado', 'Progressão de puxada supinada. Use apoio para subir e controle a fase excêntrica.', array['Confira a estabilidade da barra e da pegada.', 'Evite queda livre na fase negativa.', 'Interrompa se sentir dor.']::text[], array['Diminua assistência', 'Aumente o tempo de descida']::text[], array['Australian chin-up', 'Remada com elástico']::text[]
  ),
  (
    array['Tríceps pulley', 'Tríceps corda', 'Tríceps barra', 'Tríceps francês', 'Tríceps testa', 'Tríceps unilateral', 'Tríceps coice', 'Supino fechado']::text[],
    'Tríceps', 'Tríceps e peitoral', 'Cabo, halteres ou barra', array['cabos', 'halteres', 'barra']::text[], 'Iniciante', 'Academia', array['forca', 'hipertrofia']::text[], array['tríceps', 'peitoral']::text[], 'extensão de cotovelo', false, 'baixo', 'Exercício de extensão de cotovelo. Mantenha ombro e punho em posição confortável.', array['Comece com carga leve e cotovelos estáveis.', 'Controle a volta sem travar a articulação.', 'Interrompa se sentir dor.']::text[], array['Aumente carga gradualmente', 'Progrida para variação unilateral']::text[], array['Reduza carga', 'Use cabo ou elástico leve']::text[]
  ),
  (
    array['Diamond push-up', 'Close-grip push-up', 'Bench dips', 'Parallel-bar dips', 'Straight-bar dips']::text[],
    'Tríceps', 'Tríceps, peitoral e deltoides', 'Peso corporal, banco ou paralelas', array['peso corporal', 'banco', 'paralelas']::text[], 'Intermediário', 'Calistenia', array['forca', 'hipertrofia', 'calistenia']::text[], array['tríceps', 'peitoral', 'deltoides']::text[], 'empurrar', false, 'moderado', 'Exercício de empurrar. Use uma progressão estável e não force amplitude do ombro.', array['Confira a estabilidade do apoio.', 'Mantenha descida controlada e amplitude confortável.', 'Interrompa se sentir dor.']::text[], array['Reduza assistência', 'Adicione repetições com controle']::text[], array['Flexão inclinada fechada', 'Reduza amplitude']::text[]
  ),
  (
    array['Abdominal tradicional', 'Crunch', 'Reverse crunch', 'Bicicleta', 'Elevação de pernas', 'Elevação de joelhos', 'Hanging knee raise', 'Hanging leg raise', 'Abdominal na máquina', 'Abdominal no cabo', 'Prancha', 'Prancha lateral', 'Prancha com apoio dos cotovelos', 'Dead bug', 'Bird dog', 'Hollow body hold', 'Hollow rocks', 'V-up', 'Russian twist', 'Mountain climber', 'Pallof press', 'Ab wheel rollout']::text[],
    'Core', 'Abdômen e estabilizadores', 'Peso corporal, cabo, máquina ou roda abdominal', array['peso corporal', 'cabos', 'máquinas', 'roda abdominal']::text[], 'Iniciante', 'Academia e calistenia', array['forca', 'condicionamento', 'estabilidade']::text[], array['abdômen', 'oblíquos', 'core']::text[], 'flexão, anti-extensão e estabilidade', false, 'baixo', 'Exercício de core. Respire continuamente e mantenha controle sem forçar o pescoço ou lombar.', array['Mantenha respiração regular.', 'Faça o movimento sem balanço e com controle.', 'Interrompa se sentir dor.']::text[], array['Aumente o tempo ou repetições gradualmente', 'Adicione resistência leve']::text[], array['Reduza amplitude', 'Use versão com apoio']::text[]
  ),
  (
    array['Caminhada', 'Caminhada inclinada', 'Bicicleta', 'Bicicleta ergométrica', 'Elíptico', 'Remo']::text[],
    'Cardio', 'Sistema cardiorrespiratório e membros inferiores', 'Esteira, bicicleta, elíptico ou remo', array['esteira', 'bicicleta', 'elíptico', 'remo']::text[], 'Iniciante', 'Cardio', array['condicionamento', 'resistencia', 'composicao_corporal', 'saude']::text[], array['cardiorrespiratório', 'pernas']::text[], 'cardio contínuo baixo impacto', false, 'baixo', 'Atividade aeróbica de baixo impacto. Ajuste ritmo e duração à sua condição atual.', array['Comece em ritmo leve.', 'Aumente duração ou intensidade gradualmente.', 'Interrompa se sentir dor, falta de ar fora do esperado ou tontura.']::text[], array['Aumente alguns minutos por sessão', 'Aumente levemente a inclinação']::text[], array['Reduza ritmo e duração', 'Escolha uma modalidade confortável']::text[]
  ),
  (
    array['Corrida', 'Corrida intervalada', 'Sprint', 'Escada', 'Jumping jacks', 'Burpees', 'Mountain climbers', 'Corrida estacionária']::text[],
    'Cardio', 'Sistema cardiorrespiratório e corpo inteiro', 'Esteira, escada ou peso corporal', array['esteira', 'escada', 'peso corporal']::text[], 'Intermediário', 'Cardio', array['condicionamento', 'resistencia', 'potencia']::text[], array['cardiorrespiratório', 'pernas', 'core']::text[], 'cardio intervalado e potência', false, 'alto', 'Atividade de maior intensidade. Use apenas se compatível com sua experiência e limitações.', array['Aqueça antes dos intervalos.', 'Comece com esforço moderado e pausas suficientes.', 'Interrompa se sentir dor, tontura ou mal-estar.']::text[], array['Aumente gradualmente os intervalos', 'Reduza pausas apenas com boa recuperação']::text[], array['Caminhada rápida', 'Marcha estacionária de baixo impacto']::text[]
  ),
  (
    array['Saltos']::text[],
    'Cardio', 'Pernas e sistema cardiorrespiratório', 'Peso corporal', array['peso corporal']::text[], 'Avançado', 'Cardio', array['potencia', 'condicionamento']::text[], array['pernas', 'cardiorrespiratório']::text[], 'pliometria', false, 'alto', 'Exercício de impacto. Use superfície estável e somente se adequado à sua experiência e limitações.', array['Aqueça e faça poucas repetições inicialmente.', 'Aterrisse com controle e espaço livre.', 'Interrompa se sentir dor.']::text[], array['Aumente poucas repetições', 'Progrida para saltos direcionais']::text[], array['Marcha rápida', 'Step-up baixo']::text[]
  ),
  (
    array['Mobilidade de tornozelo', 'Mobilidade de quadril', 'Mobilidade torácica', 'Rotação torácica', 'Mobilidade de ombro', 'Shoulder dislocates', '90/90 de quadril', 'World''s greatest stretch', 'Cat-cow', 'Deep squat hold', 'Alongamento de posterior', 'Alongamento de quadríceps', 'Alongamento de flexores do quadril', 'Alongamento de peitoral', 'Alongamento de dorsais']::text[],
    'Mobilidade', 'Articulações e grupos musculares variados', 'Peso corporal ou elástico leve', array['peso corporal', 'elásticos']::text[], 'Iniciante', 'Mobilidade', array['mobilidade', 'recuperacao', 'saude']::text[], array['tornozelos', 'quadril', 'torácica', 'ombros']::text[], 'mobilidade articular e alongamento', false, 'baixo', 'Movimento de mobilidade sem carga alta. Trabalhe em amplitude confortável, sem forçar dor.', array['Faça movimentos lentos e respire normalmente.', 'Use amplitude confortável e sem balanço brusco.', 'Interrompa se sentir dor ou formigamento.']::text[], array['Aumente gradualmente a amplitude', 'Adicione controle isométrico leve']::text[], array['Reduza amplitude', 'Use apoio ou versão no chão']::text[]
  )
), expanded as (
  select catalogue.*, exercise_name
  from catalogue
  cross join lateral unnest(catalogue.names) as expanded_names(exercise_name)
)
insert into public.exercises (
  id, name, category, muscle_group, equipment, difficulty, description,
  video_url, demo_image_url, modality, objectives, muscles, movement_pattern,
  unilateral, impact_level, instructions, progressions, regressions, equipment_options
)
select
  gen_random_uuid(), expanded.exercise_name, expanded.category, expanded.muscle_group,
  expanded.equipment, expanded.difficulty, expanded.description,
  null, null, expanded.modality, expanded.objectives, expanded.muscles,
  expanded.movement_pattern, expanded.unilateral, expanded.impact_level,
  to_jsonb(expanded.instructions), expanded.progressions, expanded.regressions,
  expanded.equipment_options
from expanded
where not exists (
  select 1
  from public.exercises existing
  where lower(existing.name) = lower(expanded.exercise_name)
);

commit;