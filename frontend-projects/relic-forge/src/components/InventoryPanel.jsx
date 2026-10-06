
import { useState } from 'react';

import {
  Sword,
  Shield,
  CircleDot,
  FlaskConical,
  Package,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';

import ItemArtwork from './ItemArtwork';

const categories = [
  { id: 'all', label: 'All', icon: null },
  { id: 'weapon', label: 'Weapons', icon: Sword },
  { id: 'armor', label: 'Armor', icon: Shield },
  { id: 'accessory', label: 'Accessories', icon: CircleDot },
  { id: 'consumable', label: 'Consumables', icon: FlaskConical },
  { id: 'material', label: 'Materials', icon: Package },
];

export default function InventoryPanel({
  items,
  rarities,
  selectedId,
  filters,
  onFilterChange,
  onSelect,
  favorites,
  onFavorite,
  capacity,
}) {
  const [isSearching, setIsSearching] = useState(false);

  return (
    <section className="inventory-panel panel">

      {/* Inventory heading */}
      <div className="inventory-heading">
        <h2 className="panel-title">Inventory</h2>
        <span className="inventory-heading__ornament">✧</span>
      </div>

      {/* Filters */}
      <div className="inventory-filters">

        <div className="category-tabs">
          {categories.map((category) => {
            const Icon = category.icon;

            return (
              <button
                key={category.id}
                type="button"
                className={`category-tab ${
                  filters.category === category.id
                    ? 'category-tab--active'
                    : ''
                }`}
                title={category.label}
                aria-label={category.label}
                aria-pressed={filters.category === category.id}
                onClick={() =>
                  onFilterChange('category', category.id)
                }
              >
                {Icon ? (
                  <Icon size={15} strokeWidth={1.4} />
                ) : (
                  'All'
                )}
              </button>
            );
          })}
        </div>

        {/* Search toggle */}
        <button
          type="button"
          className={`icon-button ${
            isSearching ? 'icon-button--active' : ''
          }`}
          onClick={() => setIsSearching(!isSearching)}
          title="Search items"
          aria-label="Toggle inventory search"
        >
          <Search size={16} />
        </button>

        {/* Rarity filter */}
        <label className="rarity-select">
          <select
            value={filters.rarity}
            aria-label="Filter by rarity"
            onChange={(e) =>
              onFilterChange('rarity', e.target.value)
            }
          >
            <option value="all">All rarities</option>

            {rarities.map((rarity) => (
              <option key={rarity.id} value={rarity.id}>
                {rarity.name}
              </option>
            ))}
          </select>

          <ChevronDown size={13} />
        </label>
      </div>

      {/* Search field */}
      {isSearching && (
        <div className="inventory-search">
          <Search size={14} />

          <input
            type="text"
            placeholder="Search your inventory..."
            value={filters.search}
            onChange={(e) =>
              onFilterChange('search', e.target.value)
            }
          />

          <button
            type="button"
            aria-label="Clear search"
            onClick={() => onFilterChange('search', '')}
          >
            <X size={13} />
          </button>
        </div>
      )}

      {/* Inventory grid */}
      <div className="inventory-grid">
        {items.map((item) => {
          const rarity = rarities.find(
            (entry) => entry.id === item.rarityId
          );

          const isSelected = selectedId === item.id;
          const isFavorite = favorites.includes(item.id);

          const statValue =
            item.category === 'consumable'
              ? 10
              : item.category === 'material'
              ? 5
              : item.stats?.attack ||
                item.stats?.defense ||
                item.stats?.health ||
                item.stats?.crit ||
                0;

          return (
            <button
              key={item.id}
              type="button"
              className={`inventory-slot ${
                isSelected ? 'inventory-slot--selected' : ''
              }`}
              style={{
                '--item-accent': rarity?.color || '#8d8e87',
              }}
              title={`${item.name} - ${rarity?.name || 'Common'}`}
              onClick={() => onSelect(item.id)}
              onDoubleClick={() => onFavorite(item.id)}
            >

              {/* Item image */}
              <ItemArtwork item={item} />

              {/* Favorite indicator */}
              {isFavorite && (
                <span className="inventory-slot__favorite">
                  ◆
                </span>
              )}

              {/* Item stat */}
              <span className="inventory-slot__number">
                {statValue}
              </span>

            </button>
          );
        })}

        {/* Empty inventory */}
        {items.length === 0 && (
          <div className="inventory-empty">
            No items match your filters.
          </div>
        )}
      </div>

      {/* Inventory footer */}
      <div className="inventory-footer">
        <span>{capacity} / 100</span>

        <label className="sort-select">
          <select
            value={filters.sortBy}
            aria-label="Sort inventory"
            onChange={(e) =>
              onFilterChange('sortBy', e.target.value)
            }
          >
            <option value="rarity">Sort: Rarity</option>
            <option value="level">Sort: Level</option>
            <option value="name">Sort: Name</option>
          </select>

          <ChevronDown size={14} />
        </label>
      </div>

    </section>
  );
}
