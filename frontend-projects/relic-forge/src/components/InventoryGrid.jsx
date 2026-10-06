import {
  Backpack,
  Search,
  SlidersHorizontal,
  ArrowDownUp,
  GripVertical
} from "lucide-react";

import InventoryItem from "./InventoryItem";

import {
  getItemRarity
} from "../utils/inventoryHelpers";

const CATEGORIES = [
  { id: "all", label: "All Items" },
  { id: "weapon", label: "Weapons" },
  { id: "armor", label: "Armor" },
  { id: "accessory", label: "Accessories" }
];

function InventoryGrid({
  items,
  totalItems,
  rarities,
  filters,
  onFilterChange,
  selectedId,
  draggedId,
  onSelectItem,
  onEquipItem,
  onDragStart,
  onDragEnd,
  onDropToBackpack
}) {
  return (
    <section className="forge-panel forge-panel--inventory">
      <div className="forge-panel__heading">
        <div>
          <p>02 / COLLECTION</p>
          <h2>Backpack</h2>
        </div>

        <div className="inventory-capacity">
          <Backpack size={16} />
          <span>{totalItems} ITEMS</span>
        </div>
      </div>

      <div className="inventory-toolbar">
        <label className="inventory-search">
          <Search size={17} />

          <input
            type="search"
            value={filters.search}
            onChange={(event) => {
              onFilterChange("search", event.target.value);
            }}
            placeholder="Search your inventory..."
          />
        </label>
      </div>

      <div className="inventory-categories">
        {CATEGORIES.map((category) => (
          <button
            key={category.id}
            type="button"
            className={
              filters.category === category.id
                ? "active"
                : ""
            }
            onClick={() => {
              onFilterChange("category", category.id);
            }}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="inventory-filters">
        <div className="inventory-filters__label">
          <SlidersHorizontal size={15} />
          <span>FILTER & SORT</span>
        </div>

        <div className="inventory-filters__controls">
          <select
            value={filters.rarity}
            onChange={(event) => {
              onFilterChange("rarity", event.target.value);
            }}
            aria-label="Filter by rarity"
          >
            <option value="all">All Rarities</option>

            {rarities.map((rarity) => (
              <option
                key={rarity.id}
                value={rarity.id}
              >
                {rarity.name}
              </option>
            ))}
          </select>

          <label className="inventory-sort">
            <ArrowDownUp size={13} />

            <select
              value={filters.sortBy}
              onChange={(event) => {
                onFilterChange("sortBy", event.target.value);
              }}
              aria-label="Sort inventory"
            >
              <option value="rarity">Rarity</option>
              <option value="level">Level</option>
              <option value="name">Name</option>
            </select>
          </label>
        </div>
      </div>

      <div
        className="inventory-grid"
        onDragOver={(event) => {
          event.preventDefault();
          event.dataTransfer.dropEffect = "move";
        }}
        onDrop={onDropToBackpack}
        aria-label="Backpack inventory drop area"
      >
        {items.length > 0 ? (
          items.map((item) => {
            const rarity = getItemRarity(
              item,
              rarities
            );

            return (
              <InventoryItem
                key={item.id}
                item={item}
                rarity={rarity}
                selected={selectedId === item.id}
                dragging={draggedId === item.id}
                onSelect={onSelectItem}
                onEquip={onEquipItem}
                onDragStart={onDragStart}
                onDragEnd={onDragEnd}
              />
            );
          })
        ) : (
          <div className="inventory-empty">
            <Backpack size={34} />

            <strong>No matching items</strong>

            <span>
              Change your filters or unequip an item
              to see it here.
            </span>
          </div>
        )}
      </div>

      <div className="inventory-footer">
        <span>
          SHOWING {items.length} OF {totalItems} ITEMS
        </span>

        <span>
          <GripVertical size={13} />
          DRAG TO EQUIP
        </span>
      </div>
    </section>
  );
}

export default InventoryGrid;