import { useState, useEffect, useRef } from "react";
import { collection, query, where, getDocs, doc, getDoc, addDoc, orderBy, onSnapshot, serverTimestamp } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { crearNotificacion } from "../services/notificaciones";

export default function Mensajes() {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [amigos, setAmigos] = useState([]);
    const [chatActivo, setChatActivo] = useState(null);
    const [mensajes, setMensajes] = useState([]);
    const [nuevoMensaje, setNuevoMensaje] = useState("");
    const [cargando, setCargando] = useState(true);
    const mensajesEndRef = useRef(null);

    useEffect(() => { cargarAmigos(); }, []);

    useEffect(() => {
        if (!chatActivo) return;
        const chatId = getChatId(usuario.uid, chatActivo.id);
        const q = query(collection(db, "messages", chatId, "mensajes"), orderBy("timestamp", "asc"));
        const unsub = onSnapshot(q, (snap) => {
            setMensajes(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
            setTimeout(() => mensajesEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });
        return unsub;
    }, [chatActivo]);

    function getChatId(uid1, uid2) { return [uid1, uid2].sort().join("_"); }

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
        setAmigos(perfiles.map((p) => ({ id: p.id, ...p.data() })));
        } catch (err) {
            console.error(err);
        }
        setCargando(false);
    }

    async function enviarMensaje() {
        if (!nuevoMensaje.trim() || !chatActivo) return;
        const chatId = getChatId(usuario.uid, chatActivo.id);
        try {
            await addDoc(collection(db, "messages", chatId, "mensajes"), {
                autorUid: usuario.uid,
                texto: nuevoMensaje.trim(),
                timestamp: serverTimestamp(),
            });
            await crearNotificacion({ receptorUid: chatActivo.id, origenUid: usuario.uid, tipo: "mensaje" });
            setNuevoMensaje("");
        } catch (err) {
            console.error(err);
        }
    }

    function handleKeyDown(e) {
        if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); enviarMensaje(); }
    }

    return (
        <div style={{ minHeight: "100vh", background: "#f5f0e8", fontFamily: "'Nunito', sans-serif", padding: "20px" }}>
            <div style={{ maxWidth: "800px", margin: "0 auto" }}>

                <button onClick={() => navigate("/feed")} style={estilos.backBtn}>← Volver al feed</button>

                <div style={estilos.chatContainer}>

                    {/* Lista amigos */}
                    <div style={estilos.sidebar}>
                        <h3 style={estilos.sidebarTitulo}>💬 Chats</h3>
                        {cargando ? (
                            <p style={estilos.vacio}>Cargando...</p>
                        ) : amigos.length === 0 ? (
                            <p style={estilos.vacio}>No tienes amigos todavía</p>
                        ) : (
                            amigos.map((amigo) => (
                                <div
                                    key={amigo.id}
                                    onClick={() => setChatActivo(amigo)}
                                    style={{
                                        ...estilos.amigoRow,
                                        background: chatActivo?.id === amigo.id ? "#e8f8f4" : "transparent",
                                    }}
                                >
                                    <img src={amigo.fotoPerfil || "https://via.placeholder.com/40"} alt="foto" style={estilos.avatar} />
                                    <p style={{ margin: 0, fontWeight: 600, fontSize: "14px" }}>{amigo.nombre} {amigo.apellidos}</p>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Ventana chat */}
                    <div style={estilos.chatArea}>
                        {!chatActivo ? (
                            <div style={estilos.sinChat}>
                                <p style={{ fontFamily: "'Caveat', cursive", fontSize: "22px", color: "#aaa" }}>
                                    Selecciona un amigo para chatear 💬
                                </p>
                            </div>
                        ) : (
                            <>
                            {/* Cabecera chat */}
                            <div style={estilos.chatHeader}>
                                <img src={chatActivo.fotoPerfil || "https://via.placeholder.com/40"} alt="foto" style={estilos.avatar} />
                                <p style={{ margin: 0, fontWeight: 700, fontSize: "16px" }}>{chatActivo.nombre} {chatActivo.apellidos}</p>
                            </div>

                            {/* Mensajes */}
                            <div style={estilos.mensajesArea}>
                                {mensajes.map((m) => (
                                    <div
                                        key={m.id}
                                        style={{
                                            ...estilos.burbujaMensaje,
                                            alignSelf: m.autorUid === usuario.uid ? "flex-end" : "flex-start",
                                            background: m.autorUid === usuario.uid ? "#1D9E75" : "#f0ece4",
                                            color: m.autorUid === usuario.uid ? "white" : "#333",
                                        }}
                                    >
                                        {m.texto}
                                    </div>
                                ))}
                                <div ref={mensajesEndRef} />
                            </div>

                            {/* Input */}
                            <div style={estilos.inputArea}>
                                <input
                                    type="text"
                                    placeholder="Escribe un mensaje..."
                                    value={nuevoMensaje}
                                    onChange={(e) => setNuevoMensaje(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    style={estilos.input}
                                />
                                <button onClick={enviarMensaje} style={estilos.sendBtn}>Enviar</button>
                            </div>
                            </>
                        )}
                    </div>

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
    chatContainer: {
        background: "white", borderRadius: "20px",
        boxShadow: "3px 4px 12px rgba(0,0,0,0.08)",
        display: "flex", height: "75vh", overflow: "hidden",
    },
    sidebar: {
        width: "240px", borderRight: "1px solid #f0ece4",
        overflowY: "auto", padding: "16px",
        flexShrink: 0,
    },
    sidebarTitulo: {
        fontFamily: "'Caveat', cursive", fontSize: "22px",
        color: "#333", marginBottom: "12px",
    },
    amigoRow: {
        display: "flex", alignItems: "center", gap: "10px",
        padding: "10px", borderRadius: "12px", cursor: "pointer",
        marginBottom: "4px",
    },
    avatar: {
        width: "40px", height: "40px", borderRadius: "50%",
        objectFit: "cover", border: "2px solid #5DCAA5",
        flexShrink: 0,
    },
    chatArea: {
        flex: 1, display: "flex", flexDirection: "column",
    },
    sinChat: {
        flex: 1, display: "flex", alignItems: "center",
        justifyContent: "center",
    },
    chatHeader: {
        display: "flex", alignItems: "center", gap: "12px",
        padding: "16px", borderBottom: "1px solid #f0ece4",
    },
    mensajesArea: {
        flex: 1, overflowY: "auto", padding: "16px",
        display: "flex", flexDirection: "column", gap: "8px",
    },
    burbujaMensaje: {
        padding: "10px 14px", borderRadius: "18px",
        maxWidth: "70%", fontSize: "14px", lineHeight: 1.4,
    },
    inputArea: {
        display: "flex", gap: "8px", padding: "16px",
        borderTop: "1px solid #f0ece4",
    },
    input: {
        flex: 1, padding: "10px 16px", borderRadius: "20px",
        border: "1.5px solid #e0d8cc", fontSize: "14px",
        fontFamily: "'Nunito', sans-serif", outline: "none",
        background: "#faf8f4",
    },
    sendBtn: {
        background: "#1D9E75", color: "white", border: "none",
        borderRadius: "20px", padding: "10px 20px", fontSize: "14px",
        fontWeight: 700, fontFamily: "'Nunito', sans-serif",
    },
    vacio: {
        color: "#aaa", fontSize: "13px", textAlign: "center", padding: "12px 0",
    },
};