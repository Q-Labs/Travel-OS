import { useApp } from '../../app/AppContext';
import { Icon } from '../atoms/Icon';

type AccentKey = 'orange' | 'olive' | 'blue' | 'plum' | 'sand';

const ACCENTS: { key: AccentKey; val: string; label: string }[] = [
  { key: 'orange', val: 'oklch(62% 0.15 50)', label: 'Clay' },
  { key: 'olive', val: 'oklch(55% 0.1 130)', label: 'Olive' },
  { key: 'blue', val: 'oklch(55% 0.12 250)', label: 'Ink' },
  { key: 'plum', val: 'oklch(55% 0.12 330)', label: 'Plum' },
  { key: 'sand', val: 'oklch(60% 0.04 60)', label: 'Sand' },
];

export function TweaksPanel() {
  const { theme, setTheme, accent, setAccent, density, setDensity, setTweaksOpen } = useApp();

  const close = () => setTweaksOpen(false);

  return (
    <div className="tweaks-panel">
      <div className="tweaks-head">
        Tweaks <em style={{ fontStyle: 'italic', color: 'var(--ink-3)' }}>· preview</em>
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
