import {
  LayoutDashboard,
  Crown,
  Castle,
  Map,
  Users,
  FileText,
  Gem,
  Archive,
  Settings,
  Snowflake,
} from 'lucide-react';

import { NavLink, Outlet } from 'react-router-dom';

import './AppShell.css';

const navigation = [
  {
    label: 'Imperial Command',
    path: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'The Tsaritsa',
    path: '/tsaritsa',
    icon: Crown,
  },
  {
    label: 'Palace',
    path: '/palace',
    icon: Castle,
  },
  {
    label: 'War Table',
    path: '/war-table',
    icon: Map,
  },
  {
    label: 'Harbingers',
    path: '/harbingers',
    icon: Users,
  },
  {
    label: 'Intelligence',
    path: '/intelligence',
    icon: FileText,
  },
  {
    label: 'Project: Gnoses',
    path: '/gnoses',
    icon: Gem,
  },
  {
    label: 'Relic Vault',
    path: '/relic-vault',
    icon: Archive,
  },
];

function AppShell() {
  return (
    <div className="app-shell">

      <aside className="app-shell__sidebar">

        <div className="app-shell__brand">
          <Snowflake size={28} strokeWidth={1.3} />

          <div>
            <strong>Crown of Winter</strong>
            <span>Winter Palace</span>
          </div>
        </div>

        <nav className="app-shell__nav">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `app-shell__nav-item ${
                    isActive
                      ? 'app-shell__nav-item--active'
                      : ''
                  }`
                }
              >
                <Icon size={17} strokeWidth={1.4} />

                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="app-shell__sidebar-bottom">
          <NavLink
            to="/system"
            className={({ isActive }) =>
              `app-shell__nav-item ${
                isActive
                  ? 'app-shell__nav-item--active'
                  : ''
              }`
            }
          >
            <Settings size={17} strokeWidth={1.4} />

            <span>System</span>
          </NavLink>
        </div>

      </aside>

      <section className="app-shell__main">

        <header className="app-shell__topbar">

          <div>
            <span className="app-shell__topbar-label">
              Imperial Network
            </span>

            <strong>
              Winter Palace Command
            </strong>
          </div>

          <div className="app-shell__status">
            <span className="app-shell__status-dot" />

            Cryo Network // Online
          </div>

        </header>

        <div className="app-shell__content">
          <Outlet />
        </div>

      </section>

    </div>
  );
}

export default AppShell;