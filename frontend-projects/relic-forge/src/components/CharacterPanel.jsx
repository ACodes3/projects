
import {
  Sword,
  Shield,
  Sparkles,
  Heart,
  Diamond,
  Eye,
  Clover,
  HeartPulse,
} from 'lucide-react';

const secondaryStats = [
  {
    label: 'Strength',
    icon: Diamond,
    value: (stats) => Math.round(stats.attack / 5),
  },
  {
    label: 'Dexterity',
    icon: Eye,
    value: (stats) => Math.round(stats.crit + 18),
  },
  {
    label: 'Intelligence',
    icon: Sparkles,
    value: (stats) => Math.round(stats.defense / 4),
  },
  {
    label: 'Vitality',
    icon: HeartPulse,
    value: (stats) => Math.round(stats.health / 3),
  },
  {
    label: 'Luck',
    icon: Clover,
    value: (stats) => Math.max(10, stats.crit * 2),
  },
];

export default function CharacterPanel({
  character,
  stats,
}) {
  return (
    <section className="character-panel panel">

      {/* Character artwork */}
      <div className="character-stage">
        <div className="character-stage__halo" />

        <img
          src={character.image}
          alt={`${character.name} in full armor`}
          className="character-stage__portrait"
        />

        <div className="character-stage__vignette" />
      </div>

      {/* Character statistics */}
      <div className="character-stats">

        {/* Primary stats */}
        <div className="character-stats__primary">

          <div>
            <span>
              <Sword size={14} />
              Attack
            </span>
            <strong>{stats.attack.toLocaleString()}</strong>
          </div>

          <div>
            <span>
              <Shield size={14} />
              Defense
            </span>
            <strong>{stats.defense.toLocaleString()}</strong>
          </div>

          <div>
            <span>
              <Sparkles size={14} />
              Magic
            </span>
            <strong>
              {Math.round(stats.crit * 42).toLocaleString()}
            </strong>
          </div>

        </div>

        {/* Health */}
        <div className="character-stats__health">
          <Heart size={12} />

          <span className="character-stats__health-line" />

          <span>{stats.health} HP</span>
        </div>

        {/* Secondary stats */}
        <div className="character-stats__secondary">
          {secondaryStats.map((stat) => {
            const Icon = stat.icon;

            return (
              <div key={stat.label}>
                <span>
                  <Icon size={13} />
                  {stat.label}
                </span>

                <strong>
                  {stat.value(stats)}
                </strong>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
