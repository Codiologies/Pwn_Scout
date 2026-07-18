import { motion } from 'framer-motion';
import { HUDPanel, ACCENT } from './ui/HUDPanel';

const RISKY_PORTS = [21, 23, 445, 1433, 3306, 3389, 5432, 5900, 6379, 9200, 27017];
const PORT_COLORS = {
  critical: '#FF3355',
  high: '#FF6B2C',
  medium: '#FFA31A',
  info: '#4D9FFF'
};

function riskLevel(port) {
  if ([23, 3306, 5432, 1433, 27017, 6379, 9200].includes(port)) return 'critical';
  if ([3389, 445, 5900].includes(port)) return 'high';
  if ([21].includes(port)) return 'medium';
  return 'info';
}

export function PortsCard({ ports }) {
  if (!ports) return null;
  if (ports.error) return (
    <HUDPanel label="Port Sweep" accent={ACCENT.red}>
      <div className="font-mono text-xs break-words" style={{ color: '#FF3355' }}>Port scan error: {ports.error}</div>
    </HUDPanel>
  );

  const open = ports.open || [];
  const risky = open.filter(p => RISKY_PORTS.includes(p.port)).length;

  return (
    <HUDPanel
      label="Port Sweep"
      meta={`${open.length} open / ${ports.total}`}
      accent={risky ? ACCENT.red : ACCENT.lime}
      delay={0.12}
      actions={
        <span className="flex-shrink-0">
          {risky > 0 && <span className="chip badge-critical">{risky} RISKY</span>}
          {open.length === 0 && <span className="chip badge-pass">CLOSED</span>}
        </span>
      }
    >
      {open.length === 0 ? (
        <div className="font-mono text-xs text-center py-6" style={{ color: '#6B8199' }}>
          No open ports detected on common ports
        </div>
      ) : (
        <div className="space-y-1.5">
          {open.map((p, i) => {
            const risk = riskLevel(p.port);
            const color = PORT_COLORS[risk];
            return (
              <motion.div
                key={p.port}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.4) }}
                className="flex items-center gap-2 sm:gap-3 px-2.5 sm:px-3 py-2 font-mono text-xs"
                style={{ background: 'rgba(20,36,58,0.25)', borderLeft: `2px solid ${color}` }}
              >
                <span className="font-bold w-10 sm:w-12 text-right flex-shrink-0 count-num" style={{ color }}>{p.port}</span>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
                <span className="flex-1 text-text-primary min-w-0 truncate">
                  {p.service}
                  {p.software && p.software !== p.service && <span style={{ color: '#6B8199' }} className="ml-1">{p.software}</span>}
                  {p.version && <span className="ml-1 px-1" style={{ background: 'rgba(0,229,255,0.1)', color: '#00E5FF' }}>{p.version}</span>}
                  {p.poweredBy && <span className="ml-1 hidden sm:inline" style={{ color: '#6B8199' }}>via {p.poweredBy}</span>}
                </span>
                {p.httpStatus && <span className="hidden sm:block flex-shrink-0" style={{ color: '#6B8199' }}>{p.httpStatus}</span>}
                {risk !== 'info' && <span className="chip flex-shrink-0" style={{ background: `${color}18`, color, borderColor: `${color}40` }}>{risk}</span>}
              </motion.div>
            );
          })}
        </div>
      )}

      {import.meta.env.PROD && (
        <div className="mt-3 flex items-start gap-2 px-2.5 py-1.5" style={{ background: 'rgba(255,163,26,0.05)', border: '1px solid rgba(255,163,26,0.2)' }}>
          <span style={{ color: '#FFA31A' }} className="flex-shrink-0">⚠</span>
          <span className="font-mono" style={{ color: '#6B8199', fontSize: '0.66rem', lineHeight: 1.4 }}>Scanned from cloud IP — target firewall may block datacenter ranges. Run locally for accurate results.</span>
        </div>
      )}

      {ports.findings?.filter(f => f.severity !== 'info').length > 0 && (
        <div className="mt-4 space-y-1">
          {ports.findings.filter(f => f.severity !== 'info').map((f, i) => (
            <div key={i} className="flex items-start gap-2 font-mono text-xs p-2" style={{ background: 'rgba(255,51,85,0.05)', borderLeft: '2px solid #FF3355' }}>
              <span style={{ color: '#FF3355' }} className="flex-shrink-0">⚠</span>
              <div className="min-w-0">
                <div className="text-text-primary break-words">{f.title}</div>
                <div className="mt-0.5 break-words" style={{ color: '#6B8199' }}>{f.remediation}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </HUDPanel>
  );
}
