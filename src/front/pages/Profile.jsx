import { useState, useEffect } from 'react';

import useAuth from "../hooks/useAuth";
import { getRoutesByUser, deleteRoute } from "../services/routesService";
import { getUserFavorites, removeFavorite } from "../services/favoritesService";
import RouteMapCard from "../components/Profile/RouteMapCard";
import { Loader } from "lucide-react";

const Profile = () => {
    const { user } = useAuth();
    const [createdRoutes, setCreatedRoutes] = useState([]);
    const [favoriteRoutes, setFavoriteRoutes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const handleDeleteRoute = async (routeId) => {
        try {
            await deleteRoute(routeId);
            // Actualizar el estado para remover la ruta eliminada
            setCreatedRoutes((prevRoutes) =>
                prevRoutes.filter((route) => route.id !== routeId)
            );
            // También removerla de favoritas si está ahí
            setFavoriteRoutes((prevRoutes) =>
                prevRoutes.filter((route) => route.id !== routeId)
            );
        } catch (error) {
            console.error("Error al eliminar ruta:", error);
            throw error; // Propagar el error para que RouteMapCard lo maneje
        }
    };

    const handleDeleteRouteFavorite = async (routeId) => {
         try {
            await removeFavorite(routeId);
            // Actualizar el estado para remover la ruta de favoritas
            setFavoriteRoutes((prevRoutes) =>
                prevRoutes.filter((route) => route.id !== routeId)
            );
        } catch (error) {
            console.error("Error al eliminar ruta de favoritas:", error);
            throw error; // Propagar el error para que RouteMapCard lo maneje       
        }
    };

    useEffect(() => {
        if (!user) return;

        const fetchProfileData = async () => {
            setLoading(true);
            setError("");
            try {
                const [created, favorites] = await Promise.all([
                    getRoutesByUser(user.id),
                    getUserFavorites(user.id),
                ]);
                setCreatedRoutes(created);
                setFavoriteRoutes(favorites);
            } catch (err) {
                setError(
                    "No se pudieron cargar los datos del perfil. Inténtalo de nuevo más tarde."
                );
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfileData();
    }, [user]);

    if (loading) {
        return (
            <div
                className="d-flex justify-content-center align-items-center"
                style={{ height: "80vh" }}
            >
                <Loader className="animate-spin" size={48} />
            </div>
        );
    }

    if (error) {
        return <div className="alert alert-danger m-4">{error}</div>;
    }

    return (
        <div className="container mt-4">
            <h1 className="mb-4">Perfil de {user?.name}</h1>

            {/* Sección de Rutas Creadas */}
            <div className="mb-5">
                <h2 className="mb-3">
                    <span style={{ color: "blue", fontWeight: "bold" }}>■</span> Rutas
                    Creadas ({createdRoutes.length})
                </h2>
                {createdRoutes.length > 0 ? (
                    <div className="row">
                        {createdRoutes.map((route) => (
                            <RouteMapCard
                                key={route.id}
                                route={route}
                                type="created"
                                onDelete={handleDeleteRoute}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="alert alert-info">
                        Aún no has creado ninguna ruta. ¡Crea tu primera ruta para empezar!
                    </div>
                )}
            </div>

            {/* Sección de Rutas Favoritas */}
            <div className="mb-5">
                <h2 className="mb-3">
                    <span style={{ color: "orange", fontWeight: "bold" }}>■</span> Rutas
                    Favoritas ({favoriteRoutes.length})
                </h2>
                {favoriteRoutes.length > 0 ? (
                    <div className="row">
                        {favoriteRoutes.map((route) => (
                            <RouteMapCard
                                key={route.id}
                                route={route}
                                type="favorite"
                                onDelete={handleDeleteRouteFavorite}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="alert alert-info">
                        Aún no has marcado ninguna ruta como favorita.
                    </div>
                )}
            </div>
        </div>
    );
};

export default Profile;
