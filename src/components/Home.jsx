import React, { useState } from 'react';
import Navbar from './Navbar'; // Caminho correto para o arquivo na mesma pasta

export default function Home({ onOpenNotif, onOpenConfig }) {
  const [activeGoal, setActiveGoal] = useState('emagrecer');
  const [activeDay, setActiveDay] = useState('Seg');
  const [level, setLevel] = useState('Intermediário');
  const [time, setTime] = useState('45 min');
  const [frequency, setFrequency] = useState('4x por semana');
  const [equipment, setEquipment] = useState('Academia completa');

  return (
    <div style={styles.appContainer}>
      {/* 1. Navbar Superior */}
      <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />

      {/* 2. Conteúdo do Dashboard */}
      <main style={styles.dashboardGrid}>
        
        {/* COLUNA ESQUERDA (Principal) */}
        <section style={styles.leftColumn}>
          
          {/* Banner Principal: SEU TREINO, INTELIGÊNCIA ARTIFICIAL */}
          <div style={styles.heroCard}>
            <div style={styles.heroContent}>
              <span style={styles.heroTag}>— BEM-VINDO DE VOLTA</span>
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

            {/* Espaço para Imagem / Avatar 3D */}
            <div style={styles.avatarBox}>
              <div style={styles.cornerTL} />
              <div style={styles.cornerTR} />
              <div style={styles.cornerBL} />
              <div style={styles.cornerBR} />
              <div style={styles.avatarPlaceholderContent}>
                <svg style={{ width: '40px', height: '40px', color: '#00e0ff', marginBottom: '8px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span style={{ color: '#00e0ff', fontSize: '13px', fontWeight: 600 }}>Espaço para imagem</span>
                <span style={{ color: '#64748b', fontSize: '11px' }}>(vídeo ou captura do movimento)</span>
              </div>
            </div>
          </div>

          {/* Passo 1: Selecione seu objetivo */}
          <div style={styles.sectionCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>1</span>
              <span style={styles.stepTitleText}>SELECIONE SEU OBJETIVO</span>
            </div>

            <div style={styles.goalsGrid}>
              {[
                { id: 'ganhar-massa', label: 'Ganhar massa', desc: 'Mais força e volume muscular', icon: '🏋️' },
                { id: 'emagrecer', label: 'Emagrecer', desc: 'Queime calorias e melhore seu condicionamento', icon: '🔥' },
                { id: 'definir', label: 'Definir', desc: 'Mais resultados e menos gordura', icon: '💪' },
                { id: 'performance', label: 'Performance', desc: 'Melhore sua performance esportiva', icon: '⚡' },
                { id: 'saude', label: 'Saúde', desc: 'Mais disposição e qualidade de vida', icon: '❤️' },
              ].map((goal) => {
                const isSelected = activeGoal === goal.id;
                return (
                  <div
                    key={goal.id}
                    onClick={() => setActiveGoal(goal.id)}
                    style={{
                      ...styles.goalCard,
                      ...(isSelected ? styles.goalCardSelected : {})
                    }}
                  >
                    <span style={{ fontSize: '22px', marginBottom: '6px' }}>{goal.icon}</span>
                    <span style={{ fontSize: '13px', fontWeight: 700, color: isSelected ? '#fff' : '#e2e8f0', marginBottom: '4px' }}>{goal.label}</span>
                    <span style={{ fontSize: '10px', color: isSelected ? '#bae6fd' : '#64748b', textAlign: 'center', lineHeight: '1.2' }}>{goal.desc}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Passo 2: Informe seus dados */}
          <div style={styles.sectionCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>2</span>
              <span style={styles.stepTitleText}>INFORME SEUS DADOS</span>
            </div>

            <div style={styles.inputsGrid}>
              <div>
                <label style={styles.inputLabel}>Nível de experiência</label>
                <select value={level} onChange={(e) => setLevel(e.target.value)} style={styles.selectInput}>
                  <option>Intermediário</option>
                  <option>Iniciante</option>
                  <option>Avançado</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Tempo disponível</label>
                <select value={time} onChange={(e) => setTime(e.target.value)} style={styles.selectInput}>
                  <option>45 min</option>
                  <option>30 min</option>
                  <option>60 min</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Frequência semanal</label>
                <select value={frequency} onChange={(e) => setFrequency(e.target.value)} style={styles.selectInput}>
                  <option>4x por semana</option>
                  <option>3x por semana</option>
                  <option>5x por semana</option>
                </select>
              </div>

              <div>
                <label style={styles.inputLabel}>Equipamentos</label>
                <select value={equipment} onChange={(e) => setEquipment(e.target.value)} style={styles.selectInput}>
                  <option>Academia completa</option>
                  <option>Peso corporal</option>
                  <option>Halteres em casa</option>
                </select>
              </div>
            </div>
          </div>

          {/* Passo 3: Gerar meu treino */}
          <div style={styles.sectionCard}>
            <div style={styles.stepHeader}>
              <span style={styles.stepNumber}>3</span>
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

              <span style={styles.generateSubtext}>
                Em poucos segundos, a IA vai criar<br />seu treino ideal com base nos seus dados.
              </span>
            </div>
          </div>

          {/* Footer Stats inferiores */}
          <div style={styles.footerStats}>
            <div style={styles.statItem}>
              <span style={styles.statIcon}>📋</span>
              <div>
                <div style={styles.statTitle}>TREINOS CRIADOS</div>
                <div style={styles.statValue}>0</div>
              </div>
            </div>

            <div style={styles.statItem}>
              <span style={styles.statIcon}>📈</span>
              <div>
                <div style={styles.statTitle}>SEU PROGRESSO</div>
                <div style={styles.statValue}>0%</div>
              </div>
            </div>

            <div style={styles.statItem}>
              <span style={styles.statIcon}>⏱️</span>
              <div>
                <div style={styles.statTitle}>TEMPO TOTAL</div>
                <div style={styles.statValue}>0 min</div>
              </div>
            </div>
          </div>

        </section>

        {/* COLUNA DIREITA (Sidebar de Rotina e IA) */}
        <aside style={styles.rightColumn}>
          
          {/* Objetivo Atual */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '18px' }}>🎯</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>SEU OBJETIVO ATUAL</span>
              </div>
              <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Emagrecimento</div>
            <div style={{ fontSize: '10px', color: '#64748b', marginBottom: '12px' }}>Defina seu objetivo para ver mais detalhes.</div>
            
            <div style={styles.progressBarBg}>
              <div style={styles.progressBarFill} />
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: '#00e0ff', fontWeight: 700, marginTop: '4px' }}>50%</div>
          </div>

          {/* Sua Rotina */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>📅</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>SUA ROTINA</span>
            </div>

            {/* Dias da semana */}
            <div style={styles.daysRow}>
              {['Seg', 'Ter', 'Qua', 'Qui', 'Sex'].map((day) => {
                const isSel = activeDay === day;
                return (
                  <button
                    key={day}
                    onClick={() => setActiveDay(day)}
                    style={{
                      ...styles.dayButton,
                      ...(isSel ? styles.dayButtonSelected : {})
                    }}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '8px', fontWeight: 600 }}>Hoje</div>

            {/* Exercício 1 */}
            <div style={styles.routineItem}>
              <span style={{ fontSize: '18px' }}>🏋️</span>
              <div style={{ flex: 1, marginLeft: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Peito + Tríceps</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>45 min</div>
              </div>
              <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
            </div>

            {/* Exercício 2 */}
            <div style={styles.routineItem}>
              <span style={{ fontSize: '18px' }}>❤️</span>
              <div style={{ flex: 1, marginLeft: '10px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#fff' }}>Cardio leve</div>
                <div style={{ fontSize: '11px', color: '#64748b' }}>20 min</div>
              </div>
              <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
            </div>
          </div>

          {/* Dicas da IA */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <span style={{ fontSize: '16px' }}>💡</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>DICAS DA IA</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <span style={{ fontSize: '18px', background: '#0c132c', padding: '6px', borderRadius: '8px', border: '1px solid rgba(0,162,255,0.2)' }}>🤖</span>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '4px' }}>Mantenha a constância!</div>
                <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.4' }}>
                  Resultados reais vêm do compromisso diário com o seu processo.
                </div>
              </div>
              <span style={{ color: '#64748b', fontSize: '12px', marginLeft: 'auto' }}>›</span>
            </div>
          </div>

          {/* Card Motivacional Inferior */}
          <div style={{ ...styles.sideCard, position: 'relative', overflow: 'hidden', textAlign: 'center', padding: '24px 16px' }}>
            <div style={styles.cornerTL} />
            <div style={styles.cornerTR} />
            <div style={styles.cornerBL} />
            <div style={styles.cornerBR} />
            
            <div style={{ fontSize: '24px', marginBottom: '6px' }}>📸</div>
            <div style={{ fontSize: '10px', color: '#00e0ff', fontWeight: 700, marginBottom: '6px' }}>Espaço para imagem</div>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#fff', lineHeight: '1.3' }}>
              DISCIPLINA TAMBÉM É <span style={{ color: '#00e0ff' }}>RESULTADO.</span>
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
    maxWidth: '1400px',
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
    gridTemplateColumns: '1.2fr 1fr',
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
    fontSize: '26px',
    fontWeight: 900,
    lineHeight: '1.1',
    margin: '0 0 12px 0',
    letterSpacing: '-0.02em'
  },
  heroGradient: {
    background: 'linear-gradient(90deg, #00e0ff 0%, #0077ff 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  heroDesc: {
    fontSize: '12px',
    color: '#94a3b8',
    lineHeight: '1.5',
    margin: '0 0 16px 0'
  },
  heroFeatures: {
    display: 'flex',
    gap: '10px'
  },
  featureBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 162, 255, 0.2)',
    padding: '6px 10px',
    borderRadius: '8px'
  },
  featureIcon: {
    fontSize: '14px'
  },
  featureTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#fff'
  },
  featureSub: {
    fontSize: '9px',
    color: '#64748b'
  },
  avatarBox: {
    position: 'relative',
    height: '160px',
    backgroundColor: '#04060b',
    borderRadius: '12px',
    border: '1px dashed rgba(0, 162, 255, 0.4)',
    display: 'flex',
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
  goalsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gap: '10px'
  },
  goalCard: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '12px',
    padding: '14px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  goalCardSelected: {
    background: 'linear-gradient(135deg, #0c1c3c 0%, #040d1a 100%)',
    border: '1px solid #00e0ff',
    boxShadow: '0 0 15px rgba(0, 224, 255, 0.3)'
  },
  inputsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px'
  },
  inputLabel: {
    display: 'block',
    fontSize: '11px',
    color: '#94a3b8',
    marginBottom: '6px',
    fontWeight: 600
  },
  selectInput: {
    width: '100%',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.3)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: '#fff',
    fontSize: '13px',
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
    fontSize: '14px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    cursor: 'pointer',
    boxShadow: '0 0 20px rgba(0, 224, 255, 0.4)'
  },
  generateSubtext: {
    flex: 1,
    fontSize: '11px',
    color: '#94a3b8',
    lineHeight: '1.4'
  },
  footerStats: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '15px'
  },
  statItem: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '12px',
    padding: '14px 18px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
  },
  statIcon: {
    fontSize: '20px'
  },
  statTitle: {
    fontSize: '9px',
    color: '#64748b',
    fontWeight: 700,
    letterSpacing: '0.05em'
  },
  statValue: {
    fontSize: '16px',
    fontWeight: 900,
    color: '#fff',
    marginTop: '2px'
  },
  sideCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
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
    width: '50%',
    height: '100%',
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    borderRadius: '3px'
  },
  daysRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '14px'
  },
  dayButton: {
    flex: 1,
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '8px',
    padding: '6px 0',
    fontSize: '11px',
    fontWeight: 700,
    color: '#94a3b8',
    cursor: 'pointer',
    textAlign: 'center'
  },
  dayButtonSelected: {
    backgroundColor: '#00e0ff',
    color: '#050508',
    border: '1px solid #00e0ff',
    boxShadow: '0 0 10px rgba(0, 224, 255, 0.4)'
  },
  routineItem: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '10px',
    padding: '10px 12px',
    marginBottom: '8px'
  }
};