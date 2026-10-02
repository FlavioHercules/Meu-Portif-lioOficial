import React from 'react';
import Navbar from './Navbar';

export default function Perfil({ onOpenNotif, onOpenConfig }) {
  return (
    <div style={styles.appContainer}>
      {/* 1. Navbar Superior */}
      <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />

      {/* 2. Conteúdo do Dashboard (Layout em Grid idêntico à imagem) */}
      <main style={styles.dashboardGrid}>
        
        {/* ================= COLUNA ESQUERDA ================= */}
        <section style={styles.leftColumn}>
          
          {/* Banner Principal do Perfil */}
          <div style={styles.heroCard}>
            <div style={styles.heroTopRow}>
              <div style={styles.avatarContainer}>
                <div style={styles.avatarCircle}>
                  <span style={{ fontSize: '36px', color: '#00e0ff' }}>👤</span>
                </div>
                <div style={styles.editAvatarBtn}>✎</div>
              </div>

              <div style={styles.heroUserInfo}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <div>
                    <h1 style={styles.heroTitle}>Usuário</h1>
                    <p style={styles.heroSub}>
                      📅 Membro desde 10 de março de 2025<br />
                      Disciplina hoje, resultados amanhã.
                    </p>
                  </div>
                  <button style={styles.editProfileBtn}>
                    <span>✎</span> Editar perfil
                  </button>
                </div>

                <div style={styles.userBadgesRow}>
                  <div style={styles.badgeItem}><span>👤</span> 18 anos</div>
                  <div style={styles.badgeItem}><span>📏</span> 1,70 m</div>
                  <div style={styles.badgeItem}><span>⚖️</span> 90 kg</div>
                  <div style={styles.badgeItem}><span>🎯</span> Objetivo: Emagrecer</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid do Meio: Informações Pessoais & Evolução Física */}
          <div style={styles.twoColumnGrid}>
            
            {/* Informações Pessoais */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>👤</span>
                  <span style={styles.sectionTitleText}>INFORMAÇÕES PESSOAIS</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
              </div>

              <div style={styles.infoList}>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>👤</span> Nome
                  </div>
                  <span style={styles.infoValue}>Usuário</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>📅</span> Idade
                  </div>
                  <span style={styles.infoValue}>18 anos</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>📏</span> Altura
                  </div>
                  <span style={styles.infoValue}>1,70 m</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>⚖️️</span> Peso
                  </div>
                  <span style={styles.infoValue}>90 kg</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>🎯</span> Objetivo
                  </div>
                  <span style={styles.infoValue}>Emagrecer</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>🏋️</span> Nível
                  </div>
                  <span style={styles.infoValue}>Iniciante</span>
                </div>
              </div>
            </div>

            {/* Evolução Física */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>📈</span>
                  <span style={styles.sectionTitleText}>EVOLUÇÃO FÍSICA</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
              </div>

              <div style={styles.chartContainer}>
                {/* Linha simulada do gráfico */}
                <svg style={styles.svgChart} viewBox="0 0 300 100">
                  <defs>
                    <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="rgba(0,224,255,0.4)" />
                      <stop offset="100%" stopColor="rgba(0,224,255,0)" />
                    </linearGradient>
                  </defs>
                  <path d="M 10 70 L 150 50 L 290 25" fill="none" stroke="#00e0ff" strokeWidth="2.5" />
                  <circle cx="10" cy="70" r="4" fill="#00e0ff" />
                  <circle cx="150" cy="50" r="4" fill="#00e0ff" />
                  <circle cx="290" cy="25" r="4" fill="#00e0ff" />
                </svg>

                <div style={styles.chartAxisInfo}>
                  <div>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>Início</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>90 kg</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '9px', color: '#64748b' }}>Atual</div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>90 kg</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Grid inferior esquerdo: Seu Objetivo & Preferências de Treino */}
          <div style={styles.twoColumnGrid}>
            
            {/* Seu Objetivo */}
            <div style={styles.sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px' }}>🎯</span>
                <span style={styles.sectionTitleText}>SEU OBJETIVO</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>🔥</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>Emagrecer</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Perder peso, ganhar saúde e mais disposição.</div>
                </div>
              </div>

              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: '0%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10px', color: '#00e0ff', marginTop: '4px', fontWeight: 700 }}>0%</div>
            </div>

            {/* Preferências de Treino */}
            <div style={styles.sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px' }}>🏋️</span>
                <span style={styles.sectionTitleText}>PREFERÊNCIAS DE TREINO</span>
              </div>

              <div style={styles.pillsRow}>
                <span style={{ ...styles.prefPill, ...styles.prefPillActive }}>Musculação</span>
                <span style={styles.prefPill}>Funcional</span>
                <span style={styles.prefPill}>HIIT</span>
                <span style={styles.prefPill}>Cardio</span>
                <span style={styles.prefPill}>Core</span>
              </div>

              <div style={styles.prefDetailsRow}>
                <div style={styles.prefDetailItem}>
                  <span>📅</span>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>3-5x</div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>por semana</div>
                  </div>
                </div>
                <div style={styles.prefDetailItem}>
                  <span>⏱️</span>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>45-60 min</div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>por treino</div>
                  </div>
                </div>
                <div style={styles.prefDetailItem}>
                  <span>🏠</span>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>Em casa</div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>ou academia</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Histórico de Atividades */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>🕒</span>
                <span style={styles.sectionTitleText}>HISTÓRICO DE ATIVIDADES</span>
              </div>
              <span style={{ color: '#00e0ff', fontSize: '11px', cursor: 'pointer' }}>Ver todo o histórico ›</span>
            </div>

            <div style={styles.historyGrid}>
              <div style={styles.historyCardItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>🏋️</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>Treino realizado</span>
                </div>
                <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>Treino de Força - Superior</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Hoje • 45 min</div>
              </div>

              <div style={styles.historyCardItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>📈</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>Análise de movimento</span>
                </div>
                <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>Postura e mobilidade</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Ontem • 12 min</div>
              </div>

              <div style={styles.historyCardItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>💳</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>Plano atualizado</span>
                </div>
                <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>Novo plano: Emagrecimento</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Dia 12/04 • Premium</div>
              </div>
            </div>
          </div>

        </section>


        {/* ================= COLUNA DIREITA (Sidebar) ================= */}
        <aside style={styles.rightColumn}>
          
          {/* Seu Progresso */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>📈</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>SEU PROGRESSO</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={styles.progressCircle}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#00e0ff' }}>0%</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Evolução no seu ritmo</div>
                <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.3' }}>Cada treino te aproxima do seu objetivo.</div>
              </div>
            </div>

            <div style={styles.progressStatsGrid}>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>📋</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>0</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Treinos concluídos</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>📅</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>0</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Dias ativos</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>⏱️</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>0h 0min</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Tempo total de treino</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>🔥</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>0 kcal</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Calorias queimadas</div>
              </div>
            </div>
          </div>

          {/* Seu Plano */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>👑</span>
                <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>SEU PLANO</span>
              </div>
              <span style={{ color: '#00e0ff', fontSize: '12px' }}>›</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <span style={{ fontSize: '14px' }}>👑</span>
              <span style={{ fontSize: '12px', fontWeight: 900, color: '#fff' }}>Plano Premium</span>
              <span style={{ fontSize: '8px', fontWeight: 800, backgroundColor: 'rgba(0,224,255,0.15)', color: '#00e0ff', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(0,224,255,0.3)' }}>ATIVO</span>
            </div>

            <p style={{ fontSize: '10px', color: '#94a3b8', margin: '0 0 12px 0' }}>
              Acesso completo a todas as funcionalidades.
            </p>

            <button style={styles.sidePlanButton}>
              <span>Ver detalhes</span>
              <span>→</span>
            </button>
          </div>

          {/* Configurações Rápidas */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>⚙️️</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>CONFIGURAÇÕES RÁPIDAS</span>
            </div>

            <div style={styles.configList}>
              <div style={styles.configItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔔</span>
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>Notificações</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
              </div>

              <div style={styles.configItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔒</span>
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>Privacidade</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
              </div>

              <div style={styles.configItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>❓</span>
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>Suporte</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
              </div>

              <div style={{ ...styles.configItem, borderBottom: 'none', marginBottom: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🚪</span>
                  <span style={{ fontSize: '11px', color: '#ff4d4d', fontWeight: 600 }}>Sair da conta</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
              </div>
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
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  heroTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  avatarContainer: {
    position: 'relative'
  },
  avatarCircle: {
    width: '76px',
    height: '76px',
    borderRadius: '50%',
    backgroundColor: '#04060b',
    border: '2px solid #00e0ff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 15px rgba(0,224,255,0.3)'
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    backgroundColor: '#00e0ff',
    color: '#050508',
    fontSize: '11px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 900,
    cursor: 'pointer'
  },
  heroUserInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column'
  },
  heroTitle: {
    fontSize: '20px',
    fontWeight: 900,
    margin: '0 0 4px 0',
    color: '#fff'
  },
  heroSub: {
    fontSize: '11px',
    color: '#94a3b8',
    margin: '0 0 12px 0',
    lineHeight: '1.4'
  },
  editProfileBtn: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 162, 255, 0.3)',
    color: '#fff',
    borderRadius: '8px',
    padding: '6px 12px',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    cursor: 'pointer'
  },
  userBadgesRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap'
  },
  badgeItem: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '10px',
    fontWeight: 600,
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '16px'
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
    marginBottom: '12px'
  },
  sectionTitleText: {
    fontSize: '11px',
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: '#e2e8f0'
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  infoRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.15)',
    borderRadius: '8px',
    padding: '8px 12px'
  },
  infoLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '11px',
    color: '#94a3b8'
  },
  infoValue: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#fff'
  },
  chartContainer: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    height: '140px'
  },
  svgChart: {
    width: '100%',
    height: '80px'
  },
  chartAxisInfo: {
    display: 'flex',
    justifyContent: 'space-between',
    borderTop: '1px solid rgba(0, 100, 200, 0.2)',
    paddingTop: '6px'
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
  pillsRow: {
    display: 'flex',
    gap: '6px',
    marginBottom: '14px',
    flexWrap: 'wrap'
  },
  prefPill: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '8px',
    padding: '5px 10px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#94a3b8',
    cursor: 'pointer'
  },
  prefPillActive: {
    backgroundColor: '#00e0ff',
    color: '#050508',
    borderColor: '#00e0ff'
  },
  prefDetailsRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  prefDetailItem: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.15)',
    borderRadius: '8px',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  historyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '8px'
  },
  historyCardItem: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '10px',
    padding: '10px'
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
  sidePlanButton: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 162, 255, 0.4)',
    color: '#fff',
    borderRadius: '10px',
    padding: '8px 12px',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    width: '100%'
  },
  configList: {
    display: 'flex',
    flexDirection: 'column'
  },
  configItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid rgba(0, 100, 200, 0.1)',
    cursor: 'pointer'
  }
};