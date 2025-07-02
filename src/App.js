import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import BookDetailPage from "./api/pages/BookDetailPage";
import ForgotPasswordPage from './api/pages/ForgotPasswordPage';
import ResetPasswordPage from './api/pages/ResetPasswordPage';

import HomePage from './api/pages/HomePage';
import LoginPage from './api/pages/LoginPage';
import UsersPage from './api/pages/UsersPage';
import UserBooksPage from './api/pages/UserBooksPage';
import Navbar from './api/components/Navbar';
import VerifyEmailPage from './api/pages/VerifyEmailPage';
import { useAuth } from "./hooks/useAuth";
import RegisterPage from './api/pages/RegisterPage';

function App() {
  const isLoggedIn = !!localStorage.getItem("token");
  const { isAuthenticated } = useAuth();
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/registro" element={<RegisterPage />} />
        <Route path="/" element={<HomePage />} />
        <Route path="/olvide" 
            element={<ForgotPasswordPage />} />
        <Route path="/reset-password" 
            element={<ResetPasswordPage />} />
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/mis-libros" /> : <LoginPage />}
        />
        <Route
          path="/usuarios"
          element={isLoggedIn ? <UsersPage /> : <Navigate to="/login" />}
        />
        <Route
          path="/mis-libros"
          element={isLoggedIn ? <UserBooksPage /> : <Navigate to="/login" />}
        />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        {/* Ruta por defecto */}
        <Route path="*" element={<Navigate to="/" />} />
        <Route
          path="/mis-libros/:id"
          element={isLoggedIn ? <BookDetailPage /> : <Navigate to="/login" />}
        />
      </Routes>
    </Router>
  );
}

export default App;