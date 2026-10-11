import React, { useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [nome, setNome] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isSupabaseConfigured || !supabase) {
      setMessage('Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY para autenticar.');
      return;
    }

    try {
      setLoading(true);
      setMessage('');

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password: senha,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: nome,
          },
        },
      });

      if (error) throw error;
      setMessage('Conta criada. Verifique seu e-mail para confirmar a conta.');
    } catch (error) {
      setMessage(error.message || 'Erro ao autenticar com o Supabase.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        
        {/* Cabeçalho / Logo */}
        <div style={styles.header}>
          <div style={styles.logoIcon}>⚡</div>
          <h1 style={styles.title}>MOTIONFIT</h1>
          <p style={styles.subtitle}>{mode === 'login' ? 'Entre para acessar sua jornada de treinos' : 'Crie sua conta para começar'}</p>
        </div>

        <div style={styles.tabContainer}>
          <button
            type="button"
            onClick={() => setMode('login')}
            style={{ ...styles.tabButton, ...(mode === 'login' ? styles.tabButtonActive : {}) }}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            style={{ ...styles.tabButton, ...(mode === 'signup' ? styles.tabButtonActive : {}) }}
          >
            Cadastrar
          </button>
        </div>

        {/* Formulário */}
        <form onSubmit={handleSubmit} style={styles.form}>
          {mode === 'signup' && (
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nome</label>
              <input
                type="text"
                placeholder="Seu nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                style={styles.input}
              />
            </div>
          )}

          <div style={styles.inputGroup}>
            <label style={styles.label}>E-mail</label>
            <input 
              type="email" 
              placeholder="seu@email.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.inputGroup}>
            <label style={styles.label}>Senha</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              required
              minLength={6}
              style={styles.input}
            />
          </div>

          {message && <p style={styles.message}>{message}</p>}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'PROCESSANDO...' : mode === 'login' ? 'ENTRAR' : 'CRIAR CONTA'}
          </button>
        </form>

        {/* Rodapé do Card */}
        <div style={styles.footer}>
          <span style={styles.footerText}>{mode === 'login' ? 'Ainda não tem uma conta?' : 'Já tem uma conta?'} </span>
          <a
            href="#cadastro"
            style={styles.link}
            onClick={(e) => {
              e.preventDefault();
              setMode(mode === 'login' ? 'signup' : 'login');
            }}
          >
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </a>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    minWidth: 0,
    height: '100dvh',
    padding: 'calc(env(safe-area-inset-top, 0px) + 16px) max(16px, env(safe-area-inset-right, 0px)) calc(env(safe-area-inset-bottom, 0px) + 16px) max(16px, env(safe-area-inset-left, 0px))',
    backgroundColor: '#050508',
    backgroundImage: 'radial-gradient(circle at 50% 30%, rgba(0, 100, 200, 0.15) 0%, transparent 70%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  card: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.3)',
    borderRadius: '24px',
    padding: '36px 32px',
    width: '100%',
    maxWidth: '400px',
    boxShadow: '0 16px 48px rgba(0, 0, 0, 0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center'
  },
  header: {
    textAlign: 'center',
    marginBottom: '28px'
  },
  logoIcon: {
    width: '48px',
    height: '48px',
    borderRadius: '14px',
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    border: '1px solid rgba(0, 224, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    margin: '0 auto 12px auto',
    boxShadow: '0 0 16px rgba(0, 224, 255, 0.2)'
  },
  title: {
    fontSize: '20px',
    fontWeight: 900,
    color: '#fff',
    margin: '0 0 6px 0',
    letterSpacing: '0.08em'
  },
  subtitle: {
    fontSize: '12px',
    color: '#94a3b8',
    margin: 0
  },
  form: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  tabContainer: {
    width: '100%',
    display: 'flex',
    gap: '8px',
    background: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '12px',
    padding: '6px',
    marginBottom: '20px',
  },
  tabButton: {
    flex: 1,
    border: 'none',
    borderRadius: '10px',
    padding: '10px 12px',
    background: 'transparent',
    color: '#94a3b8',
    fontWeight: 700,
    cursor: 'pointer',
  },
  tabButtonActive: {
    background: 'linear-gradient(90deg, rgba(0, 224, 255, 0.2), rgba(0, 102, 255, 0.2))',
    color: '#fff',
    boxShadow: '0 0 16px rgba(0, 224, 255, 0.15)',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#94a3b8',
    letterSpacing: '0.03em'
  },
  input: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.3)',
    borderRadius: '12px',
    padding: '12px 16px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    transition: 'border-color 0.2s ease',
  },
  message: {
    margin: 0,
    fontSize: '11px',
    color: '#7dd3fc',
  },
  button: {
    marginTop: '8px',
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '13px',
    fontSize: '13px',
    fontWeight: 800,
    cursor: 'pointer',
    letterSpacing: '0.05em',
    boxShadow: '0 4px 16px rgba(0, 224, 255, 0.3)',
    transition: 'opacity 0.2s ease',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center'
  },
  footerText: {
    fontSize: '11px',
    color: '#94a3b8'
  },
  link: {
    fontSize: '11px',
    color: '#00e0ff',
    fontWeight: 700,
    textDecoration: 'none'
  }
};