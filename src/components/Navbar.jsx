import React from 'react';
import { NavLink } from 'react-router-dom';

const navItems = [
  { to: '/', label: 'Início', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { to: '/ia', label: 'Treino IA', icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z' },
  { to: '/movimentos', label: 'Movimento + Treinos', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { to: '/planos', label: 'Planos', icon: 'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' },
  { to: '/perfil', label: 'Perfil', icon: 'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z' },
];

export default function Navbar({ onOpenNotif = () => {}, onOpenConfig = () => {} }) {
  return (
    <header className="flex w-full items-center justify-between border-b border-[#0d1f39]/80 bg-[#070913] px-6 py-4 shadow-[0_0_20px_rgba(0,150,255,0.15)] select-none">
      <div className="flex items-center gap-3">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-cyan-400/40 bg-gradient-to-br from-[#0c132c] to-[#04060b] shadow-[0_0_15px_rgba(0,162,255,0.25)]">
          <svg className="h-6 w-6 text-cyan-400 drop-shadow-[0_0_8px_rgba(0,224,255,0.8)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>

        <div className="flex flex-col">
          <span className="flex items-center gap-1 text-[20px] font-black italic tracking-[0.05em] text-white">
            MOTION<span className="text-cyan-400">FIT</span>
          </span>
          <span className="mt-1 text-[9px] font-semibold uppercase tracking-[0.25em] text-cyan-300/70">
            DESENVOLVIMENTO
          </span>
        </div>
      </div>

      <nav className="flex items-center gap-1 rounded-full border border-[#0a1f3a] bg-[#0b0e1b]/80 p-1.5 shadow-inner">
        {navItems.map(({ to, label, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium transition-all duration-300',
                isActive
                  ? 'border border-cyan-300/30 bg-gradient-to-r from-cyan-500 to-sky-700 text-white shadow-[0_0_20px_rgba(0,140,255,0.5)]'
                  : 'bg-transparent text-slate-400 hover:text-cyan-300',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <svg className="h-4 w-4" style={{ color: isActive ? '#fff' : '#00e0ff' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <button
          type="button"
          title="Notificações"
          onClick={onOpenNotif}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#0d1f39] bg-[#0b0e1b] text-slate-400 transition hover:border-cyan-400/60 hover:text-cyan-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
        </button>

        <button
          type="button"
          title="Configurações"
          onClick={onOpenConfig}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-[#0d1f39] bg-[#0b0e1b] text-slate-400 transition hover:border-cyan-400/60 hover:text-cyan-300"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
