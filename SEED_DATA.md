# 🌍 Generador de Rutas por Defecto - Waypoint App

Este archivo te permite generar **50+ rutas turísticas** de todo el mundo con datos realistas para inicializar tu proyecto Waypoint con contenido diverso.

## 📋 ¿Qué se Genera?

### 👥 **Usuarios**

- 1 Usuario Administrador
- 4 Usuarios normales

### 🗺️ **50 Rutas Turísticas** de:

- **España**: Madrid, Barcelona, Sevilla
- **Francia**: París, Lyon
- **Italia**: Roma, Florencia, Venecia
- **Reino Unido**: Londres, Edimburgo
- **Alemania**: Berlín, Múnich
- **Países Bajos**: Ámsterdam
- **Grecia**: Atenas
- **Portugal**: Lisboa, Oporto
- **Estados Unidos**: Nueva York, San Francisco, Los Ángeles
- **Canadá**: Toronto, Vancouver
- **Japón**: Tokio, Kioto
- **China**: Pekín, Shanghái
- **India**: Nueva Delhi, Agra
- **Australia**: Sídney, Melbourne
- **Brasil**: Río de Janeiro, São Paulo
- **Argentina**: Buenos Aires
- **México**: Ciudad de México, Cancún
- **Perú**: Cusco
- **Chile**: Santiago
- **Colombia**: Cartagena
- **Marruecos**: Marrakech
- **Turquía**: Estambul
- **Egipto**: El Cairo
- **Tailandia**: Bangkok

### ⭐ **Votos Aleatorios**

- Entre 1-5 votos por ruta
- Ratings realistas (tendencia hacia puntuaciones altas)

## 🚀 Formas de Ejecutar

### **Opción 1: Script Independiente (Recomendado)**

```bash
# Desde la raíz del proyecto
python seed_routes.py
```

### **Opción 2: Comandos Flask**

#### Generar solo rutas:

```bash
flask seed-routes
```

#### Generar todo (usuarios + rutas + votos):

```bash
flask insert-test-data
```

#### Crear admin manualmente:

```bash
flask create-admin "Nombre Admin" "admin@email.com" "password123"
```

#### Reiniciar base de datos (⚠️ ELIMINA TODO):

```bash
flask reset-db
```

## 💡 Credenciales de Acceso

Después de ejecutar el script, tendrás estos usuarios disponibles:

### **👨‍💼 Administrador**

- **Email**: `admin@waypoint.com`
- **Password**: `admin123`
- **Rol**: ADMIN

### **👥 Usuarios Normales**

- **Email**: `maria@waypoint.com` | **Password**: `user123`
- **Email**: `juan@waypoint.com` | **Password**: `user123`
- **Email**: `ana@waypoint.com` | **Password**: `user123`
- **Email**: `carlos@waypoint.com` | **Password**: `user123`

## 📊 Estadísticas Generadas

Al finalizar verás algo como:

```
📊 ESTADÍSTICAS FINALES:
   👥 Usuarios: 5
   🗺️ Rutas: 50
   ⭐ Votos: 180
```

## 🔧 Estructura de Datos

### **Rutas Incluyen:**

- **País y Ciudad** reales
- **Localidad/Barrio** específico
- **5 Puntos de Interés** por ruta con nombres reales
- **Coordenadas GPS** precisas para cada punto
- **Autor** (usuario que creó la ruta)

### **Ejemplo de Ruta Generada:**

```json
{
  "country": "España",
  "city": "Madrid",
  "locality": "Centro",
  "points_of_interest": [
    "Museo del Prado",
    "Puerta del Sol",
    "Plaza Mayor",
    "Retiro",
    "Gran Vía"
  ],
  "coordinates": [
    [40.4138, -3.6921], // Prado
    [40.4169, -3.7035], // Puerta del Sol
    [40.4155, -3.7074], // Plaza Mayor
    [40.4153, -3.6844], // Retiro
    [40.42, -3.701] // Gran Vía
  ]
}
```

## ⚠️ Notas Importantes

1. **No Duplicados**: El script verifica si ya existen rutas/usuarios antes de crearlos
2. **Coordenadas Reales**: Todas las coordenadas son de ubicaciones reales
3. **Datos Realistas**: Nombres de lugares, ciudades y puntos de interés auténticos
4. **Seguridad**: Las contraseñas están hasheadas con bcrypt
5. **Votos Variables**: Cada ruta tiene un número aleatorio de votos (1-5)

## 🎯 Casos de Uso

- **Desarrollo**: Tener datos realistas para probar la aplicación
- **Demo**: Mostrar la aplicación con contenido atractivo
- **Testing**: Probar funcionalidades con gran volumen de datos
- **Presentaciones**: Tener rutas variadas de todo el mundo

## 🛠️ Personalización

Para añadir más rutas, edita el array `ROUTES_DATA` en `seed_routes.py`:

```python
{
    "country": "Tu País",
    "city": "Tu Ciudad",
    "locality": "Tu Barrio",
    "points_of_interest": ["POI1", "POI2", "POI3", "POI4", "POI5"],
    "coordinates": [
        [lat1, lng1], [lat2, lng2], [lat3, lng3], [lat4, lng4], [lat5, lng5]
    ]
}
```

---

¡Disfruta explorando el mundo con Waypoint! 🌍✈️
