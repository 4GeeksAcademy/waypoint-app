import { POPULAR_CITIES_BY_COUNTRY } from "../components/CreateRoute/CardPopularCities";
import { POPULAR_COUNTRIES } from "../components/CreateRoute/CardPouplarCountry";
import { normalizeText } from "../utils/constants";
import { useState, useEffect } from "react";
import {
  Search,
  MapPin,
  Globe,
  Loader,
  ChevronLeft,
  ChevronRight,
  Compass
} from "lucide-react";
import RouteCard from "../components/RouteCard";
import { API_ENDPOINTS, getAuthHeaders } from "../utils/apiConfig";
import {goToNextPage, goToPrevPage, goToPage } from "../utils/constants";

const Explore = () => {
  // ========== ESTADOS ==========
  const [allRoutes, setAllRoutes] = useState([]); // Todas las rutas de la BD
  const [filteredRoutes, setFilteredRoutes] = useState([]); // Rutas después de filtrar
  const [selectedCountry, setSelectedCountry] = useState(null); // País seleccionado
  const [selectedCity, setSelectedCity] = useState(null); // Ciudad seleccionada
  const [searchTerm, setSearchTerm] = useState(""); // Término de búsqueda
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1); // Página actual
  const ITEMS_PER_PAGE = 3; // 3 rutas por página

  // ========== OBTENER RUTAS DE LA BD ==========
  useEffect(() => {
    fetchAllRoutes();
  }, []);

  const fetchAllRoutes = async () => {
    try {
      setLoading(true);
      const response = await fetch(API_ENDPOINTS.ROUTES, {
        method: "GET",
        headers: getAuthHeaders(),
      });

      if (!response.ok) throw new Error("Error al cargar rutas");

      const data = await response.json();
      setAllRoutes(data);
      setFilteredRoutes(data); // Inicialmente mostrar todas
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // ========== FILTRAR RUTAS ==========
  useEffect(() => {
    let filtered = [...allRoutes];

    // Filtro por país (comparamos con el nombre del país)
    if (selectedCountry) {
      filtered = filtered.filter(
        (route) =>
          normalizeText(route.country) === normalizeText(selectedCountry.name)
      );
    }

    // Filtro por ciudad
    if (selectedCity) {
      filtered = filtered.filter(
        (route) => normalizeText(route.city) === normalizeText(selectedCity)
      );
    }

    // Filtro por búsqueda manual
    if (searchTerm.trim()) {
      const searchNormalized = normalizeText(searchTerm);
      filtered = filtered.filter(
        (route) =>
          normalizeText(route.country).includes(searchNormalized) ||
          normalizeText(route.city).includes(searchNormalized) ||
          normalizeText(route.locality || "").includes(searchNormalized)
      );
    }

    setFilteredRoutes(filtered);
    setCurrentPage(1); // Reset a página 1 cuando cambian los filtros
  }, [selectedCountry, selectedCity, searchTerm, allRoutes]);

  // ========== HANDLERS ==========
  const handleCountryClick = (country) => {
    // Guardamos el objeto completo del país para tener acceso al código
    setSelectedCountry(country);
    setSelectedCity(null); // Reset ciudad cuando cambias de país
    setSearchTerm(""); // Limpiar búsqueda
  };

  const handleCityClick = (cityName) => {
    setSelectedCity(cityName);
    setSearchTerm(""); // Limpiar búsqueda
  };

  const handleResetFilters = () => {
    setSelectedCountry(null);
    setSelectedCity(null);
    setSearchTerm("");
  };

  // ========== RENDER ==========
  if (loading) {
    return (
      <div className="container py-5 text-center">
        <Loader className="animate-spin" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger">{error}</div>
      </div>
    );
  }

  // Obtener ciudades del país seleccionado usando el código del país
  const citiesForSelectedCountry = selectedCountry
    ? POPULAR_CITIES_BY_COUNTRY[selectedCountry.code] || []
    : [];

  // ========== PAGINACIÓN ==========
  const totalPages = Math.ceil(filteredRoutes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentRoutes = filteredRoutes.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      
    }
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    
  };

  return (
    <div className="container py-4">
      {/* HEADER */}
      <div className="text-center mb-5">
        <Compass size={64} className="text-primary mb-3" />
        <h1 className="display-4 fw-bold">Explorar Rutas</h1>
        <p className="lead text-muted">
          Descubre rutas turísticas creadas por la comunidad
        </p>
      </div>

      {/* BUSCADOR */}
      <div className="row mb-5">
        <div className="col-md-8 mx-auto">
          <div className="input-group input-group-lg">
            <span className="input-group-text">
              <Search size={24} />
            </span>
            <input
              type="text"
              className="form-control"
              placeholder="Buscar por país o ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {(searchTerm || selectedCountry || selectedCity) && (
              <button
                className="btn btn-outline-secondary"
                onClick={handleResetFilters}
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </div>

      {/* FILTROS ACTIVOS */}
      {(selectedCountry || selectedCity) && (
        <div className="mb-4">
          <h5 className="mb-3">Filtros activos:</h5>
          <div className="d-flex gap-2 flex-wrap">
            {selectedCountry && (
              <span className="badge bg-primary fs-6">
                País: {selectedCountry.name}
                <button
                  className="btn-close btn-close-white ms-2"
                  onClick={() => setSelectedCountry(null)}
                ></button>
              </span>
            )}
            {selectedCity && (
              <span className="badge bg-info fs-6">
                Ciudad: {selectedCity}
                <button
                  className="btn-close btn-close-white ms-2"
                  onClick={() => setSelectedCity(null)}
                ></button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* SECCIÓN DE PAÍSES */}
      <section className="mb-5">
        <h2 className="mb-4">
          <MapPin className="me-2" />
          Países Populares
        </h2>
        <div className="row g-3">
          {POPULAR_COUNTRIES.map((country) => (
            <div key={country.name} className="col-md-3 col-sm-6">
              <div
                className={`card h-100 cursor-pointer ${selectedCountry?.name === country.name ? "border-primary border-3" : ""}`}
                onClick={() => handleCountryClick(country)}
                style={{ cursor: "pointer" }}
              >
                <img
                  src={country.image}
                  className="card-img-top"
                  alt={country.name}
                  style={{ height: "150px", objectFit: "cover" }}
                />
                <div className="card-body text-center">
                  <h5 className="card-title">{country.name}</h5>
                  <p className="text-muted small">{country.visitors}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECCIÓN DE CIUDADES (Solo si hay país seleccionado) */}
      {selectedCountry && citiesForSelectedCountry.length > 0 && (
        <section className="mb-5">
          <h2 className="mb-4">Ciudades de {selectedCountry.name}</h2>
          <div className="row g-3">
            {citiesForSelectedCountry.map((city) => (
              <div key={city.name} className="col-md-3 col-sm-6">
                <div
                  className={`card h-100 cursor-pointer ${selectedCity === city.name ? "border-info border-3" : ""}`}
                  onClick={() => handleCityClick(city.name)}
                  style={{ cursor: "pointer" }}
                >
                  <img
                    src={city.image}
                    className="card-img-top"
                    alt={city.name}
                    style={{ height: "120px", objectFit: "cover" }}
                  />
                  <div className="card-body text-center">
                    <h6 className="card-title">{city.name}</h6>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECCIÓN DE RUTAS FILTRADAS */}
      <section>
        <h2 className="mb-4">
          <Compass /> Rutas Disponibles ({filteredRoutes.length})
        </h2>

        {filteredRoutes.length === 0 ? (
          <div className="alert alert-info">
            No se encontraron rutas con los filtros seleccionados.
          </div>
        ) : (
          <>
            <div className="row g-4">
              {currentRoutes.map((route) => (
                <div key={route.id} className="col-md-4 col-sm-6">
                  <RouteCard route={route} />
                </div>
              ))}
            </div>

            {/* PAGINACIÓN */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center align-items-center gap-3 mt-5">
                {/* Botón Anterior */}
                <button
                  className="btn btn-outline-primary"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft size={20} />
                  Anterior
                </button>

                {/* Números de página */}
                <div className="d-flex gap-2">
                  {[...Array(totalPages)].map((_, index) => {
                    const pageNumber = index + 1;
                    return (
                      <button
                        key={pageNumber}
                        className={`btn ${currentPage === pageNumber ? "btn-primary" : "btn-outline-primary"}`}
                        onClick={() => goToPage(pageNumber)}
                        style={{ minWidth: "40px" }}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                </div>

                {/* Botón Siguiente */}
                <button
                  className="btn btn-outline-primary"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  Siguiente
                  <ChevronRight size={20} />
                </button>
              </div>
            )}

            {/* Info de paginación */}
            <div className="text-center text-muted mt-3">
              <small>
                Mostrando {startIndex + 1} -{" "}
                {Math.min(endIndex, filteredRoutes.length)} de{" "}
                {filteredRoutes.length} rutas
              </small>
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default Explore;
