import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, links, onLogout }) {
  const { pathname } = useLocation();

  return (
    <header className="nav">
      <div className="nav__brand">
        <div className="nav__logo">SG</div>
        <div>
          <div className="nav__title">SerenGuard</div>
          <div className="nav__subtitle">Maritime Surveillance</div>
        </div>
      </div>
      <nav className="nav__links">
        {links.map((link) => (
          <Link
            key={link.to}
            to={link.to}
            className={`nav__link ${pathname === link.to ? 'is-active' : ''}`}
          >
            {link.label}
          </Link>
        ))}
      </nav>
      <div className="nav__profile">
        <div className="nav__role">{user?.role || 'Guest'}</div>
        <div className="nav__name">{user?.name || user?.username}</div>
        <button className="nav__logout" onClick={onLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

export default Navbar;
