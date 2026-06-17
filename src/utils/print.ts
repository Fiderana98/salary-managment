// ─── Utilitaire d'impression des bulletins de paie et rapports ─────────────
import { BulletinPaie, Employe } from '../types';

// ─── Formatage ───────────────────────────────────────────────────────────────

function formatAriary(amount: number): string {
  return new Intl.NumberFormat('fr-MG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + ' Ar';
}

function formatPeriode(periode: string): string {
  if (!periode) return '—';
  const [year, month] = periode.split('-');
  const mois = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
  ];
  return `${mois[parseInt(month) - 1]} ${year}`;
}

// ─── Styles CSS pour l'impression ─────────────────────────────────────────────

const PRINT_STYLES = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  @page { margin: 12mm 15mm; }
  
  body {
    font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif;
    font-size: 11px;
    color: #1e293b;
    line-height: 1.5;
    background: #fff;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .page-break {
    page-break-after: always;
    break-after: page;
  }
  .page-break:last-child {
    page-break-after: avoid;
    break-after: avoid;
  }

  .bulletin-wrapper {
    max-width: 210mm;
    margin: 0 auto;
    padding: 10px 0;
  }

  /* En-tête */
  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding-bottom: 12px;
    margin-bottom: 12px;
    border-bottom: 2px solid #6366f1;
  }
  .header-left h1 {
    font-size: 18px;
    font-weight: 700;
    color: #6366f1;
    letter-spacing: -0.02em;
  }
  .header-left p {
    font-size: 10px;
    color: #64748b;
    margin-top: 2px;
  }
  .header-right {
    text-align: right;
  }
  .header-right .periode {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }
  .header-right .statut-badge {
    display: inline-block;
    margin-top: 4px;
    padding: 2px 10px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
  }
  .statut-badge.paye { background: #d1fae5; color: #065f46; }
  .statut-badge.valide { background: #dbeafe; color: #1e40af; }
  .statut-badge.brouillon { background: #f1f5f9; color: #475569; }

  /* Infos employé */
  .employe-info {
    display: flex;
    gap: 24px;
    padding: 10px 14px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    margin-bottom: 14px;
  }
  .employe-info .col {
    flex: 1;
  }
  .employe-info .col p {
    font-size: 10px;
    margin-bottom: 2px;
  }
  .employe-info .col .label {
    color: #94a3b8;
    font-weight: 500;
    text-transform: uppercase;
    font-size: 9px;
    letter-spacing: 0.04em;
  }
  .employe-info .col .value {
    color: #0f172a;
    font-weight: 600;
    font-size: 11px;
  }

  /* Tableaux */
  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 10px;
    font-size: 10px;
  }
  table th {
    background: #f1f5f9;
    color: #475569;
    font-weight: 600;
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: left;
    padding: 6px 10px;
    border-bottom: 1px solid #e2e8f0;
  }
  table td {
    padding: 5px 10px;
    border-bottom: 1px solid #f1f5f9;
    color: #334155;
  }
  table td.numeric, table th.numeric {
    text-align: right;
    font-variant-numeric: tabular-nums;
  }
  table tr.total td {
    font-weight: 700;
    color: #0f172a;
    border-top: 2px solid #6366f1;
    border-bottom: none;
    padding-top: 6px;
    background: #f8fafc;
  }
  table tr.subtotal td {
    font-weight: 600;
    color: #334155;
    border-top: 1px solid #cbd5e1;
    background: #fafafa;
  }

  /* Sections */
  .section-title {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #6366f1;
    margin-bottom: 6px;
    margin-top: 14px;
  }

  /* Net à payer */
  .net-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: linear-gradient(135deg, #ecfdf5, #d1fae5);
    border: 1px solid #a7f3d0;
    border-radius: 8px;
    margin-top: 14px;
  }
  .net-box .net-label {
    font-size: 11px;
    font-weight: 700;
    color: #065f46;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }
  .net-box .net-label small {
    display: block;
    font-weight: 400;
    font-size: 9px;
    color: #047857;
    margin-top: 2px;
    text-transform: none;
    letter-spacing: normal;
  }
  .net-box .net-amount {
    font-size: 20px;
    font-weight: 800;
    color: #065f46;
  }

  /* Pied de page */
  .footer {
    margin-top: 20px;
    padding-top: 10px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    font-size: 8px;
    color: #94a3b8;
  }

  /* Impression groupée - séparateur */
  .batch-title {
    text-align: center;
    padding: 20px 0 10px;
    font-size: 16px;
    font-weight: 700;
    color: #0f172a;
  }
  .batch-subtitle {
    text-align: center;
    font-size: 11px;
    color: #64748b;
    margin-bottom: 16px;
  }

  /* Rapport */
  .rapport-header {
    text-align: center;
    padding: 20px 0;
    border-bottom: 2px solid #6366f1;
    margin-bottom: 20px;
  }
  .rapport-header h1 {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
  }
  .rapport-header p {
    font-size: 11px;
    color: #64748b;
    margin-top: 4px;
  }
  .rapport-kpis {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 16px;
  }
  .rapport-kpi {
    padding: 10px;
    border: 1px solid #e2e8f0;
    border-radius: 6px;
    text-align: center;
  }
  .rapport-kpi .kpi-label {
    font-size: 9px;
    color: #94a3b8;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .rapport-kpi .kpi-value {
    font-size: 14px;
    font-weight: 700;
    color: #0f172a;
    margin-top: 2px;
  }
  .rapport-table-title {
    font-size: 12px;
    font-weight: 600;
    color: #0f172a;
    margin-bottom: 8px;
    margin-top: 16px;
  }
`;

// ─── Générateur d'iframe d'impression ────────────────────────────────────────

let printIframe: HTMLIFrameElement | null = null;

function getPrintIframe(): HTMLIFrameElement {
  if (!printIframe || !document.body.contains(printIframe)) {
    printIframe = document.createElement('iframe');
    printIframe.style.position = 'fixed';
    printIframe.style.right = '0';
    printIframe.style.bottom = '0';
    printIframe.style.width = '0';
    printIframe.style.height = '0';
    printIframe.style.border = 'none';
    printIframe.style.opacity = '0';
    printIframe.style.pointerEvents = 'none';
    document.body.appendChild(printIframe);
  }
  return printIframe;
}

function imprimerContenu(html: string): void {
  const iframe = getPrintIframe();
  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  
  if (!iframeDoc) {
    alert('Erreur lors de la création de l\'aperçu d\'impression.');
    return;
  }

  iframeDoc.open();
  iframeDoc.write(html);
  iframeDoc.close();

  // Attendre que le contenu soit chargé puis lancer l'impression
  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (e) {
      // Fallback: si l'impression via iframe échoue, essayer avec window.print()
      // Ceci peut arriver sur certains navigateurs très restrictifs
      const win = window.open('', '_blank', 'width=900,height=700,scrollbars=yes');
      if (win) {
        win.document.write(html);
        win.document.close();
        win.focus();
        setTimeout(() => win.print(), 500);
      } else {
        alert('Veuillez autoriser les pop-ups pour imprimer les documents.\n\nOu utilisez la fonction "Imprimer" de votre navigateur (Ctrl+P) après avoir ouvert cette page.');
      }
    }
  }, 250);
}

// ─── Génération HTML pour un bulletin individuel ──────────────────────────────

function bulletinHTML(bulletin: BulletinPaie, employe: Employe | undefined): string {
  const primesList = [
    ...(bulletin.montantHeuresSup > 0 ? [{ label: `Heures supp. (${bulletin.heuresSupplementaires}h)`, montant: bulletin.montantHeuresSup, imposable: true }] : []),
    ...(bulletin.primeTransport > 0 ? [{ label: 'Prime de transport', montant: bulletin.primeTransport, imposable: true }] : []),
    ...(bulletin.primeAnciennete > 0 ? [{ label: "Prime d'ancienneté", montant: bulletin.primeAnciennete, imposable: true }] : []),
    ...((bulletin.autresPrimes || []).map(p => ({ label: p.libelle, montant: p.montant, imposable: p.imposable !== undefined ? p.imposable : true }))),
  ].filter(p => p.montant > 0);

  const primesNonImposables = primesList.filter(p => !p.imposable).reduce((s, p) => s + p.montant, 0);
  const primesImposables = primesList.filter(p => p.imposable).reduce((s, p) => s + p.montant, 0);
  const totalPrimes = primesImposables + primesNonImposables;

  return `
  <div class="bulletin-wrapper">
    <div class="header">
      <div class="header-left">
        <h1>BULLETIN DE PAIE</h1>
        <p>Document établi par le service des ressources humaines</p>
      </div>
      <div class="header-right">
        <div class="periode">${formatPeriode(bulletin.periode)}</div>
        <span class="statut-badge ${bulletin.statut}">${bulletin.statut === 'paye' ? 'Payé' : bulletin.statut === 'valide' ? 'Validé' : 'Brouillon'}</span>
      </div>
    </div>

    <div class="employe-info">
      <div class="col">
        <p><span class="label">Employé</span></p>
        <p class="value">${employe?.nom || ''} ${employe?.prenom || ''}</p>
        <p><span class="label">Matricule</span> ${employe?.matricule || '—'}</p>
      </div>
      <div class="col">
        <p><span class="label">Poste</span></p>
        <p class="value">${employe?.poste || '—'}</p>
        <p><span class="label">Département</span> ${employe?.departement || '—'}</p>
      </div>
      <div class="col">
        <p><span class="label">RIB</span></p>
        <p class="value">${employe?.rib || 'Non renseigné'}</p>
        <p><span class="label">Date d'embauche</span> ${employe?.dateEmbauche || '—'}</p>
      </div>
    </div>

    <div class="section-title">Éléments de rémunération</div>
    <table>
      <thead>
        <tr>
          <th>Libellé</th>
          <th class="numeric">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>Salaire de base</td>
          <td class="numeric">${formatAriary(bulletin.salaireBrut)}</td>
        </tr>
        <tr>
          <td>Primes et indemnités</td>
          <td class="numeric">${formatAriary(totalPrimes)}</td>
        </tr>
        <tr class="total">
          <td>Total brut</td>
          <td class="numeric">${formatAriary(bulletin.totalBrut)}</td>
        </tr>
      </tbody>
    </table>

    ${primesList.length > 0 ? `
    <div class="section-title">Détail des primes et indemnités</div>
    <table>
      <thead>
        <tr>
          <th>Libellé</th>
          <th class="numeric">Montant</th>
        </tr>
      </thead>
      <tbody>
        ${primesList.map(p => `
        <tr>
          <td>${p.label}${!p.imposable ? ' (Non imposable)' : ''}</td>
          <td class="numeric">${formatAriary(p.montant)}</td>
        </tr>`).join('')}
        <tr class="subtotal">
          <td>Total des primes</td>
          <td class="numeric">${formatAriary(totalPrimes)}</td>
        </tr>
      </tbody>
    </table>
    ` : ''}

    <div class="section-title">Retenues salariales</div>
    <table>
      <thead>
        <tr>
          <th>Libellé</th>
          <th class="numeric">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>CNaPS (part salariale)</td>
          <td class="numeric">-${formatAriary(bulletin.cnaps_salarial)}</td>
        </tr>
        <tr>
          <td>OSTIE (part salariale)</td>
          <td class="numeric">-${formatAriary(bulletin.ostie_salariale)}</td>
        </tr>
        <tr>
          <td>IRSA</td>
          <td class="numeric">-${formatAriary(bulletin.irsa)}</td>
        </tr>
        <tr class="total">
          <td>Total des retenues</td>
          <td class="numeric">-${formatAriary(bulletin.totalCotisationsSalariales + bulletin.irsa)}</td>
        </tr>
      </tbody>
    </table>

    <div class="net-box">
      <div class="net-label">
        SALAIRE NET À PAYER
        <small>Virement bancaire${employe?.rib ? ' — ' + employe.rib : ''}</small>
      </div>
      <div class="net-amount">${formatAriary(bulletin.salaireNet)}</div>
    </div>

    <div class="footer">
      <span>Généré le ${new Date().toLocaleDateString('fr-FR')}</span>
      <span>Bulletin de paie — ${formatPeriode(bulletin.periode)}</span>
    </div>
  </div>`;
}

// ─── Impression d'un bulletin individuel ──────────────────────────────────────

export function imprimerBulletin(bulletin: BulletinPaie, employe: Employe | undefined): void {
  const content = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Bulletin de paie - ${employe?.nom || ''} ${employe?.prenom || ''} - ${formatPeriode(bulletin.periode)}</title>
      <style>${PRINT_STYLES}</style>
    </head>
    <body>
      ${bulletinHTML(bulletin, employe)}
    </body>
    </html>
  `;

  imprimerContenu(content);
}

// ─── Impression groupée de tous les bulletins d'une période ───────────────────

export function imprimerTousBulletins(
  bulletins: BulletinPaie[],
  getEmploye: (id: string) => Employe | undefined,
  periode: string
): void {
  const htmlParts = bulletins.map((b, index) => {
    const emp = getEmploye(b.employeId);
    const html = bulletinHTML(b, emp);
    if (index < bulletins.length - 1) {
      return `<div class="page-break">${html}</div>`;
    }
    return html;
  });

  const content = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Tous les bulletins - ${formatPeriode(periode)}</title>
      <style>${PRINT_STYLES}</style>
      <style>
        .batch-header {
          text-align: center;
          padding: 30px 0 10px;
        }
        .batch-header h1 { font-size: 22px; font-weight: 800; color: #0f172a; }
        .batch-header p { font-size: 13px; color: #64748b; margin-top: 4px; }
        .batch-stats {
          display: flex; justify-content: center; gap: 30px;
          margin-bottom: 24px; padding: 12px;
          background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;
        }
        .batch-stat { text-align: center; }
        .batch-stat .stat-value { font-size: 16px; font-weight: 700; color: #0f172a; }
        .batch-stat .stat-label { font-size: 9px; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.03em; }
      </style>
    </head>
    <body>
      <div class="batch-header">
        <h1>BULLETINS DE PAIE</h1>
        <p>Période : ${formatPeriode(periode)} — ${bulletins.length} bulletin${bulletins.length > 1 ? 's' : ''}</p>
      </div>
      <div class="batch-stats">
        <div class="batch-stat">
          <div class="stat-value">${bulletins.length}</div>
          <div class="stat-label">Bulletins</div>
        </div>
        <div class="batch-stat">
          <div class="stat-value">${formatAriary(bulletins.reduce((s, b) => s + b.salaireNet, 0))}</div>
          <div class="stat-label">Masse nette</div>
        </div>
        <div class="batch-stat">
          <div class="stat-value">${formatAriary(bulletins.reduce((s, b) => s + b.totalBrut, 0))}</div>
          <div class="stat-label">Masse brute</div>
        </div>
      </div>
      ${htmlParts.join('\n')}
    </body>
    </html>
  `;

  imprimerContenu(content);
}

// ─── Impression des rapports ──────────────────────────────────────────────────

interface RapportData {
  titre?: string;
  periode?: string;
  stats?: {
    effectif: number;
    totalBrut: number;
    totalNet: number;
    totalIrsa: number;
    totalCotisations: number;
    bulletinsPayes: number;
  };
  employes?: any[];
  bulletins?: any[];
  totalBulletins: number;
  bulletinsPaies: number;
  totalNetPaye: number;
  monthlyData: Array<{
    mois: string;
    brut: number;
    net: number;
    irsa: number;
    cotisations: number;
    count: number;
  }>;
  deptData: Array<{
    name: string;
    brut: number;
    moy: number;
    count: number;
  }>;
}

export function imprimerRapport(data: RapportData): void {
  const content = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Rapport de paie</title>
      <style>${PRINT_STYLES}</style>
    </head>
    <body>
      <div class="bulletin-wrapper">
        <div class="rapport-header">
          <h1>RAPPORT DE PAIE</h1>
          <p>Généré le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
        </div>

        <div class="section-title">Indicateurs clés</div>
        <div class="rapport-kpis">
          <div class="rapport-kpi">
            <div class="kpi-label">Bulletins émis</div>
            <div class="kpi-value">${data.totalBulletins}</div>
          </div>
          <div class="rapport-kpi">
            <div class="kpi-label">Payés</div>
            <div class="kpi-value">${data.bulletinsPaies}</div>
          </div>
          <div class="rapport-kpi">
            <div class="kpi-label">Net total versé</div>
            <div class="kpi-value">${formatAriary(data.totalNetPaye)}</div>
          </div>
        </div>

        ${data.monthlyData.length > 0 ? `
        <div class="section-title">Évolution mensuelle</div>
        <table>
          <thead>
            <tr>
              <th>Période</th>
              <th class="numeric">Effectif</th>
              <th class="numeric">Masse brute</th>
              <th class="numeric">Masse nette</th>
              <th class="numeric">Cotisations</th>
              <th class="numeric">IRSA</th>
            </tr>
          </thead>
          <tbody>
            ${data.monthlyData.map(m => `
            <tr>
              <td>${m.mois}</td>
              <td class="numeric">${m.count}</td>
              <td class="numeric">${formatAriary(m.brut)}</td>
              <td class="numeric">${formatAriary(m.net)}</td>
              <td class="numeric">${formatAriary(m.cotisations)}</td>
              <td class="numeric">${formatAriary(m.irsa)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        ` : ''}

        ${data.deptData.length > 0 ? `
        <div class="section-title">Masse salariale par département</div>
        <table>
          <thead>
            <tr>
              <th>Département</th>
              <th class="numeric">Effectif</th>
              <th class="numeric">Masse salariale</th>
              <th class="numeric">Moyenne</th>
            </tr>
          </thead>
          <tbody>
            ${data.deptData.map(d => `
            <tr>
              <td>${d.name}</td>
              <td class="numeric">${d.count}</td>
              <td class="numeric">${formatAriary(d.brut)}</td>
              <td class="numeric">${formatAriary(d.moy)}</td>
            </tr>`).join('')}
          </tbody>
        </table>
        ` : ''}

        <div class="footer">
          <span>Généré le ${new Date().toLocaleDateString('fr-FR')}</span>
          <span>Rapport de paie</span>
        </div>
      </div>
    </body>
    </html>
  `;

  imprimerContenu(content);
}