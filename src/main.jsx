import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Login from "./pages/login";
import Register from "./pages/register";
import Feed from "./pages/feed";
import NuevoPost from "./pages/nuevoPost";
import Perfil from "./pages/perfil";
import EditarPerfil from "./pages/editarPerfil";
import Amigos from "./pages/amigos";
import Mensajes from "./pages/mensajes";
import Notificaciones from "./pages/notificaciones";
import Buscar from "./pages/buscar";
import PerfilPublico from "./pages/perfilPublico";

function App() {
  const { usuario } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/feed" element={usuario ? <Feed /> : <Navigate to="/login" />} />
      <Route path="/nuevo-post" element={usuario ? <NuevoPost /> : <Navigate to="/login" />} />
      <Route path="/perfil" element={usuario ? <Perfil /> : <Navigate to="/login" />} />
      <Route path="/perfil/:uid" element={usuario ? <PerfilPublico /> : <Navigate to="/login" />} />
      <Route path="/editar-perfil" element={usuario ? <EditarPerfil /> : <Navigate to="/login" />} />
      <Route path="/amigos" element={usuario ? <Amigos /> : <Navigate to="/login" />} />
      <Route path="/mensajes" element={usuario ? <Mensajes /> : <Navigate to="/login" />} />
      <Route path="/notificaciones" element={usuario ? <Notificaciones /> : <Navigate to="/login" />} />
      <Route path="/buscar" element={usuario ? <Buscar /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);