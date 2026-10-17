import {
  Crown,
  Snowflake,
  Shield,
  Gem,
  ScrollText,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

import { Link } from 'react-router-dom';

import './TsaritsaPage.css';

function TsaritsaPage() {
  return (
    <main className="tsaritsa-page">

      {/* HERO */}
      <section className="tsaritsa-page__hero">

        <img
          src="/images/hero.png"
          alt="The Tsaritsa"
          className="tsaritsa-page__hero-bg"
        />

        <div className="tsaritsa-page__overlay" />

        <div className="tsaritsa-page__hero-content">

          <span className="tsaritsa-page__eyebrow">
            Her Imperial Majesty
          </span>

          <h1>The Tsaritsa</h1>

          <h2>
            Sovereign of Snezhnaya
          </h2>

          <p>
            Supreme authority of the Winter Palace and ruler
            of Snezhnaya. Every imperial directive, Fatui
            operation and classified initiative ultimately
            answers to the Crown.
          </p>

          <div className="tsaritsa-page__title-row">
            <span>
              <Snowflake size={14} />
              Cryo Sovereign
            </span>

            <span>
              <Crown size={14} />
              Imperial Authority
            </span>

            <span>
              <Shield size={14} />
              Clearance Omega
            </span>
          </div>

        </div>

      </section>

      {/* CONTENT */}
      <section className="tsaritsa-page__grid">

        {/* PROFILE */}
        <article className="tsaritsa-card tsaritsa-card--profile">

          <div className="tsaritsa-card__header">
            <div>
              <span>Imperial Record</span>
              <h2>Royal Profile</h2>
            </div>

            <Crown size={18} />
          </div>

          <div className="tsaritsa-page__profile-list">

            <div>
              <span>Title</span>
              <strong>The Tsaritsa</strong>
            </div>

            <div>
              <span>Nation</span>
              <strong>Snezhnaya</strong>
            </div>

            <div>
              <span>Element</span>
              <strong>Cryo</strong>
            </div>

            <div>
              <span>Seat of Power</span>
              <strong>Winter Palace</strong>
            </div>

            <div>
              <span>Authority</span>
              <strong>Supreme Imperial</strong>
            </div>

            <div>
              <span>Command Network</span>
              <strong>Online</strong>
            </div>

          </div>

        </article>

        {/* DIRECTIVES */}
        <article className="tsaritsa-card tsaritsa-card--directives">

          <div className="tsaritsa-card__header">
            <div>
              <span>By Her Command</span>
              <h2>Imperial Directives</h2>
            </div>

            <ScrollText size={18} />
          </div>

          <div className="tsaritsa-page__directives">

            <div className="tsaritsa-page__directive">
              <span>01</span>

              <div>
                <strong>Secure Divine Assets</strong>
                <p>
                  Continue acquisition and protection of
                  strategic divine objects.
                </p>
              </div>
            </div>

            <div className="tsaritsa-page__directive">
              <span>02</span>

              <div>
                <strong>Preserve Northern Sovereignty</strong>
                <p>
                  Maintain the security and authority of
                  Snezhnaya across all imperial territories.
                </p>
              </div>
            </div>

            <div className="tsaritsa-page__directive">
              <span>03</span>

              <div>
                <strong>Expand Imperial Intelligence</strong>
                <p>
                  Continue surveillance and intelligence
                  operations throughout Teyvat.
                </p>
              </div>
            </div>

          </div>

        </article>

        {/* CRYO AUTHORITY */}
        <article className="tsaritsa-card tsaritsa-card--power">

          <div className="tsaritsa-card__header">
            <div>
              <span>Divine Authority</span>
              <h2>Cryo Dominion</h2>
            </div>

            <Snowflake size={18} />
          </div>

          <div className="tsaritsa-page__cryo">

            <div className="tsaritsa-page__cryo-symbol">
              <Snowflake
                size={52}
                strokeWidth={0.9}
              />
            </div>

            <strong>
              Absolute Winter
            </strong>

            <p>
              The Cryo network of the Winter Palace remains
              synchronized with the throne.
            </p>

            <div className="tsaritsa-page__power-bar">
              <span />
            </div>

            <small>
              Imperial Cryo Network // 100%
            </small>

          </div>

        </article>

        {/* IMPERIAL PROJECT */}
        <article className="tsaritsa-card tsaritsa-card--project">

          <div className="tsaritsa-card__header">
            <div>
              <span>Highest Classification</span>
              <h2>Project: Gnoses</h2>
            </div>

            <Gem size={18} />
          </div>

          <div className="tsaritsa-page__project-content">

            <div className="tsaritsa-page__project-icon">
              <Gem
                size={33}
                strokeWidth={1}
              />
            </div>

            <div>
              <strong>4 / 7</strong>

              <span>
                Divine assets secured
              </span>
            </div>

          </div>

          <Link
            to="/gnoses"
            className="tsaritsa-card__link"
          >
            Access Classified Project
            <ChevronRight size={14} />
          </Link>

        </article>

        {/* PALACE */}
        <article className="tsaritsa-card tsaritsa-card--palace">

          <div className="tsaritsa-card__header">
            <div>
              <span>Royal Residence</span>
              <h2>Winter Palace</h2>
            </div>

            <Sparkles size={18} />
          </div>

          <p>
            Enter the imperial palace network and explore
            the throne chamber, war room, archives, vaults
            and restricted royal sectors.
          </p>

          <Link
            to="/palace"
            className="tsaritsa-card__link"
          >
            Enter Palace
            <ChevronRight size={14} />
          </Link>

        </article>

      </section>

    </main>
  );
}

export default TsaritsaPage;