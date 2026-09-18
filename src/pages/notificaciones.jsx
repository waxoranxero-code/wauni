import { useState, useEffect } from "react";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Notificaciones() {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [notificaciones, setNotificaciones] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const q = query(
            collection(db, "notifications", usuario.uid, "items"),
            orderBy("timestamp", "desc")
        );
        const unsub = onSnapshot(q, async (snap) => {
            const datos = await Promise.all(
                snap.docs.map(async (d) => {
                    const data = { id: d.id, ...d.data() };
                    if (data.origenUid) {
                        const perfil = await getDoc(doc(db, "users", data.origenUid));
                        data.origenNombre = perfil.exists()
                        ? `${perfil.data().nombre} ${perfil.data().apellidos}`
                        : "Alguien";
                        data.origenFoto = perfil.data()?.fotoPerfil || "";
                    }
                    return data;
                })
            );
            setNotificaciones(datos);
            setCargando(false);
        });
        return unsub;
    }, []);

    async function marcarLeida(notifId) {
        await updateDoc(doc(db, "notifications", usuario.uid, "items", notifId), { leida: true });
    }

    function textoNotificacion(notif) {
        switch (notif.tipo) {
            case "like": return `${notif.origenNombre} dio me gusta a tu publicación`;
            case "solicitud_amistad": return `${notif.origenNombre} te envió una solicitud de amistad`;
            case "amistad_aceptada": return `${notif.origenNombre} aceptó tu solicitud de amistad`;
            case "mensaje": return `${notif.origenNombre} te envió un mensaje`;
            default: return "Nueva notificación";
        }
    }

    function iconoNotificacion(tipo) {
        switch (tipo) {
            case "like": return "👍";
            case "solicitud_amistad": return "🤝";
            case "amistad_aceptada": return "✅";
            case "mensaje": return "💬";
            default: return "🔔";
        }
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Nunito', sans-serif", padding: "20px" }}>
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>

                <button onClick={() => navigate("/feed")} style={estilos.backBtn}>← Volver al feed</button>

                <div style={estilos.card}>
                    <h2 style={estilos.titulo}>🔔 Notificaciones</h2>

                    {cargando ? (
                        <p style={estilos.vacio}>Cargando...</p>
                    ) : notificaciones.length === 0 ? (
                        <p style={estilos.vacio}>No tienes notificaciones todavía</p>
                    ) : (
                        notificaciones.map((notif) => (
                            <div
                                key={notif.id}
                                onClick={() => marcarLeida(notif.id)}
                                style={{
                                    ...estilos.notifRow,
                                    background: notif.leida ? "transparent" : "#e8f8f4",
                                }}
                            >
                                <div style={estilos.iconoContainer}>
                                    <img
                                        src={notif.origenFoto || "https://via.placeholder.com/44"}
                                        alt="foto"
                                        style={estilos.avatar}
                                    />
                                    <span style={estilos.iconoTipo}>{iconoNotificacion(notif.tipo)}</span>
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: "14px", fontWeight: notif.leida ? 400 : 700, color: "#333" }}>
                                        {textoNotificacion(notif)}
                                    </p>
                                    <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#b8935a" }}>
                                        {notif.timestamp?.toDate().toLocaleDateString("es-ES", {
                                            day: "numeric", month: "short", hour: "2-digit", minute: "2-digit"
                                        })}
                                    </p>
                                </div>
                                {!notif.leida && <div style={estilos.puntito} />}
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
        boxShadow: "3px 4px 12px rgba(0,0,0,0.08)",
    },
    titulo: {
        fontFamily: "'Caveat', cursive", fontSize: "26px",
        color: "#333", marginBottom: "20px",
    },
    notifRow: {
        display: "flex", alignItems: "center", gap: "12px",
        padding: "12px", borderRadius: "14px", cursor: "pointer",
        marginBottom: "6px", transition: "background 0.15s",
    },
    iconoContainer: {
        position: "relative", flexShrink: 0,
    },
    avatar: {
    width: "44px", height: "44px", borderRadius: "50%",
    objectFit: "cover", border: "2px solid #5DCAA5",
    },
    iconoTipo: {
        position: "absolute", bottom: -2, right: -4,
        fontSize: "14px", background: "white",
        borderRadius: "50%", width: "20px", height: "20px",
        display: "flex", alignItems: "center", justifyContent: "center",
    },
    puntito: {
        width: "10px", height: "10px", borderRadius: "50%",
        background: "#1D9E75", flexShrink: 0,
    },
    vacio: {
        color: "#aaa", fontSize: "14px", textAlign: "center", padding: "20px 0",
    },
};