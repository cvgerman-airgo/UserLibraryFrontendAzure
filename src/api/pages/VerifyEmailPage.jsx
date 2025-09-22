import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import AuthService from '../AuthService';

const VerifyEmailPage = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('🔄 Verificando correo electrónico...');
  const [errorDetails, setErrorDetails] = useState('');
  const [isDone, setIsDone] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const token = searchParams.get('token');
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setStatus('❌ Token de verificación no encontrado');
      setErrorDetails('La URL de verificación no contiene un token válido. Por favor, revisa el enlace en tu correo electrónico.');
      setIsDone(true);
      setIsSuccess(false);
      return;
    }

    // Validar formato básico del token
    if (token.length < 10) {
      setStatus('❌ Token inválido');
      setErrorDetails('El token proporcionado no tiene el formato correcto.');
      setIsDone(true);
      setIsSuccess(false);
      return;
    }

    console.log('Iniciando verificación de email con token:', token);

    AuthService.verifyEmail(token)
      .then((response) => {
        console.log('Verificación exitosa:', response);
        setStatus('✅ ¡Correo electrónico verificado con éxito!');
        setErrorDetails('Tu cuenta ha sido activada. Ahora puedes iniciar sesión.');
        setIsSuccess(true);
      })
      .catch((error) => {
        console.error('Error en verificación de email:', error);
        
        let errorMessage = '❌ Error en la verificación';
        let details = '';

        if (error.response) {
          // El servidor respondió con un código de estado de error
          const status = error.response.status;
          const data = error.response.data;

          switch (status) {
            case 400:
              errorMessage = '❌ Token inválido o malformado';
              details = 'El token de verificación no es válido. Por favor, solicita un nuevo enlace de verificación.';
              break;
            case 404:
              errorMessage = '❌ Token no encontrado';
              details = 'El token de verificación no existe o ya fue utilizado.';
              break;
            case 410:
              errorMessage = '❌ Token expirado';
              details = 'El token de verificación ha expirado. Por favor, solicita un nuevo enlace de verificación.';
              break;
            case 500:
              errorMessage = '❌ Error del servidor';
              details = 'Ocurrió un error interno del servidor. Por favor, inténtalo más tarde o contacta al soporte.';
              break;
            default:
              errorMessage = `❌ Error ${status}`;
              details = data?.message || 'Ocurrió un error inesperado durante la verificación.';
          }
        } else if (error.request) {
          // No se recibió respuesta del servidor
          errorMessage = '❌ Error de conexión';
          details = 'No se pudo conectar con el servidor. Verifica tu conexión a internet e inténtalo nuevamente.';
        } else {
          // Error en la configuración de la petición
          errorMessage = '❌ Error de configuración';
          details = 'Ocurrió un error inesperado. Por favor, inténtalo más tarde.';
        }

        setStatus(errorMessage);
        setErrorDetails(details);
        setIsSuccess(false);
      })
      .finally(() => {
        setIsDone(true);
      });
  }, [token]);

  const handleAccept = () => {
    navigate('/login');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-green-100 to-blue-200">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-lg text-center">
        <h2 className="text-2xl font-bold mb-6 text-blue-700">Verificación de Correo</h2>
        
        {/* Estado principal */}
        <div className="mb-4">
          <p className={`text-lg font-semibold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
            {status}
          </p>
        </div>

        {/* Detalles del error o éxito */}
        {errorDetails && (
          <div className={`mb-6 p-4 rounded-lg ${isSuccess ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
            <p className={`text-sm ${isSuccess ? 'text-green-700' : 'text-red-700'}`}>
              {errorDetails}
            </p>
          </div>
        )}

        {/* Información del token (solo para debugging, se puede quitar en producción) */}
        {token && (
          <div className="mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
            <p className="text-xs text-gray-600">
              Token: <span className="font-mono">{token.substring(0, 20)}...</span>
            </p>
          </div>
        )}

        {/* Botones de acción */}
        {isDone && (
          <div className="space-y-3">
            <button
              onClick={handleAccept}
              className={`w-full font-bold py-2 px-4 rounded transition ${
                isSuccess 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {isSuccess ? 'Ir al Login' : 'Continuar'}
            </button>
            
            {!isSuccess && (
              <button
                onClick={handleRetry}
                className="w-full bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition"
              >
                Intentar nuevamente
              </button>
            )}
          </div>
        )}

        {/* Indicador de carga */}
        {!isDone && (
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmailPage;
