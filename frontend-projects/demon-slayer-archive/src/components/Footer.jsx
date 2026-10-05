import { NavLink } from "react-router-dom";
import {
  Sword,
  Skull,
  Wind,
  Droplets,
} from "lucide-react";

import "./Footer.css";

function Footer() {
  return (
    <footer className="archive-footer">

      <div className="archive-footer__glow archive-footer__glow--left" />
      <div className="archive-footer__glow archive-footer__glow--right" />

      <div className="archive-footer__inner">

        {/* BRAND */}

        <div className="archive-footer__brand">

          <div className="archive-footer__logo">

            <span className="archive-footer__logo-mark">
              <Sword size={18} />
            </span>

            <div>
              <strong>
                KIMETSU ARCHIVE
              </strong>

              <span>
                DEMON SLAYER DATABASE
              </span>
            </div>

          </div>

          <p>
            A connected archive exploring Demon Slayers,
            demons, Breathing Styles, Blood Demon Arts
            and their techniques.
          </p>

        </div>

        {/* NAVIGATION */}

        <div className="archive-footer__section">

          <span className="archive-footer__heading">
            ARCHIVE
          </span>

          <nav className="archive-footer__links">

            <NavLink to="/slayers">
              <Sword size={13} />
              <span>Demon Slayers</span>
            </NavLink>

            <NavLink to="/demons">
              <Skull size={13} />
              <span>Demons</span>
            </NavLink>

            <NavLink to="/breathing">
              <Wind size={13} />
              <span>Breathing Styles</span>
            </NavLink>

            <NavLink to="/blood-arts">
              <Droplets size={13} />
              <span>Blood Demon Arts</span>
            </NavLink>

          </nav>

        </div>

        {/* PROJECT */}

        <div className="archive-footer__section">

          <span className="archive-footer__heading">
            PROJECT
          </span>

          <div className="archive-footer__project-links">

            <NavLink to="/">
              Home
            </NavLink>

          </div>

        </div>

      </div>

      {/* BOTTOM */}

      <div className="archive-footer__bottom">

        <div className="archive-footer__bottom-left">

          <span>
            © 2026 KIMETSU ARCHIVE
          </span>

          <span className="archive-footer__dot">
            •
          </span>

          <span>
            FRONTEND PORTFOLIO PROJECT
          </span>

        </div>

        <p>
          Fan-made project. Demon Slayer: Kimetsu no Yaiba
          belongs to its respective copyright holders.
        </p>

      </div>

    </footer>
  );
}

export default Footer;