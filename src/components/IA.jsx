import React, { useState } from 'react';
import Navbar from './Navbar';

export default function IA({ onOpenNotif, onOpenConfig }) {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('');
  const [time, setTime] = useState('');
  const [frequency, setFrequency] = useState('');
  const [equipment, setEquipment] = useState('');

  return (
    <div style={styles.appContainer}>
      {/* 1. Navbar Superior */}
      <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />

      {/* 2. Conteúdo do Dashboard (Layout em Grid idêntico à imagem) */}
      <main style={styles.dashboardGrid}>
        
        {/* ================= COLUNA ESQUERDA ================= */}
        <section style={styles.leftColumn}>
          
          {/* Banner Principal: SEU TREINO, INTELIGÊNCIA ARTIFICIAL */}
          <div style={styles.heroCard}>
            <div style={styles.heroContent}>
              <span style={styles.heroTag}>— TREINO IA</span>
              <h1 style={styles.heroTitle}>
                SEU TREINO,<br />
                <span style={styles.heroGradient}>INTELIGÊNCIA ARTIFICIAL.</span>
              </h1>
              <p style={styles.heroDesc}>
                A IA analisa seus dados, objetivos e movimentos para criar um treino totalmente personalizado para você.
              </p>

              <div style={styles.heroFeatures}>
                <div style={styles.featureBadge}>
                  <span style={styles.featureIcon}>🛡️</span>
                  <div>
                    <div style={styles.featureTitle}>Personalizado</div>
                    <div style={styles.featureSub}>Para o seu objetivo</div>
                  </div>
                </div>

                <div style={styles.featureBadge}>
                  <span style={styles.featureIcon}>🛡️</span>
                  <div>
                    <div style={styles.featureTitle}>Seguro</div>
                    <div style={styles.featureSub}>Com base na sua análise</div>
                  </div>
                </div>

                <div style={styles.featureBadge}>
                  <span style={styles.featureIcon}>📈</span>
                  <div>
                    <div style={styles.featureTitle}>Evolutivo</div>
                    <div style={styles.featureSub}>Ajusta conforme seu progresso</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Espaço para Imagem / Avatar 3D Superior */}
            <div style={styles.avatarBox}>
              <div style={styles.cornerTL} />
              <div style={styles.cornerTR} />
              <div style={styles.cornerBL} />
              <div style={styles.cornerBR} />
              <div style={styles.avatarPlaceholderContent}>
                <svg style={{ width: '36px', height: '36px', color: '#00e0ff', marginBottom: '6px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span style={{ color: '#00e0ff', fontSize: '12px', fontWeight: 600 }}>Espaço para imagem</span>
                <span style={{ color: '#64748b', fontSize: '10px' }}>(vídeo ou captura do movimento)</span>
              </div>
            </div>
          </div>

          {/* Passo 1: Informe seus dados (Selects em linha) */}
          <div style={styles.sectionCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>1</span>
              <span style={styles.stepTitleText}>INFORME SEUS DADOS</span>
            </div>

            <div style={styles.inputsGrid}>
              <div>
                <label style={styles.inputLabel}>Objetivo</label>
                <select value={goal} onChange={(e) => setGoal(e.target.value)} style={styles.selectInput}>
                  <option value="">Selecione seu objetivo</option>
                  <option>Emagrecer e secar</option>
                  <option>Ganhar massa muscular</option>
                  <option>Definição corporal</option>
                  <option>Performance e força</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Nível de experiência</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} style={styles.selectInput}>
                  <option value="">Selecione seu nível</option>
                  <option>Iniciante</option>
                  <option>Intermediário</option>
                  <option>Avançado</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Tempo disponível</label>
                <select value={time} onChange={(e) => setTime(e.target.value)} style={styles.selectInput}>
                  <option value="">Selecione o tempo</option>
                  <option>30 min</option>
                  <option>45 min</option>
                  <option>60 min</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Frequência semanal</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={styles.selectInput}>
                  <option value="">Selecione a frequência</option>
                  <option>3x por semana</option>
                  <option>4x por semana</option>
                  <option>5x por semana</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Equipamentos</label>
                <select value={equipment} onChange={(e) => setEquipment(e.target.value)} style={styles.selectInput}>
                  <option value="">Selecione os equipamentos</option>
                  <option>Academia completa</option>
                  <option>Peso corporal (Calistenia)</option>
                  <option>Halteres em casa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Passo 2: Gerar meu treino */}
          <div style={styles.sectionCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>2</span>
              <span style={styles.stepTitleText}>GERAR MEU TREINO</span>
            </div>

            <div style={styles.generateRow}>
              <button style={styles.generateButton}>
                <svg style={{ width: '18px', height: '18px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Gerar treino com IA</span>
                <span style={{ marginLeft: 'auto' }}>→</span>
              </button>

              <div style={styles.generateSubContainer}>
                <span style={{ color: '#00e0ff', fontSize: '16px' }}>⚡</span>
                <span style={styles.generateSubtext}>
                  Em poucos segundos, a IA vai criar<br />seu treino ideal com base nos seus dados.
                </span>
              </div>
            </div>
          </div>

          {/* Passo 3: Seu treino está pronto! */}
          <div style={styles.sectionCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>3</span>
              <span style={styles.stepTitleText}>SEU TREINO ESTÁ PRONTO!</span>
            </div>

            <div style={styles.readyCardContent}>
              <div style={styles.readyImageBox}>
                <div style={styles.cornerTL} />
                <div style={styles.cornerTR} />
                <div style={styles.cornerBL} />
                <div style={styles.cornerBR} />
                <span style={{ fontSize: '20px', marginBottom: '4px' }}>📸</span>
                <span style={{ color: '#00e0ff', fontSize: '11px', fontWeight: 600 }}>Espaço para imagem</span>
                <span style={{ color: '#64748b', fontSize: '9px' }}>(vídeo ou animação do treino)</span>
              </div>

              <div style={styles.readyInfoBox}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <span style={{ fontSize: '16px' }}>🤖</span>
                  <span style={{ fontSize: '12px', fontWeight: 800, color: '#fff' }}>TREINO PERSONALIZADO</span>
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4', margin: '0 0 14px 0' }}>
                  Aqui você verá seu treino completo,<br />com exercícios, séries, repetições e descanso.
                </p>
                <button style={styles.secondaryButton}>
                  <span>Ver meu treino</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          </div>

        </section>


        {/* ================= COLUNA DIREITA (Sidebar) ================= */}
        <aside style={styles.rightColumn}>
          
          {/* Seu Progresso */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px' }}>📈</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>SEU PROGRESSO</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
              <div style={styles.progressCircle}>
                <span style={{ fontSize: '18px', fontWeight: 900, color: '#00e0ff' }}>0%</span>
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Evolução no seu ritmo</div>
                <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.3' }}>Acompanhe seu progresso e veja seus resultados.</div>
              </div>
            </div>

            <div style={styles.progressStatItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>📋</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Treinos concluídos</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>0</span>
            </div>

            <div style={styles.progressStatItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>📅</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dias ativos</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>0</span>
            </div>

            <div style={styles.progressStatItem}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>⏱️</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Tempo de treino</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>0 min</span>
            </div>

            <div style={{ ...styles.progressStatItem, borderBottom: 'none', marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🔥</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Calorias queimadas</span>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>0 kcal</span>
            </div>
          </div>

          {/* Meta Atual */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>🎯</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>META ATUAL</span>
            </div>

            <div style={styles.metaImageBox}>
              <div style={styles.cornerTL} />
              <div style={styles.cornerTR} />
              <div style={styles.cornerBL} />
              <div style={styles.cornerBR} />
              <span style={{ fontSize: '20px', marginBottom: '4px' }}>📊</span>
              <span style={{ color: '#00e0ff', fontSize: '11px', fontWeight: 600 }}>Espaço para imagem</span>
              <span style={{ color: '#64748b', fontSize: '9px' }}>(gráfico ou indicador)</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#94a3b8', marginBottom: '6px' }}>
              <span>Sua meta: —</span>
              <span style={{ fontWeight: 700, color: '#00e0ff' }}>0%</span>
            </div>
            
            <div style={styles.progressBarBg}>
              <div style={styles.progressBarFill} />
            </div>
          </div>

          {/* Dicas da IA */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>💡</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>DICAS DA IA</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '18px', background: '#0c132c', padding: '6px', borderRadius: '8px', border: '1px solid rgba(0,162,255,0.2)' }}>🤖</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '3px' }}>Mantenha a constância!</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                  O progresso vem da repetição.<br />A IA está com você nessa jornada.
                </div>
              </div>
              <span style={{ color: '#64748b', fontSize: '12px', marginLeft: 'auto', alignSelf: 'center' }}>›</span>
            </div>
          </div>

        </aside>

      </main>
    </div>
  );
}

const styles = {
  appContainer: {
    width: '100vw',
    minHeight: '100vh',
    backgroundColor: '#050508',
    color: '#ffffff',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    boxSizing: 'border-box',
    overflowX: 'hidden'
  },
  dashboardGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '20px',
    padding: '24px',
    maxWidth: '1450px',
    margin: '0 auto'
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px'
  },
  heroCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '24px',
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
    marginBottom: '8px'
  },
  heroTitle: {
    fontSize: '24px',
    fontWeight: 900,
    lineHeight: '1.1',
    margin: '0 0 10px 0',
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
    lineHeight: '1.5',
    margin: '0 0 14px 0'
  },
  heroFeatures: {
    display: 'flex',
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
    fontSize: '13px'
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
    height: '140px',
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
  cornerTL: { position: 'absolute', top: 4, left: 4, width: 6, height: 6, borderTop: '2px solid #00e0ff', borderLeft: '2px solid #00e0ff' },
  cornerTR: { position: 'absolute', top: 4, right: 4, width: 6, height: 6, borderTop: '2px solid #00e0ff', borderRight: '2px solid #00e0ff' },
  cornerBL: { position: 'absolute', bottom: 4, left: 4, width: 6, height: 6, borderBottom: '2px solid #00e0ff', borderLeft: '2px solid #00e0ff' },
  cornerBR: { position: 'absolute', bottom: 4, right: 4, width: 6, height: 6, borderBottom: '2px solid #00e0ff', borderRight: '2px solid #00e0ff' },

  sectionCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '20px 24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  stepHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '16px'
  },
  stepNumber: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#00e0ff',
    color: '#050508',
    fontSize: '11px',
    fontWeight: 900,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  stepTitleText: {
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: '#e2e8f0'
  },
  inputsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px'
  },
  inputLabel: {
    display: 'block',
    fontSize: '10px',
    color: '#94a3b8',
    marginBottom: '6px',
    fontWeight: 600
  },
  selectInput: {
    width: '100%',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.3)',
    borderRadius: '8px',
    padding: '9px 10px',
    color: '#fff',
    fontSize: '11px',
    outline: 'none',
    cursor: 'pointer'
  },
  generateRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  generateButton: {
    flex: 1.2,
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    padding: '14px 20px',
    fontSize: '13px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(0, 224, 255, 0.4)'
  },
  generateSubContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flex: 1
  },
  generateSubtext: {
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.4'
  },
  readyCardContent: {
    display: 'grid',
    gridTemplateColumns: '1fr 1.5fr',
    gap: '20px',
    alignItems: 'center'
  },
  readyImageBox: {
    position: 'relative',
    height: '110px',
    backgroundColor: '#04060b',
    borderRadius: '12px',
    border: '1px dashed rgba(0, 162, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  readyInfoBox: {
    display: 'flex',
    flexDirection: 'column'
  },
  secondaryButton: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 162, 255, 0.4)',
    color: '#fff',
    borderRadius: '10px',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    width: '100%',
    maxWidth: '220px'
  },
  sideCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  progressCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: '3px solid rgba(0, 224, 255, 0.2)',
    borderTopColor: '#00e0ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0e1b'
  },
  progressStatItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid rgba(0, 100, 200, 0.1)'
  },
  metaImageBox: {
    position: 'relative',
    height: '100px',
    backgroundColor: '#04060b',
    borderRadius: '12px',
    border: '1px dashed rgba(0, 162, 255, 0.4)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '12px'
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
    width: '0%',
    height: '100%',
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    borderRadius: '3px'
  }
};