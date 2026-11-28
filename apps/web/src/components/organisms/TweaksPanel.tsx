import { useApp } from '../../app/AppContext';
import { ACCENTS } from '../../lib/accents';
import { Icon } from '../atoms/Icon';

/**
 * The Tweaks panel: switches the theme (light or dark), the accent colour and
 * the density. It is a prototype control, and `FLAG_TWEAKS` is the switch that
 * will hide it.
 */
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
                style={{ background: a.swatch }}
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
