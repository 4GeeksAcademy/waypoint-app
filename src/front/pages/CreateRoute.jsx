import { useState, useEffect, useRef, useCallback, useReducer } from "react";

// ============================================================================
// PÁGINA: CreateRoute - VERSIÓN PROFESIONAL 2025 ✨
// ============================================================================
// ✅ Al seleccionar país → Muestra ciudades Y localidades (Carmona, Utrera, etc.)
// ✅ Al seleccionar ciudad/localidad → Muestra TODOS los POIs disponibles
// ✅ Permite seleccionar MÚLTIPLES POIs para una ruta
// ✅ Flujo simplificado: País → Ciudad/Localidad → POIs
// ✅ Sistema de CARDS con paginación (12 por página)
// ============================================================================

import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Plus,
  X,
  Search,
  Loader,
  AlertCircle,
  Check,
  Compass,
  Building2,
  UtensilsCrossed,
  Coffee,
  Beer,
  Trees,
  Landmark,
  Church,
  Hotel,
  Mountain,
  ChevronLeft,
  ChevronRight,
  Map,
  LayoutGrid,
} from "lucide-react";
import { createRoute } from "../services/routesService";
import { searchLocations, searchPointsOfInterest } from "../utils/apiConfig";
import { STANDARD_ICON_SIZE } from "../utils/constants";
import CreateRouteMap from "../components/CreateRoute/CreateRouteMap";
import { POPULAR_COUNTRIES } from "../components/CreateRoute/CardPouplarCountry";
import { POPULAR_CITIES_BY_COUNTRY } from "../components/CreateRoute/CardPopularCities";
import { normalizeText } from "../utils/constants";

// ============================================================================
// REDUCER: Estado simplificado sin campo "locality"
// ============================================================================
const formReducer = (state, action) => {
  switch (action.type) {
    case "SET_FIELD":
      return { ...state, [action.field]: action.value };

    case "SET_COUNTRY":
      return {
        ...state,
        country: action.value,
        countryCode: action.countryCode,
        city: "",
        coordinates: null,
        points_of_interest: [],
      };

    case "SET_CITY":
      return {
        ...state,
        city: action.value,
        coordinates: action.coordinates,
        points_of_interest: [],
      };

    case "ADD_POI":
      // Evitar duplicados
      if (state.points_of_interest.some((p) => p.id === action.poi.id)) {
        return state;
      }
      return {
        ...state,
        points_of_interest: [...state.points_of_interest, action.poi],
      };

    case "REMOVE_POI":
      return {
        ...state,
        points_of_interest: state.points_of_interest.filter(
          (p) => p.id !== action.poiId
        ),
      };

    case "RESET":
      return action.initialState;

    default:
      return state;
  }
};

const initialFormState = {
  country: "",
  countryCode: "",
  city: "",
  coordinates: null,
  points_of_interest: [],
};


const loadingAll = {
  countries: false,
  cities: false,
  pois: false,
};

// ============================================================================
// CONSTANTES PARA PAGINACIÓN
// ============================================================================
const ITEMS_PER_PAGE = 8;

// ============================================================================
// IMÁGENES POR DEFECTO SEGÚN TIPO DE POI
// ============================================================================
const DEFAULT_IMAGES = {
  attraction:
    "https://images.unsplash.com/photo-1533929736458-ca588d08c8be?w=400&h=300&fit=crop",
  museum:
    "https://images.unsplash.com/photo-1565626424178-c699f6601afd?w=400&h=300&fit=crop",
  restaurant:
    "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=300&fit=crop",
  cafe: "https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&h=300&fit=crop",
  bar: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=300&fit=crop",
  park: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop",
  monument:
    "https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=400&h=300&fit=crop",
  church:
    "https://images.unsplash.com/photo-1491677533189-49215d7e8c2e?w=400&h=300&fit=crop",
  hotel:
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop",
  viewpoint:
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop",
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================
const CreateRoute = () => {
  // ========== STATE CON useReducer (profesional) ==========
  const [formState, dispatch] = useReducer(formReducer, initialFormState);

  // ========== ESTADOS AUXILIARES ==========
  const [loadingAll, setLoadingAll] = useState({
    countries: false,
    cities: false,
    pois: false,
  });

  const [showDropdownAll, setShowDropdownAll] = useState({
    countries: false,
    cities: false,
    pois: false,
  });

  const [suggestions, setSuggestions] = useState({
    countries: [],
    cities: [],
    pois: [],
  });

  const [searchState, setSearchState] = useState({
    countryQuery: "",
    cityQuery: "",
    poiQuery: "",
    poiType: "attraction",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ========== ESTADO PARA PAGINACIÓN ==========
  const [currentPage, setCurrentPage] = useState(1);

  // ========== ESTADO PARA VISTA (MAPA O CARDS) ==========
  const [viewMode, setViewMode] = useState("cards"); // "cards" o "map"

  // ========== REFS PARA DEBOUNCING ==========
  const countryDebounceRef = useRef(null);
  const cityDebounceRef = useRef(null);
  const poiDebounceRef = useRef(null);
  const abortControllerRef = useRef(null);

  const navigate = useNavigate();

  // ============================================================================
  // FUNCIÓN: Buscar países con debouncing (solo para filtrar mientras escribe)
  // ============================================================================
  const handleSearchCountries = useCallback(async (query) => {
    if (query.length < 2) {
      setSuggestions((prev) => ({ ...prev, countries: [] }));
      return;
    }

    setLoadingAll((prev) => ({ ...prev, countries: true }));

    try {
      const results = await searchLocations(query, { type: "country" });

      // Filtrar solo países

      const countries = results
        .filter((r) => {
          const isCountry =
            r.addresstype === "country" || r.type === "administrative";
          const displayName = r.display_name.split(",")[0];
          return (
            isCountry && normalizeText(displayName).includes(normalizedQuery)
          );
        })
        .map((r) => ({
          name: r.display_name.split(",")[0],
          code: r.address?.country_code?.toUpperCase() || "",
          fullName: r.display_name,
        }));

      // Eliminar duplicados
      const uniqueCountries = countries.reduce((acc, country) => {
        if (!acc.find((c) => c.code === country.code)) {
          acc.push(country);
        }
        return acc;
      }, []);

      setSuggestions((prev) => ({ ...prev, countries: uniqueCountries }));
    } catch (error) {
      console.error("Error searching countries:", error);
    } finally {
      setLoadingAll((prev) => ({ ...prev, countries: false }));
    }
  }, []);

  // ============================================================================
  // FUNCIÓN: Al seleccionar país → Cargar TODAS las ciudades automáticamente
  // ============================================================================
  // ============================================================================
  // FUNCIÓN: Cargar ciudades Y localidades de un país
  // ESTRATEGIA: Muestra sugerencias iniciales + permite búsqueda manual
  // ============================================================================
  const loadAllCitiesForCountry = useCallback(
    async (countryCode, countryName) => {
      setLoadingAll((prev) => ({ ...prev, cities: true }));
      setSuggestions((prev) => ({ ...prev, cities: [] }));

      try {
        console.log(
          `[loadAllCitiesForCountry] 🔍 Cargando sugerencias para ${countryName}...`
        );

        // Estrategia mejorada: Más queries específicas para capturar MÁS pueblos
        const queries = [
          // Ciudades principales
          searchLocations("city", {
            countryCode: countryCode.toLowerCase(),
            limit: 50,
          }),
          // Pueblos grandes
          searchLocations("town", {
            countryCode: countryCode.toLowerCase(),
            limit: 50,
          }),
          // Pueblos pequeños
          searchLocations("village", {
            countryCode: countryCode.toLowerCase(),
            limit: 50,
          }),
          // Municipios
          searchLocations("municipality", {
            countryCode: countryCode.toLowerCase(),
            limit: 50,
          }),
          // Búsqueda por nombre del país (captura más resultados)
          searchLocations(countryName, {
            countryCode: countryCode.toLowerCase(),
            limit: 50,
          }),
        ];

        // Ejecutar todas las búsquedas en paralelo
        const allResults = await Promise.all(queries);
        const combinedResults = allResults.flat();

        console.log(
          `[loadAllCitiesForCountry] 📊 Total resultados: ${combinedResults.length}`
        );

        // Filtrar y formatear ciudades + localidades
        const citiesAndLocalities = combinedResults
          .filter(
            (r) =>
              r &&
              ([
                "city",
                "town",
                "village",
                "municipality",
                "locality",
                "hamlet",
              ].includes(r.type) ||
                r.addresstype === "city" ||
                r.addresstype === "town" ||
                r.addresstype === "village" ||
                r.addresstype === "municipality" ||
                r.class === "place")
          )
          .map((r) => ({
            name:
              r.name ||
              r.address?.city ||
              r.address?.town ||
              r.address?.village ||
              r.address?.municipality ||
              r.address?.locality ||
              r.display_name?.split(",")[0],
            lat: parseFloat(r.lat),
            lon: parseFloat(r.lon),
            displayName: r.display_name,
            type: r.type || r.addresstype,
          }))
          .filter((city) => city.name && city.lat && city.lon) // Eliminar inválidos
          .filter(
            (city, index, self) =>
              // Eliminar duplicados por nombre
              index === self.findIndex((c) => c.name === city.name)
          )
          .sort((a, b) => a.name.localeCompare(b.name, "es"));

        console.log(
          `[loadAllCitiesForCountry] ✅ Lugares únicos: ${citiesAndLocalities.length}`
        );
        setSuggestions((prev) => ({ ...prev, cities: citiesAndLocalities }));

        // Mensaje informativo en lugar de error
        if (citiesAndLocalities.length === 0) {
          console.log(
            `[loadAllCitiesForCountry] ℹ️ No hay sugerencias automáticas, pero puedes buscar manualmente`
          );
        }
      } catch (error) {
        console.error("Error loading cities:", error);
        setError("Error al cargar sugerencias. Puedes buscar manualmente.");
      } finally {
        setLoadingAll((prev) => ({ ...prev, cities: false }));
      }
    },
    []
  );

  // ============================================================================
  // FUNCIÓN: Filtrar ciudades/localidades mientras el usuario escribe
  // ============================================================================
  const handleSearchCities = useCallback((query, allCities) => {
    if (!query) {
      return allCities;
    }
    const normalizedQuery = normalizeText(query);
    return allCities.filter((city) =>
      normalizeText(city.name).includes(normalizedQuery)
    );
  }, []);

  // ============================================================================
  // FUNCIÓN: Al seleccionar categoría POI → Cargar TODOS los POIs automáticamente
  // ============================================================================
  const loadAllPOIsForCategory = useCallback(async (category, coordinates) => {
    if (!coordinates) return;

    setLoadingAll((prev) => ({ ...prev, pois: true }));
    setSuggestions((prev) => ({ ...prev, pois: [] }));
    setError(""); // Limpiar errores previos

    try {
      // Buscar todos los POIs de la categoría en un radio de 10km
      const pois = await searchPointsOfInterest(
        coordinates.lat,
        coordinates.lon,
        category,
        10000 // 10km de radio
      );

      if (pois.length === 0) {
        setError(
          "⏳ No se encontraron puntos de interés. Puede que el servidor esté ocupado. Intenta de nuevo en 1 minuto."
        );
      } else {
        setSuggestions((prev) => ({ ...prev, pois }));
      }
    } catch (error) {
      console.error("Error loading POIs:", error);
      setError(
        "❌ Error al cargar puntos de interés. Por favor, espera 1-2 minutos e intenta de nuevo."
      );
    } finally {
      setLoadingAll((prev) => ({ ...prev, pois: false }));
    }
  }, []);

  // ============================================================================
  // FUNCIÓN: Filtrar POIs mientras el usuario escribe
  // ============================================================================
  const handleSearchPOIs = useCallback((query, allPOIs) => {
    if (!query) {
      return allPOIs;
    }
    return allPOIs.filter((poi) =>
      poi.name.toLowerCase().includes(query.toLowerCase())
    );
  }, []);

  // ============================================================================
  // EFFECT: Debouncing para búsqueda de países
  // ============================================================================
  useEffect(() => {
    if (countryDebounceRef.current) {
      clearTimeout(countryDebounceRef.current);
    }

    countryDebounceRef.current = setTimeout(() => {
      handleSearchCountries(searchState.countryQuery);
    }, 500);

    return () => clearTimeout(countryDebounceRef.current);
  }, [searchState.countryQuery, handleSearchCountries]);

  // ============================================================================
  // EFFECT: Al seleccionar país → Cargar ciudades automáticamente
  // ============================================================================
  useEffect(() => {
    if (formState.country && formState.countryCode) {
      loadAllCitiesForCountry(formState.countryCode, formState.country);
      setShowDropdownAll((prev) => ({ ...prev, cities: true })); // Abrir dropdown de ciudades al cargar
    } else {
      setSuggestions((prev) => ({ ...prev, cities: [] }));
      setShowDropdownAll((prev) => ({ ...prev, cities: false }));
    }
  }, [formState.country, formState.countryCode, loadAllCitiesForCountry]);

  // ============================================================================
  // EFFECT: Búsqueda MANUAL en tiempo real (para encontrar CUALQUIER pueblo)
  // Si el usuario escribe, busca directamente sin depender de sugerencias
  // ============================================================================
  useEffect(() => {
    // Solo buscar si el usuario está escribiendo activamente
    if (
      !searchState.cityQuery ||
      !formState.countryCode ||
      searchState.cityQuery.length < 3
    ) {
      return;
    }

    // Si ya hay resultados que coinciden, usar filtrado local
    const localMatches = handleSearchCities(
      searchState.cityQuery,
      suggestions.cities
    );
    if (localMatches.length > 0) {
      return; // Ya hay resultados, no hacer nueva búsqueda
    }

    // Debouncing para búsqueda manual
    if (cityDebounceRef.current) {
      clearTimeout(cityDebounceRef.current);
    }

    cityDebounceRef.current = setTimeout(async () => {
      console.log(
        `[Búsqueda Manual] 🔎 Buscando: "${searchState.cityQuery}" en ${formState.countryCode}`
      );
      setLoadingAll((prev) => ({ ...prev, cities: true }));

      try {
        // BÚSQUEDA MÁS AMPLIA: Query directo con el nombre del pueblo
        const searchQuery = `${searchState.cityQuery}, ${formState.country}`;

        const results = await searchLocations(searchQuery, {
          countryCode: formState.countryCode.toLowerCase(),
          limit: 50, // Más resultados
        });

        console.log(
          `[Búsqueda Manual] 📊 Resultados encontrados: ${results.length}`
        );

        const cities = results
          .filter((r) => {
            if (!r) return false;

            // Aceptar MÁS tipos de lugares
            const validTypes = [
              "city",
              "town",
              "village",
              "municipality",
              "locality",
              "hamlet",
              "suburb",
              "neighbourhood",
            ];

            const isValidType =
              validTypes.includes(r.type) ||
              validTypes.includes(r.addresstype) ||
              r.class === "place";

            // Verificar que esté en el país correcto
            const isCorrectCountry =
              r.address?.country_code?.toUpperCase() ===
              formState.countryCode.toUpperCase();

            return isValidType && isCorrectCountry;
          })
          .map((r) => ({
            name:
              r.name ||
              r.address?.city ||
              r.address?.town ||
              r.address?.village ||
              r.address?.municipality ||
              r.address?.hamlet ||
              r.display_name?.split(",")[0],
            lat: parseFloat(r.lat),
            lon: parseFloat(r.lon),
            displayName: r.display_name,
            type: r.type || r.addresstype,
          }))
          .filter((city) => city.name && city.lat && city.lon) // Solo válidos
          .filter(
            (city, index, self) =>
              index === self.findIndex((c) => c.name === city.name)
          );

        console.log(`[Búsqueda Manual] ✅ Lugares únicos: ${cities.length}`);

        if (cities.length > 0) {
          setSuggestions((prev) => ({ ...prev, cities: cities }));
          console.log(
            `[Búsqueda Manual] 📍 Ejemplos:`,
            cities.slice(0, 5).map((c) => c.name)
          );
        }
      } catch (error) {
        console.error("[Búsqueda Manual] ❌ Error:", error);
      } finally {
        setLoadingAll((prev) => ({ ...prev, cities: false }));
      }
    }, 500);

    return () => clearTimeout(cityDebounceRef.current);
  }, [
    searchState.cityQuery,
    formState.countryCode,
    formState.country,
    suggestions.cities,
    handleSearchCities,
  ]);

  // ============================================================================
  // EFFECT: Al seleccionar categoría POI → Cargar POIs automáticamente
  // ============================================================================
  useEffect(() => {
    if (searchState.poiType && formState.coordinates) {
      loadAllPOIsForCategory(searchState.poiType, formState.coordinates);
      setShowDropdownAll((prev) => ({ ...prev, pois: true })); // Abrir dropdown de POIs al cargar
      setCurrentPage(1); // Reset página al cambiar categoría
    } else {
      setSuggestions((prev) => ({ ...prev, pois: [] }));
      setShowDropdownAll((prev) => ({ ...prev, pois: false }));
    }
  }, [searchState.poiType, formState.coordinates, loadAllPOIsForCategory]);

  // ============================================================================
  // EFFECT: Reset página cuando cambia la búsqueda
  // ============================================================================
  useEffect(() => {
    setCurrentPage(1);
  }, [searchState.poiQuery]);

  // ============================================================================
  // HANDLERS: Selección de sugerencias
  // ============================================================================
  const handleSelectCountry = (country) => {
    dispatch({
      type: "SET_COUNTRY",
      value: country.name,
      countryCode: country.code,
    });
    setSearchState((prev) => ({ ...prev, countryQuery: country.name }));
    setSuggestions((prev) => ({ ...prev, countries: [] }));
    setShowDropdownAll((prev) => ({ ...prev, countries: false })); // ✅ Cerrar dropdown
  };

  const handleSelectCity = (city) => {
    dispatch({
      type: "SET_CITY",
      value: city.name,
      coordinates: { lat: city.lat, lon: city.lon },
    });
    setSearchState((prev) => ({ ...prev, cityQuery: city.name }));
    setShowDropdownAll((prev) => ({ ...prev, cities: false })); // ✅ Cerrar dropdown
  };

  const handleAddPOI = (poi) => {
    // Verificar si ya está seleccionado para hacer toggle
    const isAlreadySelected = formState.points_of_interest.some(
      (p) => p.id === poi.id
    );

    if (isAlreadySelected) {
      // Si ya está seleccionado, quitarlo
      handleRemovePOI(poi.id);
    } else {
      // Si no está seleccionado, agregarlo
      dispatch({
        type: "ADD_POI",
        poi: {
          id: poi.id,
          name: poi.name,
          type: poi.type,
          lat: poi.lat,
          lon: poi.lon,
        },
      });
    }
  };

  const handleRemovePOI = (poiId) => {
    dispatch({ type: "REMOVE_POI", poiId });
  };

  // ============================================================================
  // HANDLER: Submit
  // ============================================================================
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validación
    if (formState.points_of_interest.length === 0) {
      setError("Debes agregar al menos un punto de interés");
      return;
    }

    if (!formState.country || !formState.city) {
      setError("Debes seleccionar un país y una ciudad");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsSubmitting(true);
    setError("");

    try {
      await createRoute(formState, controller.signal);
      navigate("/profile");
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error("Error creating route:", error);
        setError(
          error.message ||
            "No se pudo crear la ruta. Por favor, intenta de nuevo."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================================
  // FUNCIONES AUXILIARES: Paginación y filtrado de POIs
  // ============================================================================
  const getFilteredPOIs = () => {
    return handleSearchPOIs(searchState.poiQuery, suggestions.pois);
  };

  const getPaginatedPOIs = () => {
    const filtered = getFilteredPOIs();
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filtered.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const filtered = getFilteredPOIs();
    return Math.ceil(filtered.length / ITEMS_PER_PAGE);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // ============================================================================
  // FUNCIÓN: Obtener icono según tipo de POI
  // ============================================================================
  const getPOIIcon = (type) => {
    const iconMap = {
      attraction: Compass,
      museum: Building2,
      restaurant: UtensilsCrossed,
      cafe: Coffee,
      bar: Beer,
      park: Trees,
      monument: Landmark,
      church: Church,
      hotel: Hotel,
      viewpoint: Mountain,
    };
    return iconMap[type] || MapPin;
  };

  // ============================================================================
  // FUNCIÓN: Obtener color según tipo de POI
  // ============================================================================
  const getPOIColor = (type) => {
    const colorMap = {
      attraction: "primary",
      museum: "info",
      restaurant: "danger",
      cafe: "warning",
      bar: "success",
      park: "success",
      monument: "secondary",
      church: "info",
      hotel: "primary",
      viewpoint: "success",
    };
    return colorMap[type] || "primary";
  };

  // ============================================================================
  // FUNCIÓN: Obtener imagen del POI (de la API o por defecto)
  // ============================================================================
  const getPOIImage = (poi, poiType) => {
    // Si el POI tiene imagen de Wikimedia/Wikipedia, usarla
    if (poi.image) {
      return poi.image;
    }
    // Si no, usar imagen por defecto según el tipo
    return DEFAULT_IMAGES[poiType] || DEFAULT_IMAGES.attraction;
  };

  // ============================================================================
  // RENDER
  // ============================================================================
  return (
    <div className="container-fluid p-4">
      {/* Header */}
      <div className="mb-4">
        <h1 className="display-4 fw-bold mb-2">Crear Nueva Ruta</h1>
        <p className="text-muted">
          Usa el autocompletado para seleccionar ubicaciones y puntos de interés
        </p>
      </div>
      {/* Cards de Países Populares */}
      {!formState.country && (
        <div className="mb-4">
          <h5 className="fw-semibold mb-3">🌍 Países Más Visitados</h5>
          <div className="row g-3">
            {POPULAR_COUNTRIES.map((country) => (
              <div key={country.code} className="col-md-3 col-sm-6">
                <div
                  className="card h-100 shadow-sm"
                  style={{
                    cursor: "pointer",
                    transition: "transform 0.2s ease, box-shadow 0.2s ease",
                  }}
                  onClick={() => handleSelectCountry(country)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-5px)";
                    e.currentTarget.style.boxShadow =
                      "0 8px 20px rgba(0,0,0,0.15)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "";
                  }}
                >
                  <img
                    src={country.image}
                    className="card-img-top"
                    alt={country.name}
                    style={{ height: "120px", objectFit: "cover" }}
                  />
                  <div className="card-body text-center p-2">
                    <h6 className="card-title mb-1 fw-bold">{country.name}</h6>
                    <small className="text-muted">
                      {country.visitors} visitantes/año
                    </small>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <hr className="my-4" />
          <p className="text-center text-muted small">
            O busca cualquier otro país:
          </p>
        </div>
      )}

      {/* Formulario */}
      <div className="row">
        <div className="col-12">
          <div className="card shadow-sm">
            <div className="card-body p-4">
              <form onSubmit={handleSubmit}>
                {/* País con Autocompletado */}
                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold">
                    País *{" "}
                    <span className="text-muted small">
                      (busca y selecciona)
                    </span>
                  </label>
                  <div className="position-relative">
                    <Search
                      className="position-absolute"
                      size={20}
                      style={{ left: 12, top: 12 }}
                    />
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder="Buscar país... Ej: España"
                      value={searchState.countryQuery}
                      onChange={(e) =>
                        setSearchState((prev) => ({
                          ...prev,
                          countryQuery: e.target.value,
                        }))
                      }
                      onFocus={() =>
                        setShowDropdownAll((prev) => ({
                          ...prev,
                          countries: true,
                        }))
                      }
                      onBlur={() =>
                        setTimeout(
                          () =>
                            setShowDropdownAll((prev) => ({
                              ...prev,
                              countries: false,
                            })),
                          200
                        )
                      }
                      required
                    />
                    {loadingAll.countries && (
                      <Loader
                        className="position-absolute animate-spin"
                        size={20}
                        style={{ right: 12, top: 12 }}
                      />
                    )}
                  </div>

                  {/* Sugerencias de países */}
                  {showDropdownAll.countries &&
                    suggestions.countries.length > 0 && (
                      <div
                        className="position-absolute w-100 mt-1 bg-body border rounded shadow-lg"
                        style={{
                          zIndex: 1000,
                          maxHeight: "300px",
                          overflowY: "auto",
                        }}
                      >
                        {suggestions.countries.map((country, idx) => (
                          <div
                            key={idx}
                            className="p-3 border-bottom cursor-pointer hover-bg-light"
                            onClick={() => handleSelectCountry(country)}
                            style={{ cursor: "pointer" }}
                          >
                            <div className="fw-semibold">{country.name}</div>
                            <div className="small text-muted">
                              {country.fullName}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                  {formState.country && (
                    <div className="mt-2">
                      <span className="badge bg-success">
                        ✓ {formState.country}
                      </span>
                    </div>
                  )}
                </div>

                {/* Cards de Ciudades Populares del País Seleccionado */}
                {formState.country &&
                  !formState.city &&
                  POPULAR_CITIES_BY_COUNTRY[formState.countryCode] && (
                    <div className="mb-4">
                      <h5 className="fw-semibold mb-3">
                        🏙️ Ciudades Más Visitadas de {formState.country}
                      </h5>
                      <div className="row g-3">
                        {POPULAR_CITIES_BY_COUNTRY[formState.countryCode].map(
                          (city) => (
                            <div key={city.name} className="col-md-3 col-sm-6">
                              <div
                                className="card h-100 shadow-sm"
                                style={{
                                  cursor: "pointer",
                                  transition:
                                    "transform 0.2s ease, box-shadow 0.2s ease",
                                }}
                                onClick={() => handleSelectCity(city)}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.transform =
                                    "translateY(-5px)";
                                  e.currentTarget.style.boxShadow =
                                    "0 8px 20px rgba(0,0,0,0.15)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.transform =
                                    "translateY(0)";
                                  e.currentTarget.style.boxShadow = "";
                                }}
                              >
                                <img
                                  src={city.image}
                                  className="card-img-top"
                                  alt={city.name}
                                  style={{
                                    height: "100px",
                                    objectFit: "cover",
                                  }}
                                />
                                <div className="card-body text-center p-2">
                                  <h6 className="card-title mb-0 fw-bold small">
                                    {city.name}
                                  </h6>
                                </div>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                      <hr className="my-4" />
                      <p className="text-center text-muted small">
                        O busca otra ciudad/pueblo:
                      </p>
                    </div>
                  )}

                {/* Ciudad/Localidad con Autocompletado */}
                <div className="mb-3 position-relative">
                  <label className="form-label fw-semibold">
                    Ciudad/Localidad *{" "}
                    {loadingAll.cities && (
                      <span className="text-primary">
                        <Loader
                          className="d-inline-block animate-spin"
                          size={16}
                        />{" "}
                        Cargando ciudades y localidades...
                      </span>
                    )}
                    {!loadingAll.cities &&
                      formState.country &&
                      suggestions.cities.length > 0 && (
                        <span className="text-success small ms-2">
                          ({suggestions.cities.length} opciones disponibles)
                        </span>
                      )}
                  </label>
                  <div className="position-relative">
                    <Search
                      className="position-absolute"
                      size={20}
                      style={{ left: 12, top: 12 }}
                    />
                    <input
                      type="text"
                      className="form-control ps-5"
                      placeholder={
                        !formState.country
                          ? "Primero selecciona un país"
                          : loadingAll.cities
                            ? "Buscando..."
                            : suggestions.cities.length > 0
                              ? "Escribe para buscar más lugares..."
                              : "Escribe el nombre del pueblo/ciudad (ej: Carmona)"
                      }
                      value={searchState.cityQuery}
                      onChange={(e) =>
                        setSearchState((prev) => ({
                          ...prev,
                          cityQuery: e.target.value,
                        }))
                      }
                      disabled={!formState.country}
                      onFocus={() =>
                        setShowDropdownAll((prev) => ({
                          ...prev,
                          cities: true,
                        }))
                      }
                      onBlur={() =>
                        setTimeout(
                          () =>
                            setShowDropdownAll((prev) => ({
                              ...prev,
                              cities: false,
                            })),
                          200
                        )
                      }
                    />
                  </div>

                  {/* Mensaje informativo mejorado */}
                  {formState.country &&
                    !loadingAll.cities &&
                    suggestions.cities.length === 0 &&
                    !formState.city &&
                    searchState.cityQuery.length === 0 && (
                      <div className="alert alert-info mt-2 mb-0 py-2 small">
                        💡 <strong>Escribe el nombre</strong> del pueblo o
                        ciudad que buscas
                        <br />
                        <span className="text-muted">
                          Ejemplos: Carmona, Dos Hermanas, Utrera...
                        </span>
                      </div>
                    )}

                  {/* Mensaje mientras busca */}
                  {formState.country &&
                    loadingAll.cities &&
                    searchState.cityQuery.length >= 3 && (
                      <div className="alert alert-primary mt-2 mb-0 py-2 small">
                        🔍 Buscando "{searchState.cityQuery}" en{" "}
                        {formState.country}...
                      </div>
                    )}

                  {/* Mensaje si no encuentra resultados */}
                  {formState.country &&
                    !loadingAll.cities &&
                    suggestions.cities.length === 0 &&
                    searchState.cityQuery.length >= 3 && (
                      <div className="alert alert-warning mt-2 mb-0 py-2 small">
                        ⚠️ No se encontró "{searchState.cityQuery}".
                        <br />
                        <span className="text-muted">
                          Intenta con otro nombre o verifica la ortografía.
                        </span>
                      </div>
                    )}

                  {/* Lista de ciudades y localidades (filtrada localmente) */}
                  {showDropdownAll.cities &&
                    formState.country &&
                    suggestions.cities.length > 0 && (
                      <div
                        className="position-absolute w-100 mt-1 bg-body border rounded shadow-lg"
                        style={{
                          zIndex: 1000,
                          maxHeight: "400px",
                          overflowY: "auto",
                        }}
                      >
                        {handleSearchCities(
                          searchState.cityQuery,
                          suggestions.cities
                        )
                          .slice(0, 50) // Limitar a 50 para performance
                          .map((city, idx) => (
                            <div
                              key={idx}
                              className="p-3 border-bottom cursor-pointer hover-bg-light d-flex justify-content-between align-items-start"
                              onClick={() => handleSelectCity(city)}
                              style={{ cursor: "pointer" }}
                            >
                              <div className="flex-grow-1">
                                <div className="fw-semibold d-flex align-items-center gap-2">
                                  <MapPin size={16} className="text-primary" />
                                  {city.name}
                                  {city.type && (
                                    <span className="badge bg-secondary text-white small">
                                      {city.type === "city"
                                        ? "Ciudad"
                                        : city.type === "town"
                                          ? "Pueblo"
                                          : city.type === "village"
                                            ? "Aldea"
                                            : city.type === "municipality"
                                              ? "Municipio"
                                              : city.type}
                                    </span>
                                  )}
                                </div>
                                <div className="small text-muted mt-1">
                                  {city.displayName}
                                </div>
                                <div className="extra-small text-muted">
                                  📍 {city.lat.toFixed(4)},{" "}
                                  {city.lon.toFixed(4)}
                                </div>
                              </div>
                              {formState.city === city.name && (
                                <Check
                                  className="text-success flex-shrink-0"
                                  size={20}
                                />
                              )}
                            </div>
                          ))}
                      </div>
                    )}

                  {formState.city && (
                    <div className="mt-2">
                      <span className="badge bg-success fs-6 py-2">
                        ✓ {formState.city}
                      </span>
                    </div>
                  )}
                </div>

                {/* Puntos de Interés - MÚLTIPLES SELECCIONES CON CARDS */}
                <div className="mb-3">
                  <label className="form-label fw-semibold">
                    Puntos de Interés *{" "}
                    {loadingAll.pois && (
                      <Loader
                        className="d-inline-block animate-spin"
                        size={16}
                      />
                    )}
                    {formState.city && (
                      <span className="text-muted small ms-2">
                        ({formState.points_of_interest.length} seleccionados,{" "}
                        {suggestions.pois.length} disponibles)
                      </span>
                    )}
                  </label>

                  {/* Toggle entre Vista de Cards y Mapa */}
                  <div className="mb-3 d-flex justify-content-center">
                    <div className="btn-group" role="group">
                      <button
                        type="button"
                        className={`btn ${viewMode === "cards" ? "btn-primary" : "btn-outline-primary"} d-flex align-items-center gap-2`}
                        onClick={() => setViewMode("cards")}
                      >
                        <LayoutGrid size={18} />
                        Vista de Cards
                      </button>
                      <button
                        type="button"
                        className={`btn ${viewMode === "map" ? "btn-primary" : "btn-outline-primary"} d-flex align-items-center gap-2`}
                        onClick={() => setViewMode("map")}
                        disabled={!formState.city}
                      >
                        <Map size={18} />
                        Vista de Mapa
                      </button>
                    </div>
                  </div>

                  {/* Selector de categoría de POI con Botones */}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">
                      Selecciona una categoría:
                    </label>
                    <div className="d-flex flex-wrap gap-2 STANDARD_ICON_SIZE">
                      {[
                        {
                          value: "attraction",
                          icon: Compass,
                          label: "Atracciones",
                          color: "primary",
                        },
                        {
                          value: "museum",
                          icon: Building2,
                          label: "Museos",
                          color: "info",
                        },
                        {
                          value: "restaurant",
                          icon: UtensilsCrossed,
                          label: "Restaurantes",
                          color: "danger",
                        },
                        {
                          value: "cafe",
                          icon: Coffee,
                          label: "Cafés",
                          color: "warning",
                        },
                        {
                          value: "bar",
                          icon: Beer,
                          label: "Bares",
                          color: "success",
                        },
                        {
                          value: "park",
                          icon: Trees,
                          label: "Parques",
                          color: "success",
                        },
                        {
                          value: "monument",
                          icon: Landmark,
                          label: "Monumentos",
                          color: "secondary",
                        },
                        {
                          value: "church",
                          icon: Church,
                          label: "Iglesias",
                          color: "info",
                        },
                        {
                          value: "hotel",
                          icon: Hotel,
                          label: "Hoteles",
                          color: "primary",
                        },
                        {
                          value: "viewpoint",
                          icon: Mountain,
                          label: "Miradores",
                          color: "success",
                        },
                      ].map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <button
                            key={category.value}
                            type="button"
                            className={`btn ${
                              searchState.poiType === category.value
                                ? `btn-${category.color}`
                                : `btn-outline-${category.color}`
                            } btn-sm d-flex align-items-center gap-2`}
                            onClick={() =>
                              setSearchState((prev) => ({
                                ...prev,
                                poiType: category.value,
                              }))
                            }
                            disabled={!formState.city}
                            style={{
                              cursor: formState.city
                                ? "pointer"
                                : "not-allowed",
                              transition: "all 0.2s ease",
                            }}
                          >
                            <IconComponent size={16} />
                            {category.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* POIs Seleccionados (Tags) */}
                  {formState.points_of_interest.length > 0 && (
                    <div className="mb-3 p-3 bg-light rounded">
                      <div className="small fw-semibold mb-2">
                        POIs en tu ruta:
                      </div>
                      <div className="d-flex flex-wrap gap-2">
                        {formState.points_of_interest.map((poi) => (
                          <span
                            key={poi.id}
                            className="badge bg-primary fs-6 py-2 px-3 d-flex align-items-center gap-2"
                          >
                            <MapPin size={14} />
                            {poi.name}
                            <button
                              type="button"
                              className="btn btn-link p-0 m-0 border-0"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRemovePOI(poi.id);
                              }}
                              style={{
                                cursor: "pointer",
                                background: "none",
                                color: "inherit",
                                lineHeight: 0,
                              }}
                            >
                              <X size={16} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* VISTA DE CARDS */}
                  {viewMode === "cards" && (
                    <>
                      {/* Buscador de POI */}
                      <div className="position-relative mb-3">
                        <div className="position-relative">
                          <Search
                            className="position-absolute"
                            size={20}
                            style={{ left: 12, top: 12 }}
                          />
                          <input
                            type="text"
                            className="form-control ps-5"
                            placeholder={
                              formState.city
                                ? "Buscar por nombre..."
                                : "Primero selecciona una ciudad"
                            }
                            value={searchState.poiQuery}
                            onChange={(e) =>
                              setSearchState((prev) => ({
                                ...prev,
                                poiQuery: e.target.value,
                              }))
                            }
                            disabled={!formState.city}
                          />
                        </div>
                      </div>

                      {/* Grid de Cards de POIs con Paginación */}
                      {formState.city && suggestions.pois.length > 0 && (
                        <div className="poi-cards-container">
                          {/* Información de resultados */}
                          <div className="mb-3 d-flex justify-content-between align-items-center">
                            <div className="text-muted small">
                              Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1}{" "}
                              -{" "}
                              {Math.min(
                                currentPage * ITEMS_PER_PAGE,
                                getFilteredPOIs().length
                              )}{" "}
                              de {getFilteredPOIs().length} resultados
                            </div>
                            <div className="text-muted small">
                              Página {currentPage} de {getTotalPages()}
                            </div>
                          </div>

                          {/* Grid de Cards */}
                          <div className="row g-3 mb-4">
                            {getPaginatedPOIs().map((poi) => {
                              const isSelected =
                                formState.points_of_interest.some(
                                  (p) => p.id === poi.id
                                );
                              const IconComponent = getPOIIcon(
                                searchState.poiType
                              );
                              const colorClass = getPOIColor(
                                searchState.poiType
                              );
                              const imageUrl = getPOIImage(
                                poi,
                                searchState.poiType
                              );

                              return (
                                <div
                                  key={poi.id}
                                  className="col-md-6 col-lg-4 col-xl-3"
                                >
                                  <div
                                    className={`card h-100 shadow-sm ${
                                      isSelected
                                        ? "border-success border-3"
                                        : ""
                                    }`}
                                    style={{
                                      cursor: "pointer",
                                      transition: "all 0.3s ease",
                                      overflow: "hidden",
                                    }}
                                    onClick={() => handleAddPOI(poi)}
                                    onMouseEnter={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.transform =
                                          "translateY(-5px)";
                                        e.currentTarget.style.boxShadow =
                                          "0 8px 20px rgba(0,0,0,0.15)";
                                      }
                                    }}
                                    onMouseLeave={(e) => {
                                      if (!isSelected) {
                                        e.currentTarget.style.transform =
                                          "translateY(0)";
                                        e.currentTarget.style.boxShadow = "";
                                      }
                                    }}
                                  >
                                    {/* Imagen del POI con altura fija */}
                                    <div
                                      style={{
                                        position: "relative",
                                        width: "100%",
                                        height: "180px",
                                        overflow: "hidden",
                                        backgroundColor: "#f0f0f0",
                                      }}
                                    >
                                      <img
                                        src={imageUrl}
                                        alt={poi.name}
                                        style={{
                                          width: "100%",
                                          height: "100%",
                                          objectFit: "cover",
                                        }}
                                        onError={(e) => {
                                          // Si la imagen falla, usar la imagen por defecto
                                          e.target.src =
                                            DEFAULT_IMAGES[
                                              searchState.poiType
                                            ] || DEFAULT_IMAGES.attraction;
                                        }}
                                      />

                                      {/* Badge de selección en la esquina */}
                                      {isSelected && (
                                        <div
                                          style={{
                                            position: "absolute",
                                            top: "10px",
                                            right: "10px",
                                            backgroundColor: "#198754",
                                            color: "white",
                                            borderRadius: "50%",
                                            width: "32px",
                                            height: "32px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            boxShadow:
                                              "0 2px 8px rgba(0,0,0,0.3)",
                                          }}
                                        >
                                          <Check size={20} />
                                        </div>
                                      )}

                                      {/* Icono de categoría en la esquina */}
                                      <div
                                        style={{
                                          position: "absolute",
                                          top: "10px",
                                          left: "10px",
                                          backgroundColor: "white",
                                          borderRadius: "8px",
                                          padding: "8px",
                                          boxShadow:
                                            "0 2px 8px rgba(0,0,0,0.2)",
                                        }}
                                      >
                                        <IconComponent
                                          size={20}
                                          className={`text-${colorClass}`}
                                        />
                                      </div>
                                    </div>

                                    {/* Contenido de la card con altura fija */}
                                    <div
                                      className="card-body d-flex flex-column"
                                      style={{
                                        padding: "1rem",
                                        height: "200px", // Altura fija para el contenido
                                      }}
                                    >
                                      {/* Nombre del POI - altura fija */}
                                      <h6
                                        className="card-title mb-2 fw-bold"
                                        style={{
                                          fontSize: "0.95rem",
                                          lineHeight: "1.3",
                                          height: "2.6rem",
                                          display: "-webkit-box",
                                          WebkitLineClamp: 2,
                                          WebkitBoxOrient: "vertical",
                                          overflow: "hidden",
                                          textOverflow: "ellipsis",
                                        }}
                                      >
                                        {poi.name}
                                      </h6>

                                      {/* Tipo - badge */}
                                      <div className="mb-2">
                                        <span
                                          className="badge"
                                          style={{
                                            fontSize: "0.7rem",
                                            backgroundColor: `var(--bs-${colorClass})`,
                                            color: "white",
                                          }}
                                        >
                                          {poi.type}
                                        </span>
                                      </div>

                                      {/* Dirección con altura fija */}
                                      <div
                                        style={{
                                          fontSize: "0.8rem",
                                          color: "#6c757d",
                                          lineHeight: "1.3",
                                          height: "3.9rem",
                                          overflow: "hidden",
                                          marginBottom: "0.5rem",
                                          display: "-webkit-box",
                                          WebkitLineClamp: 3,
                                          WebkitBoxOrient: "vertical",
                                        }}
                                      >
                                        {poi.address ? (
                                          <>📍 {poi.address}</>
                                        ) : (
                                          <span className="text-muted fst-italic">
                                            Sin dirección disponible
                                          </span>
                                        )}
                                      </div>

                                      {/* Botón siempre al final - con margin-top auto */}
                                      <div className="mt-auto">
                                        {isSelected ? (
                                          <button
                                            type="button"
                                            className="btn btn-success btn-sm w-100 d-flex align-items-center justify-content-center gap-2"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleRemovePOI(poi.id);
                                            }}
                                            style={{
                                              fontWeight: "600",
                                              padding: "0.5rem",
                                            }}
                                          >
                                            <Check size={16} />
                                            Seleccionado
                                          </button>
                                        ) : (
                                          <button
                                            type="button"
                                            className={`btn btn-outline-${colorClass} btn-sm w-100 d-flex align-items-center justify-content-center gap-2`}
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              handleAddPOI(poi);
                                            }}
                                            style={{
                                              fontWeight: "600",
                                              padding: "0.5rem",
                                            }}
                                          >
                                            <Plus size={16} />
                                            Agregar
                                          </button>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          {/* Controles de Paginación */}
                          {getTotalPages() > 1 && (
                            <div className="d-flex justify-content-center align-items-center gap-3 mb-3">
                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() =>
                                  handlePageChange(currentPage - 1)
                                }
                                disabled={currentPage === 1}
                              >
                                <ChevronLeft size={20} />
                                Anterior
                              </button>

                              <div className="d-flex gap-2">
                                {Array.from(
                                  { length: getTotalPages() },
                                  (_, i) => i + 1
                                ).map((page) => {
                                  // Mostrar solo páginas cercanas a la actual
                                  if (
                                    page === 1 ||
                                    page === getTotalPages() ||
                                    (page >= currentPage - 1 &&
                                      page <= currentPage + 1)
                                  ) {
                                    return (
                                      <button
                                        key={page}
                                        type="button"
                                        className={`btn ${
                                          page === currentPage
                                            ? "btn-primary"
                                            : "btn-outline-primary"
                                        }`}
                                        onClick={() => handlePageChange(page)}
                                        style={{ minWidth: "40px" }}
                                      >
                                        {page}
                                      </button>
                                    );
                                  } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                  ) {
                                    return (
                                      <span key={page} className="px-2">
                                        ...
                                      </span>
                                    );
                                  }
                                  return null;
                                })}
                              </div>

                              <button
                                type="button"
                                className="btn btn-outline-primary"
                                onClick={() =>
                                  handlePageChange(currentPage + 1)
                                }
                                disabled={currentPage === getTotalPages()}
                              >
                                Siguiente
                                <ChevronRight size={20} />
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Mensaje cuando no hay POIs */}
                      {formState.city &&
                        !loadingAll.pois &&
                        suggestions.pois.length === 0 && (
                          <div className="alert alert-info">
                            <AlertCircle size={20} className="me-2" />
                            No se encontraron puntos de interés para esta
                            categoría. Prueba con otra categoría.
                          </div>
                        )}

                      {/* Mensaje cuando no hay resultados de búsqueda */}
                      {formState.city &&
                        suggestions.pois.length > 0 &&
                        getFilteredPOIs().length === 0 && (
                          <div className="alert alert-warning">
                            <AlertCircle size={20} className="me-2" />
                            No se encontraron resultados para "
                            {searchState.poiQuery}". Intenta con otro término.
                          </div>
                        )}
                    </>
                  )}

                  {/* VISTA DE MAPA */}
                  {viewMode === "map" && formState.city && (
                    <div className="mb-3">
                      <CreateRouteMap
                        center={
                          formState.coordinates
                            ? [
                                formState.coordinates.lat,
                                formState.coordinates.lon,
                              ]
                            : [40.4168, -3.7038]
                        }
                        pois={suggestions.pois}
                        selectedPOIs={formState.points_of_interest}
                        onPOIClick={(poi) => {
                          const isSelected = formState.points_of_interest.some(
                            (p) => p.id === poi.id
                          );
                          if (isSelected) {
                            handleRemovePOI(poi.id);
                          } else {
                            handleAddPOI(poi);
                          }
                        }}
                        showRoute={true}
                      />
                    </div>
                  )}
                </div>

                {/* Error */}
                {error && (
                  <div
                    className="alert alert-danger d-flex align-items-center gap-2"
                    role="alert"
                  >
                    <AlertCircle size={20} />
                    Necesario Registro
                  </div>
                )}

                {/* Botones */}
                <div className="d-flex gap-2">
                  <button
                    type="submit"
                    className="btn bg-orange text-white px-4"
                    disabled={
                      isSubmitting ||
                      !formState.country ||
                      !formState.city ||
                      formState.points_of_interest.length === 0
                    }
                  >
                    {isSubmitting ? "Creando..." : "Crear Ruta"}
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => navigate(-1)}
                    disabled={isSubmitting}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateRoute;
