import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import './StartPage.css';

export default function StartPage() {
  const navigate = useNavigate();

  function enterForge() {
    sessionStorage.setItem(
      'forge:entered',
      'true',
    );

    navigate('/');
  }

  return (
    <main className="start-page">
      <div className="start-page__overlay" />

      <div className="start-page__content">
        <div className="start-page__intro">
          <span className="start-page__eyebrow">
            Training & Nutrition
          </span>

          <h1 className="start-page__title">
            Welcome to
            <span> FORGE.</span>
          </h1>

          <p className="start-page__lead">
            Train with intent.
            Track what matters.
            Build strength one session at a time.
          </p>

          <p className="start-page__description">
            Your private space for workouts,
            nutrition and progress.
          </p>

          <button
            type="button"
            className="start-page__enter"
            onClick={enterForge}
          >
            <span>Enter Forge</span>

            <span className="start-page__enter-icon">
              <ArrowRight size={18} />
            </span>
          </button>
        </div>
      </div>
    </main>
  );
}