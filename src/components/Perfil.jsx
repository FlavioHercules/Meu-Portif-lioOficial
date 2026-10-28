import React from 'react';
import Navbar from './Navbar';

export default function Perfil({ userProfile = {}, onEditResearch, onSignOut, onOpenNotif, onOpenConfig }) {
  const userName = userProfile.full_name || 'Usuário';
  const pesquisa = userProfile.pesquisa;
  const objective = pesquisa?.objective || 'Não informado';
  const memberSince = userProfile.member_since
    ? new Date(userProfile.member_since).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'Data não informada';

  return (
    <div style={styles.appContainer}>
      {/* 1. Navbar Superior */}
      <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />

      {/* 2. Conteúdo do Dashboard (Layout em Grid idêntico à imagem) */}
      <main className="profile-dashboard" style={styles.dashboardGrid}>
        
        {/* ================= COLUNA ESQUERDA ================= */}
        <section style={styles.leftColumn}>
          
          {/* Banner Principal do Perfil */}
          <div style={styles.heroCard}>
            <div className="profile-hero-row" style={styles.heroTopRow}>
              <div style={styles.avatarContainer}>
                <div style={styles.avatarCircle}>
                  <span style={{ fontSize: '36px', color: '#00e0ff' }}>👤</span>
                </div>
                <div style={styles.editAvatarBtn}>✎</div>
              </div>

              <div style={styles.heroUserInfo}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                  <div>
                    <h1 style={styles.heroTitle}>{userName}</h1>
                    <p style={styles.heroSub}>
                      📅 Membro desde {memberSince}<br />
                      Disciplina hoje, resultados amanhã.
                    </p>
                  </div>
                  <button style={styles.editProfileBtn} onClick={onEditResearch}>
                    <span>✎</span> Editar perfil
                  </button>
                </div>

                <div style={styles.userBadgesRow}>
                  <div style={styles.badgeItem}><span>👤</span> {pesquisa?.gender || 'Sexo não informado'}</div>
                  <div style={styles.badgeItem}><span>🎂</span> {pesquisa?.age ? `${pesquisa.age} anos` : 'Idade não informada'}</div>
                  <div style={styles.badgeItem}><span>📏</span> {pesquisa?.height_cm ? `${pesquisa.height_cm} cm` : 'Altura não informada'}</div>
                  <div style={styles.badgeItem}><span>⚖️</span> {pesquisa?.weight_kg ? `${pesquisa.weight_kg} kg` : 'Peso não informado'}</div>
                  <div style={styles.badgeItem}><span>🎯</span> Objetivo: {objective}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Grid do Meio: Informações Pessoais & Evolução Física */}
          <div className="profile-two-column-grid" style={styles.twoColumnGrid}>
            
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
                  <span style={styles.infoValue}>{userName}</span>
                </div>
                {userProfile.email && (
                  <div style={styles.infoRow}>
                    <div style={styles.infoLabel}>
                      <span>✉️</span> E-mail
                    </div>
                    <span style={styles.infoValue}>{userProfile.email}</span>
                  </div>
                )}
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>👤</span> Sexo
                  </div>
                  <span style={styles.infoValue}>{pesquisa?.gender || 'Não informado'}</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>🎂</span> Idade
                  </div>
                  <span style={styles.infoValue}>{pesquisa?.age ? `${pesquisa.age} anos` : 'Não informado'}</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>📏</span> Altura
                  </div>
                  <span style={styles.infoValue}>{pesquisa?.height_cm ? `${pesquisa.height_cm} cm` : 'Não informado'}</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>⚖️️</span> Peso
                  </div>
                  <span style={styles.infoValue}>{pesquisa?.weight_kg ? `${pesquisa.weight_kg} kg` : 'Não informado'}</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>🎯</span> Objetivo
                  </div>
                  <span style={styles.infoValue}>{objective}</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>🏋️</span> Nível
                  </div>
                  <span style={styles.infoValue}>{pesquisa?.experience_level || 'Não informado'}</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>📆</span> Experiência
                  </div>
                  <span style={styles.infoValue}>{pesquisa?.experience_months ? `${pesquisa.experience_months} meses` : 'Iniciante'}</span>
                </div>
                <div style={styles.infoRow}>
                  <div style={styles.infoLabel}>
                    <span>🩹</span> Limitações
                  </div>
                  <span style={styles.infoValue}>{pesquisa?.limitations?.length ? pesquisa.limitations.join(', ') : 'Nenhuma informada'}</span>
                </div>
              </div>
            </div>

            {/* Evolução Física */}
            <div style={styles.sectionCard}>
              <div style={styles.sectionHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '14px' }}>📈</span>
                  <span style={styles.sectionTitleText}>MEDIDAS ATUAIS</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
              </div>

              <div style={{ ...styles.chartContainer, height: '140px', flexDirection: 'row', alignItems: 'center', gap: '12px' }}>
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>ALTURA</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                    {pesquisa?.height_cm ? `${pesquisa.height_cm} cm` : 'Não informado'}
                  </div>
                </div>
                <div style={{ width: '1px', height: '48px', backgroundColor: 'rgba(0, 100, 200, 0.2)' }} />
                <div style={{ flex: 1, textAlign: 'center' }}>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>PESO</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#fff', marginTop: '6px' }}>
                    {pesquisa?.weight_kg ? `${pesquisa.weight_kg} kg` : 'Não informado'}
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Grid inferior esquerdo: Seu Objetivo & Preferências de Treino */}
          <div className="profile-two-column-grid" style={styles.twoColumnGrid}>
            
            {/* Seu Objetivo */}
            <div style={styles.sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px' }}>🎯</span>
                <span style={styles.sectionTitleText}>SEU OBJETIVO</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                <span style={{ fontSize: '20px' }}>🔥</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{objective}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8' }}>Objetivo informado na pesquisa inicial.</div>
                </div>
              </div>

              <div style={styles.progressBarBg}>
                <div style={{ ...styles.progressBarFill, width: userProfile.progress_percent ? `${Math.min(100, Number(userProfile.progress_percent))}%` : '0%' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '10px', color: '#00e0ff', marginTop: '4px', fontWeight: 700 }}>
                {userProfile.progress_percent ? `${Math.min(100, Number(userProfile.progress_percent))}%` : '0%'}
              </div>
            </div>

            {/* Preferências de Treino */}
            <div style={styles.sectionCard}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                <span style={{ fontSize: '14px' }}>🏋️</span>
                <span style={styles.sectionTitleText}>PREFERÊNCIAS DE TREINO</span>
              </div>

              <div style={styles.pillsRow}>
                {(pesquisa?.training_preferences || []).map((preference) => (
                  <span key={preference} style={{ ...styles.prefPill, ...styles.prefPillActive }}>{preference}</span>
                ))}
                {!pesquisa?.training_preferences?.length && <span style={styles.prefPill}>Não informado</span>}
              </div>

              <div style={styles.prefDetailsRow}>
                <div style={styles.prefDetailItem}>
                  <span>📅</span>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{pesquisa?.weekly_frequency || 'Não informado'}</div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>por semana</div>
                  </div>
                </div>
                <div style={styles.prefDetailItem}>
                  <span>⏱️</span>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{pesquisa?.available_time || 'Não informado'}</div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>por treino</div>
                  </div>
                </div>
                <div style={styles.prefDetailItem}>
                  <span>🏠</span>
                  <div>
                    <div style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>{pesquisa?.training_location || 'Não informado'}</div>
                    <div style={{ fontSize: '8px', color: '#64748b' }}>local de treino</div>
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
              <span style={{ color: '#64748b', fontSize: '11px' }}>Sem dados ainda</span>
            </div>

            <div className="profile-history-grid" style={styles.historyGrid}>
              <div style={styles.historyCardItem}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '14px' }}>📊</span>
                  <span style={{ fontSize: '10px', fontWeight: 700, color: '#fff' }}>Status</span>
                </div>
                <div style={{ fontSize: '11px', color: '#e2e8f0', fontWeight: 600 }}>Nenhuma atividade registrada</div>
                <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>Os treinos concluídos aparecerão aqui.</div>
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
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#00e0ff' }}>{userProfile.progress_percent ? `${Math.min(100, Number(userProfile.progress_percent))}%` : '0%'}</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Evolução no seu ritmo</div>
                <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.3' }}>Acompanhe os dados reais de treino quando houver registros salvos.</div>
              </div>
            </div>

            <div style={styles.progressStatsGrid}>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>📋</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{userProfile.completed_workouts ?? 0}</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Treinos concluídos</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>📅</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{userProfile.active_days ?? 0}</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Dias ativos</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>⏱️</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{userProfile.total_minutes ? `${userProfile.total_minutes} min` : '0 min'}</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Tempo total de treino</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>🔥</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>{userProfile.calories_burned ?? 0}</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Calorias queimadas</div>
              </div>
            </div>
          </div>

          {/* Configurações Rápidas */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>⚙️️</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>CONFIGURAÇÕES RÁPIDAS</span>
            </div>

            <div style={styles.configList}>
              <button type="button" onClick={onOpenNotif} style={{ ...styles.configItem, width: '100%', borderTop: 0, borderLeft: 0, borderRight: 0, backgroundColor: 'transparent', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔔</span>
                  <span style={{ fontSize: '11px', color: '#fff', fontWeight: 600 }}>Notificações</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
              </button>

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

              <button type="button" onClick={onSignOut} style={{ ...styles.configItem, width: '100%', borderBottom: 'none', marginBottom: 0, borderTop: 0, borderLeft: 0, borderRight: 0, backgroundColor: 'transparent', textAlign: 'left' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🚪</span>
                  <span style={{ fontSize: '11px', color: '#ff4d4d', fontWeight: 600 }}>Sair da conta</span>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
              </button>
            </div>
          </div>

        </aside>

      </main>
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
    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 340px)',
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
    border: '1px solid #00e0ff'
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