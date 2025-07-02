import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthService from '../AuthService';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Verificando...');
  const [isDone, setIsDone] = useState(false);
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      AuthService.verifyEmail(token)
        .then(() => {
          setStatus('✅ Correo electrónico verificado con éxito.');
        })
        .catch(() => {
          setStatus('❌ El token es inválido o ha expirado.');
        })
        .finally(() => {
          setIsDone(true);
        });
    } else {
      setStatus('❌ Token no proporcionado.');
      setIsDone(true);
    }
  }, [token]);

  const handleAccept = () => {
    navigate('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-blue-200">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md text-center">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Verificación de Correo</h2>
        <p className="mb-6 text-gray-700">{status}</p>
        {isDone && (
          <button
            onClick={handleAccept}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded transition"
          >
            Aceptar
          </button>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
