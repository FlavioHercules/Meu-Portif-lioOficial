import React, { useState } from 'react';
import Navbar from './Navbar';

export default function Planos({ onOpenNotif, onOpenConfig }) {
  const [billingCycle, setBillingCycle] = useState('mensal'); // 'mensal' ou 'anual'

  return (
    <div style={styles.appContainer}>
      {/* 1. Navbar Superior */}
      <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />

      {/* 2. Conteúdo do Dashboard (Layout em Grid idêntico à imagem) */}
      <main style={styles.dashboardGrid}>
        
        {/* ================= COLUNA ESQUERDA ================= */}
        <section style={styles.leftColumn}>
          
          {/* Banner Principal: SEU OBJETIVO. NOSSO COMPROMISSO. */}
          <div style={styles.heroCard}>
            <div style={styles.heroContent}>
              <span style={styles.heroTag}>— PLANOS</span>
              <h1 style={styles.heroTitle}>
                SEU OBJETIVO.<br />
                <span style={styles.heroGradient}>NOSSO COMPROMISSO.</span>
              </h1>
              <p style={styles.heroDesc}>
                Escolha o plano ideal para o seu momento e tenha acesso a todas as ferramentas da MotionFit. Treine com inteligência, acompanhe sua evolução e alcance seus resultados.
              </p>
            </div>

            {/* Ícones de Resumo de Recursos no Banner */}
            <div style={styles.heroFeaturesRow}>
              <div style={styles.featureItem}>
                <span style={{ fontSize: '18px' }}>🤖</span>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Treino IA</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Planos personalizados com inteligência artificial</div>
              </div>
              <div style={styles.featureItem}>
                <span style={{ fontSize: '18px' }}>📈</span>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Análise de movimento</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Acompanhe sua evolução e melhore sua performance</div>
              </div>
              <div style={styles.featureItem}>
                <span style={{ fontSize: '18px' }}>🏋️</span>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Movimentos + Treinos</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Biblioteca completa de exercícios e treinos</div>
              </div>
              <div style={styles.featureItem}>
                <span style={{ fontSize: '18px' }}>👤</span>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Suporte e acompanhamento</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Mais resultado com o seu progresso</div>
              </div>
            </div>
          </div>

          {/* Seção: Nossos Planos & Toggle Mensal/Anual */}
          <div style={styles.sectionCard}>
            <div style={styles.plansHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>💳</span>
                <span style={styles.sectionTitleText}>NOSSOS PLANOS</span>
              </div>

              <div style={styles.billingToggleContainer}>
                <div style={styles.toggleGroup}>
                  <button
                    onClick={() => setBillingCycle('mensal')}
                    style={{
                      ...styles.toggleBtn,
                      ...(billingCycle === 'mensal' ? styles.toggleBtnActive : {})
                    }}
                  >
                    Mensal
                  </button>
                  <button
                    onClick={() => setBillingCycle('anual')}
                    style={{
                      ...styles.toggleBtn,
                      ...(billingCycle === 'anual' ? styles.toggleBtnActive : {})
                    }}
                  >
                    Anual
                  </button>
                </div>
                <span style={styles.discountBadge}>⚡ Economize até 40%</span>
              </div>
            </div>

            {/* Grid dos 4 Planos */}
            <div style={styles.plansGrid}>
              
              {/* PLANO BÁSICO */}
              <div style={styles.planCard}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>👑</span>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>INICIANTE</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>BÁSICO</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', minHeight: '28px', marginBottom: '14px' }}>Ideal para quem está começando.</div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>R$ 29,90</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}> /mês</span>
                  </div>

                  <div style={styles.planFeaturesList}>
                    <div style={styles.planFeatureRow}>✓ Treino IA (planos personalizados)</div>
                    <div style={styles.planFeatureRow}>✓ Movimentos + Treinos (biblioteca completa)</div>
                    <div style={styles.planFeatureRow}>✓ Análise de movimento (básica)</div>
                    <div style={styles.planFeatureRow}>✓ Suporte por e-mail</div>
                  </div>
                </div>

                <button style={styles.planButtonOutline}>
                  <span>Assinar agora</span>
                  <span>→</span>
                </button>
              </div>

              {/* PLANO PREMIUM (DESTACADO COM BORDA NEON E TAG "MAIS ESCOLHIDO") */}
              <div style={{ ...styles.planCard, ...styles.planCardFeatured }}>
                <div style={styles.mostChosenBadge}>MAIS ESCOLHIDO</div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>👑</span>
                    <span style={{ fontSize: '9px', color: '#00e0ff', fontWeight: 700 }}>POPULAR</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>PREMIUM</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', minHeight: '28px', marginBottom: '14px' }}>O equilíbrio perfeito entre custo e resultado.</div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#00e0ff' }}>R$ 49,90</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}> /mês</span>
                  </div>

                  <div style={styles.planFeaturesList}>
                    <div style={styles.planFeatureRow}>✓ Tudo do plano Básico</div>
                    <div style={styles.planFeatureRow}>✓ Análise de movimento (completa)</div>
                    <div style={styles.planFeatureRow}>✓ Acompanhamento de progresso</div>
                    <div style={styles.planFeatureRow}>✓ Suporte prioritário</div>
                  </div>
                </div>

                <button style={styles.planButtonGlow}>
                  <span>Assinar agora</span>
                  <span>→</span>
                </button>
              </div>

              {/* PLANO PRO */}
              <div style={styles.planCard}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>💎</span>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>AVANÇADO</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>PRO</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', minHeight: '28px', marginBottom: '14px' }}>Para quem quer ir mais longe.</div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>R$ 79,90</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}> /mês</span>
                  </div>

                  <div style={styles.planFeaturesList}>
                    <div style={styles.planFeatureRow}>✓ Tudo do plano Premium</div>
                    <div style={styles.planFeatureRow}>✓ Planos avançados e periodizados</div>
                    <div style={styles.planFeatureRow}>✓ Relatórios detalhados de evolução</div>
                    <div style={styles.planFeatureRow}>✓ Suporte via chat e e-mail</div>
                  </div>
                </div>

                <button style={styles.planButtonOutline}>
                  <span>Assinar agora</span>
                  <span>→</span>
                </button>
              </div>

              {/* PLANO ELITE */}
              <div style={styles.planCard}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '16px' }}>⭐</span>
                    <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 700 }}>EXCLUSIVO</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>ELITE</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', minHeight: '28px', marginBottom: '14px' }}>Máximo desempenho, sem limites.</div>
                  
                  <div style={{ marginBottom: '16px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 900, color: '#fff' }}>R$ 119,90</span>
                    <span style={{ fontSize: '10px', color: '#64748b' }}> /mês</span>
                  </div>

                  <div style={styles.planFeaturesList}>
                    <div style={styles.planFeatureRow}>✓ Tudo do plano Pro</div>
                    <div style={styles.planFeatureRow}>✓ Consultoria individual (opcional)</div>
                    <div style={styles.planFeatureRow}>✓ Ajustes semanais de treino</div>
                    <div style={styles.planFeatureRow}>✓ Suporte 24/7</div>
                  </div>
                </div>

                <button style={styles.planButtonOutline}>
                  <span>Assinar agora</span>
                  <span>→</span>
                </button>
              </div>

            </div>
          </div>

        </section>


        {/* ================= COLUNA DIREITA (Sidebar) ================= */}
        <aside style={styles.rightColumn}>
          
          {/* Por que escolher a MotionFit? */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px' }}>🛡️</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>POR QUE ESCOLHER A MOTIONFIT?</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={styles.reasonItem}>
                <span style={{ fontSize: '16px' }}>🤖</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Tecnologia de ponta</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.3' }}>Inteligência artificial e análise de movimento em tempo real.</div>
                </div>
              </div>

              <div style={styles.reasonItem}>
                <span style={{ fontSize: '16px' }}>📈</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Treinos personalizados</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.3' }}>Adaptados ao seu objetivo, nível e evolução.</div>
                </div>
              </div>

              <div style={styles.reasonItem}>
                <span style={{ fontSize: '16px' }}>⚡</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Mais resultados</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.3' }}>Com acompanhamento e ajustes contínuos.</div>
                </div>
              </div>

              <div style={styles.reasonItem}>
                <span style={{ fontSize: '16px' }}>📍</span>
                <div>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Acesso em qualquer lugar</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.3' }}>Treine onde e quando quiser.</div>
                </div>
              </div>
            </div>
          </div>

          {/* Compra Segura */}
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>🔒</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>COMPRA SEGURA</span>
            </div>

            <p style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.4', margin: '0 0 12px 0' }}>
              Seus dados protegidos e pagamento 100% seguro.
            </p>

            <div style={styles.paymentMethodsGrid}>
              <span style={styles.payBadge}>VISA</span>
              <span style={styles.payBadge}>MC</span>
              <span style={styles.payBadge}>pix</span>
              <span style={styles.payBadge}>Pay</span>
            </div>
          </div>

          {/* Comece Hoje a sua Evolução */}
          <div style={{ ...styles.sideCard, background: 'linear-gradient(135deg, #070913 0%, #0b1536 100%)' }}>
            <div style={{ fontSize: '12px', fontWeight: 900, color: '#fff', marginBottom: '4px' }}>COMECE HOJE</div>
            <div style={{ fontSize: '13px', fontWeight: 900, color: '#00e0ff', marginBottom: '10px' }}>A SUA EVOLUÇÃO.</div>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: '24px' }}>🏃</span>
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
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
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
    margin: 0,
    maxWidth: '700px'
  },
  heroFeaturesRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
    borderTop: '1px solid rgba(0, 100, 200, 0.2)',
    paddingTop: '16px'
  },
  featureItem: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 162, 255, 0.15)',
    borderRadius: '10px',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '4px'
  },
  sectionCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '24px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  plansHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '12px'
  },
  sectionTitleText: {
    fontSize: '12px',
    fontWeight: 800,
    letterSpacing: '0.05em',
    color: '#e2e8f0'
  },
  billingToggleContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px'
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
    padding: '6px 14px',
    borderRadius: '8px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  toggleBtnActive: {
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    color: '#fff',
    boxShadow: '0 0 10px rgba(0,224,255,0.4)'
  },
  discountBadge: {
    fontSize: '10px',
    color: '#00e0ff',
    fontWeight: 700,
    backgroundColor: 'rgba(0,224,255,0.1)',
    padding: '6px 10px',
    borderRadius: '8px',
    border: '1px solid rgba(0,224,255,0.2)'
  },
  plansGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '14px'
  },
  planCard: {
    position: 'relative',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '14px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease'
  },
  planCardFeatured: {
    border: '2px solid #00e0ff',
    boxShadow: '0 0 20px rgba(0, 224, 255, 0.25)',
    backgroundColor: '#0c132c'
  },
  mostChosenBadge: {
    position: 'absolute',
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#00e0ff',
    color: '#050508',
    fontSize: '8px',
    fontWeight: 900,
    padding: '3px 8px',
    borderRadius: '6px',
    letterSpacing: '0.05em'
  },
  planFeaturesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '16px',
    borderTop: '1px solid rgba(0, 100, 200, 0.2)',
    paddingTop: '12px'
  },
  planFeatureRow: {
    fontSize: '10px',
    color: '#94a3b8',
    lineHeight: '1.3'
  },
  planButtonOutline: {
    backgroundColor: 'transparent',
    border: '1px solid rgba(0, 162, 255, 0.4)',
    color: '#fff',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '11px',
    fontWeight: 700,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    width: '100%'
  },
  planButtonGlow: {
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    padding: '10px',
    fontSize: '11px',
    fontWeight: 800,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 0 15px rgba(0, 224, 255, 0.4)'
  },
  sideCard: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.25)',
    borderRadius: '16px',
    padding: '18px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
  },
  reasonItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '10px'
  },
  paymentMethodsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '6px'
  },
  payBadge: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '6px',
    padding: '6px 4px',
    fontSize: '10px',
    fontWeight: 800,
    textAlign: 'center',
    color: '#fff'
  }
};