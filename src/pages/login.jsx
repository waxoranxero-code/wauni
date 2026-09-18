import { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/feed");
    } catch (err) {
      setError("Email o contraseña incorrectos");
    }
  }

  async function handleRecuperar() {
    if (!email) { setError("Introduce tu email primero"); return; }
    await sendPasswordResetEmail(auth, email);
    alert("Email de recuperación enviado. Revisa tu carpeta de spam.");
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f0e8",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Nunito', sans-serif",
    }}>
      <div style={{
        background: "white",
        borderRadius: "20px",
        padding: "40px 36px",
        width: "100%",
        maxWidth: "380px",
        boxShadow: "4px 6px 20px rgba(0,0,0,0.1)",
      }}>

        {/* Logo */}
        <div style={{
          fontFamily: "'Caveat', cursive",
          fontSize: "42px",
          fontWeight: 700,
          textAlign: "center",
          marginBottom: "4px",
        }}>
          <span style={{ color: "#1D9E75" }}>WAU</span>
          <span style={{ color: "#b8935a" }}>ni</span>
          {" "}📌
        </div>
        <p style={{
          fontFamily: "'Caveat', cursive",
          fontSize: "20px",
          color: "#999",
          textAlign: "center",
          marginBottom: "32px",
        }}>
          Hello again!
        </p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email universitario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1.5px solid #e0d8cc",
              marginBottom: "12px",
              fontSize: "15px",
              background: "#faf8f4",
              outline: "none",
            }}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              padding: "12px 16px",
              borderRadius: "12px",
              border: "1.5px solid #e0d8cc",
              marginBottom: "8px",
              fontSize: "15px",
              background: "#faf8f4",
              outline: "none",
            }}
          />

          {error && (
            <p style={{ color: "#E24B4A", fontSize: "13px", marginBottom: "8px" }}>{error}</p>
          )}

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "13px",
              background: "#1D9E75",
              color: "white",
              border: "none",
              borderRadius: "12px",
              fontSize: "16px",
              fontWeight: 700,
              fontFamily: "'Nunito', sans-serif",
              marginTop: "4px",
            }}
          >
            Entrar
          </button>
        </form>

        <button
          onClick={handleRecuperar}
          style={{
            background: "none",
            border: "none",
            color: "#b8935a",
            fontSize: "13px",
            fontWeight: 600,
            marginTop: "14px",
            display: "block",
            width: "100%",
            textAlign: "center",
          }}
        >
          ¿Olvidaste tu contraseña?
        </button>

        <div style={{
          marginTop: "24px",
          paddingTop: "20px",
          borderTop: "1px solid #f0ece4",
          textAlign: "center",
        }}>
          <span style={{ color: "#999", fontSize: "14px" }}>¿No eres parte de nosotros? </span>
          <Link to="/register" style={{ color: "#1D9E75", fontWeight: 700, fontSize: "14px" }}>
            Únete
          </Link>
        </div>

      </div>
    </div>
  );
}