import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import App from "./App";

import HomePage from "./pages/HomePage";
import StorePage from "./pages/StorePage";
import CommunityPage from "./pages/CommunityPage";
import PlayPageWrapper from "./pages/PlayPageWrapper";

import Footer from "./components/Footer";

import "./index.css";

export function Root() {
  return (
    <BrowserRouter>
      <div className="root-layout">
        <div className="root-layout__content">
          <Routes>
            <Route
              path="/"
              element={<HomePage />}
            />

            <Route
              path="/library"
              element={<App />}
            />

            <Route
              path="/store"
              element={<StorePage />}
            />

            <Route
              path="/community"
              element={<CommunityPage />}
            />

            <Route
              path="/play/:gameId"
              element={<PlayPageWrapper />}
            />
          </Routes>
        </div>

        <Footer />
      </div>
    </BrowserRouter>
  );
}

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <Root />
  </StrictMode>
);