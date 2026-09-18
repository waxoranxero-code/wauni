import { useState, useEffect } from "react";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import { crearNotificacion } from "../services/notificaciones";

const FILTROS = ["Todos", "Culture", "Sport", "Study", "Party", "Music"];

const EMOJI_GRUPO = {
    Culture: "🎭",
    Sport: "⚽",
    Study: "📚",
    Party: "🎉",
    Music: "🎵",
};

const COLOR_GRUPO = {
    Culture: { bg: "#e8f8f4", color: "#0F6E56" },
    Sport:   { bg: "#e6f1fb", color: "#185FA5" },
    Study:   { bg: "#faeeda", color: "#854F0B" },
    Party:   { bg: "#faece7", color: "#993C1D" },
    Music:   { bg: "#fbeaf0", color: "#993556" },
};

export default function Feed() {
    const { usuario } = useAuth();
    const navigate = useNavigate();
    const [posts, setPosts] = useState([]);
    const [filtroActivo, setFiltroActivo] = useState("Todos");
    const [cargando, setCargando] = useState(true);
    const [notifSinLeer, setNotifSinLeer] = useState(0);
    const [msgSinLeer, setMsgSinLeer] = useState(0);

    useEffect(() => { cargarPosts(); }, [filtroActivo]);

    useEffect(() => {
        let unsub;
        import("firebase/firestore").then(({ collection, query, where, onSnapshot }) => {
            const q = query(
                collection(db, "notifications", usuario.uid, "items"),
                where("leida", "==", false)
            );
            unsub = onSnapshot(q, (snap) => setNotifSinLeer(snap.size));
        });
        return () => unsub && unsub();
    }, []);

    async function cargarPosts() {
        setCargando(true);
        try {
            let q;
            if (filtroActivo === "Todos") {
                q = query(collection(db, "posts"), orderBy("timestamp", "desc"));
            } else {
                q = query(
                    collection(db, "posts"),
                    where("grupo", "==", filtroActivo),
                    orderBy("timestamp", "desc")
                );
            }
            const snap = await getDocs(q);
            setPosts(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
            console.error("Error cargando posts:", err);
        }   
        setCargando(false);
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>

            {/* Topbar */}
            <div style={{
                background: "#f5f0e8",
                borderBottom: "1px solid #c4a97a",
                padding: "12px 20px 10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
            }}>
                <div style={{
                    fontFamily: "'Caveat', cursive",
                    fontSize: "28px",
                    fontWeight: 700,
                    letterSpacing: "0.5px",
                }}>
                    <span style={{ color: "#1D9E75" }}>WAU</span>
                    <span style={{ color: "#b8935a" }}>ni</span>
                    {" "}📌
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                    {FILTROS.map((f) => (
                        <button
                            key={f}
                            onClick={() => setFiltroActivo(f)}
                            style={{
                                background: filtroActivo === f ? "#1D9E75" : "transparent",
                                border: `1px solid ${filtroActivo === f ? "#1D9E75" : "#a08050"}`,
                                borderRadius: "20px",
                                padding: "3px 12px",
                                fontSize: "12px",
                                fontWeight: 600,
                                color: filtroActivo === f ? "white" : "#6b4f2a",
                                fontFamily: "'Nunito', sans-serif",
                            }}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Corcho */}
            <div style={{
                flex: 1,
                background: "#b8935a",
                backgroundImage: `
                    repeating-linear-gradient(90deg, transparent, transparent 18px, rgba(90,55,10,0.04) 18px, rgba(90,55,10,0.04) 19px),
                    repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(90,55,10,0.03) 22px, rgba(90,55,10,0.03) 23px),
                    repeating-linear-gradient(30deg, rgba(160,110,50,0.12) 0px, rgba(160,110,50,0.12) 1px, transparent 1px, transparent 30px),
                    repeating-linear-gradient(150deg, rgba(100,65,20,0.08) 0px, rgba(100,65,20,0.08) 1px, transparent 1px, transparent 40px)
                `,
                display: "flex",
                alignItems: "center",
                padding: "28px 8px",
            }}>

                {/* Burbujas izquierda */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px", padding: "0 8px" }}>
                    <Burbuja emoji="🔔" badge={notifSinLeer} onClick={() => navigate("/notificaciones")} />
                    <Burbuja emoji="🔍" onClick={() => navigate("/buscar")} />
                    <Burbuja emoji="👥" onClick={() => navigate("/amigos")} />
                </div>

                {/* Feed */}
                <div style={{ flex: 1, overflow: "hidden" }}>
                    <div style={{
                        display: "flex",
                        gap: "22px",
                        overflowX: "auto",
                        padding: "18px 8px 26px",
                        scrollbarWidth: "none",
                        alignItems: "flex-start",
                    }}>
                        {cargando ? (
                            <p style={{ color: "white", fontFamily: "'Caveat', cursive", fontSize: "18px" }}>Cargando...</p>
                        ) : posts.length === 0 ? (
                            <p style={{ color: "white", fontFamily: "'Caveat', cursive", fontSize: "18px" }}>No hay publicaciones todavía</p>
                        ) : (
                            posts.map((post, i) => (
                                <PostCard key={post.id} post={post} usuarioUid={usuario.uid} index={i} />
                            ))
                        )}
                    </div>
                </div>

                {/* Burbujas derecha */}
                <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "16px", padding: "0 8px" }}>
                    <Burbuja emoji="👤" onClick={() => navigate("/perfil")} />
                    <Burbuja emoji="💬" badge={msgSinLeer} onClick={() => navigate("/mensajes")} />
                    <Burbuja emoji="➕" onClick={() => navigate("/nuevo-post")} verde />
                </div>

            </div>
        </div>
    );
}

function Burbuja({ emoji, badge, onClick, verde }) {
    return (
        <div
            onClick={onClick}
            style={{
                width: "44px",
                height: "44px",
                borderRadius: "50%",
                background: verde ? "#1D9E75" : "#e8f8f4",
                border: `2px solid ${verde ? "#0F6E56" : "#5DCAA5"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: verde ? "22px" : "18px",
                boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                position: "relative",
                userSelect: "none",
            }}
        >
            {emoji}
            {badge > 0 && (
                <div style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    background: "#E24B4A",
                    color: "white",
                    borderRadius: "50%",
                    width: "16px",
                    height: "16px",
                    fontSize: "9px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: 700,
                    border: "2px solid #b8935a",
                }}>
                    {badge}
                </div>
            )}
        </div>
    );
}

function PostCard({ post, usuarioUid, index }) {
    const [likes, setLikes] = useState(post.likes || []);
    const [importantes, setImportantes] = useState(post.importantes || []);
    const [guardados, setGuardados] = useState(post.guardados || []);

    const yaDioLike = likes.includes(usuarioUid);
    const yaEsImportante = importantes.includes(usuarioUid);
    const yaGuardado = guardados.includes(usuarioUid);

    const rotaciones = [-2, 1.2, -0.8, 2, -1.5];
    const translateY = [4, -8, 10, -4, 6];
    const rot = rotaciones[index % rotaciones.length];
    const ty = translateY[index % translateY.length];

    const colores = [
        "radial-gradient(circle at 38% 32%, #ff7675, #d63031)",
        "radial-gradient(circle at 38% 32%, #74b9ff, #0984e3)",
        "radial-gradient(circle at 38% 32%, #a29bfe, #6c5ce7)",
        "radial-gradient(circle at 38% 32%, #55efc4, #00b894)",
        "radial-gradient(circle at 38% 32%, #ffeaa7, #fdcb6e)",
    ];
    const colorChincheta = colores[index % colores.length];
    const colorGrupo = COLOR_GRUPO[post.grupo] || { bg: "#f1efe8", color: "#444" };

    async function crearHistoria() {
        const { addDoc, collection, serverTimestamp } = await import("firebase/firestore");
        const { db } = await import("../services/firebase");
        await addDoc(collection(db, "stories"), {
            autorUid: usuarioUid,
            postId: post.id,
            imagenUrl: post.imagenUrl || "",
            texto: post.texto,
            grupo: post.grupo,
            autorNombre: post.autorNombre,
            timestamp: serverTimestamp(),
            expiraEn: new Date(Date.now() + 24 * 60 * 60 * 1000),
        });
    }

    async function handleBorrar() {
        if (!confirm("¿Seguro que quieres borrar esta publicación?")) return;
        const { doc, deleteDoc } = await import("firebase/firestore");
        const { db } = await import("../services/firebase");
        await deleteDoc(doc(db, "posts", post.id));
    }

    async function toggleReaccion(tipo) {
        const { doc, updateDoc, arrayUnion, arrayRemove } = await import("firebase/firestore");
        const { db } = await import("../services/firebase");
        const ref = doc(db, "posts", post.id);
        const campos = { likes: setLikes, importantes: setImportantes, guardados: setGuardados };
        const yaActivo = { likes: yaDioLike, importantes: yaEsImportante, guardados: yaGuardado };

        if (!yaActivo[tipo] && tipo === "likes") {
            await crearNotificacion({ receptorUid: post.autorUid, origenUid: usuarioUid, tipo: "like", postId: post.id });
        }
        if (!yaActivo[tipo] && tipo === "importantes") {
            await crearHistoria();
        }
        if (yaActivo[tipo] && tipo === "importantes") {
            // Eliminar la historia asociada
            const { collection, query, where, getDocs, deleteDoc, doc } = await import("firebase/firestore");
            const { db } = await import("../services/firebase");
            const q = query(
                collection(db, "stories"),
                where("autorUid", "==", usuarioUid),
                where("postId", "==", post.id)
            );
            const snap = await getDocs(q);
            await Promise.all(snap.docs.map((d) => deleteDoc(doc(db, "stories", d.id))));
        }
        if (yaActivo[tipo]) {
            await updateDoc(ref, { [tipo]: arrayRemove(usuarioUid) });
            campos[tipo]((prev) => prev.filter((id) => id !== usuarioUid));
        } else {
            await updateDoc(ref, { [tipo]: arrayUnion(usuarioUid) });
            campos[tipo]((prev) => [...prev, usuarioUid]);
        }
    }

    return (
        <div style={{
            background: "white",
            padding: "10px 10px 28px 10px",
            borderRadius: "2px",
            boxShadow: "3px 4px 8px rgba(0,0,0,0.25), 0 1px 2px rgba(0,0,0,0.1)",
            position: "relative",
            flexShrink: 0,
            width: "190px",
            transform: `rotate(${rot}deg) translateY(${ty}px)`,
        }}>

            {/* Chincheta */}
            <div style={{
                position: "absolute",
                top: "-10px",
                left: "50%",
                transform: "translateX(-50%)",
                width: "15px",
                height: "15px",
                borderRadius: "50%",
                background: colorChincheta,
                boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                zIndex: 2,
            }} />

                {/* Imagen */}
                {post.imagenUrl ? (
                    <img src={post.imagenUrl} alt="post" style={{ width: "100%", height: "125px", objectFit: "cover" }} />
                ) : (
                    <div style={{
                        width: "100%",
                        height: "125px",
                        background: colorGrupo.bg,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "40px",
                    }}>
                        {EMOJI_GRUPO[post.grupo] || "📌"}
                    </div>
                )}

                {/* Texto */}
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: "14px", color: "#333", marginTop: "8px", lineHeight: 1.35 }}>
                    {post.texto}
                </div>
                <div style={{ fontFamily: "'Caveat', cursive", fontSize: "12px", color: "#999", marginTop: "3px" }}>
                    - {post.autorNombre || "Usuario"}
                    {post.autorUid === usuarioUid && (
                        <button
                            onClick={handleBorrar}
                            style={{
                                position: "absolute",
                                top: "8px",
                                right: "8px",
                                background: "rgba(255,255,255,0.8)",
                                border: "none",
                                borderRadius: "50%",
                                width: "24px",
                                height: "24px",
                                fontSize: "12px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                zIndex: 3,
                            }}
                        >
                            ✕
                        </button>
                    )}
                </div>

                {/* Badge grupo */}
                <div style={{
                    position: "absolute",
                    bottom: "32px",
                    right: "8px",
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 7px",
                    borderRadius: "8px",
                    fontFamily: "'Nunito', sans-serif",
                    letterSpacing: "0.3px",
                    textTransform: "uppercase",
                    background: colorGrupo.bg,
                    color: colorGrupo.color,
                }}>
                    {post.grupo}
                </div>

                {/* Reacciones */}
                <div style={{
                    display: "flex",
                    gap: "10px",
                    marginTop: "7px",
                    paddingTop: "7px",
                    borderTop: "0.5px solid #eee",
                }}>
                    <button onClick={() => toggleReaccion("likes")} style={{
                        background: "none", border: "none", fontSize: "11px",
                        fontWeight: 600, color: yaDioLike ? "#1D9E75" : "#666",
                        fontFamily: "'Nunito', sans-serif", cursor: "pointer",
                    }}>
                        👍 {likes.length}
                    </button>
                    <button onClick={() => toggleReaccion("importantes")} style={{
                        background: "none", border: "none", fontSize: "11px",
                        fontWeight: 600, color: yaEsImportante ? "#1D9E75" : "#666",
                        fontFamily: "'Nunito', sans-serif", cursor: "pointer",
                    }}>
                        📌 {importantes.length}
                    </button>
                    <button onClick={() => toggleReaccion("guardados")} style={{
                        background: "none", border: "none", fontSize: "11px",
                        fontWeight: 600, color: yaGuardado ? "#1D9E75" : "#666",
                        fontFamily: "'Nunito', sans-serif", cursor: "pointer",
                    }}>
                        🔖 {guardados.length}
                    </button>
                </div>
        </div>
    );
}