import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

export async function crearNotificacion({ receptorUid, origenUid, tipo, postId = null }) {
  if (receptorUid === origenUid) return; // no notificarse a uno mismo
    try {
        await addDoc(collection(db, "notifications", receptorUid, "items"), {
            tipo,
            origenUid,
            postId,
            leida: false,
            timestamp: serverTimestamp(),
        });
    } catch (err) {
        console.error("Error creando notificación:", err);
    }
}