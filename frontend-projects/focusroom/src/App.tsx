import { Routes, Route, Navigate } from "react-router";

import AppLayout from "./components/layout/AppLayout";
import FocusPage from "./features/focus/FocusPage";

type PlaceholderPageProps = {
  title: string;
  description: string;
};

function PlaceholderPage({ title, description }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-5xl">
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>

      <p className="mt-2 text-[#C9BDB8]">{description}</p>

      <div className="mt-10 rounded-3xl border border-[#4B4344] bg-[#2A2324] p-10 text-center">
        <p className="text-sm text-[#E06A6A]">Coming soon</p>

        <p className="mt-3 text-[#C9BDB8]">We're building this space.</p>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<FocusPage />} />

        <Route
          path="tasks"
          element={
            <PlaceholderPage
              title="Tasks"
              description="Organize your work and priorities."
            />
          }
        />

        <Route
          path="history"
          element={
            <PlaceholderPage
              title="Session History"
              description="Reflect on your completed focus sessions."
            />
          }
        />

        <Route
          path="settings"
          element={
            <PlaceholderPage
              title="Settings"
              description="Customize your Focusroom experience."
            />
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
