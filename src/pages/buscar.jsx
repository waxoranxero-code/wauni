import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Buscar() {
  const { usuario } = useAuth();
  const navigate = useNavigate();
  const [busqueda, setBusqueda] = useState("");
  const [resultados, setResultados] = useState([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  async function handleBuscar(e) {
    e.preventDefault();
    if (!busqueda.trim()) return;
    setCargando(true);
    setBuscado(true);
    try {
      const q = query(
        collection(db, "users"),
        where("nombre", ">=", busqueda),
        where("nombre", "<=", busqueda + "\uf8ff")
      );
      const snap = await getDocs(q);
      setResultados(snap.docs.map((d) => ({ id: d.id, ...d.data() })).filter((u) => u.id !== usuario.uid));
    } catch (err) {
      console.error(err);
    }
    setCargando(false);
  }

  async function amigosEnComun(otroUid) {
    try {
      const q1 = query(collection(db, "friendships"), where("solicitanteUid", "==", usuario.uid), where("estado", "==", "aceptada"));
      const q2 = query(collection(db, "friendships"), where("receptorUid", "==", usuario.uid), where("estado", "==", "aceptada"));
      const q3 = query(collection(db, "friendships"), where("solicitanteUid", "==", otroUid), where("estado", "==", "aceptada"));
      const q4 = query(collection(db, "friendships"), where("receptorUid", "==", otroUid), where("estado", "==", "aceptada"));
      const [s1, s2, s3, s4] = await Promise.all([getDocs(q1), getDocs(q2), getDocs(q3), getDocs(q4)]);
      const misAmigos = new Set([...s1.docs.map((d) => d.data().receptorUid), ...s2.docs.map((d) => d.data().solicitanteUid)]);
      const susAmigos = new Set([...s3.docs.map((d) => d.data().receptorUid), ...s4.docs.map((d) => d.data().solicitanteUid)]);
      return [...misAmigos].filter((uid) => susAmigos.has(uid)).length;
    } catch (err) {
      return 0;
    }
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Nunito', sans-serif", padding: "20px" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto" }}>

        <button onClick={() => navigate("/feed")} style={estilos.backBtn}>← Volver al feed</button>

        <div style={estilos.card}>
          <h2 style={estilos.titulo}>🔍 Buscar personas</h2>

          <form onSubmit={handleBuscar} style={{ display: "flex", gap: "8px", marginBottom: "20px" }}>
            <input
              type="text"
              placeholder="Buscar por nombre..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              style={estilos.input}
            />
            <button type="submit" style={estilos.searchBtn}>Buscar</button>
          </form>

          {cargando ? (
            <p style={estilos.vacio}>Buscando...</p>
          ) : buscado && resultados.length === 0 ? (
            <p style={estilos.vacio}>No se encontraron usuarios</p>
          ) : (
            resultados.map((u) => (
              <ResultadoUsuario key={u.id} usuario={u} amigosEnComun={amigosEnComun} navigate={navigate} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function ResultadoUsuario({ usuario, amigosEnComun, navigate }) {
  const [comun, setComun] = useState(null);

  useEffect(() => {
    amigosEnComun(usuario.id).then(setComun);
  }, []);

  return (
    <div
      onClick={() => navigate(`/perfil/${usuario.id}`)}
      style={estilos.resultadoRow}
    >
      <img
        src={usuario.fotoPerfil || "https://via.placeholder.com/50"}
        alt="foto"
        style={estilos.avatar}
      />
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: "15px", color: "#222" }}>
          {usuario.nombre} {usuario.apellidos}
        </p>
        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#b8935a", fontWeight: 600 }}>
          📍 {usuario.universidad}
        </p>
        {comun !== null && (
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#999" }}>
            {comun} amigo{comun !== 1 ? "s" : ""} en común
          </p>
        )}
      </div>
      <span style={{ color: "#ccc", fontSize: "18px" }}>›</span>
    </div>
  );
}

const estilos = {
  backBtn: {
    background: "none", border: "none", color: "#b8935a",
    fontWeight: 700, fontSize: "14px", marginBottom: "20px",
    padding: 0, fontFamily: "'Nunito', sans-serif",
  },
  card: {
    background: "white", borderRadius: "20px", padding: "24px",
    boxShadow: "3px 4px 12px rgba(0,0,0,0.08)",
  },
  titulo: {
    fontFamily: "'Caveat', cursive", fontSize: "26px",
    color: "#333", marginBottom: "20px",
  },
  input: {
    flex: 1, padding: "12px 16px", borderRadius: "12px",
    border: "1.5px solid #e0d8cc", fontSize: "14px",
    fontFamily: "'Nunito', sans-serif", outline: "none",
    background: "#faf8f4",
  },
  searchBtn: {
    background: "#1D9E75", color: "white", border: "none",
    borderRadius: "12px", padding: "12px 20px", fontSize: "14px",
    fontWeight: 700, fontFamily: "'Nunito', sans-serif",
  },
  resultadoRow: {
    display: "flex", alignItems: "center", gap: "14px",
    padding: "12px", borderRadius: "14px", cursor: "pointer",
    marginBottom: "6px", transition: "background 0.15s",
  },
  avatar: {
    width: "50px", height: "50px", borderRadius: "50%",
    objectFit: "cover", border: "2px solid #5DCAA5",
    flexShrink: 0,
  },
  vacio: {
    color: "#aaa", fontSize: "14px", textAlign: "center", padding: "20px 0",
  },
};