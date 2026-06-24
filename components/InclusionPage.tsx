import { FC, useState } from 'react';
import { Shield, CheckCircle, AlertCircle, Heart } from 'lucide-react';
import { supabase } from '../services/supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { SEO } from './SEO';

export const InclusionPage: FC = () => {
  const { authSession } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [state, setState] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [result, setResult] = useState<{ monthly_limit?: number; active_until?: string; error?: string } | null>(null);

  const handleRedeem = async () => {
    if (!code.trim()) return;
    if (!authSession) { navigate('/login'); return; }
    setState('loading');
    try {
      const { data, error } = await supabase.rpc('redeem_inclusion_voucher', { p_code: code.trim() });
      if (error) { setState('error'); setResult({ error: error.message }); return; }
      if (data?.success) { setState('success'); setResult(data); }
      else { setState('error'); setResult({ error: data?.error || 'Onbekende fout' }); }
    } catch (err: any) {
      setState('error');
      setResult({ error: err.message || 'Er ging iets mis' });
    }
  };

  return (
    <>
      <SEO
        title="Inclusieprogramma — FAINL"
        description="Het FAINL Inclusieprogramma biedt kosteloze toegang tot AI-consensus voor mensen in financieel kwetsbare situaties."
        canonical="/inclusie"
      />
      <div className="incl-page">
        <div className="incl-page__inner">

          {/* Header */}
          <div className="incl-page__header">
            <div className="incl-page__icon">
              <Heart className="incl-page__icon-svg" />
            </div>
            <h1 className="incl-page__title">FAINL Inclusieprogramma</h1>
            <p className="incl-page__subtitle">
              AI-consensus voor iedereen die het nodig heeft, niet alleen voor iedereen die het kan betalen.
            </p>
          </div>

          {/* Stats */}
          <div className="incl-page__stats">
            {[
              { label: 'Vragen per maand', value: '100' },
              { label: 'Geldigheid', value: '12 maanden' },
              { label: 'Kosten', value: 'Gratis' },
            ].map(({ label, value }) => (
              <div key={label} className="incl-page__stat">
                <div className="incl-page__stat-value">{value}</div>
                <div className="incl-page__stat-label">{label}</div>
              </div>
            ))}
          </div>

          {/* Voucher form */}
          {state === 'success' ? (
            <div className="incl-page__success">
              <CheckCircle className="incl-page__success-icon" />
              <h2 className="incl-page__success-title">Inclusieaccount geactiveerd</h2>
              <p className="incl-page__success-desc">
                Je hebt {result?.monthly_limit} vragen per maand tot je beschikking.
              </p>
              <p className="incl-page__success-date">
                Geldig tot: {result?.active_until ? new Date(result.active_until).toLocaleDateString('nl-NL') : '—'}
              </p>
              <button onClick={() => navigate('/')} className="btn-send incl-page__success-cta">
                Stel je eerste vraag
              </button>
            </div>
          ) : (
            <div className="incl-page__form-card">
              <h2 className="incl-page__form-title">Inclusievoucher inwisselen</h2>
              <p className="incl-page__form-desc">
                Heb je een vouchercode ontvangen van je hulpverlener, gemeente of maatschappelijke organisatie? Vul deze hieronder in.
              </p>

              {!authSession && (
                <div className="incl-page__warning">
                  <AlertCircle className="incl-page__warning-icon" />
                  <span>Je moet eerst inloggen om een voucher in te wisselen.</span>
                </div>
              )}

              <div className="incl-page__input-row">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="FAINL-INCL-XXXX-2026"
                  maxLength={25}
                  aria-label="Vouchercode"
                  className="incl-page__code-input"
                  onKeyDown={e => { if (e.key === 'Enter') handleRedeem(); }}
                />
                <button
                  className="btn-send"
                  onClick={handleRedeem}
                  disabled={!code.trim() || state === 'loading'}
                >
                  {state === 'loading' ? 'Bezig...' : 'Activeren'}
                </button>
              </div>

              {state === 'error' && result?.error && (
                <p className="incl-page__error">{result.error}</p>
              )}
            </div>
          )}

          {/* About */}
          <div className="incl-page__about">
            <h3 className="incl-page__about-title">Voor wie is dit programma?</h3>
            <ul className="incl-page__list">
              {[
                'Deelnemers aan schuldhulpverlening',
                'Mensen onder bewindvoering',
                'Deelnemers aan participatie- of re-integratietrajecten',
                'Mensen met een uitkeringssituatie',
                'Cliënten van sociale wijkteams en maatschappelijk werk',
              ].map(item => (
                <li key={item} className="incl-page__list-item">
                  <Shield className="incl-page__list-icon" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="incl-page__disclaimer">
              Vouchers worden uitsluitend verstrekt door erkende maatschappelijke organisaties. FAINL verwerkt geen inkomensgegevens — de beoordeling vindt plaats bij de verstrekkende instantie.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
