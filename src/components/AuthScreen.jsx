import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function AuthScreen() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!supabase) {
      setMessage('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para autenticar.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setMessage('Login realizado com sucesso.');
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      setMessage('Conta criada. Verifique o e-mail para confirmar o cadastro.');
    } catch (error) {
      setMessage(error.message || 'Erro ao autenticar com Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050508] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-cyan-500/20 bg-[#0b0e1b] p-6 shadow-[0_0_30px_rgba(0,224,255,0.12)]">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-br from-[#0c132c] to-[#04060b] text-2xl shadow-[0_0_15px_rgba(0,162,255,0.25)]">
            M
          </div>
          <h1 className="text-2xl font-black tracking-[0.08em] text-white">MOTION<span className="text-cyan-400">FIT</span></h1>
          <p className="mt-2 text-sm text-slate-400">
            {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
          </p>
        </div>

        <div className="mb-5 flex rounded-full border border-slate-700 bg-slate-900/80 p-1">
          <button
            type="button"
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
              mode === 'login' ? 'bg-cyan-500 text-white shadow-[0_0_16px_rgba(6,182,212,0.4)]' : 'text-slate-400'
            }`}
            onClick={() => setMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={`flex-1 rounded-full px-3 py-2 text-sm font-semibold transition ${
              mode === 'signup' ? 'bg-cyan-500 text-white shadow-[0_0_16px_rgba(6,182,212,0.4)]' : 'text-slate-400'
            }`}
            onClick={() => setMode('signup')}
          >
            Cadastrar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Nome</label>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400"
                placeholder="Seu nome"
              />
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-400">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              minLength={6}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-white outline-none transition focus:border-cyan-400"
              placeholder="••••••••"
            />
          </div>

          {message && <p className="text-xs text-cyan-300">{message}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-sky-700 px-4 py-3 text-sm font-bold text-white shadow-[0_0_20px_rgba(0,140,255,0.5)] transition hover:opacity-95 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loading ? 'Processando...' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>
      </div>
    </div>
  );
}
