// ===== CONTADOR DE ACTUALIZACIÓN =====
let tiempo = 5;
const titulo = document.querySelector("h1");

setInterval(() => {
    tiempo--;
    titulo.textContent = "Pedidos Recibidos";

    if (tiempo === 0) {
        location.reload();
    }
}, 1000);


// ===== CONFIRMACIONES =====
const forms = document.querySelectorAll("form");

forms.forEach(form => {
    form.addEventListener("submit", (e) => {

        const accion = form.getAttribute("action");
        let mensaje = "";

        if (accion === "/aceptar_pedido") {
            mensaje = "¿Aceptar este pedido?";
        }

        if (accion === "/rechazar_pedido") {
            mensaje = "¿Rechazar este pedido?";
        }

        if (!confirm(mensaje)) {
            e.preventDefault();
        }
    });
});


// ===== EFECTO VISUAL =====
const cards = document.querySelectorAll("article");

cards.forEach(card => {
    card.addEventListener("click", () => {
        card.style.background = "#fff3cd";

        setTimeout(() => {
            card.style.background = "white";
        }, 300);
    });
});