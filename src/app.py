from datetime import timedelta
import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, url_for, send_from_directory
from flask_migrate import Migrate
from flask_swagger import swagger
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from api.utils import APIException, generate_sitemap
from api.models import db, bcrypt
from api.routes.routes import api

# Cargar variables de entorno desde .env
load_dotenv()
# from api.admin import setup_admin  # TODO: Crear este archivo
# from api.commands import setup_commands  # TODO: Crear este archivo

# Configuración de variables de entorno
ENV = "development" if os.getenv("FLASK_DEBUG") == "1" else "production"
static_file_dir = os.path.join(
    os.path.dirname(os.path.realpath(__file__)), "../public/"
)
app = Flask(__name__)
app.url_map.strict_slashes = False

# ============================================================================
# CONFIGURACIÓN DE LA BASE DE DATOS
# ============================================================================
db_url = os.getenv("DATABASE_URL")
if db_url is not None:
    app.config["SQLALCHEMY_DATABASE_URI"] = db_url.replace(
        "postgres://", "postgresql://"
    )
else:
    # Base de datos SQLite persistente en el directorio del proyecto
    db_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "waypoint.db")
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{db_path}"

app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False

# ============================================================================
# CONFIGURACIÓN JWT - IMPORTANTE PARA AUTENTICACIÓN
# ============================================================================
# app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=30)  # Token expira en 30 días
app.config["JWT_SECRET_KEY"] = "super-secret"  # Change this!
jwt = JWTManager(app)
# ============================================================================
# INICIALIZAR EXTENSIONES
# ============================================================================
MIGRATE = Migrate(app, db, compare_type=True)
db.init_app(app)
bcrypt.init_app(app)  # Inicializar bcrypt
jwt = JWTManager(app)  # Inicializar JWT

# ============================================================================
# CONFIGURAR CORS
# ============================================================================
CORS(
    app,
    resources={
        r"/api/*": {
            "origins": ["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:3001", "http://127.0.0.1:3001"],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"],
        }
    },
)


# ============================================================================
# REGISTRAR BLUEPRINTS Y COMANDOS
# ============================================================================
app.register_blueprint(api, url_prefix="/api")
# setup_admin(app)  # TODO: Implementar
# setup_commands(app)  # TODO: Implementar


# ============================================================================
# MANEJO DE ERRORES
# ============================================================================
@app.after_request
def after_request(response):
    response.headers.add("Access-Control-Allow-Origin", "*")
    response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
    response.headers.add("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS")
    return response


@app.errorhandler(APIException)
def handle_invalid_usage(error):
    return jsonify(error.to_dict()), error.status_code


# ============================================================================
# RUTAS PRINCIPALES
# ============================================================================
@app.route("/")
def sitemap():
    if ENV == "development":
        return generate_sitemap(app)
    return send_from_directory(static_file_dir, "index.html")


@app.route("/<path:path>", methods=["GET"])
def serve_any_other_file(path):
    if not os.path.isfile(os.path.join(static_file_dir, path)):
        path = "index.html"
    response = send_from_directory(static_file_dir, path)
    response.cache_control.max_age = 0  # avoid cache memory
    return response


# ============================================================================
# CONFIGURACIÓN ADICIONAL JWT
# ============================================================================
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({"message": "Token ha expirado"}), 401


@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({"message": "Token inválido"}), 401


@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({"message": "Token de autorización requerido"}), 401


# ============================================================================
# EJECUTAR APLICACIÓN
# ============================================================================
if __name__ == "__main__":
    PORT = int(os.environ.get("PORT", 3001))
    app.run(host="0.0.0.0", port=PORT, debug=True)
