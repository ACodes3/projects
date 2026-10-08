import { useState } from 'react';

import {
  FileText,
  Eye,
  Shield,
  Search,
  AlertTriangle,
  LockKeyhole,
  ChevronRight,
  Radio,
  Snowflake,
} from 'lucide-react';

import './IntelligencePage.css';

const reports = [
  {
    id: 'fontaine',
    title: 'Fontaine Political Surveillance',
    region: 'Fontaine',
    classification: 'Crimson',
    status: 'Active',
    date: '08.10.2026',
    summary:
      'Ongoing observation of diplomatic activity and regional political shifts.',
    details:
      'Fatui intelligence assets continue monitoring political movement, foreign negotiations and internal instability throughout Fontaine.',
  },
  {
    id: 'natlan',
    title: 'Natlan Battlefield Assessment',
    region: 'Natlan',
    classification: 'Omega',
    status: 'Critical',
    date: '07.10.2026',
    summary:
      'Updated battlefield intelligence from the southern theatre.',
    details:
      'Imperial observers report increased hostile movement and elevated strategic risk across active operational zones.',
  },
  {
    id: 'liyue',
    title: 'Liyue Economic Influence',
    region: 'Liyue',
    classification: 'Imperial',
    status: 'Monitoring',
    date: '06.10.2026',
    summary:
      'Assessment of trade routes, banking influence and diplomatic leverage.',
    details:
      'Current economic operations remain stable. Imperial financial assets retain meaningful influence across major commercial channels.',
  },
  {
    id: 'mondstadt',
    title: 'Mondstadt Foreign Assets',
    region: 'Mondstadt',
    classification: 'Restricted',
    status: 'Observed',
    date: '05.10.2026',
    summary:
      'Review of active intelligence contacts and foreign movement.',
    details:
      'Surveillance networks remain operational with limited direct interference. Regional activity is currently considered low risk.',
  },
  {
    id: 'sumeru',
    title: 'Sumeru Research Acquisition',
    region: 'Sumeru',
    classification: 'Crimson',
    status: 'Active',
    date: '03.10.2026',
    summary:
      'Scientific and academic intelligence acquisition remains underway.',
    details:
      'Selected research assets and academic developments continue to be reviewed for potential strategic value to Snezhnaya.',
  },
  {
    id: 'palace',
    title: 'Winter Palace Internal Security',
    region: 'Snezhnaya',
    classification: 'Omega',
    status: 'Secure',
    date: '08.10.2026',
    summary:
      'Internal security inspection completed without significant incident.',
    details:
      'All principal palace sectors remain secure. Cryo barriers, access checkpoints and classified archive controls are functioning normally.',
  },
];

function IntelligencePage() {
  const [selectedReport, setSelectedReport] = useState(reports[0]);
  const [search, setSearch] = useState('');

  const filteredReports = reports.filter((report) =>
    `${report.title} ${report.region} ${report.status}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <main className="intelligence-page">

      {/* HEADER */}
      <header className="intelligence-page__header">

        <div>
          <span className="intelligence-page__eyebrow">
            Fatui Intelligence Directorate
          </span>

          <h1>Intelligence Archive</h1>

          <p>
            Classified reports, surveillance records and strategic
            intelligence gathered throughout Teyvat.
          </p>
        </div>

        <div className="intelligence-page__status">

          <Radio size={18} />

          <div>
            <span>Archive Network</span>
            <strong>Encrypted</strong>
          </div>

        </div>

      </header>

      {/* STATS */}
      <section className="intelligence-page__metrics">

        <article>
          <FileText size={17} />
          <div>
            <span>Active Reports</span>
            <strong>148</strong>
          </div>
        </article>

        <article>
          <Eye size={17} />
          <div>
            <span>Observed Regions</span>
            <strong>07</strong>
          </div>
        </article>

        <article>
          <LockKeyhole size={17} />
          <div>
            <span>Omega Files</span>
            <strong>19</strong>
          </div>
        </article>

        <article>
          <AlertTriangle size={17} />
          <div>
            <span>Critical Alerts</span>
            <strong>04</strong>
          </div>
        </article>

      </section>

      {/* SEARCH */}
      <section className="intelligence-page__search">

        <Search size={16} />

        <input
          type="text"
          placeholder="Search classified archive..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
        />

        <span>
          {String(filteredReports.length).padStart(2, '0')} Records
        </span>

      </section>

      {/* MAIN */}
      <section className="intelligence-page__command">

        {/* REPORT LIST */}
        <div className="intelligence-page__archive">

          <div className="intelligence-page__section-header">

            <div>
              <span>Classified Index</span>
              <h2>Recent Intelligence</h2>
            </div>

            <FileText size={17} />

          </div>

          <div className="intelligence-page__reports">

            {filteredReports.map((report) => (
              <button
                key={report.id}
                type="button"
                className={`intelligence-report ${
                  selectedReport.id === report.id
                    ? 'intelligence-report--selected'
                    : ''
                }`}
                onClick={() => setSelectedReport(report)}
              >

                <div className="intelligence-report__icon">
                  <FileText size={18} />
                </div>

                <div className="intelligence-report__content">

                  <span>
                    {report.region}
                  </span>

                  <strong>
                    {report.title}
                  </strong>

                  <small>
                    {report.date}
                  </small>

                </div>

                <div className="intelligence-report__meta">

                  <span
                    className={`intelligence-report__classification intelligence-report__classification--${report.classification.toLowerCase()}`}
                  >
                    {report.classification}
                  </span>

                  <ChevronRight size={14} />

                </div>

              </button>
            ))}

          </div>

        </div>

        {/* DOSSIER */}
        <aside className="intelligence-dossier">

          <div className="intelligence-dossier__header">

            <div>
              <span>Selected File</span>
              <h2>Intelligence Dossier</h2>
            </div>

            <Shield size={17} />

          </div>

          <div className="intelligence-dossier__classification">

            <div className="intelligence-dossier__seal">
              <Snowflake size={34} strokeWidth={0.8} />
            </div>

            <div>
              <span>Classification</span>
              <strong>{selectedReport.classification}</strong>
            </div>

          </div>

          <div className="intelligence-dossier__title">

            <span>
              {selectedReport.region}
            </span>

            <h2>
              {selectedReport.title}
            </h2>

            <small>
              Filed {selectedReport.date}
            </small>

          </div>

          <div className="intelligence-dossier__stats">

            <div>
              <span>Status</span>
              <strong>{selectedReport.status}</strong>
            </div>

            <div>
              <span>Region</span>
              <strong>{selectedReport.region}</strong>
            </div>

            <div>
              <span>Authority</span>
              <strong>Imperial Intelligence</strong>
            </div>

          </div>

          <div className="intelligence-dossier__summary">

            <span>Executive Summary</span>

            <p>
              {selectedReport.summary}
            </p>

          </div>

          <div className="intelligence-dossier__body">

            <span>Filed Intelligence</span>

            <p>
              {selectedReport.details}
            </p>

          </div>

          <button
            type="button"
            className="intelligence-dossier__button"
          >
            Open Full Classified File
            <ChevronRight size={14} />
          </button>

        </aside>

      </section>

    </main>
  );
}

export default IntelligencePage;