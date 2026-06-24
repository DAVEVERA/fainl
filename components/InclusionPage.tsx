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
    if (!authSession) {
      navigate('/login');
      return;
    }

    setState('loading');
    try {
      const { data, error } = await supabase.rpc('redeem_inclusion_voucher', { p_code: code.trim() });
      if (error) {
        setState('error');
        setResult({ error: error.message });
        return;
      }
      if (data?.success) {
        setState('success');
        setResult(data);
      } else {
        setState('error');
        setResult({ error: data?.error || 'Onbekende fout' });
      }
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
      <div className="w-full bg-white dark:bg-black pt-8 md:pt-16 pb-16 md:pb-24">
        <div className="max-w-2xl mx-auto px-4 md:px-6">

          {/* Header */}
          <div className="text-center mb-12 md:mb-16">
            <div className="w-14 h-14 bg-[var(--action)] flex items-center justify-center mx-auto mb-6" style={{ borderRadius: 'var(--r-lg)' }}>
              <Heart className="w-7 h-7" style={{ color: 'var(--action-text)' }} />
            </div>
            <h1 style={{ fontFamily: 'var(--f-display)', fontSize: 'clamp(1.5rem, 4vw, 2.25rem)', fontWeight: 600, letterSpacing: '-0.03em', color: 'var(--ink)' }}>
              FAINL Inclusieprogramma
            </h1>
            <p style={{ fontSize: '15px', color: 'var(--ink-3)', lineHeight: 1.6, marginTop: '12px', maxWidth: '480px', marginLeft: 'auto', marginRight: 'auto' }}>
              AI-consensus voor iedereen die het nodig heeft, niet alleen voor iedereen die het kan betalen.
            </p>
          </div>

          {/* Info cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10">
            {[
              { label: 'Vragen per maand', value: '100' },
              { label: 'Geldigheid', value: '12 maanden' },
              { label: 'Kosten', value: 'Gratis' },
            ].map(({ label, value }) => (
              <div key={label} style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-lg)', padding: '16px', textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--ink)', fontFamily: 'var(--f-display)' }}>{value}</div>
                <div style={{ fontSize: '11px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--ink-4)', marginTop: '4px' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Voucher form */}
          {state === 'success' ? (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--ok)', borderRadius: 'var(--r-xl)', padding: '32px', textAlign: 'center' }}>
              <CheckCircle className="w-10 h-10 mx-auto mb-4" style={{ color: 'var(--ok)' }} />
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '20px', fontWeight: 600, color: 'var(--ink)', marginBottom: '8px' }}>
                Inclusieaccount geactiveerd
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--ink-3)', marginBottom: '4px' }}>
                Je hebt {result?.monthly_limit} vragen per maand tot je beschikking.
              </p>
              <p style={{ fontSize: '12px', color: 'var(--ink-4)' }}>
                Geldig tot: {result?.active_until ? new Date(result.active_until).toLocaleDateString('nl-NL') : '—'}
              </p>
              <button
                onClick={() => navigate('/')}
                className="btn-send"
                style={{ marginTop: '24px' }}
              >
                Stel je eerste vraag
              </button>
            </div>
          ) : (
            <div style={{ background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 'var(--r-xl)', padding: '24px 24px 28px' }}>
              <h2 style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '6px' }}>
                Inclusievoucher inwisselen
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--ink-3)', marginBottom: '16px' }}>
                Heb je een vouchercode ontvangen van je hulpverlener, gemeente of maatschappelijke organisatie? Vul deze hieronder in.
              </p>

              {!authSession && (
                <div style={{ background: 'color-mix(in srgb, var(--warn) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--warn) 30%, transparent)', borderRadius: 'var(--r-md)', padding: '12px 16px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--warn)' }} />
                  <span style={{ fontSize: '13px', color: 'var(--ink-2)' }}>Je moet eerst inloggen om een voucher in te wisselen.</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="FAINL-INCL-XXXX-2026"
                  maxLength={25}
                  aria-label="Vouchercode"
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    background: 'var(--input-bg)',
                    border: '1px solid var(--input-border)',
                    borderRadius: 'var(--r-md)',
                    fontFamily: 'var(--f-mono)',
                    fontSize: '14px',
                    letterSpacing: '0.05em',
                    color: 'var(--ink)',
                    outline: 'none',
                  }}
                  onKeyDown={e => { if (e.key === 'Enter') handleRedeem(); }}
                />
                <button
                  className="btn-send"
                  onClick={handleRedeem}
                  disabled={!code.trim() || state === 'loading'}
                  style={{ whiteSpace: 'nowrap' }}
                >
                  {state === 'loading' ? 'Bezig...' : 'Activeren'}
                </button>
              </div>

              {state === 'error' && result?.error && (
                <p style={{ fontSize: '13px', color: 'var(--err)', marginTop: '10px' }}>
                  {result.error}
                </p>
              )}
            </div>
          )}

          {/* About section */}
          <div style={{ marginTop: '48px' }}>
            <h3 style={{ fontFamily: 'var(--f-display)', fontSize: '16px', fontWeight: 600, color: 'var(--ink)', marginBottom: '12px' }}>
              Voor wie is dit programma?
            </h3>
            <ul style={{ fontSize: '14px', color: 'var(--ink-2)', lineHeight: 1.8, listStyle: 'none', padding: 0 }}>
              {[
                'Deelnemers aan schuldhulpverlening',
                'Mensen onder bewindvoering',
                'Deelnemers aan participatie- of re-integratietrajecten',
                'Mensen met een uitkeringssituatie',
                'Cliënten van sociale wijkteams en maatschappelijk werk',
              ].map(item => (
                <li key={item} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                  <Shield className="w-4 h-4 shrink-0" style={{ color: 'var(--ink-4)', marginTop: '3px' }} />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p style={{ fontSize: '13px', color: 'var(--ink-4)', marginTop: '16px' }}>
              Vouchers worden uitsluitend verstrekt door erkende maatschappelijke organisaties. FAINL verwerkt geen inkomensgegevens — de beoordeling vindt plaats bij de verstrekkende instantie.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
