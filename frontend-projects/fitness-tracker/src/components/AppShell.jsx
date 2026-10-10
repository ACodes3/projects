import {
  Activity,
  CalendarDays,
  Dumbbell,
  LayoutDashboard,
  Library,
  Settings,
  TrendingUp,
  UserRound,
  Utensils,
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
    label: 'Calendar',
    path: '/calendar',
    icon: CalendarDays,
  },
  {
    label: 'Progress',
    path: '/progress',
    icon: TrendingUp,
  },
  {
    label: 'Exercise Library',
    path: '/library',
    icon: Library,
  },
  {
    label: 'Profile',
    path: '/profile',
    icon: UserRound,
  },
];

export default function AppShell() {
  return (
    <div className="app-shell">

      {/* =====================================
          SIDEBAR
      ===================================== */}

      <aside className="app-shell__sidebar">

        {/* BRAND */}

        <div className="app-shell__brand">

          <div className="app-shell__brand-icon">
            <Activity size={20} />
          </div>

          <div className="app-shell__brand-text">
            <strong>FORGE</strong>
            <span>Training & Nutrition</span>
          </div>

        </div>

        {/* NAVIGATION */}

        <nav className="app-shell__nav">

          <span className="app-shell__nav-label">
            Overview
          </span>

          <div className="app-shell__nav-list">

            {navigation.map(
              ({
                label,
                path,
                icon: Icon,
              }) => (

                <NavLink
                  key={path}
                  to={path}
                  end={path === '/'}
                  className={({
                    isActive,
                  }) =>
                    [
                      'app-shell__nav-link',
                      isActive
                        ? 'app-shell__nav-link--active'
                        : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                  }
                >
                  <Icon
                    size={18}
                    strokeWidth={1.8}
                  />

                  <span>
                    {label}
                  </span>
                </NavLink>

              ),
            )}

          </div>

        </nav>

        {/* SETTINGS */}

        <div className="app-shell__sidebar-bottom">

          <NavLink
            to="/settings"
            className={({
              isActive,
            }) =>
              [
                'app-shell__nav-link',
                isActive
                  ? 'app-shell__nav-link--active'
                  : '',
              ]
                .filter(Boolean)
                .join(' ')
            }
          >
            <Settings
              size={18}
              strokeWidth={1.8}
            />

            <span>
              Settings
            </span>
          </NavLink>

        </div>

      </aside>

      {/* =====================================
          MAIN
      ===================================== */}

      <div className="app-shell__main">

        {/* TOPBAR */}

        <header className="app-shell__topbar">

          <div className="app-shell__topbar-left">

            <span className="app-shell__status-dot" />

            <span>
              FORGE Tracker
            </span>

          </div>

          <NavLink
            to="/profile"
            className="app-shell__profile-link"
          >

            <div className="app-shell__profile-icon">
              <UserRound size={16} />
            </div>

            <span>
              Profile
            </span>

          </NavLink>

        </header>

        {/* PAGE CONTENT */}

        <div className="app-shell__content">
          <Outlet />
        </div>

      </div>

    </div>
  );
}