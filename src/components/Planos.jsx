import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';
import { supabase } from '../lib/supabase';

const formatCurrency = (amount) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount || 0);

export default function Planos({ userId, onOpenNotif, onOpenConfig }) {
  const [billingCycle, setBillingCycle] = useState('mensal');
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    let isActive = true;

    const loadPlans = async () => {
      const [plansResult, subscriptionsResult] = await Promise.all([
        supabase.from('plans').select('id, name, slug, price_monthly, price_yearly, description, features').eq('active', true).order('price_monthly'),
        supabase.from('user_subscriptions').select('id, plan_id, billing_cycle, status, started_at, ends_at, created_at').eq('user_id', userId).order('created_at', { ascending: false }),
      ]);

      if (!isActive) return;
      if (plansResult.error || subscriptionsResult.error) {
        setErrorMessage('Não foi possível carregar os planos e sua assinatura. Confira o schema e as políticas do Supabase.');
      }
      setPlans(plansResult.data || []);
      setSubscriptions(subscriptionsResult.data || []);
      setIsLoading(false);
    };

    loadPlans();
    return () => {
      isActive = false;
    };
  }, [userId]);

  const pendingSubscription = subscriptions.find((subscription) => subscription.status === 'pending');
  const currentSubscription = subscriptions.find((subscription) => ['active', 'trialing'].includes(subscription.status));
  const selectedPlanPrice = selectedPlan
    ? (billingCycle === 'anual' ? Number(selectedPlan.price_yearly) : Number(selectedPlan.price_monthly))
    : 0;

  const handleRequestPlan = async () => {
    if (!selectedPlan) return;
    setIsSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    const pending = subscriptions.find((subscription) => subscription.status === 'pending');
    const query = pending
      ? supabase.from('user_subscriptions').update({ plan_id: selectedPlan.id, billing_cycle: billingCycle }).eq('id', pending.id).eq('user_id', userId)
      : supabase.from('user_subscriptions').insert({ user_id: userId, plan_id: selectedPlan.id, billing_cycle: billingCycle, status: 'pending' });
    const { data, error } = await query
      .select('id, plan_id, billing_cycle, status, started_at, ends_at, created_at')
      .single();

    setIsSaving(false);
    if (error) {
      setErrorMessage('Não foi possível registrar a escolha. Aplique a migração de planos pendentes no Supabase.');
      return;
    }

    setSubscriptions((current) => [data, ...current.filter((subscription) => subscription.id !== data.id && subscription.status !== 'pending')]);
    setSelectedPlan(null);
    setSuccessMessage('Sua escolha foi registrada como pendente. Nenhuma cobrança foi feita e seu plano atual não foi alterado.');
  };

  const cancelPendingRequest = async () => {
    if (!pendingSubscription) return;
    setIsSaving(true);
    setErrorMessage('');
    const { error } = await supabase
      .from('user_subscriptions')
      .update({ status: 'canceled' })
      .eq('id', pendingSubscription.id)
      .eq('user_id', userId);
    setIsSaving(false);
    if (error) {
      setErrorMessage('Não foi possível cancelar a solicitação pendente.');
      return;
    }
    setSubscriptions((current) => current.map((subscription) => subscription.id === pendingSubscription.id ? { ...subscription, status: 'canceled' } : subscription));
  };

  return (
    <div style={styles.appContainer}>
      <style>{`
        @media (max-width: 900px) {
          .plans-dashboard { grid-template-columns: minmax(0, 1fr) !important; padding: 16px !important; }
          .plans-hero-features { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
          .plans-billing { flex-wrap: wrap; }
        }
      `}</style>
      {/* 1. Navbar Superior */}
      <Navbar onOpenNotif={onOpenNotif} onOpenConfig={onOpenConfig} />

      {/* 2. Conteúdo do Dashboard (Layout em Grid idêntico à imagem) */}
      <main className="plans-dashboard" style={styles.dashboardGrid}>
        
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
                Consulte os valores e recursos cadastrados. A escolha fica registrada como pendente até que o pagamento seja integrado.
              </p>
            </div>

            {/* Ícones de Resumo de Recursos no Banner */}
            <div className="plans-hero-features" style={styles.heroFeaturesRow}>
              <div style={styles.featureItem}>
                <span style={{ fontSize: '18px' }}>R$</span>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Preços do catálogo</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Valores carregados do Supabase</div>
              </div>
              <div style={styles.featureItem}>
                <span style={{ fontSize: '18px' }}>↻</span>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Ciclo flexível</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Compare valores mensais e anuais</div>
              </div>
              <div style={styles.featureItem}>
                <span style={{ fontSize: '18px' }}>▤</span>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Recursos por plano</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Descrição conforme os dados cadastrados</div>
              </div>
              <div style={styles.featureItem}>
                <span style={{ fontSize: '18px' }}>!</span>
                <div style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>Sem cobrança</div>
                <div style={{ fontSize: '9px', color: '#64748b', textAlign: 'center' }}>Checkout ainda não integrado</div>
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

              <div className="plans-billing" style={styles.billingToggleContainer}>
                <div style={styles.toggleGroup}>
                  <button
                    type="button"
                    aria-pressed={billingCycle === 'mensal'}
                    onClick={() => setBillingCycle('mensal')}
                    style={{
                      ...styles.toggleBtn,
                      ...(billingCycle === 'mensal' ? styles.toggleBtnActive : {})
                    }}
                  >
                    Mensal
                  </button>
                  <button
                    type="button"
                    aria-pressed={billingCycle === 'anual'}
                    onClick={() => setBillingCycle('anual')}
                    style={{
                      ...styles.toggleBtn,
                      ...(billingCycle === 'anual' ? styles.toggleBtnActive : {})
                    }}
                  >
                    Anual
                  </button>
                </div>
                {billingCycle === 'anual' && <span style={styles.discountBadge}>Valor anual cobrado de uma vez</span>}
              </div>
            </div>

            <div style={styles.plansGrid}>
              {isLoading && <p style={styles.stateMessage}>Carregando planos…</p>}
              {!isLoading && plans.length === 0 && <p style={styles.stateMessage}>Nenhum plano ativo está cadastrado no momento.</p>}
              {plans.map((plan) => {
                const isCurrent = currentSubscription?.plan_id === plan.id;
                const isPending = pendingSubscription?.plan_id === plan.id && pendingSubscription.billing_cycle === billingCycle;
                const amount = billingCycle === 'anual' ? Number(plan.price_yearly) : Number(plan.price_monthly);
                const monthlyEquivalent = billingCycle === 'anual' ? amount / 12 : amount;
                const annualSavings = Number(plan.price_monthly) * 12 - Number(plan.price_yearly);
                const features = Array.isArray(plan.features) ? plan.features : [];

                return (
                  <article key={plan.id} style={{ ...styles.planCard, ...(isCurrent ? styles.planCardCurrent : {}) }}>
                    <div>
                      <div style={styles.planCardTopline}>
                        <span style={{ fontSize: '16px' }}>◇</span>
                        <span style={styles.planStatus}>{isCurrent ? 'SEU PLANO' : plan.slug.toUpperCase()}</span>
                      </div>
                      <h3 style={styles.planName}>{plan.name}</h3>
                      <p style={styles.planDescription}>{plan.description || 'Plano MotionFit.'}</p>
                      <div style={styles.planPrice}>
                        <span style={{ color: isCurrent ? '#00e0ff' : '#fff' }}>{formatCurrency(monthlyEquivalent)}</span>
                        <span style={styles.planPriceUnit}>/mês</span>
                      </div>
                      {billingCycle === 'anual' && <p style={styles.billingDetail}>{formatCurrency(amount)} cobrados ao ano</p>}
                      {billingCycle === 'anual' && annualSavings > 0 && <p style={styles.savingsDetail}>Economia anual de {formatCurrency(annualSavings)}</p>}
                      <div style={styles.planFeaturesList}>
                        {features.length ? features.map((feature, index) => <div key={`${plan.id}-${index}`} style={styles.planFeatureRow}>✓ {feature}</div>) : <div style={styles.planFeatureRow}>Recursos não detalhados</div>}
                      </div>
                    </div>
                    <button
                      type="button"
                      disabled={isCurrent || isPending || isLoading}
                      onClick={() => setSelectedPlan(plan)}
                      style={isCurrent ? styles.planButtonCurrent : styles.planButtonOutline}
                    >
                      <span>{isCurrent ? 'Plano atual' : isPending ? 'Solicitação pendente' : 'Escolher plano'}</span>
                      {!isCurrent && !isPending && <span aria-hidden="true">→</span>}
                    </button>
                  </article>
                );
              })}
            </div>
            {pendingSubscription && (
              <div style={styles.pendingNotice}>
                <div>
                  <strong>Solicitação pendente</strong>
                  <p>Seu pedido está salvo, mas não houve cobrança nem mudança de acesso.</p>
                </div>
                <button type="button" disabled={isSaving} onClick={cancelPendingRequest} style={styles.cancelPendingButton}>Cancelar solicitação</button>
              </div>
            )}
            {currentSubscription && <p style={styles.currentPlanNotice}>Assinatura atual: {plans.find((plan) => plan.id === currentSubscription.plan_id)?.name || 'Plano ativo'} · {currentSubscription.status === 'trialing' ? 'período de teste' : 'ativa'}.</p>}
            {errorMessage && <p role="alert" style={styles.errorNotice}>{errorMessage}</p>}
            {successMessage && <p role="status" style={styles.successNotice}>{successMessage}</p>}
          </div>

        </section>


        {/* ================= COLUNA DIREITA (Sidebar) ================= */}
        <aside style={styles.rightColumn}>
          
          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
              <span style={{ fontSize: '16px' }}>🛡️</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>STATUS DA CONTA</span>
            </div>
            <p style={styles.accountStatusText}>{currentSubscription ? `Plano em uso: ${plans.find((plan) => plan.id === currentSubscription.plan_id)?.name || 'ativo'}.` : 'Você ainda não tem uma assinatura ativa.'}</p>
            <p style={styles.accountStatusText}>Os preços e recursos desta página vêm do catálogo do Supabase.</p>
          </div>

          <div style={styles.sideCard}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
              <span style={{ fontSize: '16px' }}>🔒</span>
              <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, letterSpacing: '0.05em' }}>PAGAMENTO</span>
            </div>

            <p style={{ fontSize: '10px', color: '#94a3b8', lineHeight: '1.4', margin: '0 0 12px 0' }}>
              O checkout ainda não está integrado. Escolher um plano não faz cobrança nem ativa assinatura.
            </p>
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
      {selectedPlan && (
        <div className="safe-overlay" role="presentation" onClick={() => !isSaving && setSelectedPlan(null)} style={styles.modalBackdrop}>
          <section role="dialog" aria-modal="true" aria-labelledby="plan-confirm-title" onClick={(event) => event.stopPropagation()} style={styles.confirmDialog}>
            <button type="button" aria-label="Fechar" disabled={isSaving} onClick={() => setSelectedPlan(null)} style={styles.closeDialogButton}>×</button>
            <p style={styles.modalEyebrow}>SELEÇÃO DE PLANO</p>
            <h2 id="plan-confirm-title" style={styles.modalTitle}>{selectedPlan.name}</h2>
            <p style={styles.modalDescription}>{billingCycle === 'anual' ? `${formatCurrency(selectedPlanPrice)} por ano` : `${formatCurrency(selectedPlanPrice)} por mês`}</p>
            <p style={styles.checkoutWarning}>Esta ação só registra uma solicitação pendente. O checkout não está configurado, não haverá cobrança e o acesso atual não será alterado.</p>
            {errorMessage && <p role="alert" style={styles.errorNotice}>{errorMessage}</p>}
            <div style={styles.modalActions}>
              <button type="button" disabled={isSaving} onClick={() => setSelectedPlan(null)} style={styles.cancelModalButton}>Voltar</button>
              <button type="button" disabled={isSaving} onClick={handleRequestPlan} style={styles.confirmModalButton}>{isSaving ? 'Salvando...' : 'Registrar solicitação'}</button>
            </div>
          </section>
        </div>
      )}
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
    gridTemplateColumns: 'minmax(0, 1fr) minmax(250px, 340px)',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))',
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 150px), 1fr))',
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
  },
  planCardTopline: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '10px',
    color: '#67e8f9'
  },
  planStatus: {
    color: '#94a3b8',
    fontSize: '9px',
    fontWeight: 800,
    textTransform: 'uppercase'
  },
  planName: {
    color: '#fff',
    fontSize: '17px',
    fontWeight: 900,
    margin: '0 0 5px'
  },
  planDescription: {
    color: '#94a3b8',
    fontSize: '10px',
    lineHeight: 1.5,
    minHeight: '32px',
    margin: '0 0 14px'
  },
  planPrice: {
    display: 'flex',
    alignItems: 'baseline',
    gap: '5px',
    marginBottom: '5px',
    fontSize: '21px',
    fontWeight: 900
  },
  planPriceUnit: {
    color: '#64748b',
    fontSize: '10px',
    fontWeight: 500
  },
  billingDetail: {
    color: '#94a3b8',
    fontSize: '10px',
    margin: '0 0 5px'
  },
  savingsDetail: {
    color: '#6ee7b7',
    fontSize: '10px',
    margin: '0 0 12px'
  },
  planCardCurrent: {
    border: '1px solid rgba(0, 224, 255, 0.75)',
    boxShadow: '0 0 15px rgba(0, 224, 255, 0.12)'
  },
  planButtonCurrent: {
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    border: '1px solid rgba(0, 224, 255, 0.35)',
    color: '#a5f3fc',
    borderRadius: '8px',
    padding: '10px',
    fontSize: '11px',
    fontWeight: 800,
    width: '100%'
  },
  stateMessage: {
    gridColumn: '1 / -1',
    color: '#94a3b8',
    fontSize: '12px',
    padding: '18px 4px'
  },
  pendingNotice: {
    marginTop: '18px',
    padding: '14px',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    backgroundColor: 'rgba(120, 53, 15, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '12px',
    color: '#fde68a',
    fontSize: '11px'
  },
  cancelPendingButton: {
    border: '1px solid rgba(251, 191, 36, 0.35)',
    backgroundColor: 'transparent',
    color: '#fde68a',
    padding: '8px 10px',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  currentPlanNotice: {
    color: '#a5f3fc',
    fontSize: '11px',
    margin: '14px 0 0'
  },
  accountStatusText: {
    color: '#94a3b8',
    fontSize: '11px',
    lineHeight: 1.5
  },
  errorNotice: {
    margin: '12px 0 0',
    padding: '10px 12px',
    border: '1px solid rgba(248, 113, 113, 0.35)',
    color: '#fecaca',
    fontSize: '11px'
  },
  successNotice: {
    margin: '12px 0 0',
    padding: '10px 12px',
    border: '1px solid rgba(110, 231, 183, 0.3)',
    color: '#a7f3d0',
    fontSize: '11px'
  },
  modalBackdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflowY: 'auto',
    backgroundColor: 'rgba(0, 0, 0, 0.8)'
  },
  confirmDialog: {
    position: 'relative',
    width: '100%',
    maxWidth: '480px',
    padding: '24px',
    border: '1px solid rgba(0, 224, 255, 0.35)',
    backgroundColor: '#070913',
    color: '#fff'
  },
  closeDialogButton: {
    position: 'absolute',
    top: '10px',
    right: '10px',
    width: '32px',
    height: '32px',
    border: '1px solid rgba(148, 163, 184, 0.4)',
    backgroundColor: 'transparent',
    color: '#fff',
    fontSize: '22px',
    cursor: 'pointer'
  },
  modalEyebrow: {
    color: '#67e8f9',
    fontSize: '10px',
    fontWeight: 800,
    margin: '0 0 8px'
  },
  modalTitle: {
    fontSize: '21px',
    fontWeight: 900,
    margin: '0 0 6px'
  },
  modalDescription: {
    color: '#fff',
    fontSize: '15px',
    fontWeight: 700
  },
  checkoutWarning: {
    margin: '16px 0',
    padding: '12px',
    border: '1px solid rgba(251, 191, 36, 0.3)',
    color: '#fde68a',
    fontSize: '11px',
    lineHeight: 1.6
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
    gap: '8px'
  },
  cancelModalButton: {
    border: '1px solid rgba(148, 163, 184, 0.4)',
    backgroundColor: 'transparent',
    color: '#cbd5e1',
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  confirmModalButton: {
    border: '1px solid #00e0ff',
    backgroundColor: '#00e0ff',
    color: '#050508',
    padding: '10px 12px',
    fontSize: '11px',
    fontWeight: 800,
    cursor: 'pointer'
  }
};