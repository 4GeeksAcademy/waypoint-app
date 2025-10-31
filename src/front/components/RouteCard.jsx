// COMPONENTE: RouteCard
// Tarjeta para mostrar información de una ruta turística
// Se usa en: Explore, Popular, Trending, Profile

import { useState } from "react";
import {
  MapPin,
  User as UserIcon,
  Star,
  Calendar,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Link } from "react-router-dom";

const RouteCard = ({ route }) => {
  // Calcular promedio de estrellas para mostrar
  const [showAllPOIs, setShowAllPOIs] = useState(false);
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    // Estrellas completas
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star
          key={`full-${i}`}
          size={16}
          fill="currentColor"
          className="text-warning"
        />
      );
    }

    // Media estrella
    if (hasHalfStar && fullStars < 5) {
      stars.push(
        <Star
          key="half"
          size={16}
          fill="currentColor"
          className="text-warning"
          style={{ opacity: 0.5 }}
        />
      );
    }

    // Estrellas vacías
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<Star key={`empty-${i}`} size={16} className="text-muted" />);
    }

    return stars;
  };

  // Formatear fecha
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="card h-100 shadow-sm hover-shadow transition">
      <div className="card-body">
        {/* Ubicación */}
        <div className="d-flex align-items-center gap-2 mb-2">
          <MapPin size={18} className="text-primary" />
          <h5 className="card-title mb-0 fw-bold">
            {route.city}, {route.country}
          </h5>
        </div>

        {/* Localidad (si existe) */}
        {route.locality && (
          <p className="text-muted small mb-2">{route.locality}</p>
        )}

        {/* Puntos de interés */}
        <div className="mb-3">
          <p className="small text-muted mb-1">Puntos de interés:</p>
          <div className="d-flex flex-wrap gap-1">
            {/* Mostrar 3 o todos según el estado */}
            {(showAllPOIs
              ? route.points_of_interest
              : route.points_of_interest?.slice(0, 3)
            )?.map((poi, index) => (
              <span key={index} className="badge bg-light text-dark border">
                {poi}
              </span>
            ))}

            {/* Botón para expandir/colapsar si hay más de 3 */}
            {route.points_of_interest?.length > 3 && (
              <button
                className="badge bg-primary text-white border-0"
                style={{ cursor: "pointer" }}
                onClick={() => setShowAllPOIs(!showAllPOIs)}
              >
                {showAllPOIs ? (
                  <>
                    <ChevronUp size={12} className="me-1" />
                    Ver menos
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} className="me-1" />+
                    {route.points_of_interest.length - 3} más
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        {/* Rating y votos */}
        <div className="d-flex align-items-center gap-2 mb-2">
          <div className="d-flex gap-1">
            {renderStars(route.average_rating || 0)}
          </div>
          <span className="text-muted small">
            {route.average_rating?.toFixed(1) || "0.0"} (
            {route.total_votes || 0} votos)
          </span>
        </div>

        {/* Autor y fecha */}
        <div className="d-flex justify-content-between align-items-center mt-3 pt-3 border-top">
          <div className="d-flex align-items-center gap-2">
            <UserIcon size={16} className="text-muted" />
            <span className="small text-muted">{route.author_name}</span>
          </div>
          <div className="d-flex align-items-center gap-2">
            <Calendar size={16} className="text-muted" />
            <span className="small text-muted">
              {formatDate(route.created_at)}
            </span>
          </div>
        </div>

        {/* Botón ver detalles */}
        <Link
          to={`/route/${route.id}`}
          className="btn btn-sm bg-orange text-white w-100 mt-3"
        >
          Ver detalles
        </Link>
      </div>
    </div>
  );
};

export default RouteCard;
