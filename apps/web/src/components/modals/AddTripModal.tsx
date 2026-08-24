import { useState } from 'react';
import { useApp } from '../../app/AppContext';
import { TRAVELERS } from '../../lib/data';
import type { Trip, TripCategory } from '../../lib/types';
import { CATEGORIES } from '../../lib/utils';
import { geocode } from '../../lib/clients/openMeteo';
import { HOME_CURRENCY } from '../../lib/currency';
import { Icon } from '../Icon';

type FormData = {
  destination: string;
  region: string;
  country: string;
  date_approx: string;
  start_date: string;
  end_date: string;
  categories: TripCategory[];
  travelers: string[];
  budget_total: string;
  budget_currency: string;
};

const STEP_LABELS = ['the idea', 'who and what', 'first details'];
/** A short list of common travel currencies; all are quoted by the ECB via Frankfurter. */
const CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'MXN', 'SEK', 'NOK'];
const COVER_HUES = [20, 180, 350, 260, 60, 110, 300];

export function AddTripModal() {
  const { addTrip, setShowModal } = useApp();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>({
    destination: '',
    region: '',
    country: '',
    date_approx: '',
    start_date: '',
    end_date: '',
    categories: [],
    travelers: ['t1'],
    budget_total: '',
    budget_currency: HOME_CURRENCY,
  });

  const [lookingUp, setLookingUp] = useState(false);

  const close = () => setShowModal(false);

  /**
   * Fills in region and country from the destination via Open-Meteo's geocoder.
   * Anything the user already typed wins — this only fills blanks.
   */
  const autofillFromDestination = async () => {
    const name = data.destination.trim();
    if (!name) return;
    setLookingUp(true);
    const place = await geocode(name, (url, init) => fetch(url, init));
    setLookingUp(false);
    if (!place) return;
    setData((d) => ({
      ...d,
      region: d.region || place.region,
      country: d.country || place.country,
    }));
  };

  const toggleCat = (k: TripCategory) =>
    setData((d) => ({
      ...d,
      categories: d.categories.includes(k)
        ? d.categories.filter((c) => c !== k)
        : [...d.categories, k],
    }));

  const toggleTrav = (id: string) =>
    setData((d) => ({
      ...d,
      travelers: d.travelers.includes(id)
        ? d.travelers.filter((t) => t !== id)
        : [...d.travelers, id],
    }));

  const canProceed = () => {
    if (step === 0) return Boolean(data.destination.trim() && data.country.trim());
    if (step === 1) return data.categories.length > 0 && data.travelers.length > 0;
    return true;
  };

  const submit = () => {
    const hue = COVER_HUES[Math.floor(Math.random() * COVER_HUES.length)];
    const trip: Trip = {
      id: 'tr-' + Math.random().toString(36).slice(2, 8),
      destination: data.destination.trim(),
      region: data.region.trim(),
      country: data.country.trim(),
      stage: 'dreaming',
      categories: data.categories,
      start_date: data.start_date || null,
      end_date: data.end_date || null,
      date_approx: data.date_approx || null,
      budget_total: Number(data.budget_total) || 0,
      budget_spent: 0,
      budget_currency: data.budget_currency,
      travelers: data.travelers,
      cover: { hue, label: 'new·' + data.country.toLowerCase().slice(0, 4) },
      notes: '',
      nights: 0,
    };
    addTrip(trip);
    close();
  };

  return (
    <div className="modal-backdrop" onClick={close}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <h2>New trip <em>· {STEP_LABELS[step]}</em></h2>
            <button className="icon-btn" aria-label="Close" onClick={close}><Icon.Close /></button>
          </div>
          <div className="modal-steps">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`s${i <= step ? ' on' : ''}`} />
            ))}
          </div>
        </div>

        <div className="modal-body">
          {step === 0 && (
            <>
              <div className="field">
                <label htmlFor="atm-destination">Destination</label>
                <input
                  id="atm-destination"
                  autoFocus
                  value={data.destination}
                  onChange={(e) => setData((d) => ({ ...d, destination: e.target.value }))}
                  onBlur={() => void autofillFromDestination()}
                  placeholder="Kyoto, Patagonia, Lisbon…"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div className="field">
                  <label htmlFor="atm-region">
                    Region / venue{lookingUp && <em className="atm-hint"> · looking up…</em>}
                  </label>
                  <input
                    id="atm-region"
                    value={data.region}
                    onChange={(e) => setData((d) => ({ ...d, region: e.target.value }))}
                    placeholder="Optional"
                  />
                </div>
                <div className="field">
                  <label htmlFor="atm-country">Country</label>
                  <input
                    id="atm-country"
                    value={data.country}
                    onChange={(e) => setData((d) => ({ ...d, country: e.target.value }))}
                    placeholder="Japan"
                  />
                </div>
              </div>
              <div className="field">
                <label htmlFor="atm-date">When?</label>
                <input
                  id="atm-date"
                  value={data.date_approx}
                  onChange={(e) => setData((d) => ({ ...d, date_approx: e.target.value }))}
                  placeholder="Spring 2027, or leave blank"
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="field">
                <label>Categories</label>
                <div className="cat-pick">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c.key}
                      className={`c${data.categories.includes(c.key) ? ' on' : ''}`}
                      onClick={() => toggleCat(c.key)}
                    >
                      <span className="cat-pip" style={{ background: c.color }} />
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="field">
                <label>Travelers</label>
                <div className="cat-pick">
                  {TRAVELERS.map((t) => (
                    <button
                      key={t.id}
                      className={`c${data.travelers.includes(t.id) ? ' on' : ''}`}
                      onClick={() => toggleTrav(t.id)}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 14 }}>
                <div className="field">
                  <label htmlFor="atm-budget">Rough budget</label>
                  <input
                    id="atm-budget"
                    type="number"
                    value={data.budget_total}
                    onChange={(e) => setData((d) => ({ ...d, budget_total: e.target.value }))}
                    placeholder="8000"
                  />
                </div>
                <div className="field">
                  <label htmlFor="atm-currency">Currency</label>
                  <select
                    id="atm-currency"
                    value={data.budget_currency}
                    onChange={(e) => setData((d) => ({ ...d, budget_currency: e.target.value }))}
                  >
                    {CURRENCIES.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div style={{ background: 'var(--bg-sunken)', padding: 16, borderRadius: 10, fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, marginBottom: 4 }}>
                  Great — we'll drop <em style={{ fontStyle: 'italic' }}>{/* v8 ignore next */ data.destination || 'this trip'}</em> into Dreaming.
                </div>
                Add flights, lodging, itinerary later as things firm up. No rush.
              </div>
            </>
          )}
        </div>

        <div className="modal-foot">
          <button className="btn ghost" onClick={step === 0 ? close : () => setStep((s) => s - 1)}>
            {step === 0 ? 'Cancel' : '← Back'}
          </button>
          <button
            className="btn primary"
            disabled={!canProceed()}
            onClick={() => (step < 2 ? setStep((s) => s + 1) : submit())}
          >
            {step < 2 ? 'Next →' : 'Add trip'}
          </button>
        </div>
      </div>
    </div>
  );
}
