import React from 'react';
import { Link } from 'react-router-dom';
import booksIcon from '../../assets/Books-2-icon.png';

const HomePage = () => (
  <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
    <div className="bg-white rounded-lg shadow-lg p-10 text-center">
      <img
        src={booksIcon}
        alt="Icono de libros UserLibrary"
        className="mx-auto mb-6 w-28 h-28 drop-shadow-lg animate-fade-in"
        style={{ filter: 'drop-shadow(0 4px 16px rgba(80, 0, 120, 0.15))' }}
      />
      <h1 className="text-5xl font-extrabold mb-4 text-purple-800 tracking-tight">
        Bienvenido a <span className="text-purple-600">UserLibrary</span>
      </h1>
      <p className="mb-8 text-gray-700 text-lg">
        Gestiona tu biblioteca personal de forma sencilla y visual.
      </p>
      <Link
        to="/login"
        className="bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-bold py-3 px-10 rounded-full shadow-md transition-all duration-200"
      >
        Iniciar sesión
      </Link>
      <div className="mt-6">
        <Link
          to="/register"
          className="text-blue-600 hover:underline text-lg font-semibold"
        >
          ¿No tienes cuenta? Regístrate aquí
        </Link>
      </div>
    </div>
  </div>
);

export default HomePage;