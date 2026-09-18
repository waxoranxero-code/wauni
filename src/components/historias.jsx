import { useState, useEffect } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import { useAuth } from "../context/AuthContext";

export default function Historias() {
    const { usuario } = useAuth();
    const [historias, setHistorias] = useState([]);
    const [historiaActiva, setHistoriaActiva] = useState(null);

    useEffect(() => {
        cargarHistorias();
    }, []);

    async function cargarHistorias() {
        try {
            // Obtener amigos
            const q1 = query(
                collection(db, "friendships"),
                where("solicitanteUid", "==", usuario.uid),
                where("estado", "==", "aceptada")
            );
            const q2 = query(
                collection(db, "friendships"),
                where("receptorUid", "==", usuario.uid),
                where("estado", "==", "aceptada")
            );
            const [s1, s2] = await Promise.all([getDocs(q1), getDocs(q2)]);
            const uidsAmigos = [
                ...s1.docs.map((d) => d.data().receptorUid),
                ...s2.docs.map((d) => d.data().solicitanteUid),
                usuario.uid,
            ];

            // Obtener historias no expiradas de amigos
            const ahora = new Date();
            const todasHistorias = [];

            for (const uid of uidsAmigos) {
                const q = query(
                    collection(db, "stories"),
                    where("autorUid", "==", uid)
                );
                const snap = await getDocs(q);
                const validas = snap.docs
                .map((d) => ({ id: d.id, ...d.data() }))
                .filter((h) => h.expiraEn?.toDate() > ahora);
        
                if (validas.length > 0) {
                    const perfil = await getDoc(doc(db, "users", uid));
                    todasHistorias.push({
                        uid,
                        nombre: perfil.data()?.nombre || "Usuario",
                        foto: perfil.data()?.fotoPerfil || "",
                        historias: validas,
                    });
                }
            }

            setHistorias(todasHistorias);
        } catch (err) {
            console.error("Error cargando historias:", err);
        }
    }

    return (
        <div>
            {/* Burbujas de historias */}
            <div style={{ display: "flex", gap: "12px", overflowX: "auto", padding: "12px 0" }}>
                {historias.length === 0 ? (
                    <p style={{ color: "gray", fontSize: "13px" }}>No hay historias todavía</p>
                ) : (
                    historias.map((grupo) => (
                        <div
                            key={grupo.uid}
                            onClick={() => setHistoriaActiva(grupo)}
                            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "4px", cursor: "pointer", minWidth: "60px" }}
                        >
                            <div style={{ width: "56px", height: "56px", borderRadius: "50%", border: "3px solid #0084ff", padding: "2px" }}>
                                <img
                                    src={grupo.foto || "https://via.placeholder.com/56"}
                                    alt="foto"
                                    style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }}
                                />
                            </div>
                            <p style={{ margin: 0, fontSize: "11px", textAlign: "center", maxWidth: "60px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                {grupo.nombre}
                            </p>
                        </div>
                    ))
                )}
            </div>

            {/* Visor de historia */}
            {historiaActiva && (
                <div
                    onClick={() => setHistoriaActiva(null)}
                    style={{
                        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
                        background: "rgba(0,0,0,0.9)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        zIndex: 1000,
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{ background: "white", borderRadius: "16px", padding: "20px", maxWidth: "400px", width: "90%", maxHeight: "80vh", overflowY: "auto" }}
                    >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                            <img
                                src={historiaActiva.foto || "https://via.placeholder.com/40"}
                                alt="foto"
                                style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover" }}
                            />
                            <p style={{ margin: 0, fontWeight: "bold" }}>{historiaActiva.nombre}</p>
                            <button onClick={() => setHistoriaActiva(null)} style={{ marginLeft: "auto" }}>✕</button>
                        </div>
                        {historiaActiva.historias.map((h) => (
                            <div key={h.id} style={{ marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
                                {h.imagenUrl && (
                                    <img src={h.imagenUrl} alt="historia" style={{ width: "100%", borderRadius: "8px", marginBottom: "8px" }} />
                                )}
                                <p style={{ margin: 0 }}>{h.texto}</p>
                                <p style={{ margin: "4px 0 0", fontSize: "11px", color: "gray" }}>{h.grupo}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}