from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
import sqlite3

app = Flask(__name__)
CORS(app)

# --- CONFIGURACIÓN DE BASE DE DATOS ---
def init_db():
    conn = sqlite3.connect('subsonica.db')
    cursor = conn.cursor()
    # Tabla de Bandas
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS bandas (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nombre TEXT NOT NULL,
            genero TEXT,
            origen TEXT,
            imagen TEXT,
            bio TEXT
        )
    ''')
    # Tabla de Canciones
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS canciones (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            banda TEXT NOT NULL,
            titulo TEXT NOT NULL,
            album TEXT,
            link TEXT,
            duracion TEXT
        )
    ''')
    conn.commit()
    conn.close()

# Inicializar la base de datos al arrancar
init_db()

# --- RUTAS PARA NAVEGACIÓN (FRONTEND) ---
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/bandas')
def pagina_bandas():
    return render_template('bandas.html')

@app.route('/canciones')
def pagina_canciones():
    return render_template('canciones.html')

@app.route('/registrar-banda')
def pagina_registro_banda():
    return render_template('registrarBanda.html')

@app.route('/registrar-cancion')
def pagina_registro_cancion():
    return render_template('registrarCancion.html')

@app.route('/perfil-banda')
def pagina_perfil():
    return render_template('perfil-banda.html')

@app.route('/buscar')
def pagina_buscar():
    return render_template('buscar.html')

@app.route('/login')
def pagina_iniciar_sesion():
    return render_template('login.html')

@app.route('/registro')
def pagina_registrarse():
    return render_template('registro.html')

# --- RUTAS DE API (PARA EL JAVASCRIPT) ---

@app.route('/api/bandas', methods=['GET', 'POST'])
def gestionar_bandas():
    conn = sqlite3.connect('subsonica.db')
    cursor = conn.cursor()
    
    if request.method == 'POST':
        datos = request.json
        cursor.execute('INSERT INTO bandas (nombre, genero, origen, imagen, bio) VALUES (?, ?, ?, ?, ?)',
                       (datos['nombre'], datos['genero'], datos['origen'], datos['imagen'], datos['bio']))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 201
    
    cursor.execute('SELECT * FROM bandas')
    filas = cursor.fetchall()
    bandas = [{"nombre": f[1], "genero": f[2], "origen": f[3], "imagen": f[4], "bio": f[5]} for f in filas]
    conn.close()
    return jsonify(bandas)

@app.route('/api/canciones', methods=['GET', 'POST'])
def gestionar_canciones():
    conn = sqlite3.connect('subsonica.db')
    cursor = conn.cursor()

    if request.method == 'POST':
        datos = request.json
        cursor.execute('INSERT INTO canciones (banda, titulo, album, link, duracion) VALUES (?, ?, ?, ?, ?)',
                       (datos['banda'], datos['titulo'], datos['album'], datos['link'], datos['duracion']))
        conn.commit()
        conn.close()
        return jsonify({"status": "success"}), 201

    cursor.execute('SELECT * FROM canciones')
    filas = cursor.fetchall()
    canciones = [{"banda": f[1], "titulo": f[2], "album": f[3], "link": f[4], "duracion": f[5]} for f in filas]
    conn.close()
    return jsonify(canciones)

if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)