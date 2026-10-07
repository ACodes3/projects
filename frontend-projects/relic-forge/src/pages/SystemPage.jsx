import { useEffect, useRef, useState } from 'react';

import {
  Settings,
  Volume2,
  Monitor,
  Gamepad2,
  Save,
  RotateCcw,
  Trash2,
  Check,
  Minus,
  Plus,
  Shield,
  Sparkles,
  Info,
} from 'lucide-react';

import './SystemPage.css';

const defaultSettings = {
  masterVolume: 80,
  musicVolume: 65,
  effectsVolume: 75,

  uiScale: 100,

  showTooltips: true,
  showDamageNumbers: true,
  screenShake: true,
  reducedMotion: false,

  autoEquipBetterItems: false,
  confirmDismantle: true,
};

function loadSettings() {
  try {
    const saved = localStorage.getItem(
      'relic-forge-settings'
    );

    return saved
      ? {
          ...defaultSettings,
          ...JSON.parse(saved),
        }
      : defaultSettings;
  } catch {
    return defaultSettings;
  }
}

function SettingToggle({
  label,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="system-page__setting">
      <div>
        <strong>{label}</strong>
        <span>{description}</span>
      </div>

      <button
        type="button"
        className={`system-page__toggle ${
          checked
            ? 'system-page__toggle--active'
            : ''
        }`}
        onClick={() => onChange(!checked)}
        aria-pressed={checked}
      >
        <span />
      </button>
    </div>
  );
}

function VolumeSetting({
  label,
  value,
  onChange,
}) {
  return (
    <div className="system-page__slider-setting">
      <div className="system-page__slider-header">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>

      <div className="system-page__slider-row">
        <Volume2 size={14} />

        <input
          type="range"
          min="0"
          max="100"
          value={value}
          onChange={(event) =>
            onChange(Number(event.target.value))
          }
        />
      </div>
    </div>
  );
}

export default function SystemPage({
  character,
}) {
  const [activeSection, setActiveSection] =
    useState('interface');

  const [settings, setSettings] = useState(
    loadSettings
  );

  const [savedMessage, setSavedMessage] =
    useState(false);

  const savedMessageTimeout = useRef(null);

  useEffect(() => {
    localStorage.setItem(
      'relic-forge-settings',
      JSON.stringify(settings)
    );
  }, [settings]);

  const showSavedMessage = () => {
    setSavedMessage(true);

    if (savedMessageTimeout.current) {
      clearTimeout(savedMessageTimeout.current);
    }

    savedMessageTimeout.current = setTimeout(() => {
      setSavedMessage(false);
    }, 900);
  };

  const updateSetting = (key, value) => {
    setSettings((current) => ({
      ...current,
      [key]: value,
    }));

    showSavedMessage();
  };

  const resetSettings = () => {
    const confirmed = window.confirm(
      'Reset all system settings to their defaults?'
    );

    if (!confirmed) return;

    setSettings(defaultSettings);
    showSavedMessage();
  };

  const clearGameData = () => {
    const confirmed = window.confirm(
      'Clear Relic Forge local save data? This will reset inventory state, favorites, skills, salvage, and system settings.'
    );

    if (!confirmed) return;

    const keys = [
      'relic-forge-inventory',
      'relic-forge-favorites',
      'relic-forge-salvage',
      'relic-forge-settings',
    ];

    keys.forEach((key) =>
      localStorage.removeItem(key)
    );

    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith(
          'relic-forge-skills-'
        )
      ) {
        localStorage.removeItem(key);
      }
    });

    window.location.reload();
  };

  const sections = [
    {
      id: 'interface',
      label: 'Interface',
      icon: Monitor,
    },
    {
      id: 'audio',
      label: 'Audio',
      icon: Volume2,
    },
    {
      id: 'gameplay',
      label: 'Gameplay',
      icon: Gamepad2,
    },
    {
      id: 'save',
      label: 'Save Data',
      icon: Save,
    },
  ];

  return (
    <main className="system-page">

      {/* HEADER */}
      <header className="system-page__header">
        <div>
          <span className="system-page__eyebrow">
            Relic Forge Configuration
          </span>

          <h1>System</h1>
        </div>

        <div className="system-page__saved">
          {savedMessage ? (
            <>
              <Check size={15} />
              Settings Saved
            </>
          ) : (
            <>
              <Settings size={15} />
              Preferences
            </>
          )}
        </div>
      </header>

      <div className="system-page__layout">

        {/* LEFT NAVIGATION */}
        <aside className="system-page__sidebar panel">

          <div className="system-page__section-heading">
            <h2>Settings</h2>
          </div>

          <div className="system-page__navigation">
            {sections.map((section) => {
              const Icon = section.icon;

              return (
                <button
                  key={section.id}
                  type="button"
                  className={`
                    system-page__nav-item
                    ${
                      activeSection ===
                      section.id
                        ? 'system-page__nav-item--active'
                        : ''
                    }
                  `}
                  onClick={() =>
                    setActiveSection(
                      section.id
                    )
                  }
                >
                  <span>
                    <Icon
                      size={20}
                      strokeWidth={1.4}
                    />
                  </span>

                  {section.label}
                </button>
              );
            })}
          </div>

          <div className="system-page__sidebar-footer">
            <Settings size={21} />

            <div>
              <strong>Relic Forge</strong>
              <span>Version 1.0.0</span>
            </div>
          </div>
        </aside>

        {/* CENTER SETTINGS */}
        <section className="system-page__content panel">

          {/* INTERFACE */}
          {activeSection ===
            'interface' && (
            <>
              <div className="system-page__content-header">
                <Monitor size={25} />

                <div>
                  <span>
                    Display Preferences
                  </span>

                  <h2>Interface</h2>

                  <p>
                    Adjust how Relic Forge
                    presents information and
                    visual effects.
                  </p>
                </div>
              </div>

              <div className="system-page__settings-group">
                <h3>Interface Scale</h3>

                <div className="system-page__scale-setting">
                  <button
                    type="button"
                    onClick={() =>
                      updateSetting(
                        'uiScale',
                        Math.max(
                          80,
                          settings.uiScale -
                            10
                        )
                      )
                    }
                  >
                    <Minus size={14} />
                  </button>

                  <strong>
                    {settings.uiScale}%
                  </strong>

                  <button
                    type="button"
                    onClick={() =>
                      updateSetting(
                        'uiScale',
                        Math.min(
                          120,
                          settings.uiScale +
                            10
                        )
                      )
                    }
                  >
                    <Plus size={14} />
                  </button>
                </div>
              </div>

              <div className="system-page__settings-group">
                <h3>Display Options</h3>

                <SettingToggle
                  label="Show Tooltips"
                  description="Display additional information while hovering over interface elements."
                  checked={
                    settings.showTooltips
                  }
                  onChange={(value) =>
                    updateSetting(
                      'showTooltips',
                      value
                    )
                  }
                />

                <SettingToggle
                  label="Damage Numbers"
                  description="Show floating damage values during combat."
                  checked={
                    settings.showDamageNumbers
                  }
                  onChange={(value) =>
                    updateSetting(
                      'showDamageNumbers',
                      value
                    )
                  }
                />

                <SettingToggle
                  label="Screen Shake"
                  description="Allow impact effects to shake the interface."
                  checked={
                    settings.screenShake
                  }
                  onChange={(value) =>
                    updateSetting(
                      'screenShake',
                      value
                    )
                  }
                />

                <SettingToggle
                  label="Reduced Motion"
                  description="Reduce transitions and animated interface effects."
                  checked={
                    settings.reducedMotion
                  }
                  onChange={(value) =>
                    updateSetting(
                      'reducedMotion',
                      value
                    )
                  }
                />
              </div>
            </>
          )}

          {/* AUDIO */}
          {activeSection === 'audio' && (
            <>
              <div className="system-page__content-header">
                <Volume2 size={25} />

                <div>
                  <span>Sound Configuration</span>

                  <h2>Audio</h2>

                  <p>
                    Control music, effects, and
                    overall game volume.
                  </p>
                </div>
              </div>

              <div className="system-page__settings-group">
                <h3>Volume</h3>

                <VolumeSetting
                  label="Master Volume"
                  value={
                    settings.masterVolume
                  }
                  onChange={(value) =>
                    updateSetting(
                      'masterVolume',
                      value
                    )
                  }
                />

                <VolumeSetting
                  label="Music Volume"
                  value={
                    settings.musicVolume
                  }
                  onChange={(value) =>
                    updateSetting(
                      'musicVolume',
                      value
                    )
                  }
                />

                <VolumeSetting
                  label="Effects Volume"
                  value={
                    settings.effectsVolume
                  }
                  onChange={(value) =>
                    updateSetting(
                      'effectsVolume',
                      value
                    )
                  }
                />
              </div>

              <div className="system-page__notice">
                <Info size={16} />

                <p>
                  Audio controls are saved, but
                  Relic Forge does not currently
                  include background audio files.
                </p>
              </div>
            </>
          )}

          {/* GAMEPLAY */}
          {activeSection ===
            'gameplay' && (
            <>
              <div className="system-page__content-header">
                <Gamepad2 size={25} />

                <div>
                  <span>Adventure Preferences</span>

                  <h2>Gameplay</h2>

                  <p>
                    Configure inventory and
                    gameplay-related behavior.
                  </p>
                </div>
              </div>

              <div className="system-page__settings-group">
                <h3>Inventory</h3>

                <SettingToggle
                  label="Auto Equip Better Items"
                  description="Automatically equip stronger items when they are acquired."
                  checked={
                    settings.autoEquipBetterItems
                  }
                  onChange={(value) =>
                    updateSetting(
                      'autoEquipBetterItems',
                      value
                    )
                  }
                />

                <SettingToggle
                  label="Confirm Dismantle"
                  description="Ask for confirmation before permanently dismantling an item."
                  checked={
                    settings.confirmDismantle
                  }
                  onChange={(value) =>
                    updateSetting(
                      'confirmDismantle',
                      value
                    )
                  }
                />
              </div>

              <div className="system-page__notice">
                <Shield size={16} />

                <p>
                  Gameplay settings are stored
                  locally in your browser.
                </p>
              </div>
            </>
          )}

          {/* SAVE DATA */}
          {activeSection === 'save' && (
            <>
              <div className="system-page__content-header">
                <Save size={25} />

                <div>
                  <span>
                    Local Character Data
                  </span>

                  <h2>Save Data</h2>

                  <p>
                    Review or reset your locally
                    stored Relic Forge progress.
                  </p>
                </div>
              </div>

              <div className="system-page__save-card">
                <div className="system-page__save-icon">
                  <Sparkles
                    size={30}
                    strokeWidth={1.3}
                  />
                </div>

                <div className="system-page__save-info">
                  <span>
                    Current Character
                  </span>

                  <strong>
                    {character?.name ||
                      'Ashen Knight'}
                  </strong>

                  <small>
                    Level{' '}
                    {character?.level || 1}
                  </small>
                </div>

                <div className="system-page__save-status">
                  <Check size={13} />
                  Local Save
                </div>
              </div>

              <div className="system-page__settings-group system-page__danger-zone">
                <h3>Data Management</h3>

                <button
                  type="button"
                  className="system-page__reset-button"
                  onClick={resetSettings}
                >
                  <RotateCcw size={15} />

                  <div>
                    <strong>
                      Reset Settings
                    </strong>

                    <span>
                      Restore all preferences to
                      their defaults.
                    </span>
                  </div>
                </button>

                <button
                  type="button"
                  className="system-page__delete-button"
                  onClick={clearGameData}
                >
                  <Trash2 size={15} />

                  <div>
                    <strong>
                      Delete Local Save
                    </strong>

                    <span>
                      Clear inventory, skill,
                      favorite and settings data.
                    </span>
                  </div>
                </button>
              </div>
            </>
          )}

        </section>

        {/* RIGHT INFORMATION */}
        <aside className="system-page__info panel">

          <div className="system-page__emblem">
            <Settings
              size={42}
              strokeWidth={1}
            />
          </div>

          <span className="system-page__info-eyebrow">
            System
          </span>

          <h2>Relic Forge</h2>

          <p>
            Configure the interface and manage
            the local data used by your
            adventure.
          </p>

          <div className="system-page__info-divider" />

          <div className="system-page__info-row">
            <span>Save Type</span>
            <strong>Local Storage</strong>
          </div>

          <div className="system-page__info-row">
            <span>Character</span>
            <strong>
              {character?.name ||
                'Ashen Knight'}
            </strong>
          </div>

          <div className="system-page__info-row">
            <span>Level</span>
            <strong>
              {character?.level || 1}
            </strong>
          </div>

          <div className="system-page__info-row">
            <span>Version</span>
            <strong>1.0.0</strong>
          </div>

          <div className="system-page__info-message">
            <Sparkles size={14} />

            <span>
              Your journey is preserved within
              this browser.
            </span>
          </div>

        </aside>

      </div>
    </main>
  );
}