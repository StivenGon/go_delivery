// ===== AUTO ACTUALIZACIÓN MÁS INTELIGENTE =====

// En vez de recargar toda la página,
// solo mostramos aviso antes de actualizar

let tiempo = 5;

const titulo = document.querySelector("h1");

// contador visual
setInterval(() => {
    tiempo--;
    titulo.textContent = "Pedidos disponibles ";

    if (tiempo === 0) {
        location.reload();
    }
}, 1000);


// ===== CONFIRMACIÓN DE ACCIONES =====
const formularios = document.querySelectorAll("form");

formularios.forEach(form => {
    form.addEventListener("submit", (e) => {

        const accion = form.getAttribute("action");

        let mensaje = "";

        if (accion === "/tomar_pedido") {
            mensaje = "¿Tomar este pedido?";
        }

        if (accion === "/entregar_pedido") {
            mensaje = "¿Marcar como entregado?";
        }

        if (!confirm(mensaje)) {
            e.preventDefault();
        }
    });
});


// ===== EFECTO VISUAL AL HACER CLICK =====
const cards = document.querySelectorAll("article");

cards.forEach(card => {
    card.addEventListener("click", () => {
        card.style.background = "#e3f2fd";

        setTimeout(() => {
            card.style.background = "white";
        }, 300);
    });
});