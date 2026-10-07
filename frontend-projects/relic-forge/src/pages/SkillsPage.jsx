
import { useEffect, useMemo, useState } from 'react';

import {
  Swords,
  Shield,
  Flame,
  Zap,
  Heart,
  Crosshair,
  Sparkles,
  Crown,
  Wind,
  Eye,
  Skull,
  Lock,
  Check,
  Plus,
  RotateCcw,
  ChevronRight,
  BookOpen,
} from 'lucide-react';

import './SkillsPage.css';

const icons = {
  swords: Swords,
  shield: Shield,
  flame: Flame,
  zap: Zap,
  heart: Heart,
  crosshair: Crosshair,
  sparkles: Sparkles,
  crown: Crown,
  wind: Wind,
  eye: Eye,
  skull: Skull,
};

const getIcon = (name) => icons[name] || Sparkles;

function SkillIcon({ name, ...props }) {
  switch (name) {
    case 'swords':
      return <Swords {...props} />;
    case 'shield':
      return <Shield {...props} />;
    case 'flame':
      return <Flame {...props} />;
    case 'zap':
      return <Zap {...props} />;
    case 'heart':
      return <Heart {...props} />;
    case 'crosshair':
      return <Crosshair {...props} />;
    case 'sparkles':
      return <Sparkles {...props} />;
    case 'crown':
      return <Crown {...props} />;
    case 'wind':
      return <Wind {...props} />;
    case 'eye':
      return <Eye {...props} />;
    case 'skull':
      return <Skull {...props} />;
    default:
      return <Sparkles {...props} />;
  }
}

function loadRanks(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

export default function SkillsPage({ character }) {
  const [data, setData] = useState(null);
  const [activeTree, setActiveTree] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  const storageKey = `relic-forge-skills-${character.id || character.name}`;

  const [ranks, setRanks] = useState(() =>
    loadRanks(storageKey)
  );

  // Load skill trees from JSON
  useEffect(() => {
    let active = true;

    async function loadSkills() {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/skills.json`
        );

        if (!response.ok) {
          throw new Error('Could not load skills.json');
        }

        const result = await response.json();

        if (!active) return;

        setData(result);
        setActiveTree(result.trees[0]?.id || null);
        setSelectedId(result.trees[0]?.skills[0]?.id || null);
      } catch (err) {
        if (active) setError(err.message);
      }
    }

    loadSkills();

    return () => {
      active = false;
    };
  }, []);

  // Save skill upgrades
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(ranks));
  }, [ranks, storageKey]);

  const trees = useMemo(
    () => data?.trees || [],
    [data]
  );

  const allSkills = useMemo(
    () => trees.flatMap((tree) => tree.skills),
    [trees]
  );

  const selectedTree = trees.find(
    (tree) => tree.id === activeTree
  );

  const selectedSkill = allSkills.find(
    (skill) => skill.id === selectedId
  );

  // Skill points earned through leveling
  const totalPoints = Math.floor(character.level / 2);

  const spentPoints = Object.values(ranks).reduce(
    (sum, rank) => sum + Number(rank || 0),
    0
  );

  const availablePoints = Math.max(
    0,
    totalPoints - spentPoints
  );

  const getRank = (skillId) => ranks[skillId] || 0;

  const isUnlocked = (skill) => {
    if (character.level < skill.requiredLevel) {
      return false;
    }

    if (!skill.requires) {
      return true;
    }

    return (
      getRank(skill.requires) >= (skill.requiresRank || 1)
    );
  };

  const canUpgrade = (skill) => {
    return (
      isUnlocked(skill) &&
      getRank(skill.id) < skill.maxRank &&
      availablePoints > 0
    );
  };

  // Unlock or upgrade an ability
  const upgradeSkill = (skill) => {
    if (!canUpgrade(skill)) return;

    setRanks((current) => ({
      ...current,
      [skill.id]: (current[skill.id] || 0) + 1,
    }));
  };

  // Change skill tree
  const changeTree = (tree) => {
    setActiveTree(tree.id);
    setSelectedId(tree.skills[0]?.id || null);
  };

  // Reset allocated skill points
  const resetSkills = () => {
    const confirmed = window.confirm(
      'Reset all skill upgrades and return your skill points?'
    );

    if (confirmed) {
      setRanks({});
    }
  };

  if (error) {
    return (
      <main className="skills-page">
        <div className="skills-page__feedback">
          <BookOpen size={36} />
          <h2>Skill Tome Unavailable</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="skills-page">
        <div className="skills-page__feedback">
          Opening the skill tome...
        </div>
      </main>
    );
  }

  return (
    <main className="skills-page">

      {/* Page heading */}
      <header className="skills-page__header">
        <div>
          <span className="skills-page__eyebrow">
            Character Progression
          </span>

          <h1>Skills & Abilities</h1>
        </div>

        <div className="skills-page__points">
          <Sparkles size={21} />

          <div>
            <strong>{availablePoints}</strong>
            <span>Available Skill Points</span>
          </div>
        </div>
      </header>

      <div className="skills-page__layout">

        {/* LEFT: Skill categories */}
        <aside className="skills-page__sidebar panel">
          <div className="skills-page__section-heading">
            <h2>Skill Disciplines</h2>
          </div>

          <div className="skills-page__categories">
            {trees.map((tree) => {
              const Icon = getIcon(tree.icon);

              const learned = tree.skills.filter(
                (skill) => getRank(skill.id) > 0
              ).length;

              return (
                <button
                  key={tree.id}
                  type="button"
                  className={`skills-page__category ${
                    activeTree === tree.id
                      ? 'skills-page__category--active'
                      : ''
                  }`}
                  onClick={() => changeTree(tree)}
                >
                  <span className="skills-page__category-icon">
                    <Icon size={27} strokeWidth={1.3} />
                  </span>

                  <span className="skills-page__category-info">
                    <strong>{tree.name}</strong>

                    <small>{tree.subtitle}</small>

                    <span>
                      {learned} / {tree.skills.length} Learned
                    </span>
                  </span>

                  <ChevronRight size={15} />
                </button>
              );
            })}
          </div>

          <div className="skills-page__sidebar-bottom">
            <div className="skills-page__points-summary">
              <span>Total Points</span>
              <strong>{totalPoints}</strong>
            </div>

            <div className="skills-page__points-summary">
              <span>Points Spent</span>
              <strong>{spentPoints}</strong>
            </div>

            <button
              type="button"
              className="skills-page__reset"
              onClick={resetSkills}
              disabled={spentPoints === 0}
            >
              <RotateCcw size={14} />
              Reset Skills
            </button>
          </div>
        </aside>

        {/* CENTER: Skill tree */}
        <section className="skills-page__tree panel">
          <div className="skills-page__tree-header">
            <div>
              <span>Selected Discipline</span>
              <h2>{selectedTree?.name}</h2>
              <p>{selectedTree?.description}</p>
            </div>

            {selectedTree && (() => {
              const Icon = getIcon(selectedTree.icon);

              return (
                <div className="skills-page__tree-emblem">
                  <Icon size={34} strokeWidth={1.1} />
                </div>
              );
            })()}
          </div>

          <div className="skills-page__tree-content">
            {[1, 2, 3].map((tier) => {
              const tierSkills =
                selectedTree?.skills.filter(
                  (skill) => skill.tier === tier
                ) || [];

              if (!tierSkills.length) return null;

              return (
                <div
                  key={tier}
                  className="skills-page__tier"
                >
                  <div className="skills-page__tier-heading">
                    <span>Tier {tier}</span>
                    <div />
                  </div>

                  <div className="skills-page__skill-grid">
                    {tierSkills.map((skill) => {
                      const Icon = getIcon(skill.icon);
                      const rank = getRank(skill.id);
                      const unlocked = isUnlocked(skill);
                      const maxed = rank >= skill.maxRank;
                      const selected = selectedId === skill.id;

                      return (
                        <button
                          key={skill.id}
                          type="button"
                          onClick={() => setSelectedId(skill.id)}
                          className={`skills-page__skill ${
                            selected
                              ? 'skills-page__skill--selected'
                              : ''
                          } ${
                            !unlocked
                              ? 'skills-page__skill--locked'
                              : ''
                          } ${
                            rank > 0
                              ? 'skills-page__skill--learned'
                              : ''
                          }`}
                        >
                          <span className="skills-page__skill-icon">
                            <Icon size={32} strokeWidth={1.3} />

                            {!unlocked && (
                              <span className="skills-page__lock">
                                <Lock size={12} />
                              </span>
                            )}

                            {maxed && (
                              <span className="skills-page__maxed">
                                <Check size={12} />
                              </span>
                            )}
                          </span>

                          <strong>{skill.name}</strong>

                          <span className="skills-page__skill-rank">
                            Rank {rank} / {skill.maxRank}
                          </span>

                          <span className="skills-page__rank-track">
                            <span
                              style={{
                                width: `${
                                  (rank / skill.maxRank) * 100
                                }%`,
                              }}
                            />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* RIGHT: Selected ability details */}
        <aside className="skills-page__details panel">
          {selectedSkill && (
            <>
              <div className="skills-page__details-body">

                <div className="skills-page__details-icon">
                  <SkillIcon
                    name={selectedSkill.icon}
                    size={55}
                    strokeWidth={1.1}
                  />
                </div>

                <span className="skills-page__details-type">
                  Tier {selectedSkill.tier} Ability
                </span>

                <h2>{selectedSkill.name}</h2>

                <div className="skills-page__details-rank">
                  <span>Ability Rank</span>

                  <strong>
                    {getRank(selectedSkill.id)}
                    {' / '}
                    {selectedSkill.maxRank}
                  </strong>
                </div>

                <p className="skills-page__description">
                  {selectedSkill.description}
                </p>

                <div className="skills-page__details-divider" />

                <h3>Ability Effect</h3>

                <p className="skills-page__effect">
                  <Sparkles size={14} />
                  {selectedSkill.effect}
                </p>

                <div className="skills-page__requirements">
                  <h3>Requirements</h3>

                  <div>
                    <span>Character Level</span>

                    <strong>
                      {selectedSkill.requiredLevel}

                      {character.level >=
                      selectedSkill.requiredLevel ? (
                        <Check size={14} />
                      ) : (
                        <Lock size={14} />
                      )}
                    </strong>
                  </div>

                  {selectedSkill.requires && (
                    <div>
                      <span>
                        {allSkills.find(
                          (skill) =>
                            skill.id === selectedSkill.requires
                        )?.name || 'Previous Ability'}
                      </span>

                      <strong>
                        Rank {selectedSkill.requiresRank || 1}
                      </strong>
                    </div>
                  )}
                </div>
              </div>

              <div className="skills-page__details-actions">
                <button
                  type="button"
                  className="skills-page__upgrade"
                  disabled={!canUpgrade(selectedSkill)}
                  onClick={() => upgradeSkill(selectedSkill)}
                >
                  {getRank(selectedSkill.id) >=
                  selectedSkill.maxRank ? (
                    <>
                      <Check size={16} />
                      Fully Upgraded
                    </>
                  ) : !isUnlocked(selectedSkill) ? (
                    <>
                      <Lock size={16} />
                      Ability Locked
                    </>
                  ) : availablePoints === 0 ? (
                    'Not Enough Skill Points'
                  ) : (
                    <>
                      <Plus size={16} />
                      Upgrade Ability
                    </>
                  )}
                </button>

                <span>
                  Upgrade Cost: 1 Skill Point
                </span>
              </div>
            </>
          )}
        </aside>

      </div>
    </main>
  );
}
