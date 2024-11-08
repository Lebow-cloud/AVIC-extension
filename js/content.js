// Crear un botón flotante como imagen
const botonFlotante = document.createElement("img");
botonFlotante.src = chrome.runtime.getURL("images/icon.png");
botonFlotante.alt = "Abrir Modal";
botonFlotante.style.position = "fixed";
botonFlotante.style.top = "45px";
botonFlotante.style.right = "10px";
botonFlotante.style.width = "50px";
botonFlotante.style.height = "50px";
botonFlotante.style.cursor = "pointer";
botonFlotante.style.zIndex = "10000";
botonFlotante.style.borderRadius = "50%";
botonFlotante.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
document.body.appendChild(botonFlotante);

// Crear un dropdown oculto inicialmente
const dropdown = document.createElement("div");
dropdown.style.position = "absolute";
dropdown.style.top = "90px"; // Posicionado debajo del botón
dropdown.style.right = "10px";
dropdown.style.width = "300px";
dropdown.style.padding = "20px";
dropdown.style.backgroundColor = "white";
dropdown.style.borderRadius = "10px";
dropdown.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
dropdown.style.display = "none"; // Oculto inicialmente
dropdown.style.zIndex = "10000";
dropdown.style.transition = "opacity 0.3s ease, transform 0.3s ease"; // Transiciones suaves
dropdown.style.opacity = "0";
dropdown.style.transform = "scale(0.95)"; // Efecto de contracción inicial

// Contenido del dropdown
dropdown.innerHTML = `
  <h2 style="margin-top: 0; margin-bottom: 12px; font-size: 18px; color: #333;">Introduce el Código</h2>
  <input type="text" id="codigo" placeholder="Introduce tu código" 
    style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ddd; border-radius: 5px; font-size: 14px;" />
  <button id="enviar" 
    style="padding: 10px; width: 100%; background-color: #007bff; color: white; border: none; border-radius: 5px; font-size: 14px; cursor: pointer;">
    Enviar
  </button>
  <div id="mensaje" style="margin-top: 10px; color: green; font-size: 14px;"></div>
`;

// Agregar el dropdown al DOM
document.body.appendChild(dropdown);

// Mostrar el dropdown al hacer clic en el botón flotante
botonFlotante.addEventListener("click", () => {
  if (dropdown.style.display === "none") {
    dropdown.style.display = "block";
    setTimeout(() => {
      dropdown.style.opacity = "1";
      dropdown.style.transform = "scale(1)";
    }, 10); // Pequeño retraso para aplicar la transición
  } else {
    closeDropdown();
  }
});

// Cerrar el dropdown al hacer clic fuera
document.addEventListener("click", (event) => {
  if (!dropdown.contains(event.target) && event.target !== botonFlotante) {
    closeDropdown();
  }
});

// Función para cerrar el dropdown
function closeDropdown() {
  dropdown.style.opacity = "0";
  dropdown.style.transform = "scale(0.95)";
  setTimeout(() => {
    dropdown.style.display = "none";
  }, 300); // Esperar a que termine la transición
}

// Manejar el evento del botón "Enviar"
document.getElementById("enviar").addEventListener("click", () => {
  const codigo = document.getElementById("codigo").value;

  if (codigo.trim() === "") {
    alert("Por favor, introduce un código válido.");
    return;
  }

  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = `El codi "${codigo}" s'ha enviat correctament.`;

  // Enviar el código al background.js
  enviarMensaje({ type: "codigoIntroducido", codigo });

  document.getElementById("codigo").value = "";
});

// Función para enviar un mensaje al WebSocket
function enviarMensaje(data) {
  verificarWebSocket(() => {
    chrome.runtime.sendMessage(
      { type: "sendToWebSocket", data },
      (response) => {
        if (response.status === "Mensaje enviado al WebSocket") {
          console.log("Mensaje enviado:", data);
        } else {
          console.error("Error al enviar mensaje:", response.status);
        }
      }
    );
  });
}

// Función para verificar la conexión del WebSocket
function verificarWebSocket(callback) {
  chrome.runtime.sendMessage({ type: "verificarWebSocket" }, (response) => {
    if (response && response.status === "WebSocket conectado") {
      console.log("WebSocket conectado");
      if (callback) callback();
    } else {
      console.error("WebSocket no conectado");
      alert("WebSocket no está conectado. Intenta de nuevo más tarde.");
    }
  });
}
