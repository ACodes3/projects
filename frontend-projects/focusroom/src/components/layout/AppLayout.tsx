
import {
  Timer,
  ListTodo,
  History,
  Settings,
  Moon,
} from "lucide-react";

import { NavLink, Outlet } from "react-router";

const navigation = [
  { name: "Focus", path: "/", icon: Timer, end: true },
  { name: "Tasks", path: "/tasks", icon: ListTodo },
  { name: "History", path: "/history", icon: History },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-[#1E1919] text-[#F2ECE8] md:flex-row">

      {/* Sidebar */}
      <aside className="flex w-full flex-col border-b border-[#4B4344] bg-[#241F20] p-5 md:min-h-screen md:w-64 md:shrink-0 md:border-r md:border-b-0">

        {/* Brand */}
        <div className="mb-8 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#E06A6A]">
            <Moon size={23} className="text-[#241F20]" />
          </div>

          <div>
            <h1 className="text-xl font-bold tracking-tight">
              Focusroom
            </h1>
            <p className="text-xs text-[#9B8F8A]">
              Your deep work studio
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav
          aria-label="Main navigation"
          className="flex flex-wrap gap-2 md:flex-col"
        >
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#5B2F31] text-[#F07A79]"
                      : "text-[#C9BDB8] hover:bg-[#322B2C] hover:text-[#F2ECE8]"
                  }`
                }
              >
                <Icon size={19} strokeWidth={1.8} />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Sidebar footer */}
        <div className="mt-auto hidden pt-8 md:block">
          <div className="border-t border-[#4B4344] pt-5">
            <p className="text-xs text-[#9B8F8A]">
              Warm Nocturne
            </p>
            <p className="mt-1 text-xs text-[#756B67]">
              Focusroom Alpha v0.1.0
            </p>
          </div>
        </div>
      </aside>

      {/* Main application content */}
      <main className="min-w-0 flex-1 p-6 md:p-10">
        <Outlet />
      </main>

    </div>
  );
}
