import { useState, useEffect } from "react";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../services/firebase";

export default function Perfil() {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [perfil, setPerfil] = useState(null);
    const [postGuardados, setPostsGuardados] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        cargarPerfil();
        cargarPostsGuardados();
    }, []);

    async function cargarPerfil() {
        try {
            const snap = await getDoc(doc(db, "users", usuario.uid));
            if (snap.exists()) setPerfil(snap.data());
        } catch (err) {
            console.error(err);
        }
        setCargando(false);
    }

    async function cargarPostsGuardados() {
        try {
            const q = query(collection(db, "posts"), where("guardados", "array-contains", usuario.uid));
            const snap = await getDocs(q);
            setPostsGuardados(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
        } catch (err) {
            console.error(err);
        }
    }

    if (cargando) return <div style={estilos.loading}>Cargando...</div>;
    if (!perfil) return <div style={estilos.loading}>No se encontró el perfil</div>;

    async function handleCerrarSesion() {
        await signOut(auth);
        navigate("/login");
     }

    return (
        <div style={estilos.page}>
            <div style={estilos.container}>

                {/* Botón volver */}
                <button onClick={() => navigate("/feed")} style={estilos.backBtn}>
                    ← Volver al feed
                </button>

                {/* Cabecera */}
                <div style={estilos.header}>
                    <img
                        src={perfil.fotoPerfil || "https://via.placeholder.com/100"}
                        alt="foto"
                        style={estilos.avatar}
                    />
                    <div style={{ flex: 1 }}>
                        <h2 style={estilos.nombre}>{perfil.nombre} {perfil.apellidos}</h2>
                        <p style={estilos.uni}>📍 {perfil.universidad}</p>
                        <p style={estilos.bio}>{perfil.bio || "Sin biografía todavía"}</p>
                        <button onClick={() => navigate("/editar-perfil")} style={estilos.editBtn}>
                            ✏️ Editar perfil
                        </button>
                        <button onClick={handleCerrarSesion} style={{
  background: "#faece7",
  border: "1.5px solid #e8a090",
  borderRadius: "20px",
  padding: "6px 16px",
  fontSize: "13px",
  fontWeight: 700,
  color: "#993C1D",
  fontFamily: "'Nunito', sans-serif",
  marginLeft: "8px",
}}>
  Cerrar sesión
</button>
                    </div>
                </div>

                {/* Publicaciones guardadas */}
                <div style={estilos.seccion}>
                    <h3 style={estilos.seccionTitulo}>📌 Guardados</h3>
                    {postGuardados.length === 0 ? (
                        <p style={estilos.vacio}>No tienes publicaciones guardadas todavía</p>
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
    page: {
        minHeight: "100vh",
        background: "#f5f0e8",
        fontFamily: "'Nunito', sans-serif",
        padding: "20px",
    },
    container: {
        maxWidth: "600px",
        margin: "0 auto",
    },
    loading: {
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Caveat', cursive",
        fontSize: "24px",
        color: "#1D9E75",
        background: "#f5f0e8",
    },
    backBtn: {
        background: "none",
        border: "none",
        color: "#b8935a",
        fontWeight: 700,
        fontSize: "14px",
        marginBottom: "20px",
        padding: 0,
        fontFamily: "'Nunito', sans-serif",
    },
    header: {
        background: "white",
        borderRadius: "20px",
        padding: "24px",
        display: "flex",
        gap: "20px",
        alignItems: "flex-start",
        boxShadow: "3px 4px 12px rgba(0,0,0,0.08)",
        marginBottom: "20px",
    },
    avatar: {
        width: "90px",
        height: "90px",
        borderRadius: "50%",
        objectFit: "cover",
        border: "3px solid #5DCAA5",
    },
    nombre: {
        fontFamily: "'Caveat', cursive",
        fontSize: "26px",
        fontWeight: 700,
        color: "#222",
        margin: 0,
    },
    uni: {
        fontSize: "13px",
        color: "#b8935a",
        fontWeight: 600,
        margin: "4px 0",
    },
    bio: {
        fontSize: "14px",
        color: "#666",
        margin: "6px 0 12px",
        lineHeight: 1.5,
    },
    editBtn: {
        background: "#e8f8f4",
        border: "1.5px solid #5DCAA5",
        borderRadius: "20px",
        padding: "6px 16px",
        fontSize: "13px",
        fontWeight: 700,
        color: "#0F6E56",
        fontFamily: "'Nunito', sans-serif",
    },
    seccion: {
        background: "white",
        borderRadius: "20px",
        padding: "24px",
        boxShadow: "3px 4px 12px rgba(0,0,0,0.08)",
    },
    seccionTitulo: {
        fontFamily: "'Caveat', cursive",
        fontSize: "22px",
        color: "#333",
        marginBottom: "16px",
    },
    vacio: {
        color: "#aaa",
        fontSize: "14px",
        textAlign: "center",
        padding: "20px 0",
    },
    grid: {
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "8px",
    },
    gridItem: {
        aspectRatio: "1",
        borderRadius: "12px",
        overflow: "hidden",
        background: "#f5f0e8",
        cursor: "pointer",
    },
    gridTexto: {
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px",
        fontSize: "12px",
        textAlign: "center",
        color: "#666",
        fontFamily: "'Caveat', cursive",
    },
};