import React, { useState } from "react";
import AuthService from "../AuthService";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Email enviado al backend:", email); // 👈 Aquí
    try {
      await AuthService.forgotPassword({ email });
      setMessage("Si el correo está registrado, se enviará un enlace para restablecer la contraseña.");
    } catch (error) {
      setMessage("Ocurrió un error al procesar la solicitud.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-6 border rounded shadow">
      <h2 className="text-xl font-bold mb-4">¿Olvidaste tu contraseña?</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="email"
          placeholder="Tu correo electrónico"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="w-full mb-4 px-4 py-2 border rounded"
        />
        <button
          type="submit"
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded"
        >
          Enviar enlace de recuperación
        </button>
      </form>
      {message && <p className="mt-4 text-center">{message}</p>}
    </div>
  );
};

export default ForgotPasswordPage;
