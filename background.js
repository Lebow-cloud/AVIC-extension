let socket = null;
let isReconnecting = false;

// Función para conectar al WebSocket
function connectWebSocket() {
  if (isReconnecting) return;
  console.log("Intentando conectar al WebSocket...");

  socket = new WebSocket(
    "ws://120.86.175.34.bc.googleusercontent.com/extension"
  );

  socket.onopen = () => {
    console.log("WebSocket conectado");
    isReconnecting = false;
    socket.send(
      JSON.stringify({ type: "greeting", message: "Hola desde la extensión!" })
    );
  };

  socket.onmessage = (event) => {
    console.log("Mensaje recibido del WebSocket:", event.data);

    try {
      const message = JSON.parse(event.data);
        // Envía el mensaje al content script
        chrome.tabs.query({}, (tabs) => {
          tabs.forEach((tab) => {
            chrome.tabs.sendMessage(tab.id, {
              action: "highlight",
              x_path: message.x_path,
            });
           
          });
        });
    } catch (e) {
      console.error("Error al parsear el mensaje:", e);
    }
  };

  socket.onclose = () => {
    console.warn("WebSocket cerrado. Reintentando...");
    if (!isReconnecting) {
      isReconnecting = true;
      setTimeout(connectWebSocket, 5000);
    }
  };

  socket.onerror = (error) => {
    console.error("Error en WebSocket:", error);
  };
}

// Llamada inicial para conectar al WebSocket
connectWebSocket();

// Manejo de mensajes desde el Content Script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "verificarWebSocket") {
    // Verifica si el WebSocket está conectado
    if (socket && socket.readyState === WebSocket.OPEN) {
      console.log("WebSocket conectado");
      sendResponse({ status: "WebSocket conectado" });
    } else {
      console.warn("WebSocket no conectado");
      sendResponse({ status: "WebSocket no conectado" });
    }
  } else if (message.type === "sendToWebSocket") {
    // Enviar datos al WebSocket
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message.data));
      console.log("Mensaje enviado al WebSocket:", message.data);
      sendResponse({ status: "Mensaje enviado al WebSocket" });
    } else {
      console.error("WebSocket no conectado. No se puede enviar el mensaje.");
      sendResponse({ status: "WebSocket no conectado" });
    }
  }
  return true; // Mantiene el canal abierto para respuestas asíncronas
});
