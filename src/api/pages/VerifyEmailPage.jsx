//src/api/pages/VerifyEmailPage.jsx
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import AuthService from '../AuthService';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('Verificando...');
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      AuthService.verifyEmail(token)
        .then(() => setStatus('Correo electrónico verificado con éxito.'))
        .catch(() => setStatus('El token es inválido o expiró.'));
    } else {
      setStatus('Token no proporcionado.');
    }
  }, [token]);

  return (
    <div className="container">
      <h2>Verificación de Correo</h2>
      <p>{status}</p>
    </div>
  );
};

export default VerifyEmailPage;
