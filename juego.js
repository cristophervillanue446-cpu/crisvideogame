// ======================================================
// GUERRERO VS NAVES - VERSIÓN WEB
// ======================================================

const canvas = document.getElementById("juego");
const ctx = canvas.getContext("2d");

const WIDTH = 800;
const HEIGHT = 450;

// ======================================================
// IMÁGENES
// ======================================================

const imagenes = {};
const nombresImagenes = [
    "fondo", "walk", "atak", "down", "up", "nave", "misil"
];

for (const nombre of nombresImagenes) {
    const img = new Image();
    img.src = "assets/" + nombre + ".png";
    imagenes[nombre] = img;
}

// ======================================================
// VARIABLES
// ======================================================

let estado = "menu";
let nivel = 1;
let eleccion = 1;
let vidas = 3;
let puntos = 0;

const velocidadJugador = 5;
let velocidadVertical = 0;
const gravedad = 0.7;
const suelo = 350;

let saltando = false;
let agachado = false;
let atacando = false;
let direccion = 1;

const jugador = {
    x: 150,
    y: suelo,
    ancho: 70,
    alto: 90,
    imagen: "walk"
};

let naves = [];

const misil = {
    x: -100,
    y: -100,
    ancho: 45,
    alto: 20
};

let misilActivo = false;
let velocidadMisil = 7;
let naveDisparadora = null;

let tiempoDisparo = 0;
let tiempoAtaque = 0;
const teclas = {};
let espacioAnterior = false;

// ======================================================
// TECLADO
// ======================================================

window.addEventListener("keydown", function(e) {
    teclas[e.key.toLowerCase()] = true;

    if (
        e.code === "Space" ||
        e.key.startsWith("Arrow")
    ) {
        e.preventDefault();
    }
});

window.addEventListener("keyup", function(e) {
    teclas[e.key.toLowerCase()] = false;
});

// ======================================================
// FUNCIONES
// ======================================================

function cambiarSprite(nombre) {
    jugador.imagen = nombre;
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function crearNaves() {
    naves = [];

    const posicionesY = [90, 140, 200, 260, 300];
    const cantidad = nivel + 1;

    for (let i = 0; i < cantidad; i++) {
        naves.push({
            x: randomInt(550, 750),
            y: posicionesY[randomInt(0, posicionesY.length - 1)],
            ancho: 70,
            alto: 45,
            velocidad: randomFloat(
                1.0 + nivel * 0.2,
                2.0 + nivel * 0.3
            )
        });
    }
}

function iniciarJuego() {
    estado = "jugando";
    nivel = eleccion;
    vidas = 3;
    puntos = 0;

    jugador.x = 150;
    jugador.y = suelo;

    velocidadVertical = 0;
    saltando = false;
    agachado = false;
    atacando = false;

    misilActivo = false;
    misil.x = -100;
    misil.y = -100;

    tiempoDisparo = 0;
    tiempoAtaque = 0;
    naveDisparadora = null;
    espacioAnterior = false;

    cambiarSprite("walk");
    crearNaves();
}

function siguienteNivel() {
    nivel++;
    puntos += 100;

    misilActivo = false;
    misil.x = -100;
    misil.y = -100;

    tiempoDisparo = 0;
    tiempoAtaque = 0;

    jugador.x = 150;
    jugador.y = suelo;
    cambiarSprite("walk");

    if (nivel > 3) {
        estado = "ganaste";
        return;
    }

    crearNaves();
}

function elegirNivel(numero) {
    eleccion = numero;
    iniciarJuego();
}

function jugadorMuere() {
    vidas--;

    misilActivo = false;
    misil.x = -100;
    misil.y = -100;

    jugador.x = 150;
    jugador.y = suelo;

    velocidadVertical = 0;
    saltando = false;
    agachado = false;
    atacando = false;

    cambiarSprite("walk");

    if (vidas <= 0) {
        estado = "perdiste";
    }
}

function dispararMisil() {
    if (naves.length === 0) return;

    naveDisparadora =
        naves[randomInt(0, naves.length - 1)];

    misilActivo = true;
    misil.x = naveDisparadora.x - 50;
    misil.y = naveDisparadora.y;

    velocidadMisil = randomInt(6 + nivel, 9 + nivel);
}

function atacar() {
    cambiarSprite("atak");

    const golpeX = jugador.x + (65 * direccion);
    const golpeY = jugador.y;

    for (let i = 0; i < naves.length; i++) {
        const nave = naves[i];

        const distanciaX = Math.abs(golpeX - nave.x);
        const distanciaY = Math.abs(golpeY - nave.y);

        if (distanciaX < 80 && distanciaY < 80) {
            naves.splice(i, 1);
            puntos += 50;
            break;
        }
    }

    if (naves.length === 0) {
        siguienteNivel();
    }
}

function colision(a, b) {
    return (
        a.x - a.ancho / 2 < b.x + b.ancho / 2 &&
        a.x + a.ancho / 2 > b.x - b.ancho / 2 &&
        a.y - a.alto / 2 < b.y &&
        a.y + a.alto / 2 > b.y - b.alto
    );
}

// ======================================================
// UPDATE
// ======================================================

function actualizar() {
    if (estado === "menu") {
        if (teclas["1"]) {
            elegirNivel(1);
            teclas["1"] = false;
        } else if (teclas["2"]) {
            elegirNivel(2);
            teclas["2"] = false;
        } else if (teclas["3"]) {
            elegirNivel(3);
            teclas["3"] = false;
        }
        return;
    }

    if (estado === "perdiste" || estado === "ganaste") {
        if (teclas["enter"]) {
            iniciarJuego();
            teclas["enter"] = false;
        }
        return;
    }

    if (teclas["arrowleft"]) {
        jugador.x -= velocidadJugador;
        direccion = -1;
    }

    if (teclas["arrowright"]) {
        jugador.x += velocidadJugador;
        direccion = 1;
    }

    jugador.x = Math.max(40, Math.min(WIDTH - 40, jugador.x));

    agachado = false;

    if (teclas["arrowdown"] && !saltando) {
        agachado = true;
        cambiarSprite("down");
    }

    if (
        teclas["arrowup"] &&
        !saltando &&
        !agachado
    ) {
        velocidadVertical = -12;
        saltando = true;
    }

    if (saltando) {
        jugador.y += velocidadVertical;
        velocidadVertical += gravedad;
        cambiarSprite("up");

        if (jugador.y >= suelo) {
            jugador.y = suelo;
            velocidadVertical = 0;
            saltando = false;
        }
    }

    atacando = false;

    const espacio =
        teclas[" "] || teclas["space"];

    if (espacio && !espacioAnterior) {
        atacando = true;
        tiempoAtaque = 0;
        atacar();
    }

    espacioAnterior = espacio;

    if (espacio) {
        atacando = true;
        cambiarSprite("atak");
    }

    if (!saltando && !agachado && !atacando) {
        cambiarSprite("walk");
    }

    // Naves
    for (const nave of naves) {
        nave.x -= nave.velocidad;

        if (nave.x < -100) {
            nave.x = randomInt(650, 850);

            const posicionesY = [90, 140, 200, 260, 300];
            nave.y =
                posicionesY[
                    randomInt(0, posicionesY.length - 1)
                ];
        }
    }

    // Disparos
    tiempoDisparo++;

    let limiteDisparo = 150 - (nivel * 25);
    if (limiteDisparo < 60) limiteDisparo = 60;

    if (
        tiempoDisparo >= limiteDisparo &&
        !misilActivo
    ) {
        dispararMisil();
        tiempoDisparo = 0;
    }

    // Misil
    if (misilActivo) {
        misil.x -= velocidadMisil;

        if (misil.x < -100) {
            misilActivo = false;
            misil.x = -100;
            misil.y = -100;
        }

        if (
            misilActivo &&
            colision(misil, jugador) &&
            !agachado
        ) {
            jugadorMuere();
        }
    }
}

// ======================================================
// DRAW
// ======================================================

function dibujarImagen(imagen, x, y, ancho, alto) {
    if (
        imagen &&
        imagen.complete &&
        imagen.naturalWidth > 0
    ) {
        ctx.drawImage(imagen, x, y, ancho, alto);
    } else {
        ctx.fillStyle = "magenta";
        ctx.fillRect(x, y, ancho, alto);
    }
}

function texto(contenido, x, y, tamaño) {
    ctx.fillStyle = "white";
    ctx.font = "bold " + tamaño + "px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(contenido, x, y);
}

function textoIzquierda(contenido, x, y, tamaño) {
    ctx.fillStyle = "white";
    ctx.font = "bold " + tamaño + "px Arial";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(contenido, x, y);
}

function dibujar() {
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    dibujarImagen(
        imagenes.fondo,
        0, 0, WIDTH, HEIGHT
    );

    if (estado === "menu") {
        texto("GUERRERO VS NAVES", 400, 60, 48);
        texto("ELIGE TU NIVEL", 400, 120, 30);
        texto("1 - NIVEL FACIL", 400, 180, 25);
        texto("2 - NIVEL MEDIO", 400, 220, 25);
        texto("3 - NIVEL EXPERTO", 400, 260, 25);
        texto("FLECHAS = MOVER", 400, 310, 19);
        texto("ARRIBA = SALTAR", 400, 335, 19);
        texto("ABAJO = AGACHARSE", 400, 360, 19);
        texto("ESPACIO = ATACAR", 400, 385, 19);
        return;
    }

    if (estado === "jugando") {
        const altoJugador =
            agachado ? 60 : jugador.alto;

        dibujarImagen(
            imagenes[jugador.imagen],
            jugador.x - jugador.ancho / 2,
            jugador.y - altoJugador,
            jugador.ancho,
            altoJugador
        );

        for (const nave of naves) {
            dibujarImagen(
                imagenes.nave,
                nave.x - nave.ancho / 2,
                nave.y - nave.alto / 2,
                nave.ancho,
                nave.alto
            );
        }

        if (misilActivo) {
            dibujarImagen(
                imagenes.misil,
                misil.x - misil.ancho / 2,
                misil.y - misil.alto / 2,
                misil.ancho,
                misil.alto
            );
        }

        textoIzquierda("NIVEL: " + nivel, 15, 30, 22);
        textoIzquierda("VIDAS: " + vidas, 15, 58, 22);
        textoIzquierda("PUNTOS: " + puntos, 15, 86, 22);
        textoIzquierda("NAVES: " + naves.length, 650, 30, 22);
        return;
    }

    if (estado === "perdiste") {
        texto("HAS PERDIDO", 400, 130, 55);
        texto("LAS NAVES TE DERROTARON", 400, 200, 30);
        texto("PUNTOS: " + puntos, 400, 250, 30);
        texto("PULSA ENTER PARA REINICIAR", 400, 320, 25);
        return;
    }

    if (estado === "ganaste") {
        texto("¡HAS GANADO!", 400, 130, 55);
        texto("¡DESTRUISTE TODAS LAS NAVES!", 400, 200, 30);
        texto("PUNTOS: " + puntos, 400, 250, 30);
        texto("PULSA ENTER PARA JUGAR OTRA VEZ", 400, 320, 24);
    }
}

// ======================================================
// BUCLE
// ======================================================

function bucle() {
    actualizar();
    dibujar();
    requestAnimationFrame(bucle);
}

bucle();
