import { useState } from "react";
import { createUserWithEmailAndPassword, sendEmailVerification } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../services/firebase";
import { useNavigate, Link } from "react-router-dom";

const DOMINIO_PERMITIDO = "alumnosucav.es";

export default function Register() {
    const [nombre, setNombre] = useState("");
    const [apellidos, setApellidos] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmar, setConfirmar] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    async function handleRegister(e) {
        e.preventDefault();
        setError("");
        if (!email.endsWith(`@${DOMINIO_PERMITIDO}`)) {
            setError(`El email debe ser de tu universidad (@${DOMINIO_PERMITIDO})`);
            return;
        }
        if (password !== confirmar) { setError("Las contraseñas no coinciden"); return; }
        if (password.length < 6) { setError("La contraseña debe tener al menos 6 caracteres"); return; }

        try {
            const credencial = await createUserWithEmailAndPassword(auth, email, password);
            await sendEmailVerification(credencial.user);
            await setDoc(doc(db, "users", credencial.user.uid), {
                nombre, apellidos, email,
                fotoPerfil: "", bio: "",
                universidad: DOMINIO_PERMITIDO,
                fechaRegistro: new Date(),
            });
            alert("Te hemos enviado un email de verificación. Si no lo ves, revisa el spam.");
            navigate("/login");
        } catch (err) {
            setError("Error al registrarse. Puede que ese email ya esté en uso.");
        }
    }

    const inputStyle = {
        width: "100%",
        padding: "12px 16px",
        borderRadius: "12px",
        border: "1.5px solid #e0d8cc",
        marginBottom: "12px",
        fontSize: "15px",
        background: "#faf8f4",
        outline: "none",
        fontFamily: "'Nunito', sans-serif",
    };

    return (
        <div style={{
            minHeight: "100vh",
            background: "#f5f0e8",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Nunito', sans-serif",
            padding: "20px",
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
                    Join us!
                </p>

                <form onSubmit={handleRegister}>
                    <input type="text" placeholder="Nombre" value={nombre}
                        onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Apellidos" value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)} style={inputStyle} />
                    <input type="email" placeholder="Email universitario" value={email}
                        onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
                    <input type="password" placeholder="Contraseña" value={password}
                        onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
                    <input type="password" placeholder="Confirmar contraseña" value={confirmar}
                        onChange={(e) => setConfirmar(e.target.value)} style={{ ...inputStyle, marginBottom: "8px" }} />

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
                        Registrarse
                    </button>
                </form>

                <div style={{
                    marginTop: "24px",
                    paddingTop: "20px",
                    borderTop: "1px solid #f0ece4",
                    textAlign: "center",
                }}>
                    <span style={{ color: "#999", fontSize: "14px" }}>¿Ya tienes cuenta? </span>
                    <Link to="/login" style={{ color: "#1D9E75", fontWeight: 700, fontSize: "14px" }}>
                        Inicia sesión
                    </Link>
                </div>

            </div>
        </div>
    );
}