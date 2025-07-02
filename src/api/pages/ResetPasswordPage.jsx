import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import axiosClient from '../axiosClient';
import AuthService from '../AuthService';

function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await AuthService.resetPassword({ token, password });
      setMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
    } catch {
      setMessage('No se pudo restablecer la contraseña. Token inválido o expirado.');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow-md rounded">
      <h2 className="text-2xl font-bold mb-4">Restablecer contraseña</h2>
      <form onSubmit={handleReset}>
        <input
          type="password"
          placeholder="Nueva contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border rounded mb-4"
          required
        />
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition"
        >
          Guardar contraseña
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
}
export default ResetPasswordPage;

