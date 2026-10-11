import { useState } from 'react';
import { supabase } from '../lib/supabase';

const trainingOptions = ['Musculação', 'Funcional', 'HIIT', 'Cardio', 'Mobilidade', 'Esportes'];

const initialAnswers = {
  objective: '',
  training_preferences: [],
  experience_level: '',
  weekly_frequency: '',
  available_time: '',
  training_location: '',
  equipment: 'Academia completa',
  gender: '',
  age: '',
  experience_months: '0',
  limitations: [],
  height_cm: '',
  weight_kg: '',
};

export default function PesquisaModal({ isOpen, userId, initialValues, onComplete }) {
  const [answers, setAnswers] = useState(() => ({ ...initialAnswers, ...initialValues }));
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const updateAnswer = (field, value) => {
    setAnswers((current) => ({ ...current, [field]: value }));
  };

  const togglePreference = (preference) => {
    setAnswers((current) => ({
      ...current,
      training_preferences: current.training_preferences.includes(preference)
        ? current.training_preferences.filter((item) => item !== preference)
        : [...current.training_preferences, preference],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (answers.training_preferences.length === 0) {
      setErrorMessage('Selecione pelo menos um tipo de treino.');
      return;
    }

    if (!answers.gender || !answers.age || !answers.height_cm || !answers.weight_kg || answers.experience_months === '') {
      setErrorMessage('Informe idade, experiência, sexo, altura e peso para continuar.');
      return;
    }

    setIsSaving(true);
    setErrorMessage('');

    const { data, error } = await supabase
      .from('pesquisa')
      .upsert({
        user_id: userId,
        ...answers,
        age: Number(answers.age),
        experience_months: Number(answers.experience_months),
        height_cm: Number(answers.height_cm),
        weight_kg: Number(answers.weight_kg),
      }, { onConflict: 'user_id' })
      .select()
      .single();

    setIsSaving(false);

    if (error) {
      setErrorMessage('Não foi possível salvar. Confirme se a migração da tabela pesquisa foi aplicada no Supabase.');
      return;
    }

    onComplete(data);
  };

  const selectClassName = 'w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-400';
  const labelClassName = 'mb-1.5 block text-xs font-semibold text-slate-300';

  return (
    <div className="safe-overlay fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/80 backdrop-blur-sm">
      <section className="my-auto max-h-full w-full max-w-2xl overflow-y-auto border border-cyan-500/30 bg-[#080c16] p-5 text-white shadow-[0_0_45px_rgba(0,224,255,0.12)] sm:p-7">
        <header className="mb-6 border-b border-slate-800 pb-4">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-cyan-300">MotionFit · personalização</p>
          <h1 className="text-xl font-bold">O que você quer alcançar?</h1>
          <p className="mt-1 text-sm text-slate-400">Suas respostas vão orientar os treinos e recomendações exibidos no site.</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className={labelClassName} htmlFor="survey-objective">Qual é seu principal objetivo?</label>
            <select id="survey-objective" className={selectClassName} required value={answers.objective} onChange={(event) => updateAnswer('objective', event.target.value)}>
              <option value="">Selecione um objetivo</option>
              <option value="Emagrecer">Emagrecer</option>
              <option value="Ganhar massa muscular">Ganhar massa muscular</option>
              <option value="Melhorar o condicionamento">Melhorar o condicionamento</option>
              <option value="Aumentar força">Aumentar força</option>
              <option value="Ter mais saúde e disposição">Ter mais saúde e disposição</option>
              <option value="Manter a forma">Manter a forma</option>
            </select>
          </div>

          <fieldset>
            <legend className={labelClassName}>Que tipos de treino você procura?</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {trainingOptions.map((preference) => (
                <label key={preference} className="flex cursor-pointer items-center gap-2 border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <input type="checkbox" checked={answers.training_preferences.includes(preference)} onChange={() => togglePreference(preference)} className="accent-cyan-400" />
                  {preference}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClassName} htmlFor="survey-gender">Sexo para recomendações de treino</label>
              <select id="survey-gender" className={selectClassName} required value={answers.gender} onChange={(event) => updateAnswer('gender', event.target.value)}>
                <option value="">Selecione</option>
                <option value="Mulher">Mulher</option>
                <option value="Homem">Homem</option>
                <option value="Prefiro não informar">Prefiro não informar</option>
              </select>
            </div>
            <div>
              <label className={labelClassName} htmlFor="survey-age">Idade</label>
              <input id="survey-age" className={selectClassName} type="number" min="13" max="100" step="1" required value={answers.age} onChange={(event) => updateAnswer('age', event.target.value)} placeholder="Ex.: 18" />
            </div>
            <div>
              <label className={labelClassName} htmlFor="survey-experience">Tempo de experiência</label>
              <select id="survey-experience" className={selectClassName} required value={answers.experience_months} onChange={(event) => updateAnswer('experience_months', event.target.value)}>
                <option value="0">Ainda não treino</option>
                <option value="3">1 a 3 meses</option>
                <option value="6">4 a 6 meses</option>
                <option value="12">7 a 12 meses</option>
                <option value="24">1 a 2 anos</option>
                <option value="36">Mais de 2 anos</option>
              </select>
            </div>
            <div>
              <label className={labelClassName} htmlFor="survey-height">Altura (cm)</label>
              <input id="survey-height" className={selectClassName} type="number" min="100" max="250" step="0.1" required value={answers.height_cm} onChange={(event) => updateAnswer('height_cm', event.target.value)} placeholder="Ex.: 170" />
            </div>
            <div>
              <label className={labelClassName} htmlFor="survey-weight">Peso (kg)</label>
              <input id="survey-weight" className={selectClassName} type="number" min="30" max="300" step="0.1" required value={answers.weight_kg} onChange={(event) => updateAnswer('weight_kg', event.target.value)} placeholder="Ex.: 70" />
            </div>
            <div>
              <label className={labelClassName} htmlFor="survey-equipment">Equipamentos disponíveis</label>
              <select id="survey-equipment" className={selectClassName} required value={answers.equipment} onChange={(event) => updateAnswer('equipment', event.target.value)}>
                <option>Academia completa</option>
                <option>Halteres em casa</option>
                <option>Peso corporal</option>
                <option>Elásticos</option>
                <option>Sem equipamento</option>
              </select>
            </div>
            <div>
              <label className={labelClassName} htmlFor="survey-level">Seu nível de experiência</label>
              <select id="survey-level" className={selectClassName} required value={answers.experience_level} onChange={(event) => updateAnswer('experience_level', event.target.value)}>
                <option value="">Selecione</option>
                <option value="Iniciante">Iniciante</option>
                <option value="Intermediário">Intermediário</option>
                <option value="Avançado">Avançado</option>
              </select>
            </div>
            <div>
              <label className={labelClassName} htmlFor="survey-frequency">Quantas vezes por semana?</label>
              <select id="survey-frequency" className={selectClassName} required value={answers.weekly_frequency} onChange={(event) => updateAnswer('weekly_frequency', event.target.value)}>
                <option value="">Selecione</option>
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
              <label className={labelClassName} htmlFor="survey-duration">Quanto tempo por treino?</label>
              <select id="survey-duration" className={selectClassName} required value={answers.available_time} onChange={(event) => updateAnswer('available_time', event.target.value)}>
                <option value="">Selecione</option>
                <option value="Até 30 minutos">Até 30 minutos</option>
                <option value="30-60 minutos">30-60 minutos</option>
                <option value="Mais de 60 minutos">Mais de 60 minutos</option>
              </select>
            </div>
            <div>
              <label className={labelClassName} htmlFor="survey-location">Onde pretende treinar?</label>
              <select id="survey-location" className={selectClassName} required value={answers.training_location} onChange={(event) => updateAnswer('training_location', event.target.value)}>
                <option value="">Selecione</option>
                <option value="Em casa">Em casa</option>
                <option value="Na academia">Na academia</option>
                <option value="Ao ar livre">Ao ar livre</option>
                <option value="Em casa e na academia">Em casa e na academia</option>
              </select>
            </div>
          </div>

          <fieldset>
            <legend className={labelClassName}>Alguma limitação que o treino deve considerar? (opcional)</legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {['Nenhuma', 'Joelho', 'Coluna', 'Ombro', 'Punho ou cotovelo', 'Outra limitação'].map((limitation) => (
                <label key={limitation} className="flex cursor-pointer items-center gap-2 rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-slate-200">
                  <input
                    type="checkbox"
                    checked={limitation === 'Nenhuma' ? answers.limitations.length === 0 : answers.limitations.includes(limitation)}
                    onChange={() => updateAnswer('limitations', limitation === 'Nenhuma' ? [] : answers.limitations.includes(limitation) ? answers.limitations.filter((item) => item !== limitation) : [...answers.limitations.filter((item) => item !== 'Nenhuma'), limitation])}
                    className="accent-cyan-400"
                  />
                  {limitation}
                </label>
              ))}
            </div>
          </fieldset>

          {errorMessage && <p role="alert" className="text-sm text-rose-300">{errorMessage}</p>}

          <button type="submit" disabled={isSaving} className="w-full bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-wait disabled:opacity-60">
            {isSaving ? 'Salvando respostas...' : 'Salvar e continuar'}
          </button>
        </form>
      </section>
    </div>
  );
}