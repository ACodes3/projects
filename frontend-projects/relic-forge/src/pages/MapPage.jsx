import { useEffect, useMemo, useState } from 'react';

import {
  Map,
  MapPin,
  Mountain,
  Castle,
  Trees,
  Flame,
  Snowflake,
  Skull,
  Lock,
  Check,
  Compass,
  Shield,
  Coins,
  ChevronRight,
} from 'lucide-react';

import './MapPage.css';

const regionIcons = {
  castle: Castle,
  forest: Trees,
  mountain: Mountain,
  flame: Flame,
  snow: Snowflake,
  skull: Skull,
};

// TODO: Fix map. make it more realistic, also add an image if not sufficint with code

export default function MapPage({ character }) {
  const [mapData, setMapData] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadMap() {
      try {
        const response = await fetch(
          `${import.meta.env.BASE_URL}data/map.json`
        );

        if (!response.ok) {
          throw new Error('Could not load map.json');
        }

        const result = await response.json();

        if (!active) return;

        setMapData(result);

        const firstAvailable =
          result.regions.find(
            (region) =>
              region.requiredLevel <= character.level
          ) || result.regions[0];

        setSelectedId(firstAvailable?.id || null);
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      }
    }

    loadMap();

    return () => {
      active = false;
    };
  }, [character.level]);

  const regions = useMemo(
    () => mapData?.regions || [],
    [mapData]
  );

  const selectedRegion = regions.find(
    (region) => region.id === selectedId
  );

  const isRegionUnlocked = (region) =>
    character.level >= region.requiredLevel;

  if (error) {
    return (
      <main className="map-page">
        <div className="map-page__feedback">
          <Compass size={38} />
          <h2>Map Unavailable</h2>
          <p>{error}</p>
        </div>
      </main>
    );
  }

  if (!mapData) {
    return (
      <main className="map-page">
        <div className="map-page__feedback">
          <Compass size={38} />
          <p>Unrolling the world map...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="map-page">

      {/* PAGE HEADER */}
      <header className="map-page__header">
        <div>
          <span className="map-page__eyebrow">
            The Known Realms
          </span>

          <h1>World Map</h1>
        </div>

        <div className="map-page__exploration">
          <Compass size={19} />

          <div>
            <strong>
              {
                regions.filter((region) =>
                  isRegionUnlocked(region)
                ).length
              }
              /{regions.length}
            </strong>

            <span>Regions Discovered</span>
          </div>
        </div>
      </header>

      <div className="map-page__layout">

        {/* LEFT REGION LIST */}
        <aside className="map-page__regions panel">

          <div className="map-page__section-heading">
            <h2>Regions</h2>

            <Map size={15} />
          </div>

          <div className="map-page__region-list">
            {regions.map((region) => {
              const unlocked =
                isRegionUnlocked(region);

              const Icon =
                regionIcons[region.icon] || MapPin;

              return (
                <button
                  key={region.id}
                  type="button"
                  className={`
                    map-page__region
                    ${
                      selectedId === region.id
                        ? 'map-page__region--selected'
                        : ''
                    }
                    ${
                      !unlocked
                        ? 'map-page__region--locked'
                        : ''
                    }
                  `}
                  onClick={() =>
                    setSelectedId(region.id)
                  }
                >
                  <span className="map-page__region-icon">
                    <Icon
                      size={22}
                      strokeWidth={1.4}
                    />
                  </span>

                  <span className="map-page__region-info">
                    <strong>{region.name}</strong>

                    <small>
                      {region.subtitle}
                    </small>

                    <span>
                      Level {region.requiredLevel}+
                    </span>
                  </span>

                  {unlocked ? (
                    <ChevronRight size={15} />
                  ) : (
                    <Lock size={14} />
                  )}
                </button>
              );
            })}
          </div>
        </aside>

        {/* CENTER WORLD MAP */}
        <section className="map-page__world panel">

          <div className="map-page__world-header">
            <span>Realm of Aetherion</span>

            <div>
              <Compass size={14} />
              Explore
            </div>
          </div>

          <div className="map-page__canvas">

            {/* Map artwork */}
            <div className="map-page__artwork" />

            {/* Decorative compass */}
            <div className="map-page__compass">
              <span>N</span>
              <Compass size={35} strokeWidth={1} />
            </div>

            {/* Region map markers */}
            {regions.map((region) => {
              const unlocked =
                isRegionUnlocked(region);

              const Icon =
                regionIcons[region.icon] || MapPin;

              const selected =
                selectedId === region.id;

              return (
                <button
                  key={region.id}
                  type="button"
                  className={`
                    map-page__marker
                    ${
                      selected
                        ? 'map-page__marker--selected'
                        : ''
                    }
                    ${
                      !unlocked
                        ? 'map-page__marker--locked'
                        : ''
                    }
                  `}
                  style={{
                    left: `${region.position.x}%`,
                    top: `${region.position.y}%`,
                  }}
                  onClick={() =>
                    setSelectedId(region.id)
                  }
                  title={region.name}
                >
                  <span>
                    {unlocked ? (
                      <Icon size={18} />
                    ) : (
                      <Lock size={14} />
                    )}
                  </span>

                  <strong>{region.name}</strong>
                </button>
              );
            })}
          </div>

          <div className="map-page__legend">
            <span>
              <i className="map-page__dot map-page__dot--available" />
              Discovered
            </span>

            <span>
              <i className="map-page__dot map-page__dot--selected" />
              Selected
            </span>

            <span>
              <i className="map-page__dot map-page__dot--locked" />
              Locked
            </span>
          </div>
        </section>

        {/* RIGHT REGION DETAILS */}
        <aside className="map-page__details panel">

          {selectedRegion && (
            <>
              <div className="map-page__details-body">

                <div className="map-page__details-icon">
                  {(() => {
                    const Icon =
                      regionIcons[
                        selectedRegion.icon
                      ] || MapPin;

                    return (
                      <Icon
                        size={40}
                        strokeWidth={1.2}
                      />
                    );
                  })()}
                </div>

                <span className="map-page__details-eyebrow">
                  Region
                </span>

                <h2>
                  {selectedRegion.name}
                </h2>

                <p className="map-page__subtitle">
                  {selectedRegion.subtitle}
                </p>

                <div className="map-page__divider" />

                <p className="map-page__description">
                  {selectedRegion.description}
                </p>

                {/* REGION STATUS */}
                <div className="map-page__status">
                  <h3>Region Status</h3>

                  <div>
                    <span>Required Level</span>

                    <strong>
                      {selectedRegion.requiredLevel}

                      {isRegionUnlocked(
                        selectedRegion
                      ) ? (
                        <Check size={14} />
                      ) : (
                        <Lock size={14} />
                      )}
                    </strong>
                  </div>

                  <div>
                    <span>Recommended Power</span>

                    <strong>
                      {selectedRegion.recommendedPower}
                    </strong>
                  </div>

                  <div>
                    <span>Difficulty</span>

                    <strong>
                      {selectedRegion.difficulty}
                    </strong>
                  </div>
                </div>

                {/* REGION THREATS */}
                <div className="map-page__threats">
                  <h3>Known Threats</h3>

                  {selectedRegion.enemies.map(
                    (enemy) => (
                      <div key={enemy}>
                        <Skull size={13} />
                        <span>{enemy}</span>
                      </div>
                    )
                  )}
                </div>

                {/* REWARDS */}
                <div className="map-page__rewards">
                  <h3>Possible Rewards</h3>

                  {selectedRegion.rewards.map(
                    (reward) => (
                      <div key={reward}>
                        <Coins size={13} />
                        <span>{reward}</span>
                      </div>
                    )
                  )}
                </div>

              </div>

              <div className="map-page__actions">

                <button
                  type="button"
                  disabled={
                    !isRegionUnlocked(
                      selectedRegion
                    )
                  }
                >
                  {isRegionUnlocked(
                    selectedRegion
                  ) ? (
                    <>
                      <MapPin size={15} />
                      Travel to Region
                    </>
                  ) : (
                    <>
                      <Lock size={15} />
                      Requires Level{' '}
                      {selectedRegion.requiredLevel}
                    </>
                  )}
                </button>

                <span>
                  <Shield size={12} />
                  Recommended level:{' '}
                  {selectedRegion.requiredLevel}
                  +
                </span>

              </div>
            </>
          )}

        </aside>

      </div>
    </main>
  );
}