//----------- ICONS -----------

export const NAVBAR_LOGO_SIZE = '48';

export const SETTINGS_ICON_SIZE = 30;

export const NAVBAR_ICON_SIZE = 24;

export const CLOSE_WEATHER_ICON_SIZE = 21;

export const STANDARD_ICON_SIZE = 20;

export const WEATHER_ICON_SIZE = 16;

export const HIDE_OR_SHOW_PASSWORD_ICON_SIZE = 18;

export const FORGOT_PASS_HEADER_ICON_SIZE = 40;

export const CHECKMARK_HEADER_ICON_SIZE = 56;

export const RESET_PASSWORD_HEADER_ICON_DIV_SIZE = {
  width: '80px',
  height: '80px',
  borderColor: 'var(--app-border-accent) !important',
};

export const INPUT_ICON_POSITION = {
  left: '12px',
  top: '12px',
  zIndex: 5,
  pointerEvents: 'none',
};

//----------- DIV SIZES -----------

export const NAVBAR_WIDTH = '250px';

export const WEATHER_WIDGET_WIDTH = '320px';

export const NAVBAR_CHILD_DIV_WIDTH = '220px';

export const AUTH_FORM_WIDTH = '450px';

export const SEARCH_BAR_MAX_WIDTH = '600px';

//----------- FONT SIZES -----------

export const CREATE_ROUTE_FONT_SIZE = '1.1rem';

export const NOT_FOUND_FONT_SIZE = '7rem';

//----------- BACKGROUNDS -----------

export const MODAL_BACKGROUND = 'rgba(0,0,0,0.5)';

//----------- Z-INDEX ----------------

export const NAVBAR_Z_INDEX = 1000;

export const WEATHER_WIDGET_Z_INDEX = 1100;

//----------- IMAGES ----------------

// export const BRAND_NAME_SVG_HEIGHT = '90';

// CONSTANTE PARA OMITIR LAS TILDES Y MAYÚSCULAS/ MINÚSCULAS EN STRINGS

export const normalizeText = (text) => {
  if (!text) return "";
  return text
    .toLowerCase()
    .normalize("NFD") // Descomponer caracteres con tildes
    .replace(/[\u0300-\u036f]/g, ""); // Eliminar marcas diacríticas (tildes)
};

// CONSTANTE PARA PAGINACION 

export const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      
    }
  };

export const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      
    }
  };

export const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
    
  };
