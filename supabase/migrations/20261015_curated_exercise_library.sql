begin;

alter table public.exercises
  add column if not exists equipment_options text[] not null default '{}',
  add column if not exists exercise_type text not null default 'composto',
  add column if not exists suggested_sets smallint not null default 3,
  add column if not exists suggested_reps text not null default '8-12',
  add column if not exists active boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.exercises'::regclass
      and conname = 'exercises_exercise_type_check'
  ) then
    alter table public.exercises
      add constraint exercises_exercise_type_check
      check (exercise_type in ('composto', 'isolado'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conrelid = 'public.exercises'::regclass
      and conname = 'exercises_suggested_sets_check'
  ) then
    alter table public.exercises
      add constraint exercises_suggested_sets_check
      check (suggested_sets between 1 and 10);
  end if;
end;
$$;

create temporary table motionfit_curated_exercises on commit drop as
select *
from (values
  ('Supino reto com barra', array['Supino reto com barra', 'Supino reto']::text[], 'Peito', array['peitoral', 'deltoides', 'tríceps']::text[], 'Barra e banco reto', array['barra', 'banco']::text[], 'Iniciante', 'Academia', 'composto', 3::smallint, '8-12', jsonb_build_array('Deite no banco com os pés apoiados e escápulas estáveis.', 'Desça a barra com controle até a região média do peito.', 'Empurre sem tirar os ombros do banco.'), array['forca', 'hipertrofia']::text[], 'Empurrar horizontal', 'Exercício composto de empurrar para peitoral, com participação de deltoides e tríceps.'),
  ('Supino inclinado com halteres', array['Supino inclinado com halteres']::text[], 'Peito', array['peitoral', 'deltoides', 'tríceps']::text[], 'Halteres e banco inclinado', array['halteres', 'banco inclinado']::text[], 'Iniciante', 'Academia', 'composto', 3::smallint, '8-12', jsonb_build_array('Ajuste o banco em inclinação confortável e mantenha os pés apoiados.', 'Desça os halteres ao lado do peito com controle.', 'Empurre para cima sem bater os halteres.'), array['forca', 'hipertrofia']::text[], 'Empurrar inclinado', 'Variação de supino que enfatiza a porção superior do peitoral.'),
  ('Crucifixo na máquina', array['Crucifixo na máquina', 'Peck deck', 'Peck-deck']::text[], 'Peito', array['peitoral', 'deltoides']::text[], 'Máquina peck deck', array['máquinas']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Ajuste o assento para manter os braços alinhados ao peito.', 'Aproxime os braços à frente sem perder o controle.', 'Retorne devagar até uma amplitude confortável.'), array['hipertrofia']::text[], 'Adução horizontal de ombros', 'Exercício isolado para peitoral em máquina.'),
  ('Crossover na polia', array['Crossover na polia', 'Crossover', 'Crossover alto', 'Crossover baixo']::text[], 'Peito', array['peitoral', 'deltoides']::text[], 'Polias e pegadores', array['cabos']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Posicione-se entre as polias e dê um passo à frente.', 'Traga as mãos à frente do tronco com cotovelos levemente flexionados.', 'Retorne de forma controlada sem forçar os ombros.'), array['hipertrofia']::text[], 'Adução horizontal de ombros', 'Exercício isolado de peitoral com tensão contínua da polia.'),
  ('Flexão de braços', array['Flexão de braços', 'Flexão tradicional', 'Flexão']::text[], 'Peito', array['peitoral', 'deltoides', 'tríceps']::text[], 'Peso corporal', array['peso corporal']::text[], 'Iniciante', 'Academia e calistenia', 'composto', 3::smallint, '8-15', jsonb_build_array('Apoie mãos e pés no chão e mantenha o corpo alinhado.', 'Desça o peito em direção ao chão com cotovelos controlados.', 'Empurre o chão para voltar sem deixar o quadril cair.'), array['forca', 'hipertrofia', 'resistencia']::text[], 'Empurrar horizontal', 'Exercício composto de peso corporal para peitoral, deltoides e tríceps.'),

  ('Puxada frontal na polia', array['Puxada frontal na polia', 'Puxada frontal', 'Puxada pela frente']::text[], 'Costas', array['dorsais', 'bíceps', 'romboides']::text[], 'Polia alta e barra', array['cabos', 'máquinas']::text[], 'Iniciante', 'Academia', 'composto', 3::smallint, '8-12', jsonb_build_array('Sente-se com as coxas firmes sob o apoio.', 'Puxe a barra à frente em direção à parte alta do peito.', 'Estenda os braços devagar sem balançar o tronco.'), array['forca', 'hipertrofia']::text[], 'Puxar vertical', 'Exercício composto de puxada vertical para dorsais.'),
  ('Remada baixa', array['Remada baixa']::text[], 'Costas', array['dorsais', 'romboides', 'bíceps']::text[], 'Polia baixa e pegador', array['cabos', 'máquinas']::text[], 'Iniciante', 'Academia', 'composto', 3::smallint, '8-12', jsonb_build_array('Sente-se com coluna neutra e joelhos levemente flexionados.', 'Puxe o pegador em direção ao abdômen sem inclinar o tronco.', 'Estenda os braços controlando o retorno.'), array['forca', 'hipertrofia']::text[], 'Puxar horizontal', 'Exercício composto para dorsais e parte média das costas.'),
  ('Remada curvada com barra', array['Remada curvada com barra', 'Remada curvada']::text[], 'Costas', array['dorsais', 'romboides', 'trapézio', 'bíceps']::text[], 'Barra', array['barra']::text[], 'Intermediário', 'Academia', 'composto', 3::smallint, '8-12', jsonb_build_array('Segure a barra e incline o tronco mantendo a coluna neutra.', 'Puxe a barra em direção ao abdômen com cotovelos próximos ao corpo.', 'Desça a barra devagar sem arredondar as costas.'), array['forca', 'hipertrofia']::text[], 'Puxar horizontal', 'Exercício composto de costas; exige controle do tronco e da posição lombar.'),
  ('Remada unilateral com halter', array['Remada unilateral com halter', 'Remada unilateral']::text[], 'Costas', array['dorsais', 'romboides', 'bíceps']::text[], 'Halter e banco de apoio', array['halteres', 'banco']::text[], 'Iniciante', 'Academia', 'composto', 3::smallint, '8-12 por lado', jsonb_build_array('Apoie uma mão e um joelho no banco, mantendo as costas neutras.', 'Puxe o halter em direção ao quadril sem girar o tronco.', 'Desça com controle e repita do outro lado.'), array['forca', 'hipertrofia']::text[], 'Puxar horizontal unilateral', 'Variação unilateral de remada para costas.'),
  ('Barra fixa', array['Barra fixa', 'Pull-up']::text[], 'Costas', array['dorsais', 'bíceps', 'antebraços']::text[], 'Barra fixa', array['peso corporal', 'barra fixa']::text[], 'Intermediário', 'Academia e calistenia', 'composto', 3::smallint, '5-10', jsonb_build_array('Segure a barra com pegada pronada e braços estendidos.', 'Puxe o corpo até o queixo ultrapassar a barra, sem embalar.', 'Desça com controle; use assistência se necessário.'), array['forca', 'hipertrofia', 'calistenia']::text[], 'Puxar vertical', 'Exercício composto de peso corporal para dorsais e flexores do cotovelo.'),

  ('Desenvolvimento com halteres', array['Desenvolvimento com halteres', 'Desenvolvimento na máquina']::text[], 'Ombros', array['deltoides', 'tríceps']::text[], 'Halteres ou máquina', array['halteres', 'máquinas']::text[], 'Iniciante', 'Academia', 'composto', 3::smallint, '8-12', jsonb_build_array('Sente-se ou fique em pé com o tronco firme.', 'Empurre os halteres acima da cabeça sem arquear a lombar.', 'Desça até uma amplitude confortável.'), array['forca', 'hipertrofia']::text[], 'Empurrar vertical', 'Exercício composto para deltoides e tríceps.'),
  ('Elevação lateral com halteres', array['Elevação lateral com halteres', 'Elevação lateral']::text[], 'Ombros', array['deltoides', 'trapézio']::text[], 'Halteres', array['halteres']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Fique em pé com halteres ao lado do corpo e cotovelos levemente flexionados.', 'Eleve os braços lateralmente até uma altura confortável.', 'Desça devagar sem usar impulso.'), array['hipertrofia']::text[], 'Abdução de ombros', 'Exercício isolado com foco na porção lateral dos deltoides.'),
  ('Elevação lateral na polia', array['Elevação lateral na polia', 'Elevação lateral no cabo']::text[], 'Ombros', array['deltoides']::text[], 'Polia baixa e pegador', array['cabos']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15 por lado', jsonb_build_array('Fique ao lado da polia baixa e segure o pegador com a mão oposta.', 'Eleve o braço lateralmente com o cotovelo levemente flexionado.', 'Retorne devagar e repita do outro lado.'), array['hipertrofia']::text[], 'Abdução de ombros', 'Variação de elevação lateral com tensão contínua da polia.'),
  ('Crucifixo inverso na máquina', array['Crucifixo inverso na máquina', 'Crucifixo inverso', 'Reverse pec deck']::text[], 'Ombros', array['deltoides', 'romboides', 'trapézio']::text[], 'Máquina peck deck reversa', array['máquinas']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Ajuste a máquina e apoie o peito no encosto, se disponível.', 'Abra os braços para trás sem elevar os ombros.', 'Retorne com controle à posição inicial.'), array['hipertrofia']::text[], 'Abdução horizontal de ombros', 'Exercício isolado para deltoide posterior e parte alta das costas.'),
  ('Face pull', array['Face pull']::text[], 'Ombros', array['deltoides', 'trapézio', 'romboides']::text[], 'Polia alta e corda', array['cabos']::text[], 'Iniciante', 'Academia', 'composto', 3::smallint, '10-15', jsonb_build_array('Ajuste a polia na altura do rosto e segure a corda.', 'Puxe em direção ao rosto, separando as mãos e mantendo cotovelos elevados.', 'Retorne devagar sem perder a postura.'), array['hipertrofia', 'postura']::text[], 'Puxar horizontal alto', 'Puxada para deltoides posteriores e musculatura escapular.'),

  ('Rosca direta com barra', array['Rosca direta com barra', 'Rosca direta']::text[], 'Bíceps', array['bíceps', 'antebraços']::text[], 'Barra reta ou EZ', array['barra']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '8-12', jsonb_build_array('Fique em pé com cotovelos próximos ao tronco.', 'Flexione os cotovelos para elevar a barra sem balançar o corpo.', 'Desça até quase estender os braços, controlando a carga.'), array['hipertrofia', 'forca']::text[], 'Flexão de cotovelo supinada', 'Exercício isolado clássico para bíceps.'),
  ('Rosca alternada com halteres', array['Rosca alternada com halteres', 'Rosca alternada']::text[], 'Bíceps', array['bíceps', 'antebraços']::text[], 'Halteres', array['halteres']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '8-12 por lado', jsonb_build_array('Segure um halter em cada mão com braços ao lado do corpo.', 'Flexione um cotovelo por vez, girando a palma para cima se confortável.', 'Desça devagar e alterne os lados sem balançar o tronco.'), array['hipertrofia']::text[], 'Flexão de cotovelo alternada', 'Variação unilateral de rosca para bíceps.'),
  ('Rosca martelo', array['Rosca martelo']::text[], 'Bíceps', array['bíceps', 'antebraços']::text[], 'Halteres', array['halteres']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '8-12', jsonb_build_array('Segure os halteres com as palmas voltadas uma para a outra.', 'Flexione os cotovelos sem afastá-los do tronco.', 'Retorne devagar mantendo a pegada neutra.'), array['hipertrofia']::text[], 'Flexão de cotovelo neutra', 'Trabalha bíceps e braquial com pegada neutra.'),
  ('Rosca Scott', array['Rosca Scott']::text[], 'Bíceps', array['bíceps', 'antebraços']::text[], 'Banco Scott e barra ou halteres', array['banco', 'barra', 'halteres']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '8-12', jsonb_build_array('Ajuste o banco e apoie os braços no suporte.', 'Flexione os cotovelos para subir a carga sem tirar os braços do apoio.', 'Desça controlando e evite travar os cotovelos.'), array['hipertrofia']::text[], 'Flexão de cotovelo apoiada', 'Rosca isolada com apoio para reduzir balanço do tronco.'),

  ('Tríceps na polia com corda', array['Tríceps na polia com corda', 'Tríceps corda', 'Tríceps pulley']::text[], 'Tríceps', array['tríceps']::text[], 'Polia alta e corda', array['cabos']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Fique em pé diante da polia com cotovelos junto ao corpo.', 'Estenda os cotovelos e afaste levemente as pontas da corda no final.', 'Retorne devagar sem mover os braços para a frente.'), array['hipertrofia']::text[], 'Extensão de cotovelo', 'Exercício isolado de tríceps na polia.'),
  ('Tríceps testa', array['Tríceps testa']::text[], 'Tríceps', array['tríceps']::text[], 'Barra EZ ou halteres e banco', array['barra', 'halteres', 'banco']::text[], 'Intermediário', 'Academia', 'isolado', 3::smallint, '8-12', jsonb_build_array('Deite no banco e mantenha os braços apontados para cima.', 'Flexione os cotovelos levando a carga em direção à testa, sem abrir excessivamente.', 'Estenda os cotovelos com controle e carga confortável.'), array['hipertrofia']::text[], 'Extensão de cotovelo deitado', 'Exercício isolado de tríceps; use carga controlável e amplitude confortável.'),
  ('Tríceps francês', array['Tríceps francês']::text[], 'Tríceps', array['tríceps']::text[], 'Halter ou polia', array['halteres', 'cabos']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Segure a carga acima da cabeça com braços próximos às orelhas.', 'Flexione os cotovelos levando a carga atrás da cabeça.', 'Estenda os braços sem arquear a lombar.'), array['hipertrofia']::text[], 'Extensão de cotovelo acima da cabeça', 'Exercício isolado de tríceps em posição acima da cabeça.'),
  ('Supino fechado', array['Supino fechado']::text[], 'Tríceps', array['tríceps', 'peitoral', 'deltoides']::text[], 'Barra e banco reto', array['barra', 'banco']::text[], 'Intermediário', 'Academia', 'composto', 3::smallint, '6-10', jsonb_build_array('Deite no banco e segure a barra com pegada confortável, um pouco mais fechada que o supino comum.', 'Desça a barra com cotovelos próximos ao tronco.', 'Empurre de volta sem perder o controle dos ombros.'), array['forca', 'hipertrofia']::text[], 'Empurrar horizontal com ênfase em tríceps', 'Exercício composto que enfatiza tríceps e também recruta peitoral e deltoides.'),

  ('Rosca inversa', array['Rosca inversa']::text[], 'Antebraços', array['antebraços', 'bíceps']::text[], 'Barra EZ ou barra reta', array['barra']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Segure a barra com pegada pronada e punhos alinhados.', 'Flexione os cotovelos mantendo a pegada voltada para baixo.', 'Desça controlando sem dobrar excessivamente os punhos.'), array['hipertrofia']::text[], 'Flexão de cotovelo pronada', 'Exercício para extensores do antebraço e braquiorradial.'),
  ('Flexão de punhos', array['Flexão de punhos', 'Rosca de punho']::text[], 'Antebraços', array['antebraços']::text[], 'Halteres ou barra e banco', array['halteres', 'barra', 'banco']::text[], 'Iniciante', 'Academia', 'isolado', 2::smallint, '12-20', jsonb_build_array('Apoie os antebraços nas coxas ou no banco com palmas voltadas para cima.', 'Flexione os punhos para elevar a carga em amplitude confortável.', 'Retorne devagar sem tirar os antebraços do apoio.'), array['hipertrofia']::text[], 'Flexão de punho', 'Exercício isolado para flexores do punho e antebraço.'),
  ('Extensão de punhos', array['Extensão de punhos', 'Extensão de punho']::text[], 'Antebraços', array['antebraços']::text[], 'Halteres ou barra e banco', array['halteres', 'barra', 'banco']::text[], 'Iniciante', 'Academia', 'isolado', 2::smallint, '12-20', jsonb_build_array('Apoie os antebraços com palmas voltadas para baixo.', 'Eleve o dorso das mãos estendendo os punhos em amplitude confortável.', 'Retorne lentamente sem mover os antebraços.'), array['hipertrofia']::text[], 'Extensão de punho', 'Exercício isolado para extensores do punho e antebraço.'),

  ('Agachamento livre', array['Agachamento livre']::text[], 'Quadríceps', array['quadríceps', 'glúteos', 'posteriores']::text[], 'Barra e rack ou peso corporal', array['barra', 'rack', 'peso corporal']::text[], 'Intermediário', 'Academia', 'composto', 3::smallint, '6-10', jsonb_build_array('Posicione a barra com segurança e firme os pés no chão.', 'Flexione quadris e joelhos mantendo o tronco estável e amplitude confortável.', 'Empurre o chão para subir sem deixar os joelhos colapsarem para dentro.'), array['forca', 'hipertrofia']::text[], 'Agachamento', 'Exercício composto para quadríceps e glúteos; adapte carga e amplitude à experiência.'),
  ('Leg press 45°', array['Leg press 45°']::text[], 'Quadríceps', array['quadríceps', 'glúteos']::text[], 'Máquina leg press 45°', array['máquinas']::text[], 'Iniciante', 'Academia', 'composto', 3::smallint, '8-12', jsonb_build_array('Ajuste o assento e apoie os pés na plataforma.', 'Desça a plataforma controlando e sem retirar a lombar do encosto.', 'Empurre sem travar os joelhos.'), array['forca', 'hipertrofia']::text[], 'Extensão de quadril e joelho', 'Exercício composto para quadríceps e glúteos em máquina.'),
  ('Cadeira extensora', array['Cadeira extensora']::text[], 'Quadríceps', array['quadríceps']::text[], 'Máquina cadeira extensora', array['máquinas']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Ajuste o encosto e o rolo acima dos tornozelos.', 'Estenda os joelhos sem impulsionar o tronco.', 'Retorne devagar antes de a pilha de pesos repousar.'), array['hipertrofia']::text[], 'Extensão de joelho', 'Exercício isolado para quadríceps em máquina.'),
  ('Afundo com halteres', array['Afundo com halteres', 'Afundo', 'Passada']::text[], 'Quadríceps', array['quadríceps', 'glúteos']::text[], 'Halteres', array['halteres']::text[], 'Intermediário', 'Academia', 'composto', 3::smallint, '8-12 por lado', jsonb_build_array('Fique em pé segurando halteres e mantenha espaço para avançar.', 'Dê um passo e flexione os joelhos mantendo equilíbrio e tronco firme.', 'Empurre o chão para retornar e alterne os lados.'), array['forca', 'hipertrofia']::text[], 'Afundo unilateral', 'Exercício composto unilateral para quadríceps e glúteos.'),

  ('Mesa flexora', array['Mesa flexora']::text[], 'Posterior de coxa', array['posteriores']::text[], 'Máquina mesa flexora', array['máquinas']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Ajuste o rolo próximo aos tornozelos e apoie o quadril.', 'Flexione os joelhos levando os calcanhares em direção aos glúteos.', 'Retorne devagar sem soltar a carga.'), array['hipertrofia']::text[], 'Flexão de joelho', 'Exercício isolado para posteriores de coxa em posição deitada.'),
  ('Cadeira flexora', array['Cadeira flexora']::text[], 'Posterior de coxa', array['posteriores']::text[], 'Máquina cadeira flexora', array['máquinas']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Ajuste os apoios e mantenha as costas junto ao encosto.', 'Flexione os joelhos puxando o rolo para baixo.', 'Retorne com controle à posição inicial.'), array['hipertrofia']::text[], 'Flexão de joelho', 'Exercício isolado para posteriores de coxa sentado.'),
  ('Levantamento terra romeno', array['Levantamento terra romeno']::text[], 'Posterior de coxa', array['posteriores', 'glúteos', 'eretores da coluna']::text[], 'Barra ou halteres', array['barra', 'halteres']::text[], 'Intermediário', 'Academia', 'composto', 3::smallint, '6-10', jsonb_build_array('Segure a carga à frente das coxas e mantenha os joelhos levemente flexionados.', 'Leve o quadril para trás mantendo a coluna neutra e a carga perto das pernas.', 'Estenda o quadril para subir sem hiperestender a lombar.'), array['forca', 'hipertrofia']::text[], 'Hinge de quadril', 'Exercício composto de hinge para posteriores e glúteos; priorize técnica.'),
  ('Stiff com halteres', array['Stiff com halteres', 'Stiff']::text[], 'Posterior de coxa', array['posteriores', 'glúteos']::text[], 'Halteres', array['halteres']::text[], 'Intermediário', 'Academia', 'composto', 3::smallint, '8-12', jsonb_build_array('Segure os halteres junto às coxas e mantenha os joelhos levemente flexionados.', 'Desça levando o quadril para trás até sentir alongamento confortável nos posteriores.', 'Suba estendendo o quadril e mantendo a carga próxima ao corpo.'), array['hipertrofia']::text[], 'Hinge de quadril', 'Variação de hinge para posteriores e glúteos com halteres.'),

  ('Elevação pélvica', array['Elevação pélvica', 'Hip thrust']::text[], 'Glúteos', array['glúteos', 'posteriores']::text[], 'Banco e barra ou halter', array['banco', 'barra', 'halteres']::text[], 'Iniciante', 'Academia', 'composto', 3::smallint, '8-12', jsonb_build_array('Apoie as costas no banco e posicione a carga sobre o quadril com proteção.', 'Eleve o quadril contraindo os glúteos sem arquear a lombar.', 'Desça controlando até uma amplitude confortável.'), array['forca', 'hipertrofia']::text[], 'Extensão de quadril', 'Exercício composto com ênfase em glúteos.'),
  ('Cadeira abdutora', array['Cadeira abdutora', 'Abdução de quadril']::text[], 'Glúteos', array['glúteos']::text[], 'Máquina cadeira abdutora', array['máquinas']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '12-20', jsonb_build_array('Ajuste a máquina e mantenha o tronco estável.', 'Afaste as pernas contra a resistência sem usar impulso.', 'Retorne devagar mantendo tensão controlada.'), array['hipertrofia']::text[], 'Abdução de quadril', 'Exercício isolado para glúteos e abdutores do quadril.'),
  ('Ponte de glúteos', array['Ponte de glúteos', 'Glute bridge', 'Glute bridge bilateral']::text[], 'Glúteos', array['glúteos', 'posteriores']::text[], 'Peso corporal ou halter', array['peso corporal', 'halteres']::text[], 'Iniciante', 'Academia e calistenia', 'composto', 3::smallint, '10-15', jsonb_build_array('Deite de costas com joelhos flexionados e pés apoiados.', 'Eleve o quadril contraindo os glúteos sem arquear a lombar.', 'Desça devagar até próximo ao chão.'), array['forca', 'hipertrofia']::text[], 'Extensão de quadril', 'Exercício composto de peso corporal para glúteos.'),
  ('Coice de glúteo na polia', array['Coice de glúteo na polia', 'Coice no cabo']::text[], 'Glúteos', array['glúteos', 'posteriores']::text[], 'Polia baixa e tornozeleira', array['cabos', 'tornozeleira']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15 por lado', jsonb_build_array('Prenda a tornozeleira e apoie-se para manter equilíbrio.', 'Leve a perna para trás sem girar o quadril nem arquear a lombar.', 'Retorne devagar e troque de lado.'), array['hipertrofia']::text[], 'Extensão de quadril unilateral', 'Exercício isolado de extensão de quadril para glúteos.'),

  ('Panturrilha em pé', array['Panturrilha em pé']::text[], 'Panturrilhas', array['panturrilhas']::text[], 'Máquina ou degrau', array['máquinas', 'peso corporal']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Apoie a parte da frente dos pés e mantenha os joelhos estendidos sem travá-los.', 'Eleve os calcanhares e faça uma pausa breve no alto.', 'Desça controlando até uma amplitude confortável.'), array['hipertrofia']::text[], 'Flexão plantar em pé', 'Exercício isolado para panturrilhas em pé.'),
  ('Panturrilha sentado', array['Panturrilha sentado']::text[], 'Panturrilhas', array['panturrilhas']::text[], 'Máquina de panturrilha sentada', array['máquinas']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Ajuste o apoio sobre as coxas e posicione a frente dos pés na plataforma.', 'Eleve os calcanhares sem tirar os pés da plataforma.', 'Desça lentamente alongando a panturrilha confortavelmente.'), array['hipertrofia']::text[], 'Flexão plantar sentado', 'Exercício isolado para panturrilhas sentado.'),
  ('Panturrilha no leg press', array['Panturrilha no leg press']::text[], 'Panturrilhas', array['panturrilhas']::text[], 'Máquina leg press', array['máquinas']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Posicione a ponta dos pés na plataforma com pernas quase estendidas.', 'Empurre a plataforma movendo apenas os tornozelos.', 'Retorne devagar sem deixar os calcanhares despencarem.'), array['hipertrofia']::text[], 'Flexão plantar', 'Exercício isolado para panturrilhas no leg press.'),

  ('Abdominal crunch', array['Abdominal crunch', 'Crunch', 'Abdominal tradicional']::text[], 'Abdômen', array['abdômen']::text[], 'Peso corporal ou colchonete', array['peso corporal', 'colchonete']::text[], 'Iniciante', 'Academia e calistenia', 'isolado', 3::smallint, '10-20', jsonb_build_array('Deite de costas com joelhos flexionados e mãos apoiadas levemente junto à cabeça ou ao peito.', 'Eleve o tronco contraindo o abdômen sem puxar o pescoço.', 'Desça devagar mantendo controle.'), array['resistencia', 'estabilidade']::text[], 'Flexão de tronco', 'Exercício para o reto abdominal; evite puxar a cabeça com as mãos.'),
  ('Elevação de pernas', array['Elevação de pernas', 'Elevação de joelhos']::text[], 'Abdômen', array['abdômen', 'flexores do quadril']::text[], 'Peso corporal ou barra fixa', array['peso corporal', 'barra fixa']::text[], 'Iniciante', 'Academia e calistenia', 'composto', 3::smallint, '8-15', jsonb_build_array('Deite de costas ou pendure-se com pegada estável, conforme a variação escolhida.', 'Eleve as pernas sem embalar e mantendo o tronco controlado.', 'Desça devagar sem relaxar de forma abrupta.'), array['resistencia', 'estabilidade']::text[], 'Flexão de quadril e controle abdominal', 'Exercício de peso corporal para abdômen e flexores do quadril.'),
  ('Prancha', array['Prancha']::text[], 'Abdômen', array['abdômen', 'oblíquos']::text[], 'Peso corporal e colchonete', array['peso corporal', 'colchonete']::text[], 'Iniciante', 'Academia e calistenia', 'isolado', 3::smallint, '20-60 segundos', jsonb_build_array('Apoie antebraços e pés mantendo cabeça, tronco e quadril alinhados.', 'Contraia o abdômen e respire sem deixar o quadril cair.', 'Encerre a posição quando perder o alinhamento.'), array['resistencia', 'estabilidade']::text[], 'Anti-extensão isométrica', 'Isometria para estabilidade do tronco; tempo é uma sugestão ajustável.'),
  ('Abdominal na polia', array['Abdominal na polia', 'Abdominal no cabo']::text[], 'Abdômen', array['abdômen']::text[], 'Polia alta e corda', array['cabos']::text[], 'Iniciante', 'Academia', 'isolado', 3::smallint, '10-15', jsonb_build_array('Ajoelhe-se diante da polia e segure a corda junto à cabeça.', 'Flexione o tronco contraindo o abdômen sem puxar com os braços.', 'Retorne devagar sem deixar a carga puxar o corpo.'), array['hipertrofia', 'estabilidade']::text[], 'Flexão de tronco resistida', 'Exercício isolado de abdômen com resistência ajustável da polia.')
) as curated(
  name, match_names, category, muscles, equipment, equipment_options, difficulty,
  modality, exercise_type, suggested_sets, suggested_reps, instructions, objectives,
  movement_pattern, description
);

create temporary table motionfit_curated_exercise_matches (
  name text primary key,
  exercise_id uuid not null unique
) on commit drop;

insert into motionfit_curated_exercise_matches (name, exercise_id)
select curated.name, candidate.id
from motionfit_curated_exercises curated
join lateral (
  select exercise.id
  from public.exercises exercise
  where lower(exercise.name) = any (
    select lower(alias)
    from unnest(curated.match_names) as aliases(alias)
  )
  order by (lower(exercise.name) = lower(curated.name)) desc, exercise.created_at, exercise.id
  limit 1
) candidate on true;

update public.exercises exercise
set name = curated.name,
    category = curated.category,
    muscle_group = curated.category,
    muscles = curated.muscles,
    equipment = curated.equipment,
    equipment_options = curated.equipment_options,
    difficulty = curated.difficulty,
    modality = curated.modality,
    exercise_type = curated.exercise_type,
    suggested_sets = curated.suggested_sets,
    suggested_reps = curated.suggested_reps,
    objectives = curated.objectives,
    movement_pattern = curated.movement_pattern,
    instructions = curated.instructions,
    description = curated.description
from motionfit_curated_exercises curated
join motionfit_curated_exercise_matches matches on matches.name = curated.name
where exercise.id = matches.exercise_id;

with inserted as (
  insert into public.exercises (
    name, category, muscle_group, muscles, equipment, equipment_options,
    difficulty, modality, exercise_type, suggested_sets, suggested_reps,
    objectives, movement_pattern, instructions, description, active
  )
  select
    curated.name, curated.category, curated.category, curated.muscles,
    curated.equipment, curated.equipment_options, curated.difficulty,
    curated.modality, curated.exercise_type, curated.suggested_sets,
    curated.suggested_reps, curated.objectives, curated.movement_pattern,
    curated.instructions, curated.description, true
  from motionfit_curated_exercises curated
  where not exists (
    select 1
    from motionfit_curated_exercise_matches matches
    where matches.name = curated.name
  )
  returning id, name
)
insert into motionfit_curated_exercise_matches (name, exercise_id)
select name, id from inserted;

update public.exercises exercise
set active = exists (
  select 1
  from motionfit_curated_exercise_matches matches
  where matches.exercise_id = exercise.id
)
where exercise.active is distinct from exists (
  select 1
  from motionfit_curated_exercise_matches matches
  where matches.exercise_id = exercise.id
);

create index if not exists idx_exercises_active_category
  on public.exercises(active, category);

commit;
