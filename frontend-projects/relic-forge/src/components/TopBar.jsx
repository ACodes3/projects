
import { Coins, Droplet, Gem, X } from 'lucide-react';

const navLinks = [
  'Inventory',
  'Character',
  'Skills',
  'Map',
  'Quests',
  'Codex',
  'System',
];

export default function TopBar({
  character,
  activeTab,
  onTabChange,
}) {
  const experience = character.experience || 0;
  const currentXP = Math.round(experience * 270);
  const maxXP = 27000;

  return (
    <header className="topbar">

      {/* Character information */}
      <div className="topbar__player">
        <img
          className="player-avatar"
          src={character.avatar || character.image}
          alt={character.name}
        />

        <div className="player-meta">
          <span className="player-meta__heading">
            {character.name}
          </span>

          <div className="player-meta__experience">
            <span>Level {character.level}</span>
            <span>
              {currentXP.toLocaleString()} / {maxXP.toLocaleString()}
            </span>
          </div>

          <div className="experience-track">
            <span
              style={{ width: `${experience}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <nav className="topbar__nav" aria-label="Main navigation">
        {navLinks.map((link) => (
          <button
            key={link}
            type="button"
            className={`nav-link ${
              activeTab === link ? 'nav-link--active' : ''
            }`}
            onClick={() => onTabChange(link)}
          >
            {link}
          </button>
        ))}
      </nav>

      {/* Player currencies */}
      <div className="topbar__wallet">
        <span>
          <Coins size={14} className="gold-icon" />
          128,467
        </span>

        <span>
          <Gem size={14} className="purple-icon" />
          2,850
        </span>

        <span>
          <Droplet size={14} className="blue-icon" />
          640
        </span>
      </div>

      {/* Close button */}
      <button
        type="button"
        className="close-button"
        aria-label="Close inventory"
        onClick={() => onTabChange('Home')}
      >
        <X size={19} />
      </button>

    </header>
  );
}
