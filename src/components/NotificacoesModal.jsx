import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { createWorkoutReminders } from '../services/notifications';

const notificationCategories = ['Todas', 'Treinos', 'Sistema'];

function formatNotificationDate(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function currentTimestamp() {
  return new Date().toISOString();
}

export default function NotificacoesModal({ isOpen, onClose, notificationSettings, userId }) {
  const [activeTab, setActiveTab] = useState('Todas');
  const [notifications, setNotifications] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  const { notifTreinos, notifConquistas, notifDicas } = notificationSettings || {};

  useEffect(() => {
    if (!isOpen || !userId) return undefined;
    let isActive = true;

    const loadNotifications = async () => {
      let reminderError = '';
      if (notificationSettings?.notifTreinos !== false) {
        try {
          await createWorkoutReminders(userId);
        } catch {
          reminderError = 'Não foi possível atualizar os lembretes de treino.';
        }
      }

      const { data, error } = await supabase
        .from('notifications')
        .select('id, category, icon, title, description, read_at, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(100);

      if (!isActive) return;
      setNotifications(data || []);
      setErrorMessage(error
        ? 'Não foi possível carregar notificações. Verifique a conexão com o Supabase.'
        : reminderError);
      setLoadedUserId(userId);
    };

    loadNotifications();
    return () => {
      isActive = false;
    };
  }, [isOpen, userId, notificationSettings?.notifTreinos]);

  if (!isOpen) return null;

  const isLoading = loadedUserId !== userId;

  const visibleNotifications = notifications.filter((item) => {
    if (item.category === 'Treinos') return notifTreinos !== false;
    if (item.category === 'Sistema' && item.title.toLocaleLowerCase('pt-BR').includes('conquista')) return notifConquistas !== false;
    if (item.category === 'Sistema' && item.title.toLocaleLowerCase('pt-BR').includes('dica')) return notifDicas !== false;
    return true;
  });

  const filteredNotifs = activeTab === 'Todas'
    ? visibleNotifications
    : visibleNotifications.filter((notification) => notification.category === activeTab);

  const markNotificationRead = async (notification) => {
    if (notification.read_at) return;
    const readAt = currentTimestamp();
    setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: readAt } : item));
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('id', notification.id)
      .eq('user_id', userId);

    if (error) {
      setNotifications((current) => current.map((item) => item.id === notification.id ? { ...item, read_at: null } : item));
      setErrorMessage('Não foi possível marcar a notificação como lida.');
    }
  };

  const markAllRead = async () => {
    const unreadIds = filteredNotifs.filter((notification) => !notification.read_at).map((notification) => notification.id);
    if (!unreadIds.length) return;
    setIsMarkingAll(true);
    const readAt = currentTimestamp();
    const { error } = await supabase
      .from('notifications')
      .update({ read_at: readAt })
      .eq('user_id', userId)
      .in('id', unreadIds);
    setIsMarkingAll(false);

    if (error) {
      setErrorMessage('Não foi possível atualizar as notificações.');
      return;
    }
    setNotifications((current) => current.map((item) => unreadIds.includes(item.id) ? { ...item, read_at: readAt } : item));
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.headerIconCircle}>🔔</div>
            <div>
              <h2 style={styles.modalTitle}>NOTIFICAÇÕES</h2>
              <p style={styles.modalSub}>Lembretes dos seus treinos e registros da sua evolução.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.filterTabsHeader}>
          <div style={styles.filterTabsRow}>
            {notificationCategories.map((tab) => (
              <button
                key={tab}
                type="button"
                aria-pressed={activeTab === tab}
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
          <button type="button" onClick={markAllRead} disabled={isMarkingAll || filteredNotifs.every((notification) => notification.read_at)} style={styles.markAllButton}>
            {isMarkingAll ? 'Salvando...' : 'Marcar exibidas como lidas'}
          </button>
        </div>

        <div style={styles.notifList}>
          {errorMessage && <p role="alert" style={styles.errorMessage}>{errorMessage}</p>}
          {isLoading ? (
            <div style={styles.emptyState}>Carregando notificações...</div>
          ) : filteredNotifs.length === 0 ? (
            <div style={styles.emptyState}>{notifications.length ? 'Nenhuma notificação ativa para este filtro.' : 'Você ainda não tem notificações.'}</div>
          ) : (
            filteredNotifs.map((item) => (
              <button key={item.id} type="button" onClick={() => markNotificationRead(item)} aria-label={`${item.read_at ? 'Lida' : 'Não lida'}: ${item.title}`} style={{ ...styles.notifItem, ...(item.read_at ? {} : styles.unreadNotification) }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                  <span style={{ fontSize: '18px', marginTop: '2px' }}>{item.icon || '•'}</span>
                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                      {item.title}
                    </div>
                    <div style={{ fontSize: '11px', color: '#94a3b8', lineHeight: '1.3' }}>
                      {item.description}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', whiteSpace: 'nowrap' }}>{formatNotificationDate(item.created_at)}</span>
                  {!item.read_at && <span aria-hidden="true" style={styles.unreadDot} />}
                </div>
              </button>
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
    inset: 0,
    width: '100%',
    height: '100dvh',
    padding: 'calc(16px + env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) calc(16px + env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px))',
    boxSizing: 'border-box',
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
    maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 32px)',
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
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '16px'
  },
  filterTabsHeader: {
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '8px'
  },
  markAllButton: {
    border: '1px solid rgba(0, 224, 255, 0.3)',
    backgroundColor: 'transparent',
    color: '#67e8f9',
    padding: '7px 10px',
    fontSize: '10px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  errorMessage: {
    color: '#fecaca',
    fontSize: '11px'
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
    width: '100%',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '12px',
    color: '#fff',
    textAlign: 'left',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  unreadNotification: {
    border: '1px solid rgba(0, 224, 255, 0.4)',
    backgroundColor: 'rgba(0, 224, 255, 0.06)'
  },
  unreadDot: {
    width: '8px',
    height: '8px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: '#00e0ff'
  }
};