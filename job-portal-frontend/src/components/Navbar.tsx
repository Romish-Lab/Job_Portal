import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);

  // close the mobile menu whenever the page changes
  useEffect(() => {
    setOpen(false);
  }, [pathname]);
  // hide the header when scrolling down, show it again when scrolling up
  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y < 80)
        setHidden(false); // always show near the top
      else if (y > lastY + 5)
        setHidden(true); // scrolling down
      else if (y < lastY - 5) setHidden(false); // scrolling up
      lastY = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const roleLinks =
    user?.role === "employer"
      ? [
          { to: "/employer-dashboard", label: "Dashboard" },
          { to: "/my-jobs", label: "My postings" },
          { to: "/post-job", label: "Post a job" },
        ]
      : user?.role === "candidate"
        ? [{ to: "/my-applications", label: "My applications" }]
        : user?.role === "admin"
          ? [
              { to: "/admin/jobs", label: "Job approvals" },
              { to: "/admin/users", label: "Manage users" },
               { to: "/admin/messages", label: "Messages" },
            ]
          : [];

  return (
    <header
      className={`site-header${hidden && !open ? " site-header--hidden" : ""}`}
    >
      <div className="header-inner">
        <Link to="/" className="logo">
          <span className="logo-mark">T</span>
          <span className="logo-text">
            Trailhead <span>Jobs</span>
          </span>
        </Link>

        <button
          type="button"
          className="menu-toggle"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <span />
          <span />
          <span />
        </button>

        <div
          className={open ? "header-menu open" : "header-menu"}
          onClick={() => setOpen(false)}
        >
          <nav className="main-nav" aria-label="Main">
            <NavLink to="/" end>
              Search
            </NavLink>
            <NavLink to="/about">About Us</NavLink>
            <NavLink to="/services">Services</NavLink>
            <NavLink to="/help">Help</NavLink>
            <NavLink to="/blog">Blog</NavLink>
            <NavLink to="/contact">Contact Us</NavLink>
          </nav>

          <div className="header-actions">
            {roleLinks.map((l) => (
              <Link key={l.to} to={l.to} className="nav-role">
                {l.label}
              </Link>
            ))}

            {user ? (
              <>
                <span className="user-chip" title={user.role}>
                  <span className="user-avatar">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                  {user.name.split(" ")[0]}
                </span>
                <button
                  type="button"
                  className="btn-login"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-login">
                  Log In
                </Link>
                <Link to="/register" className="btn-signup">
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
