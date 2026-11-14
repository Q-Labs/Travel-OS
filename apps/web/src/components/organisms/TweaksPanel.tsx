import { useApp } from '../../app/AppContext';
import { Icon } from '../atoms/Icon';

type AccentKey = 'cobalt' | 'emerald' | 'violet' | 'rust';

const ACCENTS: { key: AccentKey; val: string; label: string }[] = [
  { key: 'cobalt', val: '#2563EB', label: 'Cobalt' },
  { key: 'emerald', val: '#1F8A5B', label: 'Emerald' },
  { key: 'violet', val: '#7A5AE0', label: 'Violet' },
  { key: 'rust', val: '#C2410C', label: 'Rust' },
];

export function TweaksPanel() {
  const { theme, setTheme, accent, setAccent, density, setDensity, setTweaksOpen } = useApp();

  const close = () => setTweaksOpen(false);

  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        Tweaks <em style={{ fontStyle: 'normal', color: 'var(--ink-3)' }}>· preview</em>
        <button className="icon-btn" aria-label="Close" onClick={close}><Icon.Close /></button>
      </div>
      <div className="tweaks-body">
        <div className="tweak-row">
          <div className="l">Theme</div>
          <div className="opts">
            {['light', 'dark'].map((t) => (
              <button
                key={t}
                className={`o${theme === t ? ' on' : ''}`}
                onClick={() => setTheme(t as 'light' | 'dark')}
              >
                {t === 'light' ? 'Light' : 'Dark'}
              </button>
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="l">Accent</div>
          <div className="swatches">
            {ACCENTS.map((a) => (
              <button
                key={a.key}
                className={`sw${accent === a.key ? ' on' : ''}`}
                style={{ background: a.val }}
                title={a.label}
                onClick={() => setAccent(a.key)}
              />
            ))}
          </div>
        </div>
        <div className="tweak-row">
          <div className="l">Density</div>
          <div className="opts">
            {['compact', 'normal', 'roomy'].map((d) => (
              <button
                key={d}
                className={`o${density === d ? ' on' : ''}`}
                onClick={() => setDensity(d as 'compact' | 'normal' | 'roomy')}
              >
                {d}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
