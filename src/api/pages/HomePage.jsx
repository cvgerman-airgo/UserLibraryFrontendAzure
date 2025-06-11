import React from 'react';
import { Link } from 'react-router-dom';

const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
    <div className="bg-white rounded-lg shadow-lg p-10 text-center">
      <h1 className="text-4xl font-extrabold mb-4 text-purple-700">Bienvenido a UserLibrary 📚</h1>
      <p className="mb-8 text-gray-600">Gestiona tus libros y usuarios de forma sencilla y visual.</p>
      <Link
        to="/login"
        className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-full transition"
      >
        Iniciar sesión
      </Link>
    </div>
  </div>
);

export default HomePage;