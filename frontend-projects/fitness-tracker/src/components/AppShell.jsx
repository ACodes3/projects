import {
  Dumbbell,
  LayoutDashboard,
  Utensils,
  TrendingUp,
  Library,
  Settings,
  Activity,
} from 'lucide-react';

import {
  NavLink,
  Outlet,
} from 'react-router-dom';

import './AppShell.css';

const navigation = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
  },
  {
    label: 'Workouts',
    path: '/workouts',
    icon: Dumbbell,
  },
  {
    label: 'Nutrition',
    path: '/nutrition',
    icon: Utensils,
  },
  {
    label: 'Progress',
    path: '/progress',
    icon: TrendingUp,
  },
  {
    label: 'Library',
    path: '/library',
    icon: Library,
  },
];

function AppShell() {
  return (
    <div className="app-shell">

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside className="app-shell__sidebar">

        <div className="app-shell__brand">

          <div className="app-shell__brand-icon">
            <Activity size={19} />
          </div>

          <div>
            <strong>
              FORGE
            </strong>

            <span>
              Training & Nutrition
            </span>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="app-shell__navigation">

          <span className="app-shell__nav-label">
            Overview
          </span>

          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  isActive
                    ? 'app-shell__nav-item app-shell__nav-item--active'
                    : 'app-shell__nav-item'
                }
              >
                <Icon size={17} />

                <span>
                  {item.label}
                </span>
              </NavLink>
            );
          })}

        </nav>

        {/* BOTTOM */}

        <div className="app-shell__sidebar-bottom">

          <NavLink
            to="/settings"
            className={({ isActive }) =>
              isActive
                ? 'app-shell__nav-item app-shell__nav-item--active'
                : 'app-shell__nav-item'
            }
          >
            <Settings size={17} />

            <span>
              Settings
            </span>
          </NavLink>

          <div className="app-shell__profile">

            <div className="app-shell__profile-avatar">
              Y
            </div>

            <div>
              <strong>
                Your Profile
              </strong>

              <span>
                Personal Tracker
              </span>
            </div>

          </div>

        </div>

      </aside>

      {/* =====================================
          MAIN AREA
      ===================================== */}

      <div className="app-shell__main">

        <header className="app-shell__topbar">

          <div>

            <span>
              Personal Fitness
            </span>

            <strong>
              Training Dashboard
            </strong>

          </div>

          <div className="app-shell__status">

            <span className="app-shell__status-dot" />

            Data saved locally

          </div>

        </header>

        <div className="app-shell__content">

          <Outlet />

        </div>

      </div>

    </div>
  );
}

export default AppShell;