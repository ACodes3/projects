import { useEffect, useMemo, useState } from 'react';

import {
  ScrollText,
  Check,
  Lock,
  MapPin,
  Coins,
  Gem,
  Sword,
  Shield,
  Crown,
  Target,
  ChevronRight,
  Clock3,
  Sparkles,
  Circle,
} from 'lucide-react';

import './QuestsPage.css';

const rewardIcons = {
  coins: Coins,
  gem: Gem,
  weapon: Sword,
  armor: Shield,
  relic: Crown,
  xp: Sparkles,
};

export default function QuestsPage({ character }) {
  const characterLevel = character?.level ?? 1;

  const [questData, setQuestData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [activeFilter, setActiveFilter] = useState('active');
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadQuests() {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/quests.json`
        );

        if (!response.ok) {
          throw new Error('Could not load quests.json');
        }

        const result = await response.json();

        if (!active) return;

        setQuestData(result);

        const firstQuest =
          result.quests.find(
            (quest) => quest.status === 'active'
          ) ||
          result.quests[0];

        setSelectedId(firstQuest?.id || null);
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      }
    }

    loadQuests();

    return () => {
      active = false;
    };
  }, []);

  const quests = useMemo(
    () => questData?.quests || [],
    [questData]
  );

  const filteredQuests = useMemo(() => {
    if (activeFilter === 'available') {
      return quests.filter(
        (quest) =>
          quest.status === 'available' &&
          characterLevel >= quest.requiredLevel
      );
    }

    return quests.filter(
      (quest) => quest.status === activeFilter
    );
  }, [quests, activeFilter, characterLevel]);

  const selectedQuest = quests.find(
    (quest) => quest.id === selectedId
  );

  const selectFilter = (filter) => {
    setActiveFilter(filter);

    const nextQuest =
      filter === 'available'
        ? quests.find(
            (quest) =>
              quest.status === 'available' &&
              characterLevel >= quest.requiredLevel
          )
        : quests.find(
            (quest) => quest.status === filter
          );

    setSelectedId(nextQuest?.id || null);
  };

  const questUnlocked = (quest) =>
    characterLevel >= quest.requiredLevel;

  if (error) {
    return (
      <main className="quests-page">
        <div className="quests-page__feedback">
          <ScrollText size={38} />
          <h2>Quest Log Unavailable</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!questData) {
    return (
      <main className="quests-page">
        <div className="quests-page__feedback">
          <ScrollText size={38} />
          <p>Opening the quest journal...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="quests-page">

      {/* HEADER */}
      <header className="quests-page__header">
        <div>
          <span className="quests-page__eyebrow">
            Adventure Journal
          </span>

          <h1>Quests</h1>
        </div>

        <div className="quests-page__summary">
          <ScrollText size={19} />

          <div>
            <strong>
              {
                quests.filter(
                  (quest) => quest.status === 'active'
                ).length
              }
            </strong>

            <span>Active Quests</span>
          </div>
        </div>
      </header>

      <div className="quests-page__layout">

        {/* LEFT */}
        <aside className="quests-page__sidebar panel">

          <div className="quests-page__tabs">
            <button
              type="button"
              className={
                activeFilter === 'active'
                  ? 'quests-page__tab quests-page__tab--active'
                  : 'quests-page__tab'
              }
              onClick={() => selectFilter('active')}
            >
              Active
            </button>

            <button
              type="button"
              className={
                activeFilter === 'available'
                  ? 'quests-page__tab quests-page__tab--active'
                  : 'quests-page__tab'
              }
              onClick={() => selectFilter('available')}
            >
              Available
            </button>

            <button
              type="button"
              className={
                activeFilter === 'completed'
                  ? 'quests-page__tab quests-page__tab--active'
                  : 'quests-page__tab'
              }
              onClick={() => selectFilter('completed')}
            >
              Completed
            </button>
          </div>

          <div className="quests-page__list">
            {filteredQuests.map((quest) => {
              const selected =
                quest.id === selectedId;

              const unlocked =
                questUnlocked(quest);

              return (
                <button
                  key={quest.id}
                  type="button"
                  className={`
                    quests-page__quest
                    ${
                      selected
                        ? 'quests-page__quest--selected'
                        : ''
                    }
                  `}
                  onClick={() =>
                    setSelectedId(quest.id)
                  }
                >
                  <span className="quests-page__quest-icon">
                    {quest.status === 'completed' ? (
                      <Check size={18} />
                    ) : unlocked ? (
                      <Target size={18} />
                    ) : (
                      <Lock size={17} />
                    )}
                  </span>

                  <span className="quests-page__quest-info">
                    <strong>{quest.name}</strong>

                    <small>
                      {quest.category}
                    </small>

                    <span>
                      Level {quest.requiredLevel}+
                    </span>
                  </span>

                  <ChevronRight size={14} />
                </button>
              );
            })}

            {filteredQuests.length === 0 && (
              <div className="quests-page__empty">
                No quests in this category.
              </div>
            )}
          </div>

        </aside>

        {/* CENTER */}
        <section className="quests-page__journal panel">

          {selectedQuest ? (
            <>
              <div className="quests-page__journal-header">

                <div>
                  <span>
                    {selectedQuest.category}
                  </span>

                  <h2>
                    {selectedQuest.name}
                  </h2>

                  <p>
                    {selectedQuest.subtitle}
                  </p>
                </div>

                <div className="quests-page__status-icon">
                  {selectedQuest.status ===
                  'completed' ? (
                    <Check size={28} />
                  ) : questUnlocked(
                      selectedQuest
                    ) ? (
                    <ScrollText size={28} />
                  ) : (
                    <Lock size={26} />
                  )}
                </div>

              </div>

              <div className="quests-page__journal-body">

                <p className="quests-page__description">
                  {selectedQuest.description}
                </p>

                <div className="quests-page__divider" />

                <div className="quests-page__meta">
                  <div>
                    <MapPin size={14} />
                    <span>Region</span>
                    <strong>
                      {selectedQuest.region}
                    </strong>
                  </div>

                  <div>
                    <Crown size={14} />
                    <span>Required Level</span>
                    <strong>
                      {selectedQuest.requiredLevel}
                    </strong>
                  </div>

                  <div>
                    <Clock3 size={14} />
                    <span>Quest Type</span>
                    <strong>
                      {selectedQuest.type}
                    </strong>
                  </div>
                </div>

                <div className="quests-page__objectives">
                  <h3>Objectives</h3>

                  {selectedQuest.objectives.map(
                    (objective) => {
                      const completed =
                        objective.current >=
                        objective.required;

                      const progress =
                        Math.min(
                          100,
                          (objective.current /
                            objective.required) *
                            100
                        );

                      return (
                        <div
                          key={objective.id}
                          className="quests-page__objective"
                        >
                          <span className="quests-page__objective-check">
                            {completed ? (
                              <Check size={13} />
                            ) : (
                              <Circle size={11} />
                            )}
                          </span>

                          <div className="quests-page__objective-info">
                            <div>
                              <span>
                                {objective.text}
                              </span>

                              <strong>
                                {objective.current} /{' '}
                                {objective.required}
                              </strong>
                            </div>

                            <div className="quests-page__objective-track">
                              <span
                                style={{
                                  width: `${progress}%`,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

              </div>
            </>
          ) : (
            <div className="quests-page__no-selection">
              Select a quest from the journal.
            </div>
          )}

        </section>

        {/* RIGHT */}
        <aside className="quests-page__details panel">

          {selectedQuest && (
            <>
              <div className="quests-page__details-body">

                <div className="quests-page__section-heading">
                  <h2>Quest Rewards</h2>
                </div>

                <div className="quests-page__rewards">
                  {selectedQuest.rewards.map(
                    (reward, index) => {
                      const Icon =
                        rewardIcons[
                          reward.type
                        ] || Coins;

                      return (
                        <div
                          key={`${reward.name}-${index}`}
                          className="quests-page__reward"
                        >
                          <span>
                            <Icon
                              size={21}
                              strokeWidth={1.4}
                            />
                          </span>

                          <div>
                            <strong>
                              {reward.name}
                            </strong>

                            <small>
                              {reward.amount}
                            </small>
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>

                <div className="quests-page__section-heading quests-page__section-heading--lower">
                  <h2>Quest Information</h2>
                </div>

                <div className="quests-page__information">

                  <div>
                    <span>Status</span>

                    <strong>
                      {selectedQuest.status}
                    </strong>
                  </div>

                  <div>
                    <span>Recommended Level</span>

                    <strong>
                      {selectedQuest.recommendedLevel}
                    </strong>
                  </div>

                  <div>
                    <span>Difficulty</span>

                    <strong>
                      {selectedQuest.difficulty}
                    </strong>
                  </div>

                </div>

                {selectedQuest.lore && (
                  <blockquote className="quests-page__lore">
                    “{selectedQuest.lore}”
                  </blockquote>
                )}

              </div>

              <div className="quests-page__actions">

                <button
                  type="button"
                  disabled={
                    selectedQuest.status ===
                      'completed' ||
                    !questUnlocked(
                      selectedQuest
                    )
                  }
                >
                  {selectedQuest.status ===
                  'completed' ? (
                    <>
                      <Check size={15} />
                      Quest Completed
                    </>
                  ) : !questUnlocked(
                      selectedQuest
                    ) ? (
                    <>
                      <Lock size={15} />
                      Requires Level{' '}
                      {
                        selectedQuest.requiredLevel
                      }
                    </>
                  ) : selectedQuest.status ===
                    'active' ? (
                    <>
                      <MapPin size={15} />
                      Track Quest
                    </>
                  ) : (
                    <>
                      <ScrollText size={15} />
                      Accept Quest
                    </>
                  )}
                </button>

                <span>
                  <MapPin size={11} />
                  {selectedQuest.region}
                </span>

              </div>
            </>
          )}

        </aside>

      </div>
    </main>
  );
}