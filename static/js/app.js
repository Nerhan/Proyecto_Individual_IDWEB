/* --- CONFIGURACIÓN DE DATOS (EL PUENTE) --- */
const obtenerDatos = async (clave) => {
    try {
        // Usamos la ruta relativa que Flask entiende perfectamente
        const respuesta = await fetch(`/api/${clave}`);
        if (!respuesta.ok) throw new Error('Error al obtener datos del servidor');
        return await respuesta.json();
    } catch (error) {
        console.error("Error en obtenerDatos:", error);
        return [];
    }
};

const guardarEnBaseDeDatos = async (clave, objeto) => {
    try {
        const respuesta = await fetch(`/api/${clave}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(objeto)
        });
        
        if (!respuesta.ok) throw new Error('Error al guardar en el servidor');
        
        return await respuesta.json();
    } catch (error) {
        console.error("Error en guardarEnBaseDeDatos:", error);
        return { status: "error" };
    }
};

/* --- LÓGICA DE BANDAS --- */

const inicializarBandas = async () => {
    const gridBandas = document.querySelector('.contenedor-grid');
    if (!gridBandas) return;

    const bandas = await obtenerDatos('bandas');
    
    // Limpiamos y renderizamos
    gridBandas.innerHTML = ""; 
    bandas.forEach(banda => {
        gridBandas.innerHTML += crearTarjetaBanda(banda);
    });
};

const crearTarjetaBanda = (banda) => `
    <article class="tarjeta-banda">
        <div class="imagen-banda">
            <img src="${banda.imagen}" alt="${banda.nombre}">
        </div>
        <div class="info-banda">
            <h3>${banda.nombre}</h3>
            <p>Género: ${banda.genero}</p>
            <a href="/perfil-banda?id=${encodeURIComponent(banda.nombre)}" class="boton-ver">Ver Perfil</a>
        </div>
    </article>`;

/* --- LÓGICA DE CANCIONES --- */

const inicializarCanciones = async () => {
    const listaCanciones = document.querySelector('.lista-canciones');
    if (!listaCanciones) return;

    const canciones = await obtenerDatos('canciones');
    // Mantenemos el header y añadimos las filas
    const header = listaCanciones.querySelector('.track-header').outerHTML;
    listaCanciones.innerHTML = header;

    canciones.forEach((track, index) => {
        listaCanciones.innerHTML += `
            <div class="track-item">
                <span class="track-num">${String(index + 1).padStart(2, '0')}</span>
                <div class="track-info">
                    <span class="track-name">${track.titulo}</span>
                    <span class="track-artist">${track.banda}</span>
                </div>
                <span class="track-album">${track.album}</span>
                <a href="${track.link}" target="_blank" class="btn-escuchar">Escuchar</a>
            </div>`;
    });
};

/* --- MANEJADORES DE FORMULARIOS --- */

document.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;

    // Registro de Bandas
    if (form.id === 'form-registro-banda') {
        const nuevaBanda = {
            nombre: document.getElementById('nombre').value,
            genero: document.getElementById('genero').value,
            origen: document.getElementById('origen').value,
            imagen: document.getElementById('imagen').value || "https://via.placeholder.com/300",
            bio: document.getElementById('bio').value
        };
        await guardarEnBaseDeDatos('bandas', nuevaBanda);
        window.location.href = '/bandas';
    }

    // Registro de Canciones
    if (form.id === 'form-registro-cancion') {
        const nuevaCancion = {
            banda: document.getElementById('banda-vinculo').value,
            titulo: document.getElementById('titulo-cancion').value,
            album: document.getElementById('album').value,
            link: document.getElementById('link-escuchar').value,
            duracion: document.getElementById('duracion').value
        };
        await guardarEnBaseDeDatos('canciones', nuevaCancion);
        window.location.href = '/canciones';
    }
});

/* --- BUSCADOR --- */

const ejecutarBusqueda = async () => {
    const input = document.getElementById('input-busqueda');
    const contenedor = document.getElementById('resultados-busqueda');
    if (!input || !contenedor) return;

    const termino = input.value.toLowerCase();
    if (!termino) return;

    const bandas = await obtenerDatos('bandas');
    const canciones = await obtenerDatos('canciones');

    contenedor.innerHTML = ""; // Limpiar

    // Buscar en Bandas
    const bandasFiltradas = bandas.filter(b => b.nombre.toLowerCase().includes(termino) || b.genero.toLowerCase().includes(termino));
    
    // Buscar en Canciones
    const cancionesFiltradas = canciones.filter(c => c.titulo.toLowerCase().includes(termino) || c.banda.toLowerCase().includes(termino));

    if (bandasFiltradas.length === 0 && cancionesFiltradas.length === 0) {
        contenedor.innerHTML = `<p class="msj-espera">Sin resultados para "${termino}"</p>`;
        return;
    }

    // Mostrar Bandas encontradas
    bandasFiltradas.forEach(b => {
        contenedor.innerHTML += `<div class="resultado-item"><strong>BANDA:</strong> ${b.nombre} (${b.genero}) <a href="perfil-banda.html?id=${b.nombre}">Ver más</a></div>`;
    });

    // Mostrar Canciones encontradas
    cancionesFiltradas.forEach(c => {
        contenedor.innerHTML += `<div class="resultado-item"><strong>TRACK:</strong> ${c.titulo} - de ${c.banda} <a href="canciones.html">Escuchar</a></div>`;
    });
};

/* --- PERFIL AUTOMÁTICO (perfil-banda.html) --- */
const cargarPerfilBanda = async () => {
    const params = new URLSearchParams(window.location.search);
    const nombreBandaURL = params.get('id'); // El nombre que viene de la URL
    if (!nombreBandaURL || !document.getElementById('banda-nombre')) return;

    const bandas = await obtenerDatos('bandas');
    const canciones = await obtenerDatos('canciones');
    
    // Buscamos la banda comparando en minúsculas para evitar errores
    const banda = bandas.find(b => b.nombre.trim().toLowerCase() === nombreBandaURL.trim().toLowerCase());

    if (banda) {
        document.getElementById('banda-nombre').innerText = banda.nombre;
        document.getElementById('banda-genero').innerText = banda.genero;
        document.getElementById('banda-bio').innerText = banda.bio;
        document.getElementById('banda-imagen-grande').src = banda.imagen;
        document.getElementById('banda-origen').innerText = banda.origen || "Origen Desconocido";

        // --- EL VÍNCULO CRÍTICO ---
        // Filtramos las canciones asegurándonos de que ambos nombres coincidan sin importar mayúsculas
        const misCanciones = canciones.filter(c => 
            c.banda.trim().toLowerCase() === banda.nombre.trim().toLowerCase()
        );

        const lista = document.getElementById('banda-discos');
        lista.innerHTML = misCanciones.length > 0 
            ? misCanciones.map(c => `
            <li>
                <div class="track-perfil-info">
                    <strong>${c.titulo}</strong>
                    <span>${c.album || 'Single'}</span>
                </div>
                <a href="${c.link}" target="_blank" class="btn-escuchar-perfil">OÍR</a>
            </li>`).join('')
        : "<li>No hay tracks registrados aún para esta banda.</li>";
    }
};

// Evento para el botón de búsqueda
document.getElementById('btn-buscar')?.addEventListener('click', ejecutarBusqueda);

/* --- INICIO AUTOMÁTICO --- */
window.onload = () => {
    inicializarBandas();
    inicializarCanciones();
    cargarPerfilBanda();
    document.getElementById('btn-buscar')?.addEventListener('click', ejecutarBusqueda);
};