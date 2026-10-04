# Game Vault

Game Vault is a frontend gaming library application built with React and Vite.

The project is designed as a desktop game launcher interface inspired by modern game platforms. It includes a game library, dedicated play pages, a store, community pages, user profile UI, favorites, achievements, playtime information, and locally stored dummy game data.

No external game API is required. The application uses local JSON data and Axios to simulate API requests.

## Features

- Game library with selectable games
- Favorites section
- Search functionality
- Dedicated game details view
- Individual play pages
- Simulated game launching screen
- Achievement progress
- Friends activity UI
- Game add-ons and update information
- Store page
- Community page
- Home dashboard
- Responsive navigation
- User profile and avatar
- React Router navigation
- Local JSON data fetched with Axios
- Responsive dark gaming interface

## Tech Stack

- React
- Vite
- JavaScript
- React Router
- Axios
- Lucide React
- CSS
- Local JSON data

## Project Structure

game-vault/
├── public/
│   ├── data/
│   │   └── games.json
│   │
│   └── images/
│       ├── avatar.png
│       │
│       └── games/
│           ├── neon-drift.png
│           ├── achen-crown.png
│           ├── void-harvest.png
│           ├── scyforce.png
│           ├── moonlit-vale.png
│           └── rift-raiders.png
│
├── src/
│   ├── components/
│   │   ├── Footer.jsx
│   │   ├── GameDetails.jsx
│   │   ├── GameListItem.jsx
│   │   ├── Navbar.jsx
│   │   └── Sidebar.jsx
│   │
│   ├── pages/
│   │   ├── CommunityPage.jsx
│   │   ├── HomePage.jsx
│   │   ├── PlayPage.jsx
│   │   ├── PlayPageWrapper.jsx
│   │   └── StorePage.jsx
│   │
│   ├── services/
│   │   └── gameService.js
│   │
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
│
├── package.json
└── vite.config.js

## Installation

Clone the repository:

git clone <your-repository-url>

Enter the project directory:

cd game-vault

Install dependencies:

npm install

Start the development server:

npm run dev

Vite will display the local development URL in the terminal.

## Dependencies

The project uses the following main dependencies:

npm install axios react-router-dom lucide-react

## Local Data

Game data is stored inside:

public/data/games.json

The application fetches this file using Axios:

import axios from "axios";

export const getGames = async () => {
  const response = await axios.get("/data/games.json");

  return response.data;
};

This allows the frontend to behave similarly to an application consuming a real REST API while remaining completely frontend-only.

## Routing

The application uses React Router.

Main routes:

/                  Home
/store             Store
/community         Community
/library           Game Library
/play/:gameId      Individual game play page

Routing is configured in main.jsx.

## Game Images

Game artwork is stored locally in:

public/images/games/

Each game object in games.json references its image using a public path:

{
  "title": "Neon Drift",
  "image": "/images/games/neon-drift.png"
}

Because Vite serves everything inside public from the root URL, /public should not be included in image paths.

## Example Game Data

{
  "id": 1,
  "title": "Neon Drift",
  "genre": ["Racing", "Arcade"],
  "platforms": ["PC", "PlayStation", "Xbox"],
  "rating": 9.1,
  "releaseYear": 2025,
  "developer": "Voltage Street Studios",
  "favorite": true,
  "status": "Installed",
  "playTime": "18 h 42 min",
  "lastPlayed": "Today",
  "image": "/images/games/neon-drift.png",
  "description": "A high-speed futuristic street racing game set in a neon megacity.",
  "achievements": {
    "unlocked": 46,
    "total": 78
  }
}

## Pages

### Home

The home page acts as the main launcher dashboard and includes featured games and recently played titles.

### Library

The library contains:

- Favorites
- All games
- Search
- Selected game details
- Playtime
- Updates
- Add-ons
- Friends activity
- Achievements

### Play Page

Each game has its own route:

/play/:gameId

The play page displays game information and includes a simulated launch process.

### Store

The store displays available games in a browsable layout with search and purchase-style controls.

### Community

The community page contains mock player posts, activity, likes, comments, and online friends.

## Design

Game Vault uses a dark blue gaming launcher aesthetic with:

- Compact desktop-style navigation
- Game artwork
- Dark panels
- Blue accent colors
- Achievement cards
- Friend avatars
- Responsive layouts
- Gaming-focused UI elements

## Notes

This project currently uses dummy data and does not include a backend, authentication system, real payments, or actual game launching functionality.

The goal of the project is to practice frontend development concepts such as:

- Component architecture
- React state
- Routing
- Reusable UI
- Asynchronous data fetching
- Filtering
- Responsive design
- Application-style layouts

## Future Improvements

Possible additions include:

- Working favorite toggles
- Persistent favorites with localStorage
- Cart functionality
- Game filters and sorting
- Grid/list switching
- User authentication
- Reviews
- Notifications
- Profile customization
- Backend integration
- Real database storage

## License

This project is intended for learning and portfolio purposes.