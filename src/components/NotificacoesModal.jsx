import React, { useState } from 'react';

export default function NotificacoesModal({ isOpen, onClose, notificationSettings }) {
  const [activeTab, setActiveTab] = useState('Todas');

  if (!isOpen) return null;

  const { notifTreinos, notifConquistas, notifDicas } = notificationSettings || {};

  const notificacoes = [
    { id: 1, categoria: 'Treinos', icone: '✅', titulo: 'Treino concluído!', desc: 'Você finalizou o treino de hoje. Parabéns pela dedicação!', tempo: 'há 2h' },
    { id: 2, categoria: 'Sistema', icone: '🔥', titulo: 'Nova conquista desbloqueada!', desc: 'Você atingiu 3 dias consecutivos de treino. Continue assim!', tempo: 'há 5h' },
    { id: 3, categoria: 'Treinos', icone: '📅', titulo: 'Lembrete de treino', desc: 'Seu treino de hoje está programado para as 18:00.', tempo: 'há 7h' },
    { id: 4, categoria: 'Planos', icone: '👑', titulo: 'Plano atualizado', desc: 'Seu plano mensal foi renovado com sucesso!', tempo: 'há 1 dia' },
    { id: 5, categoria: 'Sistema', icone: 'ℹ️', titulo: 'Dica do dia', desc: 'Lembre-se: o progresso vem da constância, não da perfeição.', tempo: 'há 1 dia' },
    { id: 6, categoria: 'Planos', icone: '🎯', titulo: 'Meta em andamento', desc: 'Você já completou 60% da sua meta de emagrecimento!', tempo: 'há 2 dias' },
    { id: 7, categoria: 'Treinos', icone: '🏃', titulo: 'Mantenha-se motivado!', desc: 'Cada notificação é um passo a mais para o seu objetivo.', tempo: 'há 3 dias' },
  ];

  const visibleNotifications = notificacoes.filter((item) => {
    if (item.categoria === 'Treinos') return notifTreinos !== false;
    if (item.categoria === 'Sistema' && item.titulo.includes('conquista')) return notifConquistas !== false;
    if (item.categoria === 'Sistema' && item.titulo.includes('Dica')) return notifDicas !== false;
    return true;
  });

  const filteredNotifs = activeTab === 'Todas'
    ? visibleNotifications
    : visibleNotifications.filter((n) => n.categoria === activeTab);

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.headerIconCircle}>🔔</div>
            <div>
              <h2 style={styles.modalTitle}>NOTIFICAÇÕES</h2>
              <p style={styles.modalSub}>Fique por dentro de tudo o que acontece na sua jornada.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.filterTabsRow}>
          {['Todas', 'Treinos', 'Planos', 'Sistema'].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setActiveTab(tab)}
              style={{
                ...styles.filterTabBtn,
                ...(activeTab === tab ? styles.filterTabBtnActive : {})
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div style={styles.notifList}>
          {filteredNotifs.length === 0 ? (
            <div style={styles.emptyState}>Nenhuma notificação ativa para este filtro.</div>
          ) : (
            filteredNotifs.map((item) => (
              <div key={item.id} style={styles.notifItem}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '18px', marginTop: '2px' }}>{item.icone}</span>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                      {item.titulo}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.3' }}>
                      {item.desc}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap' }}>{item.tempo}</span>
                  <span style={{ color: '#64748b', fontSize: '12px' }}>›</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

const styles = {
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(5, 5, 8, 0.8)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    fontFamily: 'system-ui, -apple-system, sans-serif'
  },
  modalContainer: {
    backgroundColor: '#070913',
    border: '1px solid rgba(0, 100, 200, 0.3)',
    borderRadius: '20px',
    width: '100%',
    maxWidth: '620px',
    maxHeight: '85vh',
    padding: '24px',
    boxShadow: '0 16px 48px rgba(0,0,0,0.8)',
    display: 'flex',
    flexDirection: 'column',
    overflowY: 'auto'
  },
  modalHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: '20px'
  },
  headerIconCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(0, 224, 255, 0.1)',
    border: '1px solid rgba(0, 224, 255, 0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px'
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: 900,
    color: '#fff',
    margin: '0 0 2px 0',
    letterSpacing: '0.05em'
  },
  modalSub: {
    fontSize: '11px',
    color: '#94a3b8',
    margin: 0
  },
  closeButton: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.3)',
    color: '#fff',
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    fontSize: '12px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  filterTabsRow: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px'
  },
  filterTabBtn: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    color: '#94a3b8',
    padding: '6px 16px',
    borderRadius: '20px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  filterTabBtnActive: {
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    color: '#fff',
    border: 'none',
    boxShadow: '0 0 12px rgba(0, 224, 255, 0.4)'
  },
  notifList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  notifItem: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    transition: 'all 0.2s ease'
  }
};