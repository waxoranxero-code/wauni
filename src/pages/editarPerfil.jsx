import { useState, useEffect } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function EditarPerfil() {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [nombre, setNombre] = useState("");
    const [apellidos, setApellidos] = useState("");
    const [bio, setBio] = useState("");
    const [imagen, setImagen] = useState(null);
    const [fotoActual, setFotoActual] = useState("");
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => { cargarDatos(); }, []);

    async function cargarDatos() {
        const snap = await getDoc(doc(db, "users", usuario.uid));
        if (snap.exists()) {
            const data = snap.data();
            setNombre(data.nombre || "");
            setApellidos(data.apellidos || "");
            setBio(data.bio || "");
            setFotoActual(data.fotoPerfil || "");
        }
    }

    async function subirImagenCloudinary(archivo) {
        const formData = new FormData();
        formData.append("file", archivo);
        formData.append("upload_preset", import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(
            `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
            { method: "POST", body: formData }
        );
        const data = await res.json();
        return data.secure_url;
    }

    async function handleGuardar(e) {
        e.preventDefault();
        setCargando(true);
        setError("");
        try {
            let fotoPerfil = fotoActual;
            if (imagen) fotoPerfil = await subirImagenCloudinary(imagen);
            await updateDoc(doc(db, "users", usuario.uid), { nombre, apellidos, bio, fotoPerfil });
            navigate("/perfil");
        } catch (err) {
            setError("Error al guardar los cambios");
        }
        setCargando(false);
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
        <div style={{ minHeight: "100vh", background: "#f5f0e8", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", fontFamily: "'Nunito', sans-serif" }}>
            <div style={{ background: "white", borderRadius: "20px", padding: "40px 36px", width: "100%", maxWidth: "400px", boxShadow: "4px 6px 20px rgba(0,0,0,0.1)" }}>

                <button onClick={() => navigate("/perfil")} style={{ background: "none", border: "none", color: "#b8935a", fontWeight: 700, fontSize: "14px", marginBottom: "20px", padding: 0, fontFamily: "'Nunito', sans-serif" }}>
                    ← Volver al perfil
                </button>

                <div style={{ fontFamily: "'Caveat', cursive", fontSize: "32px", fontWeight: 700, textAlign: "center", marginBottom: "24px" }}>
                    <span style={{ color: "#1D9E75" }}>Editar </span>
                    <span style={{ color: "#b8935a" }}>perfil</span>
                </div>

                {/* Foto actual */}
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                    <img
                        src={fotoActual || "https://via.placeholder.com/90"}
                        alt="foto"
                        style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "3px solid #5DCAA5" }}
                    />
                </div>

                <form onSubmit={handleGuardar}>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#b8935a", marginBottom: "6px", display: "block" }}>
                        Cambiar foto de perfil
                    </label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImagen(e.target.files[0])}
                        style={{ ...inputStyle, padding: "8px 12px" }}
                    />
                    <input type="text" placeholder="Nombre" value={nombre}
                        onChange={(e) => setNombre(e.target.value)} style={inputStyle} />
                    <input type="text" placeholder="Apellidos" value={apellidos}
                        onChange={(e) => setApellidos(e.target.value)} style={inputStyle} />
                    <textarea placeholder="Biografía" value={bio}
                        onChange={(e) => setBio(e.target.value)} rows={3}
                        style={{ ...inputStyle, resize: "none", marginBottom: "16px" }} />

                    {error && <p style={{ color: "#E24B4A", fontSize: "13px", marginBottom: "8px" }}>{error}</p>}

                    <div style={{ display: "flex", gap: "10px" }}>
                        <button type="submit" disabled={cargando} style={{
                            flex: 1, padding: "13px", background: "#1D9E75", color: "white",
                            border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700,
                            fontFamily: "'Nunito', sans-serif",
                        }}>
                            {cargando ? "Guardando..." : "Guardar cambios"}
                        </button>
                        <button type="button" onClick={() => navigate("/perfil")} style={{
                            flex: 1, padding: "13px", background: "#f5f0e8", color: "#666",
                            border: "none", borderRadius: "12px", fontSize: "15px", fontWeight: 700,
                            fontFamily: "'Nunito', sans-serif",
                        }}>
                            Cancelar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}