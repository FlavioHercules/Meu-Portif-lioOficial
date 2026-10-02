import React from 'react';

export default function ConfiguracoesModal({ isOpen, onClose, settings, onChangeSetting }) {
  if (!isOpen) return null;

  const { darkMode, notifTreinos, notifConquistas, notifDicas, interfaceTheme, fontSize } = settings;

  const themeOptions = ['Neon', 'Aurora', 'Focus'];
  const fontOptions = ['Pequeno', 'Normal', 'Grande'];

  const handleToggle = (key, value) => onChangeSetting(key, value);

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
            <div style={styles.sectionTitle}>👤 CONTA</div>
            <div style={styles.menuList}>
              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Editar perfil</div>
                  <div style={styles.menuItemSub}>Altere suas informações pessoais.</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </div>
              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Privacidade</div>
                  <div style={styles.menuItemSub}>Gerencie seus dados e visibilidade.</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </div>
              <div style={{ ...styles.menuItem, borderBottom: 'none' }}>
                <div>
                  <div style={styles.menuItemTitle}>Sincronização</div>
                  <div style={styles.menuItemSub}>Conecte com outros dispositivos.</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </div>
            </div>
          </div>

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
                  aria-label="Alternar modo escuro"
                >
                  <div style={{ ...styles.toggleThumb, transform: darkMode ? 'translateX(16px)' : 'translateX(0)' }} />
                </button>
              </div>

              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Tema da interface</div>
                  <div style={styles.menuItemSub}>{interfaceTheme}</div>
                </div>
                <div style={styles.selectPillGroup}>
                  {themeOptions.map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => handleToggle('interfaceTheme', option)}
                      style={{
                        ...styles.optionPill,
                        ...(interfaceTheme === option ? styles.optionPillActive : {}),
                      }}
                    >
                      {option}
                    </button>
                  ))}
                </div>
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
                  aria-label="Alternar dicas e novidades"
                >
                  <div style={{ ...styles.toggleThumb, transform: notifDicas ? 'translateX(16px)' : 'translateX(0)' }} />
                </button>
              </div>
            </div>
          </div>

          <div style={styles.configBox}>
            <div style={styles.sectionTitle}>💾 DADOS E ARMAZENAMENTO</div>
            <div style={styles.menuList}>
              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Sincronizar dados</div>
                  <div style={styles.menuItemSub}>Última sincronização: hoje às 10:24</div>
                </div>
                <span style={{ color: '#00e0ff', fontSize: '14px' }}>🔄</span>
              </div>
              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Limpar cache</div>
                  <div style={styles.menuItemSub}>Libere espaço no seu dispositivo.</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </div>
              <div style={{ ...styles.menuItem, borderBottom: 'none' }}>
                <div>
                  <div style={styles.menuItemTitle}>Exportar dados</div>
                  <div style={styles.menuItemSub}>Baixe seu histórico de treinos.</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </div>
            </div>
          </div>

          <div style={styles.configBox}>
            <div style={styles.sectionTitle}>🎧 SUPORTE</div>
            <div style={styles.menuList}>
              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Central de ajuda</div>
                  <div style={styles.menuItemSub}>Tire suas dúvidas.</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </div>
              <div style={styles.menuItem}>
                <div>
                  <div style={styles.menuItemTitle}>Fale conosco</div>
                  <div style={styles.menuItemSub}>Envie um feedback.</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </div>
              <div style={{ ...styles.menuItem, borderBottom: 'none' }}>
                <div>
                  <div style={styles.menuItemTitle}>Termos de uso</div>
                  <div style={styles.menuItemSub}>Leia nossos termos.</div>
                </div>
                <span style={{ color: '#64748b' }}>›</span>
              </div>
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

        <div style={styles.logoutBox}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '14px' }}>🚪</span>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#ff4d4d' }}>Sair da conta</span>
          </div>
          <span style={{ fontSize: '10px', color: '#64748b' }}>Encerrar sessão no MotionFit.</span>
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
    maxWidth: '750px',
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
    backgroundColor: '#0b0e1b',
    border: '1px solid rgba(255, 77, 77, 0.3)',
    borderRadius: '12px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    cursor: 'pointer'
  }
};