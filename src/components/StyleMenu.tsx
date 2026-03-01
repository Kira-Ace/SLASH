import React, { useState, useEffect, useRef } from 'react';
import { MoreHorizontal } from 'lucide-react';

type Theme = 'sky' | 'academia' | 'mono';

export const StyleMenu: React.FC = () => {
  const [currentTheme, setCurrentTheme] = useState<Theme>('sky');
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('slash_theme_pref') as Theme;
    if (saved) applyTheme(saved);
  }, []);

  const applyTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    const fonts = {
      sky: "'Courier New', Courier, monospace",
      academia: "'Georgia', serif",
      mono: "Inter, sans-serif"
    };
    
    document.body.style.fontFamily = fonts[theme];
    localStorage.setItem('slash_theme_pref', theme);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    /* Changed position to relative to fit inside the navbar bezel */
    <div ref={menuRef} style={{ position: 'relative', zIndex: 2000 }}>
      <button 
        onClick={() => setMenuOpen(!menuOpen)} 
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          color: 'var(--accent-color)', 
          padding: '4px',
          display: 'flex',
          alignItems: 'center'
        }}
      >
        <MoreHorizontal size={24} />
      </button>
      
      {menuOpen && (
        <div style={{
          position: 'absolute', 
          right: 0, 
          top: '100%', 
          marginTop: '8px',
          backgroundColor: 'white', 
          border: '2px var(--border-style) var(--accent-color)', 
          borderRadius: '12px', 
          padding: '10px', 
          width: '240px',
          boxShadow: 'var(--header-shadow)', 
          display: 'flex', 
          gap: '8px'
        }}>
           {(['sky', 'academia', 'mono'] as Theme[]).map((t) => (
             <button 
               key={t}
               onClick={() => { applyTheme(t); setMenuOpen(false); }}
               style={{
                 flex: 1, 
                 padding: '10px 5px', 
                 border: currentTheme === t ? '2px solid var(--accent-color)' : '1px solid #eee',
                 borderRadius: '8px', 
                 background: currentTheme === t ? 'var(--bg-color)' : 'white', 
                 cursor: 'pointer',
                 textTransform: 'capitalize',
                 fontFamily: t === 'academia' ? "'Georgia', serif" : t === 'mono' ? 'Inter, sans-serif' : "'Courier New', monospace"
               }}
             >
                <div style={{ fontWeight: 'bold' }}>{t}</div>
             </button>
           ))}
        </div>
      )}
    </div>
  );
};