import { jsPDF } from 'jspdf';

/* ==========================================================================
   SCOUT // OPS — PDF intelligence report
   Command-center styling: void deck, cyan/amber HUD accents, tick gauge,
   bracketed panels. Presentation only — consumes the same recon result the
   dashboard renders.
   ========================================================================== */

const C = {
  void: [3, 6, 11],
  panel: [10, 18, 28],
  panel2: [13, 21, 33],
  line: [20, 36, 58],
  edge: [30, 58, 92],
  cyan: [0, 229, 255],
  amber: [255, 163, 26],
  lime: [0, 224, 138],
  red: [255, 51, 85],
  orange: [255, 107, 44],
  blue: [77, 159, 255],
  text: [220, 233, 245],
  muted: [107, 129, 153],
  faint: [62, 82, 102],
  white: [255, 255, 255]
};

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const COL = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 20;

function severityColor(sev) {
  const s = (sev || '').toLowerCase();
  if (s === 'critical') return C.red;
  if (s === 'high') return C.orange;
  if (s === 'medium') return C.amber;
  if (s === 'low') return C.blue;
  return C.muted;
}

function scoreColor(score) {
  return score >= 80 ? C.red : score >= 60 ? C.orange : score >= 40 ? C.amber : C.lime;
}

function riskLevel(port) {
  if ([23, 3306, 5432, 1433, 27017, 6379, 9200].includes(port)) return 'critical';
  if ([3389, 445, 5900].includes(port)) return 'high';
  if ([21].includes(port)) return 'medium';
  return 'info';
}

/** Blend an accent color over a base (for subtle translucent-looking fills). */
function tint(color, alpha, base = C.panel) {
  return [
    Math.round(color[0] * alpha + base[0] * (1 - alpha)),
    Math.round(color[1] * alpha + base[1] * (1 - alpha)),
    Math.round(color[2] * alpha + base[2] * (1 - alpha))
  ];
}

export function exportPDF(result) {
  const { domain, timestamp, modules = {}, risk = {} } = result;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  let y = 0;

  // ---- primitives --------------------------------------------------------
  function text(str, x, yy, opts = {}) {
    doc.setTextColor(...(opts.color || C.text));
    doc.setFontSize(opts.size || 9);
    doc.setFont(opts.font || 'helvetica', opts.bold ? 'bold' : opts.italic ? 'italic' : 'normal');
    if (opts.spacing != null && doc.setCharSpace) doc.setCharSpace(opts.spacing);
    doc.text(String(str), x, yy, { maxWidth: opts.maxWidth, align: opts.align || 'left' });
    if (opts.spacing != null && doc.setCharSpace) doc.setCharSpace(0);
  }

  /** Wrapped paragraph; advances and returns new y. */
  function paragraph(str, x, opts = {}) {
    const size = opts.size || 8;
    const lh = opts.lh || size * 0.42;
    const lines = doc.splitTextToSize(String(str), opts.maxWidth || COL - (x - MARGIN) - 2);
    lines.forEach(ln => {
      pageCheck(lh + 1);
      text(ln, x, y, opts);
      y += lh;
    });
    return y;
  }

  function fill(x, yy, w, h, color) {
    doc.setFillColor(...color);
    doc.rect(x, yy, w, h, 'F');
  }

  function stroke(x, yy, w, h, color, lw = 0.3) {
    doc.setDrawColor(...color);
    doc.setLineWidth(lw);
    doc.rect(x, yy, w, h, 'S');
  }

  /** Corner bracket marks around a rect — the HUD signature. */
  function brackets(x, yy, w, h, color, len = 4) {
    doc.setDrawColor(...color);
    doc.setLineWidth(0.5);
    // TL
    doc.line(x, yy, x + len, yy); doc.line(x, yy, x, yy + len);
    // TR
    doc.line(x + w - len, yy, x + w, yy); doc.line(x + w, yy, x + w, yy + len);
    // BL
    doc.line(x, yy + h - len, x, yy + h); doc.line(x, yy + h, x + len, yy + h);
    // BR
    doc.line(x + w, yy + h - len, x + w, yy + h); doc.line(x + w - len, yy + h, x + w, yy + h);
  }

  /** Small filled diamond LED. */
  function diamond(cx, cy, s, color) {
    doc.setFillColor(...color);
    doc.triangle(cx - s, cy, cx, cy - s, cx + s, cy, 'F');
    doc.triangle(cx - s, cy, cx, cy + s, cx + s, cy, 'F');
  }

  function chip(label, x, yy, color) {
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'bold');
    const w = doc.getTextWidth(label.toUpperCase()) + 4;
    fill(x, yy - 3, w, 4.4, tint(color, 0.16));
    doc.setDrawColor(...color); doc.setLineWidth(0.2);
    doc.rect(x, yy - 3, w, 4.4, 'S');
    doc.setTextColor(...color);
    doc.text(label.toUpperCase(), x + 2, yy);
    return w + 2;
  }

  function drawPageBg() {
    fill(0, 0, PAGE_W, PAGE_H, C.void);
    // faint corner ticks on the deck
    doc.setDrawColor(...C.line); doc.setLineWidth(0.3);
    doc.line(6, 6, 12, 6); doc.line(6, 6, 6, 12);
    doc.line(PAGE_W - 12, 6, PAGE_W - 6, 6); doc.line(PAGE_W - 6, 6, PAGE_W - 6, 12);
  }

  function pageCheck(needed = 10) {
    if (y + needed > BOTTOM) {
      doc.addPage();
      drawPageBg();
      y = 18;
    }
  }

  /** HUD section header: accent bar + LED + title + dashed rule to edge. */
  function section(title, accent = C.cyan) {
    pageCheck(16);
    y += 2;
    fill(MARGIN, y, COL, 8.5, C.panel2);
    fill(MARGIN, y, 1.6, 8.5, accent); // accent bar
    diamond(MARGIN + 5, y + 4.4, 1.4, accent);
    text(title.toUpperCase(), MARGIN + 9, y + 5.7, { bold: true, size: 9.5, color: C.text, spacing: 0.4 });
    // dashed rule
    doc.setDrawColor(...C.line); doc.setLineWidth(0.3);
    doc.setLineDashPattern([1, 1.4], 0);
    doc.line(MARGIN + 9 + doc.getTextWidth(title.toUpperCase()) + 6, y + 4.4, PAGE_W - MARGIN - 3, y + 4.4);
    doc.setLineDashPattern([], 0);
    y += 13;
  }

  /** label/value data row (monospace value). */
  function row(label, value, color) {
    pageCheck(6.5);
    text(label, MARGIN + 3, y, { size: 7.5, color: C.muted });
    const lines = doc.splitTextToSize(String(value), COL - 55);
    text(lines[0], MARGIN + 46, y, { size: 8, color: color || C.text, font: 'courier' });
    y += 5.4;
    for (let i = 1; i < lines.length; i++) {
      pageCheck(5);
      text(lines[i], MARGIN + 46, y, { size: 8, color: color || C.text, font: 'courier' });
      y += 4.6;
    }
  }

  // ── COVER HEADER ────────────────────────────────────────────────────────
  drawPageBg();
  y = 14;

  const headerH = 30;
  fill(MARGIN, y, COL, headerH, C.panel);
  fill(MARGIN, y, 2.2, headerH, C.cyan);
  brackets(MARGIN, y, COL, headerH, C.cyan, 5);

  text('SCOUT', MARGIN + 8, y + 11, { bold: true, size: 22, color: C.text, spacing: 1.2 });
  doc.setFont('helvetica', 'bold'); doc.setFontSize(22);
  const scoutW = doc.getTextWidth('SCOUT') + 1.2 * 5; // glyphs + char spacing
  text('//OPS', MARGIN + 8 + scoutW + 3, y + 11, { bold: true, size: 22, color: C.cyan, spacing: 1.2 });
  text('ATTACK SURFACE INTELLIGENCE REPORT', MARGIN + 8, y + 18, { size: 8, color: C.muted, spacing: 0.8 });
  text('CONFIDENTIAL // AUTHORIZED RECON ONLY', MARGIN + 8, y + 24.5, { size: 6.5, color: C.faint, spacing: 0.6 });

  // right meta
  text('TARGET', PAGE_W - MARGIN - 6, y + 9, { size: 6.5, color: C.faint, align: 'right', spacing: 0.5 });
  text(domain, PAGE_W - MARGIN - 6, y + 14.5, { size: 11, color: C.cyan, align: 'right', bold: true, font: 'courier' });
  text('GENERATED', PAGE_W - MARGIN - 6, y + 20.5, { size: 6.5, color: C.faint, align: 'right', spacing: 0.5 });
  text(new Date(timestamp).toLocaleString(), PAGE_W - MARGIN - 6, y + 25, { size: 7.5, color: C.muted, align: 'right', font: 'courier' });

  y += headerH + 8;

  // ── THREAT ASSESSMENT HERO ──────────────────────────────────────────────
  const heroH = 52;
  const sc = risk.score ?? 0;
  const sCol = scoreColor(sc);
  fill(MARGIN, y, COL, heroH, C.panel);
  stroke(MARGIN, y, COL, heroH, C.line, 0.3);
  brackets(MARGIN, y, COL, heroH, sCol, 5);
  fill(MARGIN, y, 2.2, heroH, sCol);

  // --- tick gauge (left) ---
  const gcx = MARGIN + 30;
  const gcy = y + heroH / 2;
  const ticks = 44;
  for (let i = 0; i < ticks; i++) {
    const ang = (i / ticks) * 2 * Math.PI - Math.PI / 2;
    const lit = i / ticks <= sc / 100;
    const r1 = 16;
    const r2 = i % 5 === 0 ? 20.5 : 19;
    const col = lit ? sCol : C.line;
    doc.setDrawColor(...col);
    doc.setLineWidth(i % 5 === 0 ? 0.8 : 0.6);
    doc.line(gcx + Math.cos(ang) * r1, gcy + Math.sin(ang) * r1, gcx + Math.cos(ang) * r2, gcy + Math.sin(ang) * r2);
  }
  text(String(sc), gcx, gcy + 1, { bold: true, size: 22, color: sCol, align: 'center' });
  text('/ 100', gcx, gcy + 7, { size: 6.5, color: C.muted, align: 'center' });
  text('THREAT INDEX', gcx, gcy + 12.5, { size: 5.8, color: C.faint, align: 'center', spacing: 0.5 });

  // --- category + severity tiles (right) ---
  const rx = MARGIN + 58;
  const rw = COL - 58 - 4;
  text('CLASSIFICATION', rx, y + 9, { size: 6.5, color: C.faint, spacing: 0.6 });
  text((risk.category || 'UNKNOWN').toUpperCase(), rx, y + 16, { bold: true, size: 14, color: sCol, spacing: 0.4 });
  text(`${risk.total || 0} findings across the attack surface`, rx, y + 22, { size: 7.5, color: C.muted });

  const counts = risk.counts || {};
  const tiles = [
    ['CRIT', counts.critical || 0, C.red],
    ['HIGH', counts.high || 0, C.orange],
    ['MED', counts.medium || 0, C.amber],
    ['LOW', counts.low || 0, C.blue],
    ['INFO', counts.info || 0, C.muted]
  ];
  const tw = (rw - 4 * 3) / 5;
  const ty = y + 28;
  tiles.forEach(([label, count, color], i) => {
    const tx = rx + i * (tw + 3);
    fill(tx, ty, tw, 16, tint(color, 0.12));
    fill(tx, ty, tw, 1.2, color);
    text(String(count), tx + tw / 2, ty + 9, { bold: true, size: 13, color, align: 'center' });
    text(label, tx + tw / 2, ty + 13.5, { size: 5.6, color: C.muted, align: 'center', spacing: 0.4 });
  });

  y += heroH + 4;

  // ── ATTACK SURFACE ──────────────────────────────────────────────────────
  if (risk.attackSurface?.vectors?.length) {
    section('Attack Surface', C.orange);
    risk.attackSurface.vectors.forEach(v => {
      pageCheck(7);
      text('>', MARGIN + 3, y, { size: 8, color: C.orange, bold: true });
      paragraph(v, MARGIN + 8, { size: 8, color: C.text, lh: 4.4, maxWidth: COL - 12 });
      y += 1.5;
    });
    y += 2;
  }

  // ── FINDINGS ────────────────────────────────────────────────────────────
  if (risk.findings?.length) {
    section('Findings', C.red);
    const list = risk.findings.slice(0, 30);
    list.forEach(f => {
      pageCheck(13);
      const col = severityColor(f.severity);
      // severity accent stripe
      const blockTop = y - 3.5;
      chip(f.severity || 'info', MARGIN + 2, y, col);
      text(f.title, MARGIN + 24, y, { size: 8.5, bold: true, color: C.text, maxWidth: COL - 26 });
      y += 5.2;
      if (f.detail) {
        paragraph(f.detail, MARGIN + 5, { size: 7.5, color: C.muted, lh: 4, maxWidth: COL - 10 });
      }
      if (f.remediation) {
        pageCheck(6);
        text('FIX', MARGIN + 5, y, { size: 6.5, color: C.lime, bold: true });
        paragraph(f.remediation, MARGIN + 14, { size: 7.5, color: C.lime, lh: 4, maxWidth: COL - 18 });
      }
      // left accent bar for the finding block
      doc.setDrawColor(...col); doc.setLineWidth(0.8);
      doc.line(MARGIN, blockTop, MARGIN, y - 1.5);
      y += 3;
    });
    if (risk.findings.length > list.length) {
      text(`+ ${risk.findings.length - list.length} more findings not shown`, MARGIN + 3, y, { size: 7, color: C.faint, italic: true });
      y += 5;
    }
    y += 2;
  }

  // ── DNS ─────────────────────────────────────────────────────────────────
  if (modules.dns && !modules.dns.error) {
    const dns = modules.dns;
    section('DNS Reconnaissance', C.cyan);

    // email security chips
    pageCheck(8);
    let cx = MARGIN + 3;
    const es = dns.emailSecurity || {};
    cx += chip(es.spf?.present ? 'SPF OK' : 'NO SPF', cx, y, es.spf?.present ? C.lime : C.red);
    cx += chip(es.dmarc?.present ? 'DMARC OK' : 'NO DMARC', cx, y, es.dmarc?.present ? C.lime : C.red);
    cx += chip(es.dkim?.present ? 'DKIM OK' : 'NO DKIM', cx, y, es.dkim?.present ? C.lime : C.red);
    cx += chip(dns.zoneTransfer?.vulnerable ? 'AXFR VULN' : 'AXFR SECURE', cx, y, dns.zoneTransfer?.vulnerable ? C.red : C.lime);
    y += 8;

    row('Subdomains found', String(dns.subdomains?.length || 0), C.cyan);

    // DNS records
    const recTypes = ['A', 'AAAA', 'MX', 'NS', 'TXT', 'SOA', 'CAA'];
    const recs = dns.records || {};
    const hasRecs = recTypes.some(t => recs[t]);
    if (hasRecs) {
      y += 1;
      text('RECORDS', MARGIN + 3, y, { size: 6.5, color: C.faint, spacing: 0.5 });
      y += 5;
      recTypes.forEach(t => {
        if (!recs[t]) return;
        const arr = Array.isArray(recs[t]) ? recs[t] : [recs[t]];
        const flat = arr.flatMap(r => (Array.isArray(r) ? r : [r]))
          .map(r => (typeof r === 'object' && r !== null ? JSON.stringify(r) : String(r)));
        row(t, flat.slice(0, 4).join(', ') + (flat.length > 4 ? ` (+${flat.length - 4})` : ''), C.text);
      });
    }

    if (dns.subdomains?.length) {
      const SENS = ['admin', 'login', 'dev', 'staging', 'test', 'backup', 'internal', 'jenkins', 'git', 'jira', 'vpn', 'secure', 'panel', 'manage'];
      y += 1;
      text('LIVE SUBDOMAINS', MARGIN + 3, y, { size: 6.5, color: C.faint, spacing: 0.5 });
      y += 5;
      dns.subdomains.slice(0, 30).forEach(s => {
        pageCheck(5);
        const sensitive = SENS.some(k => s.subdomain?.includes(k));
        const col = sensitive ? C.amber : C.text;
        text(sensitive ? '★' : '·', MARGIN + 4, y, { size: 7.5, color: sensitive ? C.amber : C.faint });
        text(s.subdomain, MARGIN + 8, y, { size: 7.5, color: col, font: 'courier' });
        text(s.ips?.[0] || s.ip || '', PAGE_W - MARGIN - 4, y, { size: 7, color: C.muted, font: 'courier', align: 'right' });
        y += 4.6;
      });
      if (dns.subdomains.length > 30) {
        text(`+ ${dns.subdomains.length - 30} more`, MARGIN + 8, y, { size: 7, color: C.faint, italic: true });
        y += 5;
      }
    }
    y += 2;
  }

  // ── TLS ─────────────────────────────────────────────────────────────────
  if (modules.tls && modules.tls.available !== false && !modules.tls.error) {
    const tls = modules.tls;
    section('TLS / SSL', tls.grade === 'A' ? C.lime : C.amber);
    row('Grade', tls.grade || 'N/A', tls.grade === 'A' ? C.lime : tls.grade === 'B' ? C.blue : C.amber);
    row('Protocol', tls.protocol || 'unknown', tls.protocol === 'TLSv1.3' ? C.lime : C.amber);
    row('Cipher', tls.cipher?.name || 'unknown');
    row('Key size', tls.cipher?.bits ? `${tls.cipher.bits} bits` : 'unknown');
    row('Trusted', tls.authorized ? 'Yes' : 'No', tls.authorized ? C.lime : C.red);
    if (tls.cert) {
      row('Subject', tls.cert.subject || '—');
      row('Issuer', tls.cert.issuer || '—');
      row('Self-signed', tls.cert.selfSigned ? 'YES' : 'No', tls.cert.selfSigned ? C.red : C.lime);
      if (tls.cert.validFrom) row('Valid from', new Date(tls.cert.validFrom).toLocaleDateString());
      if (tls.cert.validTo) row('Valid to', new Date(tls.cert.validTo).toLocaleDateString());
      if (tls.cert.daysRemaining != null) {
        row('Expires in', `${tls.cert.daysRemaining} days`, tls.cert.expired ? C.red : tls.cert.daysRemaining < 30 ? C.amber : C.lime);
      }
      if (tls.cert.san?.length) {
        row('SANs', `${tls.cert.san.slice(0, 8).join(', ')}${tls.cert.san.length > 8 ? ` (+${tls.cert.san.length - 8})` : ''}`);
      }
    }
    if (tls.findings?.length) {
      y += 1;
      tls.findings.forEach(f => {
        pageCheck(6);
        text('!', MARGIN + 4, y, { size: 8, color: C.red, bold: true });
        paragraph(f.title, MARGIN + 9, { size: 7.5, color: C.text, lh: 4, maxWidth: COL - 14 });
      });
    }
    y += 2;
  } else if (modules.tls && (modules.tls.error || modules.tls.available === false)) {
    section('TLS / SSL', C.red);
    row('Status', `Unavailable — ${modules.tls.error || 'could not connect'}`, C.red);
    y += 2;
  }

  // ── HTTP ────────────────────────────────────────────────────────────────
  if (modules.http && !modules.http.error) {
    const http = modules.http;
    section('HTTP Fingerprint', C.cyan);
    if (http.http || http.https) {
      row('HTTP status', `${http.http?.status ?? '—'}  (${http.http?.responseTime ?? '—'}ms)`);
      row('HTTPS status', `${http.https?.status ?? '—'}  (${http.https?.responseTime ?? '—'}ms)`);
    }
    row('HTTPS redirect', http.httpsRedirect ? 'Enforced' : 'MISSING', http.httpsRedirect ? C.lime : C.red);
    row('WAF', http.waf || 'None detected', http.waf ? C.blue : C.muted);
    if (http.server) row('Server', http.server);
    if (http.poweredBy) row('Powered by', http.poweredBy, C.amber);
    row('Open redirect', http.openRedirect?.vulnerable ? 'VULNERABLE' : 'Not detected', http.openRedirect?.vulnerable ? C.red : C.lime);
    if (http.techStack?.length) {
      row('Tech stack', http.techStack.map(t => t.name).join(', '), C.cyan);
    }
    y += 2;
  }

  // ── SECURITY HEADERS ────────────────────────────────────────────────────
  if (modules.secHeaders && !modules.secHeaders.error) {
    const h = modules.secHeaders;
    section('Security Headers', scoreColor(h.score));
    row('Score', `${h.score}/100   (${h.passed}/${h.total} passing)`, scoreColor(h.score));
    y += 1;
    (h.results || []).forEach(r => {
      pageCheck(6);
      const col = r.status === 'pass' ? C.lime : r.status === 'warn' ? C.amber : C.red;
      const icon = r.status === 'pass' ? '+' : r.status === 'warn' ? '~' : 'x';
      text(icon, MARGIN + 4, y, { size: 8, color: col, bold: true, font: 'courier' });
      text(r.name, MARGIN + 9, y, { size: 7.5, color: C.text, bold: true });
      const detail = r.status === 'pass' ? (r.value || '') : (r.detail || '');
      if (detail) {
        const lines = doc.splitTextToSize(detail, COL - 62);
        text(lines[0], MARGIN + 60, y, { size: 7, color: C.muted, font: 'courier' });
      }
      y += 5;
    });
    y += 2;
  }

  // ── PORTS ───────────────────────────────────────────────────────────────
  if (modules.ports && !modules.ports.error) {
    const ports = modules.ports;
    const openList = ports.open || [];
    const risky = openList.filter(p => p.risky || riskLevel(p.port) !== 'info').length;
    section('Port Sweep', risky ? C.red : C.lime);
    row('Scanned', String(ports.total));
    row('Open', String(openList.length), openList.length ? C.amber : C.lime);
    if (openList.length === 0) {
      text('No open ports detected on common ports.', MARGIN + 3, y, { size: 7.5, color: C.muted, italic: true });
      y += 5;
    } else {
      y += 1;
      openList.forEach(p => {
        pageCheck(6);
        const lvl = riskLevel(p.port);
        const col = lvl === 'critical' ? C.red : lvl === 'high' ? C.orange : lvl === 'medium' ? C.amber : C.blue;
        text(String(p.port), MARGIN + 4, y, { size: 8, bold: true, color: col, font: 'courier' });
        const svc = `${p.service || ''}${p.software && p.software !== p.service ? ' / ' + p.software : ''}${p.version ? ' ' + p.version : ''}`;
        text(svc, MARGIN + 22, y, { size: 7.5, color: C.text, maxWidth: COL - 50 });
        if (lvl !== 'info') chip(lvl, PAGE_W - MARGIN - 22, y + 0.5, col);
        y += 5;
      });
    }
    if (ports.findings?.filter(f => f.severity !== 'info').length) {
      y += 1;
      ports.findings.filter(f => f.severity !== 'info').forEach(f => {
        pageCheck(8);
        text('!', MARGIN + 4, y, { size: 8, color: C.red, bold: true });
        text(f.title, MARGIN + 9, y, { size: 7.5, color: C.text, bold: true, maxWidth: COL - 14 });
        y += 4.4;
        if (f.remediation) paragraph(f.remediation, MARGIN + 9, { size: 7, color: C.muted, lh: 3.8, maxWidth: COL - 14 });
      });
    }
    y += 2;
  }

  // ── FOOTERS ─────────────────────────────────────────────────────────────
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(...C.line); doc.setLineWidth(0.3);
    doc.line(MARGIN, PAGE_H - 14, PAGE_W - MARGIN, PAGE_H - 14);
    diamond(MARGIN + 1.5, PAGE_H - 10.7, 1, C.cyan);
    text(`SCOUT // OPS  ·  ${domain}`, MARGIN + 5, PAGE_H - 10, { size: 6.5, color: C.muted, spacing: 0.4 });
    text('CONFIDENTIAL', PAGE_W / 2, PAGE_H - 10, { size: 6.5, color: C.faint, align: 'center', spacing: 0.6 });
    text(`${String(i).padStart(2, '0')} / ${String(totalPages).padStart(2, '0')}`, PAGE_W - MARGIN, PAGE_H - 10, { size: 6.5, color: C.muted, align: 'right', font: 'courier' });
  }

  const stamp = new Date(timestamp).toISOString().slice(0, 10);
  doc.save(`scout-report-${domain}-${stamp}.pdf`);
}
