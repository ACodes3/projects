# Relic Forge

**Relic Forge** is a fantasy RPG-inspired **frontend portfolio prototype** built with React and Vite. It presents a connected character-management interface with an armory, equipment and inventory management, skill progression, a world map, quests, an in-game codex, and system settings.

The project focuses on interactive UI design, reusable components, data-driven views, client-side state, and local persistence. It is **not a complete playable RPG** and does not have a backend or user-account service.

## Tech Stack

- **React 19** and **React DOM 19** — component-based interface
- **Vite 8** — development server and production build
- **JavaScript / JSX** — application logic
- **Lucide React** — interface icons
- **CSS** — responsive layouts, visual styling, and page-specific components
- **Static JSON** — game content from `public/data/`
- **Browser `localStorage`** — selected player-state persistence

`react-router-dom` is listed as a dependency, but the current application navigates mainly through the `activeTab` state in `src/App.jsx`, rather than URL-based page routes.

## Features

### Armory and Inventory

- Armory overview with character and equipment information
- Inventory browsing, search, category and rarity filters, and sorting
- Item details, comparison against currently equipped gear, and rarity display
- Equip and unequip items through equipment slots
- Favorite items and dismantle eligible items for salvage
- Character-stat calculations based on equipment

### Character and Progression

- Character overview with statistics and equipment
- Data-driven skill trees with unlock conditions, required levels, ranks, and available points
- Skill-rank changes saved locally in the browser

### World and Reference Pages

- Interactive map interface populated by static map data
- Quest journal with status-based filtering and quest information
- Codex interface populated by structured JSON content
- System settings, including interface preferences and a local-data reset option

Some interfaces are **simulations using predefined data**. This project does not implement online gameplay, a live quest server, authentication, or multiplayer synchronization.

## Running Locally

**Requirements:** Node.js and npm compatible with Vite 8 (use a recent supported Node.js version).

```bash
# From the relic-forge project directory
npm install
npm run dev
```

Open the local address printed by Vite (commonly `http://localhost:5173`).

Other available scripts:

```bash
npm run build    # Create a production build in dist/
npm run preview  # Preview that build locally
npm run lint     # Run ESLint
```

There is no database to create, `.env` file required for the supplied demo data, or API server to start.

## Project Structure

```text
relic-forge/
├── public/
│   ├── data/              # Characters, items, slots, rarities, skills,
│   │                      # quests, codex and map data in JSON
│   └── images/            # Character, item, equipment and map artwork
├── src/
│   ├── components/        # Shared equipment, inventory and layout UI
│   ├── pages/             # Armory, Character, Skills, Map, Quests,
│   │                      # Codex and System views
│   ├── services/
│   │   └── dataService.js  # Loads core static JSON data
│   ├── utils/
│   │   └── inventoryHelpers.js
│   ├── App.jsx            # Application state and tab navigation
│   ├── index.css
│   └── main.jsx
├── package.json
└── vite.config.js
```

## Data and Persistence

The application reads its base content from files in `public/data/`. The main data service fetches `items.json`, `equipmentSlots.json`, `rarities.json`, and `characters.json`. Individual pages load additional data such as `skills.json` and `quests.json`.

Inventory/equipment changes, favorites, salvage, skill ranks, and selected settings use browser `localStorage`. They are local to the browser/profile, not shared between devices. Clearing site storage or using the application's reset option can remove this saved demo state.

To edit content, update the relevant JSON file and check that its identifiers and relationships match any objects that refer to it.

## Scope and Limitations

Relic Forge is a **frontend UI and state-management showcase**. It has no persistent server database, production authentication, external game API, or fully implemented gameplay loop. The supplied character and content are demonstrations, and the artwork's provenance and reuse rights should be verified before any redistribution beyond the portfolio repository.

## Copyright and Third-Party Materials

Copyright © 2026 **ACodes3**. All rights reserved in original contributions owned by the author.

The original code is published for portfolio and technical review. No general license to copy, modify, redistribute, or commercially reuse the author's original work is granted, except as permitted by law or separately authorized. This repository is not presented as an open-source software release.

Third-party libraries, fonts, icons, artwork, names, and other externally sourced content remain subject to their respective owners' rights and licenses. This notice does not assert ownership over those materials.

## Author

[ACodes3 on GitHub](https://github.com/ACodes3)