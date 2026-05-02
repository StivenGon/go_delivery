// ===== MENÚ =====
const btn = document.getElementById("btnMenu");
const menu = document.getElementById("menu");

if (btn && menu) {
    btn.addEventListener("click", () => {
        menu.classList.toggle("activo");
    });
}

// Cerrar menú al hacer clic fuera
document.addEventListener("click", (e) => {
    if (btn && menu && !menu.contains(e.target) && !btn.contains(e.target)) {
        menu.classList.remove("activo");
    }
});


// ===== BUSCADOR =====
const buscador = document.querySelector(".buscadores input");
const cards = document.querySelectorAll(".card");

if (buscador) {
    buscador.addEventListener("keyup", () => {
        const texto = buscador.value.toLowerCase();

        cards.forEach(card => {
            const contenido = card.textContent.toLowerCase();

            if (contenido.includes(texto)) {
                card.style.display = "block";
            } else {
                card.style.display = "none";
            }
        });
    });
}


// ===== CLICK EN TARJETAS =====
cards.forEach(card => {
    card.addEventListener("click", () => {
        alert("Seleccionaste: " + card.textContent);
    });
});