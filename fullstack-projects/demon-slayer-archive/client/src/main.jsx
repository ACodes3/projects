import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import App from "./App";

import HomePage from "./pages/HomePage";

import SlayersPage from "./pages/SlayersPage";
import SlayerDetailsPage from "./pages/SlayerDetailsPage";

import DemonsPage from "./pages/DemonsPage";
import DemonDetailsPage from "./pages/DemonDetailsPage";

import BreathingStylesPage from "./pages/BreathingStylesPage";
import BreathingStyleDetailsPage from "./pages/BreathingStyleDetailsPage";

import BloodDemonArtsPage from "./pages/BloodDemonArtsPage";
import BloodDemonArtDetailsPage from "./pages/BloodDemonArtDetailsPage";

import TechniqueDetailsPage from "./pages/TechniqueDetailsPage";

import "./index.css";

createRoot(
  document.getElementById("root")
).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />}>
          <Route index element={<HomePage />} />

          <Route
            path="slayers"
            element={<SlayersPage />}
          />

          <Route
            path="slayers/:id"
            element={<SlayerDetailsPage />}
          />

          <Route
            path="demons"
            element={<DemonsPage />}
          />

          <Route
            path="demons/:id"
            element={<DemonDetailsPage />}
          />

          <Route
            path="breathing"
            element={<BreathingStylesPage />}
          />

          <Route
            path="breathing/:id"
            element={<BreathingStyleDetailsPage />}
          />

          <Route
            path="blood-arts"
            element={<BloodDemonArtsPage />}
          />

          <Route
            path="blood-arts/:id"
            element={<BloodDemonArtDetailsPage />}
          />

          <Route
            path="techniques/:id"
            element={<TechniqueDetailsPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);