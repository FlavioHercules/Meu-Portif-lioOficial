import React, { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function ConfiguracoesModal({ isOpen, onClose, settings, onChangeSetting, settingsError, onSignOut, isSigningOut, signOutError, userId, userEmail }) {
  const [supportView, setSupportView] = useState('menu');
  const [supportMessage, setSupportMessage] = useState('');
  const [supportStatus, setSupportStatus] = useState('');
  const [isSendingSupport, setIsSendingSupport] = useState(false);
  if (!isOpen) return null;

  const { darkMode, notifTreinos, notifConquistas, notifDicas, fontSize } = settings;

  const fontOptions = ['Pequeno', 'Normal', 'Grande'];

  const handleToggle = (key, value) => onChangeSetting(key, value);

  const handleSupportSubmit = async (event) => {
    event.preventDefault();
    if (!supportMessage.trim() || !userId || isSendingSupport) return;
    const message = `Olá, equipe MotionFit! Sou ${userEmail || 'usuário do MotionFit'} e preciso de ajuda:\n\n${supportMessage.trim()}`;
    window.open(`https://wa.me/5574981258209?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    setIsSendingSupport(true);
    setSupportStatus('');
    const { error } = await supabase.from('support_requests').insert({
      user_id: userId,
      email: userEmail,
      message: supportMessage.trim(),
    });
    setIsSendingSupport(false);
    if (error) {
      setSupportStatus('O WhatsApp foi aberto, mas não foi possível registrar a solicitação no histórico do app.');
      return;
    }
    setSupportMessage('');
    setSupportStatus('Conversa aberta no WhatsApp. Revise a mensagem e toque em enviar por lá. A solicitação também foi registrada no app.');
  };

  return (
    <div style={styles.modalOverlay} onClick={onClose}>
      <div style={styles.modalContainer} onClick={(event) => event.stopPropagation()}>
        <div style={styles.modalHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={styles.headerIconCircle}>⚙️</div>
            <div>
              <h2 style={styles.modalTitle}>CONFIGURAÇÕES</h2>
              <p style={styles.modalSub}>Personalize sua experiência no MotionFit.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={styles.closeButton}>✕</button>
        </div>

        <div style={styles.configSectionsGrid}>
          <div style={styles.configBox}>
            <div style={styles.sectionTitle}>🎨 APARÊNCIA</div>
            <div style={styles.menuList}>
              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Modo escuro</div>
                  <div style={styles.menuItemSub}>{darkMode ? 'Ativado' : 'Desativado'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('darkMode', !darkMode)}
                  style={{ ...styles.toggleSwitch, backgroundColor: darkMode ? '#00e0ff' : '#0b0e1b' }}
                  aria-pressed={darkMode}
                  aria-label="Alternar modo escuro"
                >
                  <div style={{ ...styles.toggleThumb, transform: darkMode ? 'translateX(16px)' : 'translateX(0)' }} />
                </button>
              </div>

              <div style={{ ...styles.menuItem, borderBottom: 'none' }}>
                <div>
                  <div style={styles.menuItemTitle}>Tamanho da fonte</div>
                  <div style={styles.menuItemSub}>{fontSize}</div>
                </div>
                <div style={styles.selectPillGroup}>
                  {fontOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleToggle('fontSize', option)}
                      style={{
                        ...styles.optionPill,
                        ...(fontSize === option ? styles.optionPillActive : {}),
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={styles.configBox}>
            <div style={styles.sectionTitle}>🔔 NOTIFICAÇÕES</div>
            <div style={styles.menuList}>
              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Treinos e lembretes</div>
                  <div style={styles.menuItemSub}>{notifTreinos ? 'Ativadas' : 'Desativadas'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('notifTreinos', !notifTreinos)}
                  style={{ ...styles.toggleSwitch, backgroundColor: notifTreinos ? '#00e0ff' : '#0b0e1b' }}
                  aria-pressed={notifTreinos}
                  aria-label="Alternar notificações de treino"
                >
                  <div style={{ ...styles.toggleThumb, transform: notifTreinos ? 'translateX(16px)' : 'translateX(0)' }} />
                </button>
              </div>
              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Conquistas e metas</div>
                  <div style={styles.menuItemSub}>{notifConquistas ? 'Ativadas' : 'Desativadas'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('notifConquistas', !notifConquistas)}
                  style={{ ...styles.toggleSwitch, backgroundColor: notifConquistas ? '#00e0ff' : '#0b0e1b' }}
                  aria-pressed={notifConquistas}
                  aria-label="Alternar notificações de conquistas"
                >
                  <div style={{ ...styles.toggleThumb, transform: notifConquistas ? 'translateX(16px)' : 'translateX(0)' }} />
                </button>
              </div>
              <div style={{ ...styles.menuItem, borderBottom: 'none' }}>
                <div>
                  <div style={styles.menuItemTitle}>Dicas e novidades</div>
                  <div style={styles.menuItemSub}>{notifDicas ? 'Ativadas' : 'Desativadas'}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle('notifDicas', !notifDicas)}
                  style={{ ...styles.toggleSwitch, backgroundColor: notifDicas ? '#00e0ff' : '#0b0e1b' }}
                  aria-pressed={notifDicas}
                  aria-label="Alternar dicas e novidades"
                >
                  <div style={{ ...styles.toggleThumb, transform: notifDicas ? 'translateX(16px)' : 'translateX(0)' }} />
                </button>
              </div>
            </div>
          </div>

          <div style={styles.configBox}>
            <div style={styles.sectionTitle}>🎧 SUPORTE</div>
            <div style={styles.menuList}>
              <button type="button" onClick={() => { setSupportView('help'); setSupportStatus(''); }} style={styles.supportAction}>
                <div>
                  <div style={styles.menuItemTitle}>Central de ajuda</div>
                  <div style={styles.menuItemSub}>Tire suas dúvidas.</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </button>
              <button type="button" onClick={() => { setSupportView('contact'); setSupportStatus(''); }} style={{ ...styles.supportAction, borderBottom: 'none' }}>
                <div>
                  <div style={styles.menuItemTitle}>Fale conosco</div>
                  <div style={styles.menuItemSub}>Envie uma mensagem para o suporte.</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </button>
            </div>
          </div>

          <div style={styles.configBox}>
            <div style={styles.sectionTitle}>ℹ️ SOBRE</div>
            <div style={styles.menuList}>
              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Versão do app</div>
                  <div style={styles.menuItemSub}>1.0.0</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </div>
              <div style={{ ...styles.menuItem, borderBottom: 'none' }}>
                <div>
                  <div style={styles.menuItemTitle}>Atualizações</div>
                  <div style={styles.menuItemSub}>Seu app está atualizado.</div>
                </div>
                <span style={{ color: '#00e0ff', fontSize: '14px' }}>✓</span>
              </div>
            </div>
          </div>
        </div>

        {supportView !== 'menu' && (
          <section style={{ ...styles.configBox, marginBottom: '12px' }} aria-live="polite">
            <div style={styles.supportHeader}>
              <div style={styles.sectionTitle}>{supportView === 'help' ? 'CENTRAL DE AJUDA' : 'FALE CONOSCO'}</div>
              <button type="button" onClick={() => { setSupportView('menu'); setSupportStatus(''); }} style={styles.supportBack}>Voltar</button>
            </div>
            {supportView === 'help' ? (
              <div style={styles.helpContent}>
                <details><summary>Como gerar e agendar meu treino?</summary><p>Na área da Artemis, preencha suas preferências, selecione os dias da semana e toque em “Gerar treino com IA”. Os treinos aparecem nos dias selecionados da agenda.</p></details>
                <details><summary>Como marcar um treino como concluído?</summary><p>Na agenda da página inicial, selecione o dia e toque em “Concluir” no treino realizado.</p></details>
                <details><summary>Como alterar meus dados de treino?</summary><p>Edite suas preferências na área da Artemis ou abra a pesquisa do perfil na página inicial.</p></details>
              </div>
            ) : (
              <form onSubmit={handleSupportSubmit} style={styles.supportForm}>
                <label htmlFor="support-message" style={styles.menuItemSub}>Mensagem enviada por {userEmail || 'sua conta'}</label>
                <textarea id="support-message" value={supportMessage} onChange={(event) => setSupportMessage(event.target.value)} required maxLength={4000} rows={4} placeholder="Como podemos ajudar?" style={styles.supportTextarea} />
                <button type="submit" disabled={isSendingSupport || !supportMessage.trim()} style={styles.supportSubmit}>{isSendingSupport ? 'Abrindo...' : 'Abrir WhatsApp'}</button>
              </form>
            )}
            {supportStatus && <p role={supportStatus.startsWith('Não') ? 'alert' : 'status'} style={styles.supportStatus}>{supportStatus}</p>}
          </section>
        )}

        {settingsError && <p role="alert" style={styles.settingsError}>{settingsError}</p>}
        {signOutError && <p role="alert" style={styles.settingsError}>{signOutError}</p>}
        <button type="button" onClick={onSignOut} disabled={isSigningOut} style={styles.logoutBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🚪</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff4d4d' }}>{isSigningOut ? 'Saindo...' : 'Sair da conta'}</span>
          </div>
          <span style={{ fontSize: '10px', color: '#64748b' }}>Encerrar sessão no MotionFit.</span>
        </button>

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
    maxWidth: '750px',
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
  configSectionsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '12px'
  },
  configBox: {
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '12px',
    padding: '12px 14px'
  },
  sectionTitle: {
    fontSize: '10px',
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: '0.05em',
    marginBottom: '10px'
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column'
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '8px',
    marginBottom: '8px',
    borderBottom: '1px solid rgba(0, 100, 200, 0.1)',
    cursor: 'pointer'
  },
  supportAction: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    padding: '0 0 8px',
    marginBottom: '8px',
    border: 0,
    borderBottom: '1px solid rgba(0, 100, 200, 0.1)',
    background: 'transparent',
    textAlign: 'left',
    cursor: 'pointer',
  },
  supportHeader: { display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  supportBack: { border: 0, background: 'transparent', color: '#67e8f9', fontSize: '11px', cursor: 'pointer' },
  helpContent: { display: 'grid', gap: '10px', color: '#cbd5e1', fontSize: '11px', lineHeight: 1.5 },
  supportForm: { display: 'grid', gap: '10px' },
  supportTextarea: { width: '100%', boxSizing: 'border-box', resize: 'vertical', border: '1px solid rgba(0, 100, 200, 0.3)', borderRadius: '8px', background: '#070913', color: '#fff', padding: '10px', font: 'inherit', fontSize: '12px' },
  supportSubmit: { justifySelf: 'start', border: 0, borderRadius: '8px', background: '#00b8d4', color: '#041014', padding: '9px 14px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' },
  supportStatus: { margin: '10px 0 0', color: '#a5f3fc', fontSize: '11px' },
  menuItemTitle: {
    fontSize: '11px',
    fontWeight: 700,
    color: '#fff'
  },
  menuItemSub: {
    fontSize: '9px',
    color: '#94a3b8'
  },
  toggleSwitch: {
    width: '36px',
    height: '20px',
    borderRadius: '10px',
    padding: '2px',
    cursor: 'pointer',
    border: '1px solid rgba(0, 100, 200, 0.3)',
    transition: 'background-color 0.2s ease',
    display: 'flex',
    alignItems: 'center'
  },
  toggleThumb: {
    width: '16px',
    height: '16px',
    borderRadius: '50%',
    backgroundColor: '#fff',
    transition: 'transform 0.2s ease',
    boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
  },
  selectPillGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    justifyContent: 'flex-end',
    maxWidth: '140px'
  },
  optionPill: {
    backgroundColor: '#0f172a',
    color: '#cbd5e1',
    border: '1px solid rgba(0, 100, 200, 0.2)',
    borderRadius: '9999px',
    padding: '4px 6px',
    fontSize: '9px',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  optionPillActive: {
    background: 'linear-gradient(90deg, #00e0ff 0%, #0066ff 100%)',
    color: '#fff',
    borderColor: 'transparent',
    boxShadow: '0 0 12px rgba(0, 224, 255, 0.3)'
  },
  logoutBox: {
    width: '100%',
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(255, 77, 77, 0.3)',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer'
  },
  settingsError: {
    color: '#fecaca',
    fontSize: '11px',
    margin: '8px 0 0'
  }
};