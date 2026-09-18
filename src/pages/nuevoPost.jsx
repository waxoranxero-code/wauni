import { useState } from "react";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, doc, getDoc } from "firebase/firestore";

const GRUPOS = ["Culture", "Sport", "Study", "Party", "Music"];

const COLOR_GRUPO = {
  Culture: { bg: "#e8f8f4", color: "#0F6E56" },
  Sport:   { bg: "#e6f1fb", color: "#185FA5" },
  Study:   { bg: "#faeeda", color: "#854F0B" },
  Party:   { bg: "#faece7", color: "#993C1D" },
  Music:   { bg: "#fbeaf0", color: "#993556" },
};

export default function NuevoPost() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [texto, setTexto] = useState("");
  const [grupo, setGrupo] = useState("Culture");
  const [imagen, setImagen] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  function handleImagen(e) {
    const archivo = e.target.files[0];
    setImagen(archivo);
    if (archivo) setPreview(URL.createObjectURL(archivo));
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

  async function handlePublicar(e) {
    e.preventDefault();
    if (!texto.trim()) { setError("El texto no puede estar vacío"); return; }
    setCargando(true);
    setError("");
    try {
      let imagenUrl = "";
      if (imagen && import.meta.env.VITE_CLOUDINARY_CLOUD_NAME) {
        imagenUrl = await subirImagenCloudinary(imagen);
      }
      const perfilSnap = await getDoc(doc(db, "users", usuario.uid));
      const perfil = perfilSnap.data();
      const nombreCompleto = `${perfil.nombre} ${perfil.apellidos}`;
      await addDoc(collection(db, "posts"), {
        autorUid: usuario.uid,
        autorNombre: nombreCompleto,
        texto, grupo,
        imagenUrl: imagenUrl || "",
        likes: [], importantes: [], guardados: [],
        timestamp: serverTimestamp(),
      });
      navigate("/feed");
    } catch (err) {
      console.error(err);
      setError("Error al publicar. Inténtalo de nuevo.");
    }
    setCargando(false);
  }

  const colorActivo = COLOR_GRUPO[grupo];

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Nunito', sans-serif", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "20px", padding: "40px 36px", width: "100%", maxWidth: "440px", boxShadow: "4px 6px 20px rgba(0,0,0,0.1)" }}>

        <button onClick={() => navigate("/feed")} style={estilos.backBtn}>← Volver al feed</button>

        <div style={{ fontFamily: "'Caveat', cursive", fontSize: "32px", fontWeight: 700, textAlign: "center", marginBottom: "24px" }}>
          <span style={{ color: "#1D9E75" }}>Nueva </span>
          <span style={{ color: "#b8935a" }}>publicación</span>
          {" "}📌
        </div>

        <form onSubmit={handlePublicar}>

          {/* Preview imagen */}
          <div
            onClick={() => document.getElementById("fileInput").click()}
            style={{
              width: "100%", height: "180px", borderRadius: "14px",
              background: preview ? "transparent" : "#faf8f4",
              border: "2px dashed #e0d8cc",
              display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", marginBottom: "16px", overflow: "hidden",
            }}
          >
            {preview ? (
              <img src={preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <div style={{ textAlign: "center", color: "#aaa" }}>
                <div style={{ fontSize: "32px" }}>📷</div>
                <p style={{ fontSize: "13px", margin: "6px 0 0" }}>Añadir imagen (opcional)</p>
              </div>
            )}
          </div>
          <input id="fileInput" type="file" accept="image/*" onChange={handleImagen} style={{ display: "none" }} />

          {/* Texto */}
          <textarea
            placeholder="¿Qué quieres compartir?"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            rows={4}
            style={{
              width: "100%", padding: "12px 16px", borderRadius: "12px",
              border: "1.5px solid #e0d8cc", fontSize: "15px",
              background: "#faf8f4", outline: "none", resize: "none",
              fontFamily: "'Nunito', sans-serif", marginBottom: "16px",
            }}
          />

          {/* Selector de grupo */}
          <div style={{ marginBottom: "20px" }}>
            <p style={{ fontSize: "12px", fontWeight: 700, color: "#b8935a", marginBottom: "8px" }}>Categoría</p>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              {GRUPOS.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrupo(g)}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "13px",
                    fontWeight: 700, fontFamily: "'Nunito', sans-serif",
                    border: "none", cursor: "pointer",
                    background: grupo === g ? COLOR_GRUPO[g].bg : "#f5f0e8",
                    color: grupo === g ? COLOR_GRUPO[g].color : "#999",
                    outline: grupo === g ? `2px solid ${COLOR_GRUPO[g].color}` : "none",
                  }}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          {error && <p style={{ color: "#E24B4A", fontSize: "13px", marginBottom: "8px" }}>{error}</p>}

          <div style={{ display: "flex", gap: "10px" }}>
            <button type="submit" disabled={cargando} style={{
              flex: 1, padding: "13px", background: "#1D9E75", color: "white",
              border: "none", borderRadius: "12px", fontSize: "15px",
              fontWeight: 700, fontFamily: "'Nunito', sans-serif",
            }}>
              {cargando ? "Publicando..." : "Publicar 📌"}
            </button>
            <button type="button" onClick={() => navigate("/feed")} style={{
              flex: 1, padding: "13px", background: "#f5f0e8", color: "#666",
              border: "none", borderRadius: "12px", fontSize: "15px",
              fontWeight: 700, fontFamily: "'Nunito', sans-serif",
            }}>
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const estilos = {
  backBtn: {
    background: "none", border: "none", color: "#b8935a",
    fontWeight: 700, fontSize: "14px", marginBottom: "20px",
    padding: 0, fontFamily: "'Nunito', sans-serif",
  },
};