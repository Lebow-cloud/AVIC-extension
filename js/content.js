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

// Crear un modal oculto inicialmente
const modal = document.createElement("div");
modal.style.position = "fixed";
modal.style.top = "0";
modal.style.left = "0";
modal.style.width = "100%";
modal.style.height = "100%";
modal.style.backgroundColor = "rgba(0, 0, 0, 0.8)";
modal.style.display = "none";
modal.style.alignItems = "center";
modal.style.justifyContent = "center";
modal.style.zIndex = "10000";

// Contenido del modal
modal.innerHTML = `
  <div style="background: white; padding: 20px; border-radius: 10px; width: 300px; text-align: center;">
    <h2>Introduce el Código</h2>
    <input type="text" id="codigo" placeholder="Introduce tu código" style="width: 100%; padding: 5px; margin-bottom: 10px;" />
    <button id="enviar" style="padding: 5px 10px; width: 100%; background-color: #007bff; color: white; border: none; border-radius: 5px;">Enviar</button>
    <button id="cerrar" style="padding: 5px 10px; width: 100%; margin-top: 10px; background-color: #6c757d; color: white; border: none; border-radius: 5px;">Cerrar</button>
    <div id="mensaje" style="margin-top: 10px; color: green;"></div>
  </div>
`;

// Agregar el modal al DOM
document.body.appendChild(modal);

// Mostrar el modal al hacer clic en el botón flotante
botonFlotante.addEventListener("click", () => {
  modal.style.display = "flex";
});

// Manejar eventos dentro del modal
document.getElementById("enviar").addEventListener("click", () => {
  const codigo = document.getElementById("codigo").value;

  if (codigo.trim() === "") {
    alert("Por favor, introduce un código válido.");
    return;
  }

  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = `El código "${codigo}" se ha enviado correctamente.`;

  // Enviar el código al background.js
  enviarMensaje({ type: "codigoIntroducido", codigo });

  document.getElementById("codigo").value = "";
});

// Ocultar el modal al hacer clic en el botón "Cerrar"
document.getElementById("cerrar").addEventListener("click", () => {
  modal.style.display = "none";
});

// Manejar mensajes del WebSocket reenviados por el background.js
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === "webSocketMessage") {
    console.log("Mensaje del WebSocket:", message.data);
  }
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
