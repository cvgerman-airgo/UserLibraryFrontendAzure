import React from "react";
import { BrowserRouter, Routes, Route, Link, useNavigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import LoginPage from "./api/pages/LoginPage";
import UserBooksPage from "./api/pages/UserBooksPage";
import ToolsPage from "./api/pages/ToolsPage";
import BookDetailPage from "./api/pages/BookDetailPage";
import HomePage from "./api/pages/HomePage";
import RegisterPage from "./api/pages/RegisterPage";
import VerifyEmailPage from "./api/pages/VerifyEmailPage";

function App() {
  const { isAuthenticated, logout, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return null; // o puedes poner: return <div>Cargando...</div>;

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div>
      <header className="flex justify-between items-center p-4 bg-gray-100 border-b">
        <h1 className="text-lg font-bold">📚 Mi Biblioteca</h1>
        {isAuthenticated && (
          <nav className="flex gap-4 items-center">
            <Link to="/mis-libros" className="text-blue-600 hover:underline">
              Mis libros
            </Link>
            <Link to="/herramientas" className="text-blue-600 hover:underline">
              🛠 Herramientas
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-red-600 hover:underline"
            >
              Cerrar sesión
            </button>
          </nav>
        )}
      </header>

      <main className="p-4">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route path="/mis-libros" element={<UserBooksPage />} />
          <Route path="/herramientas" element={<ToolsPage />} />
          <Route path="/mis-libros/:id" element={<BookDetailPage />} />
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </main>
    </div>
  );
}

export default function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}
