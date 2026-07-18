import { motion } from 'framer-motion';
import { HUDPanel, Readout, ACCENT } from './ui/HUDPanel';
import { RiskCard } from './RiskCard';
import { DNSCard } from './DNSCard';
import { TLSCard } from './TLSCard';
import { HeadersCard } from './HeadersCard';
import { SubdomainCard } from './SubdomainCard';
import { PortsCard } from './PortsCard';
import { exportPDF } from '../lib/exportPDF';

function HTTPCard({ http }) {
  if (!http) return null;

  return (
    <HUDPanel label="HTTP Fingerprint" accent={ACCENT.cyan} delay={0.05}>
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {[['HTTP', http.http], ['HTTPS', http.https]].map(([proto, d]) => {
          const ok = d?.status < 400;
          const c = ok ? '#00E08A' : '#FF3355';
          return (
            <div key={proto} className="p-3" style={{ background: 'rgba(20,36,58,0.25)', borderLeft: `2px solid ${c}` }}>
              <div className="hud-sublabel mb-1" style={{ fontSize: '0.58rem' }}>{proto}</div>
              <div className="font-mono text-lg font-bold count-num" style={{ color: c }}>{d?.status || '—'}</div>
              <div className="font-mono text-xs" style={{ color: '#6B8199' }}>{d?.responseTime}ms</div>
            </div>
          );
        })}
      </div>

      <div className="space-y-1.5">
        <Readout label="HTTPS Redirect" value={http.httpsRedirect ? '✓ Enforced' : '✗ Missing'} color={http.httpsRedirect ? '#00E08A' : '#FF3355'} />
        {http.waf && <Readout label="WAF" value={http.waf} color="#4D9FFF" />}
        {http.server && <Readout label="Server" value={http.server} />}
        {http.poweredBy && <Readout label="Powered By" value={http.poweredBy} color="#FFA31A" />}
        <Readout label="Open Redirect" value={http.openRedirect?.vulnerable ? '⚠ Vulnerable' : '✓ Not detected'} color={http.openRedirect?.vulnerable ? '#FF3355' : '#00E08A'} />
      </div>

      {http.techStack?.length > 0 && (
        <div className="mt-4">
          <div className="hud-sublabel mb-2">Tech Stack</div>
          <div className="flex flex-wrap gap-1.5">
            {http.techStack.map((t, i) => (
              <span key={i} className="chip" style={{ background: 'rgba(20,36,58,0.5)', color: '#DCE9F5', borderColor: '#1E3A5C' }}>
                {t.name}
              </span>
            ))}
          </div>
        </div>
      )}
    </HUDPanel>
  );
}

export function ResultGrid({ result, onAIAnalyze }) {
  if (!result) return null;

  const { modules, risk, domain } = result;

  return (
    <div className="w-full h-full scrollable px-3 sm:px-4 py-3 sm:py-4 space-y-4 pb-6">
      {/* Ops header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between gap-3 flex-wrap"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="hud-panel__led flex-shrink-0" style={{ '--accent': '#00E08A' }} />
          <div className="min-w-0">
            <h2 className="stencil text-base sm:text-lg text-text-primary break-all">{domain}</h2>
            <div className="hud-sublabel" style={{ fontSize: '0.58rem' }}>
              SWEEP COMPLETE · {new Date(result.timestamp).toLocaleTimeString('en-GB', { hour12: false })}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => exportPDF(result)}
            className="hud-btn px-3 py-2 text-xs"
            style={{ '--accent': '#4D9FFF', color: '#4D9FFF' }}
          >
            ↓ <span className="hidden xs:inline">EXPORT</span>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onAIAnalyze(modules, domain)}
            className="hud-btn hud-btn--solid px-3 py-2 text-xs"
            style={{ '--accent': '#00E08A' }}
          >
            ◈ <span className="hidden xs:inline">AI ANALYZE</span><span className="xs:hidden">AI</span>
          </motion.button>
        </div>
      </motion.div>

      {/* Console grid — stacks on mobile, risk shown first */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-4 min-w-0 order-last lg:order-none">
          {modules.dns && <DNSCard dns={modules.dns} />}
          {modules.dns?.subdomains?.length > 0 && <SubdomainCard dns={modules.dns} />}
          {modules.tls && <TLSCard tls={modules.tls} />}
          {modules.http && <HTTPCard http={modules.http} />}
          {modules.secHeaders && <HeadersCard secHeaders={modules.secHeaders} />}
          {modules.ports && <PortsCard ports={modules.ports} />}
        </div>

        <div className="order-first lg:order-none">
          <div className="lg:sticky lg:top-0">
            <RiskCard risk={risk} />
          </div>
        </div>
      </div>
    </div>
  );
}
