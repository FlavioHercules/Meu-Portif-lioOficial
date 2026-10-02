import React, { useState } from 'react';
import Navbar from './Navbar';

export default function Movimentos({ onOpenNotif, onOpenConfig }) {
  const [activeTab, setActiveTab] = useState('movimentos'); // 'movimentos' ou 'treinos'
  const [selectedCategory, setSelectedCategory] = useState('todos');
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div style={styles.appContainer}>
      {/* 1. Navbar Superior */}
      <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />

      {/* 2. Conteúdo do Dashboard (Layout em Grid idêntico à imagem) */}
      <main style={styles.dashboardGrid}>
        
        {/* ================= COLUNA ESQUERDA ================= */}
        <section style={styles.leftColumn}>
          
          {/* Banner Principal: MOVIMENTOS INTELIGENTES. TREINOS MAIS EFICIENTES. */}
          <div style={styles.heroCard}>
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
              <div style={styles.cornerTL} />
              <div style={styles.cornerTR} />
              <div style={styles.cornerBL} />
              <div style={styles.cornerBR} />
              <div style={styles.avatarPlaceholderContent}>
                <svg style={{ width: '32px', height: '32px', color: '#00e0ff', marginBottom: '6px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span style={{ color: '#00e0ff', fontSize: '11px', fontWeight: 600 }}>Espaço para imagem</span>
                <span style={{ color: '#64748b', fontSize: '9px' }}>(vídeo ou captura do movimento)</span>
              </div>
            </div>
          </div>

          {/* Barra de Filtros e Pesquisa */}
          <div style={styles.filterBarCard}>
            <div style={styles.toggleGroup}>
              <button
                onClick={() => setActiveTab('movimentos')}
                style={{
                  ...styles.toggleBtn,
                  ...(activeTab === 'movimentos' ? styles.toggleBtnActive : {})
                }}
              >
                <span>🏋️</span> Movimentos
              </button>
              <button
                onClick={() => setActiveTab('treinos')}
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
                type="text"
                placeholder="Buscar movimentos ou treinos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={styles.searchInput}
              />
            </div>

            <div style={styles.categoryPills}>
              {['Todos', 'Força', 'Mobilidade', 'Cardio', 'Core'].map((cat) => {
                const isSel = selectedCategory === cat.toLowerCase();
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat.toLowerCase())}
                    style={{
                      ...styles.pillBtn,
                      ...(isSel ? styles.pillBtnActive : {})
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção: Movimentos em Destaque */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>💡</span>
                <span style={styles.sectionTitleText}>MOVIMENTOS EM DESTAQUE</span>
              </div>
              <span style={styles.seeMoreLink}>Ver todos os movimentos ›</span>
            </div>

            <div style={styles.horizontalCardsGrid}>
              {[
                { title: 'Agachamento livre', tags: 'Pernas • Força' },
                { title: 'Supino reto', tags: 'Peito • Força' },
                { title: 'Remada baixa', tags: 'Costas • Força' },
                { title: 'Desenvolvimento', tags: 'Ombros • Força' },
                { title: 'Prancha', tags: 'Core • Estabilidade' },
              ].map((item, idx) => (
                <div key={idx} style={styles.miniCard}>
                  <div style={styles.miniCardImgBox}>
                    <div style={styles.cornerTL} />
                    <div style={styles.cornerTR} />
                    <div style={styles.cornerBL} />
                    <div style={styles.cornerBR} />
                    <span style={{ fontSize: '16px', color: '#00e0ff' }}>📈</span>
                  </div>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>{item.title}</div>
                  <div style={{ fontSize: '10px', color: '#64748b' }}>{item.tags}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Seção: Treinos Personalizados */}
          <div style={styles.sectionCard}>
            <div style={styles.sectionHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>📅</span>
                <span style={styles.sectionTitleText}>TREINOS PERSONALIZADOS</span>
              </div>
              <span style={styles.seeMoreLink}>Ver todos os treinos ›</span>
            </div>

            <div style={styles.trainingCardsGrid}>
              {[
                { title: 'Treino de Força', sub: 'Membros superiores', info: '45 min • Intermediário', icon: '🏋️' },
                { title: 'Treino Funcional', sub: 'Corpo inteiro', info: '30 min • Todos os níveis', icon: '⚡' },
                { title: 'HIIT', sub: 'Queima de gordura', info: '20 min • Avançado', icon: '🔥' },
                { title: 'Mobilidade e Flexibilidade', sub: 'Recuperação', info: '25 min • Todos os níveis', icon: '🧘' },
              ].map((t, idx) => (
                <div key={idx} style={styles.trainingCardItem}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    <span style={{ fontSize: '18px' }}>{t.icon}</span>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>{t.title}</div>
                      <div style={{ fontSize: '10px', color: '#94a3b8' }}>{t.sub}</div>
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#64748b', borderTop: '1px solid rgba(0,100,200,0.15)', paddingTop: '6px', marginTop: '6px' }}>
                    {t.info}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Banner inferior */}
          <div style={styles.footerBanner}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '20px' }}>🏃</span>
              <div>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>TREINE COM INTELIGÊNCIA</div>
                <div style={{ fontSize: '10px', color: '#94a3b8' }}>Seu corpo em constante evolução.</div>
              </div>
            </div>
            <button style={styles.actionButton}>
              <span>Criar treino personalizado</span>
              <span>→</span>
            </button>
          </div>

        </section>


        {/* ================= COLUNA DIREITA (Sidebar) ================= */}
        <aside style={styles.rightColumn}>
          
          {/* Seu Progreso */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '16px' }}>📈</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>SEU PROGRESSO</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '14px' }}>
              <div style={styles.progressCircle}>
                <span style={{ fontSize: '16px', fontWeight: 900, color: '#00e0ff' }}>87%</span>
              </div>
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>Evolução no seu ritmo</div>
                <div style={{ fontSize: '10px', color: '#64748b', lineHeight: '1.3' }}>Cada treino te aproxima do seu objetivo.</div>
              </div>
            </div>

            <div style={styles.progressStatsGrid}>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>📋</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>24</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Treinos concluídos</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>🏋️</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>48</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Movimentos realizados</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>⏱️</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>12h36</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Tempo total de treino</div>
              </div>
              <div style={styles.progStatBox}>
                <span style={{ fontSize: '13px' }}>🔥</span>
                <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff' }}>3.420</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Calorias kcal</div>
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
              <span style={{ color: '#00e0ff', fontSize: '11px', cursor: 'pointer' }}>Ver todos ›</span>
            </div>

            {[
              { name: 'Treino de Força - Superior', info: 'Hoje • 45 min', icon: '🏋️' },
              { name: 'HIIT Cardio', info: 'Ontem • 20 min', icon: '🔥' },
              { name: 'Mobilidade e Flexibilidade', info: '30/04 • 25 min', icon: '🧘' },
              { name: 'Treino Funcional', info: '28/04 • 30 min', icon: '⚡' },
            ].map((ut, idx) => (
              <div key={idx} style={styles.recentItem}>
                <span style={{ fontSize: '16px' }}>{ut.icon}</span>
                <div style={{ flex: 1, marginLeft: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>{ut.name}</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>{ut.info}</div>
                </div>
                <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
              </div>
            ))}
          </div>

          {/* Metas em Andamento */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>🎯</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>METAS EM ANDAMENTO</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '14px' }}>📈</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Aumentar força</div>
                  <div style={{ fontSize: '9px', color: '#64748b' }}>3/4 semanas</div>
                </div>
              </div>
              <span style={{ fontSize: '12px', fontWeight: 700, color: '#00e0ff' }}>75%</span>
            </div>

            <div style={styles.progressBarBg}>
              <div style={{ ...styles.progressBarFill, width: '75%' }} />
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
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap'
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
    minWidth: '220px'
  },
  searchInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '11px',
    outline: 'none',
    width: '100%'
  },
  categoryPills: {
    display: 'flex',
    gap: '6px'
  },
  pillBtn: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '10px',
    fontWeight: 700,
    color: '#94a3b8',
    cursor: 'pointer'
  },
  pillBtnActive: {
    backgroundColor: '#00e0ff',
    color: '#050508',
    borderColor: '#00e0ff'
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
    gridTemplateColumns: 'repeat(5, 1fr)',
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
    gridTemplateColumns: 'repeat(4, 1fr)',
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
  }
};