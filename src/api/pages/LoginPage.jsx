import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthService from '../AuthService';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { login } = useAuth();
  

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
//      console.log('Enviando login:', { email, password });
      const res = await AuthService.login({ email, password });
      login(res.data.token); // Guarda el token en localStorage y contexto
      navigate('/mis-libros');
    } catch (err) {
      
setError(
  <>
    <strong>Error al conectar con el servidor:</strong> {err.message || err.toString()}
    {err.response && (
      <>
        <br />
        <strong>Status:</strong> {err.response.status}
        <br />
        <strong>Data:</strong> {JSON.stringify(err.response.data)}
      </>
    )}
    {err.request && (
      <>
        <br />
        <strong>Request:</strong> {JSON.stringify(err.request)}
      </>
    )}
  </>
);
    }
  };
  const handleLogin = async () => {
    setError("");
    try {
      const res = await AuthService.login(email, password);
      login(res.data.token); // ✅ guarda token + actualiza estado
      navigate("/mis-libros"); // ✅ redirige tras login
    } catch (err) {
      setError("Credenciales incorrectas");
    }
  };
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-100 to-purple-200">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-purple-700 text-center">Iniciar sesión</h2>
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <input
          type="email"
          placeholder="Correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-4 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
          required
        />
        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-6 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-purple-400"
          required
        />
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded transition"
        >
          Entrar
        </button>
         <p className="mt-4 text-center">
          <a href="/olvide" className="text-purple-600 hover:underline">
            ¿Olvidaste tu contraseña?
          </a>
        </p>
      </form>
    </div>
  );
};

export default LoginPage;