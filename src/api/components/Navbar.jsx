import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="flex justify-between items-center px-8 py-4 bg-white shadow mb-8">
      <div className="text-xl font-bold text-purple-700">
        <Link to="/">Inicio</Link>
      </div>

      <div className="flex gap-6">
        {isAuthenticated ? (
          <>
            <Link to="/usuarios" className="text-purple-700 hover:underline">
              Usuarios
            </Link>
            <button
              onClick={handleLogout}
              className="text-red-600 hover:underline"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <Link to="/login" className="text-purple-700 hover:underline">
              Iniciar sesión
            </Link>
            <Link to="/registro" className="text-purple-700 hover:underline">
              Registrarse
            </Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
