import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs, addDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useParams } from "react-router-dom";
import { crearNotificacion } from "../services/notificaciones";

export default function PerfilPublico() {
  const { uid } = useParams();
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState(null);
  const [postGuardados, setPostsGuardados] = useState([]);
  const [amigosComun, setAmigosComun] = useState(0);
  const [estadoAmistad, setEstadoAmistad] = useState(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPerfil();
    cargarPostsGuardados();
    comprobarAmistad();
    calcularAmigosComun();
  }, [uid]);

  async function cargarPerfil() {
    try {
      const snap = await getDoc(doc(db, "users", uid));
      if (snap.exists()) setPerfil(snap.data());
    } catch (err) { console.error(err); }
    setCargando(false);
  }

  async function cargarPostsGuardados() {
    try {
      const q = query(collection(db, "posts"), where("guardados", "array-contains", uid));
      const snap = await getDocs(q);
      setPostsGuardados(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) { console.error(err); }
  }

  async function comprobarAmistad() {
    try {
      const q1 = query(collection(db, "friendships"), where("solicitanteUid", "==", usuario.uid), where("receptorUid", "==", uid));
      const q2 = query(collection(db, "friendships"), where("solicitanteUid", "==", uid), where("receptorUid", "==", usuario.uid));
      const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
      const todas = [...s1.docs, ...s2.docs];
      if (todas.length > 0) setEstadoAmistad(todas[0].data().estado);
    } catch (err) { console.error(err); }
  }

  async function calcularAmigosComun() {
    try {
      const q1 = query(collection(db, "friendships"), where("solicitanteUid", "==", usuario.uid), where("estado", "==", "aceptada"));
      const q2 = query(collection(db, "friendships"), where("receptorUid", "==", usuario.uid), where("estado", "==", "aceptada"));
      const q3 = query(collection(db, "friendships"), where("solicitanteUid", "==", uid), where("estado", "==", "aceptada"));
      const q4 = query(collection(db, "friendships"), where("receptorUid", "==", uid), where("estado", "==", "aceptada"));
      const [s1, s2, s3, s4] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3), getDocs(q4)]);
      const misAmigos = new Set([...s1.docs.map((d) => d.data().receptorUid), ...s2.docs.map((d) => d.data().solicitanteUid)]);
      const susAmigos = new Set([...s3.docs.map((d) => d.data().receptorUid), ...s4.docs.map((d) => d.data().solicitanteUid)]);
      setAmigosComun([...misAmigos].filter((u) => susAmigos.has(u)).length);
    } catch (err) { console.error(err); }
  }

  async function enviarSolicitud() {
    try {
      await addDoc(collection(db, "friendships"), {
        solicitanteUid: usuario.uid, receptorUid: uid,
        estado: "pendiente", timestamp: new Date(),
      });
      await crearNotificacion({ receptorUid: uid, origenUid: usuario.uid, tipo: "solicitud_amistad" });
      setEstadoAmistad("pendiente");
    } catch (err) { console.error(err); }
  }

  function botonAmistad() {
    if (estadoAmistad === "aceptada") return (
      <button disabled style={{ ...estilos.btnVerde, opacity: 0.6 }}>✓ Amigos</button>
    );
    if (estadoAmistad === "pendiente") return (
      <button disabled style={{ ...estilos.btnGris, opacity: 0.7 }}>Solicitud enviada</button>
    );
    return <button onClick={enviarSolicitud} style={estilos.btnVerde}>Añadir amigo</button>;
  }

  if (cargando) return <div style={estilos.loading}>Cargando...</div>;
  if (!perfil) return <div style={estilos.loading}>Usuario no encontrado</div>;

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Nunito', sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        <button onClick={() => navigate(-1)} style={estilos.backBtn}>← Volver</button>

        {/* Cabecera */}
        <div style={estilos.card}>
          <div style={{ display: "flex", gap: "20px", alignItems: "flex-start" }}>
            <img
              src={perfil.fotoPerfil || "https://via.placeholder.com/90"}
              alt="foto"
              style={estilos.avatar}
            />
            <div style={{ flex: 1 }}>
              <h2 style={estilos.nombre}>{perfil.nombre} {perfil.apellidos}</h2>
              <p style={estilos.uni}>📍 {perfil.universidad}</p>
              <p style={estilos.bio}>{perfil.bio || "Sin biografía"}</p>
              <p style={{ fontSize: "13px", color: "#999", margin: "0 0 12px" }}>
                {amigosComun} amigo{amigosComun !== 1 ? "s" : ""} en común
              </p>
              {botonAmistad()}
            </div>
          </div>
        </div>

        {/* Posts guardados */}
        <div style={estilos.card}>
          <h3 style={estilos.seccionTitulo}>📌 Guardados</h3>
          {postGuardados.length === 0 ? (
            <p style={estilos.vacio}>No tiene publicaciones guardadas</p>
          ) : (
            <div style={estilos.grid}>
              {postGuardados.map((post) => (
                <div key={post.id} style={estilos.gridItem}>
                  {post.imagenUrl ? (
                    <img src={post.imagenUrl} alt="post" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={estilos.gridTexto}>{post.texto.substring(0, 60)}...</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

const estilos = {
  loading: {
    minHeight: "100vh", display: "flex", alignItems: "center",
    justifyContent: "center", fontFamily: "'Caveat', cursive",
    fontSize: "24px", color: "#1D9E75", background: "#f5f0e8",
  },
  backBtn: {
    background: "none", border: "none", color: "#b8935a",
    fontWeight: 700, fontSize: "14px", marginBottom: "20px",
    padding: 0, fontFamily: "'Nunito', sans-serif",
  },
  card: {
    background: "white", borderRadius: "20px", padding: "24px",
    boxShadow: "3px 4px 12px rgba(0,0,0,0.08)", marginBottom: "16px",
  },
  avatar: {
    width: "90px", height: "90px", borderRadius: "50%",
    objectFit: "cover", border: "3px solid #5DCAA5",
  },
  nombre: {
    fontFamily: "'Caveat', cursive", fontSize: "26px",
    fontWeight: 700, color: "#222", margin: 0,
  },
  uni: {
    fontSize: "13px", color: "#b8935a", fontWeight: 600, margin: "4px 0",
  },
  bio: {
    fontSize: "14px", color: "#666", margin: "6px 0 8px", lineHeight: 1.5,
  },
  seccionTitulo: {
    fontFamily: "'Caveat', cursive", fontSize: "22px",
    color: "#333", marginBottom: "16px",
  },
  vacio: {
    color: "#aaa", fontSize: "14px", textAlign: "center", padding: "20px 0",
  },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px",
  },
  gridItem: {
    aspectRatio: "1", borderRadius: "12px", overflow: "hidden",
    background: "#f5f0e8", cursor: "pointer",
  },
  gridTexto: {
    width: "100%", height: "100%", display: "flex",
    alignItems: "center", justifyContent: "center",
    padding: "8px", fontSize: "12px", textAlign: "center",
    color: "#666", fontFamily: "'Caveat', cursive",
  },
  btnVerde: {
    background: "#1D9E75", color: "white", border: "none",
    borderRadius: "20px", padding: "8px 18px", fontSize: "13px",
    fontWeight: 700, fontFamily: "'Nunito', sans-serif", cursor: "pointer",
  },
  btnGris: {
    background: "#f5f0e8", color: "#666", border: "none",
    borderRadius: "20px", padding: "8px 18px", fontSize: "13px",
    fontWeight: 700, fontFamily: "'Nunito', sans-serif",
  },
};