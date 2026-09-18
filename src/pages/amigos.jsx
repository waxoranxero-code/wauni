import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { crearNotificacion } from "../services/notificaciones";
import Historias from "../components/historias";

export default function Amigos() {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [amigos, setAmigos] = useState([]);
    const [solicitudes, setSolicitudes] = useState([]);
    const [sugerencias, setSugerencias] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
    cargarAmigos();
    cargarSolicitudes();
    }, []);

    async function cargarAmigos() {
        try {
            const q1 = query(collection(db, "friendships"), where("solicitanteUid", "==", usuario.uid), where("estado", "==", "aceptada"));
            const q2 = query(collection(db, "friendships"), where("receptorUid", "==", usuario.uid), where("estado", "==", "aceptada"));
            const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
            const uids = [
                ...snap1.docs.map((d) => d.data().receptorUid),
                ...snap2.docs.map((d) => d.data().solicitanteUid),
            ];
            const perfiles = await Promise.all(uids.map((uid) => getDoc(doc(db, "users", uid))));
            const listaAmigos = perfiles.map((p) => ({ id: p.id, ...p.data() }));
            setAmigos(listaAmigos);
            cargarSugerencias(listaAmigos);
        } catch (err) {
            console.error(err);
        }
        setCargando(false);
    }

    async function cargarSolicitudes() {
        try {
            const q = query(collection(db, "friendships"), where("receptorUid", "==", usuario.uid), where("estado", "==", "pendiente"));
            const snap = await getDocs(q);
            const datos = await Promise.all(
                snap.docs.map(async (d) => {
                    const perfil = await getDoc(doc(db, "users", d.data().solicitanteUid));
                    return { friendshipId: d.id, ...perfil.data(), uid: perfil.id };
                })
            );
            setSolicitudes(datos);
        } catch (err) {
            console.error(err);
        }
    }

    async function cargarSugerencias(amigosActuales) {
        try {
            const q = query(collection(db, "users"), where("universidad", "==", "alumnosucav.es"));
            const snap = await getDocs(q);
            const uidsAmigos = amigosActuales.map((a) => a.id);
            const todos = snap.docs
            .map((d) => ({ id: d.id, ...d.data() }))
            .filter((u) => u.id !== usuario.uid && !uidsAmigos.includes(u.id));
            setSugerencias(todos.slice(0, 5));
        } catch (err) {
            console.error(err);
        }
    }

    async function enviarSolicitud(receptorUid) {
        try {
            await addDoc(collection(db, "friendships"), {
                solicitanteUid: usuario.uid,
                receptorUid,
                estado: "pendiente",
                timestamp: new Date(),
            });
            await crearNotificacion({ receptorUid, origenUid: usuario.uid, tipo: "solicitud_amistad" });
            cargarSugerencias(amigos);
            alert("Solicitud enviada");
        } catch (err) {
            console.error(err);
        }
    }

    async function responderSolicitud(friendshipId, aceptar, solicitanteUid) {
        try {
            await updateDoc(doc(db, "friendships", friendshipId), { estado: aceptar ? "aceptada" : "rechazada" });
            if (aceptar) {
                await crearNotificacion({ receptorUid: solicitanteUid, origenUid: usuario.uid, tipo: "amistad_aceptada" });
                cargarAmigos();
            }
            cargarSolicitudes();
        } catch (err) {
            console.error(err);
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Nunito', sans-serif", padding: "20px" }}>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>

                <button onClick={() => navigate("/feed")} style={estilos.backBtn}>← Volver al feed</button>

                {/* Historias */}
                <div style={estilos.card}>
                    <h3 style={estilos.seccionTitulo}>📸 Historias</h3>
                    <Historias />
                </div>

                {/* Solicitudes */}
                {solicitudes.length > 0 && (
                    <div style={estilos.card}>
                        <h3 style={estilos.seccionTitulo}>🤝 Solicitudes de amistad</h3>
                        {solicitudes.map((s) => (
                            <div key={s.friendshipId} style={estilos.userRow}>
                                <img src={s.fotoPerfil || "https://via.placeholder.com/46"} alt="foto" style={estilos.avatar} />
                                <p style={{ flex: 1, fontWeight: 600, fontSize: "15px" }}>{s.nombre} {s.apellidos}</p>
                                <button onClick={() => responderSolicitud(s.friendshipId, true, s.uid)} style={estilos.btnVerde}>Aceptar</button>
                                <button onClick={() => responderSolicitud(s.friendshipId, false, s.uid)} style={estilos.btnGris}>Rechazar</button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Amigos */}
                <div style={estilos.card}>
                    <h3 style={estilos.seccionTitulo}>👥 Tus amigos</h3>
                    {cargando ? (
                        <p style={estilos.vacio}>Cargando...</p>
                    ) : amigos.length === 0 ? (
                        <p style={estilos.vacio}>Todavía no tienes amigos en wauni</p>
                    ) : (
                        amigos
                        .sort((a, b) => a.nombre.localeCompare(b.nombre))
                        .map((amigo) => (
                            <div key={amigo.id} onClick={() => navigate(`/perfil/${amigo.id}`)} style={{ ...estilos.userRow, cursor: "pointer" }}>
                                <img src={amigo.fotoPerfil || "https://via.placeholder.com/46"} alt="foto" style={estilos.avatar} />
                                <div>
                                    <p style={{ fontWeight: 600, fontSize: "15px", margin: 0 }}>{amigo.nombre} {amigo.apellidos}</p>
                                    <p style={{ fontSize: "12px", color: "#b8935a", margin: 0 }}>{amigo.universidad}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Sugerencias */}
                <div style={estilos.card}>
                    <h3 style={estilos.seccionTitulo}>✨ Sugerencias</h3>
                    {sugerencias.length === 0 ? (
                        <p style={estilos.vacio}>No hay sugerencias disponibles</p>
                    ) : (
                        sugerencias.map((u) => (
                            <div key={u.id} style={estilos.userRow}>
                                <img src={u.fotoPerfil || "https://via.placeholder.com/46"} alt="foto" style={estilos.avatar} />
                                <div style={{ flex: 1 }}>
                                    <p style={{ fontWeight: 600, fontSize: "15px", margin: 0 }}>{u.nombre} {u.apellidos}</p>
                                    <p style={{ fontSize: "12px", color: "#b8935a", margin: 0 }}>{u.universidad}</p>
                                </div>
                                <button onClick={() => enviarSolicitud(u.id)} style={estilos.btnVerde}>Añadir</button>
                            </div>
                        ))
                    )}
                </div>

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
    card: {
        background: "white", borderRadius: "20px", padding: "24px",
        boxShadow: "3px 4px 12px rgba(0,0,0,0.08)", marginBottom: "16px",
    },
    seccionTitulo: {
        fontFamily: "'Caveat', cursive", fontSize: "22px",
        color: "#333", marginBottom: "16px",
    },
    userRow: {
        display: "flex", alignItems: "center", gap: "12px",
        padding: "10px 0", borderBottom: "0.5px solid #f0ece4",
    },
    avatar: {
        width: "46px", height: "46px", borderRadius: "50%",
        objectFit: "cover", border: "2px solid #5DCAA5",
    },
    vacio: {
        color: "#aaa", fontSize: "14px", textAlign: "center", padding: "12px 0",
    },
    btnVerde: {
        background: "#1D9E75", color: "white", border: "none",
        borderRadius: "20px", padding: "6px 14px", fontSize: "13px",
        fontWeight: 700, fontFamily: "'Nunito', sans-serif",
    },
    btnGris: {
        background: "#f5f0e8", color: "#666", border: "none",
        borderRadius: "20px", padding: "6px 14px", fontSize: "13px",
        fontWeight: 700, fontFamily: "'Nunito', sans-serif",
    },
};