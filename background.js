let socket = null; // Variable global para el WebSocket
let isReconnecting = false; // Flag para evitar reconexiones múltiples

// Función para conectar al WebSocket
function connectWebSocket() {
  if (isReconnecting) return; // Evita múltiples reconexiones
  console.log("Intentando conectar al WebSocket...");

  socket = new WebSocket("ws://120.86.175.34.bc.googleusercontent.com/extension");

  // Evento: conexión establecida
  socket.onopen = () => {
    console.log("WebSocket conectado");
    isReconnecting = false; // Restablece el flag de reconexión
    socket.send(
      JSON.stringify({ type: "greeting", message: "Hola desde la extensión!" })
    );
  };

  // Evento: mensaje recibido
  socket.onmessage = (event) => {
    console.log("Mensaje recibido del WebSocket:", event.data);

    // Reenvía el mensaje al content.js
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs.length > 0) {
        chrome.tabs.sendMessage(tabs[0].id, {
          type: "webSocketMessage",
          data: event.data,
        });
      }
    });
  };

  // Evento: error en la conexión
  socket.onerror = (error) => {
    console.error("Error en WebSocket:", error);
  };

  // Evento: conexión cerrada
  socket.onclose = (event) => {
    console.warn("WebSocket cerrado:", event.reason || "Sin motivo");
    if (!isReconnecting) {
      isReconnecting = true;
      setTimeout(connectWebSocket, 5000); // Reconecta después de 5 segundos
    }
  };
}

// Llamada inicial para conectar el WebSocket
connectWebSocket();

// Manejar mensajes enviados desde content.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "sendToWebSocket") {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message.data));
      sendResponse({ status: "Mensaje enviado al WebSocket" });
      console.log("Mensaje enviado al WebSocket:", message.data);
    } else {
      console.error("WebSocket no conectado. Mensaje no enviado:", message.data);
      sendResponse({ status: "WebSocket no conectado" });
    }
  }
});

chrome.alarms.create("mantenerActivo", { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "mantenerActivo") {
    console.log("Service Worker activo");
  }
});


