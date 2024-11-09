let socket = null; // WebSocket global
let isReconnecting = false; // Flag para reconexión
let currentElement = null; // Elemento actualmente resaltado
// Función para conectar al WebSocket
function connectWebSocket() {
  if (isReconnecting) return; // Evitar múltiples reconexiones
  console.log("Intentando conectar al WebSocket...");

 // socket = new WebSocket("ws://192.168.1.71:8080/dani_test");
  socket = new WebSocket("ws://120.86.175.34.bc.googleusercontent.com/extension");


  // Evento: conexión establecida
  socket.onopen = () => {
    console.log("WebSocket conectado");
    isReconnecting = false; // Reset reconexión
    socket.send(
      JSON.stringify({ type: "greeting", message: "Hola desde la extensión!" })
    );
  };

  // Evento: mensaje recibido
  socket.onmessage = (event) => {
    console.log("Mensaje recibido del WebSocket:", event.data);

    try {
      const message = JSON.parse(event.data);
      if (message.x_path) {
        handleStep(message.x_path); // Procesar el paso recibido con el x_path
      } else {
        console.warn("Mensaje del backend sin x_path:", message);
      }
    } catch (e) {
      console.error("Error al parsear el mensaje del WebSocket:", e);
    }
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

// Llamada inicial para conectar al WebSocket
connectWebSocket();

// Función para manejar un paso basado en el x_path
function handleStep(x_path) {
  console.log(`Procesando paso para x_path: ${x_path}`);
  const element = findElementByXPath(x_path);
  if (element) {
    highlightElement(element, x_path); // Resaltar el elemento y agregar click handler
  } else {
    console.warn(
      `Elemento no encontrado para x_path: ${x_path}. Observando cambios...`
    );

    // Crear un MutationObserver para detectar cambios en el DOM
    const observer = new MutationObserver(() => {
      const newElement = findElementByXPath(x_path);
      if (newElement) {
        console.log(`Elemento encontrado para x_path: ${x_path} via observer`);
        highlightElement(newElement, x_path); // Resaltar el nuevo elemento
        observer.disconnect(); // Detener el observer
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// Función para buscar un elemento por XPath
function findElementByXPath(xpathExpression) {
  const result = document.evaluate(
    xpathExpression,
    document,
    null,
    XPathResult.FIRST_ORDERED_NODE_TYPE,
    null
  );
  return result.singleNodeValue;
}

// Función para resaltar un elemento
function highlightElement(element, x_path) {
  console.log(`Resaltando elemento para x_path: ${x_path}`);

  if (currentElement) {
    removeHighlight(); // Remover el highlight anterior
  }

  const rect = element.getBoundingClientRect();
  const oval = document.createElement("div");

  // Estilizar el óvalo
  oval.style.position = "absolute";
  oval.style.width = `${rect.width + 40}px`;
  oval.style.height = `${rect.height + 20}px`;
  oval.style.border = "2px solid red"; // Cambiado a rojo para mayor visibilidad
  oval.style.borderRadius = "50%";
  oval.style.boxShadow = "0 0 20px 5px rgba(255, 0, 0, 0.8)";
  oval.style.backgroundColor = "transparent";
  oval.style.top = `${rect.top - 10 + window.scrollY}px`;
  oval.style.left = `${rect.left - 20 + window.scrollX}px`;
  oval.style.pointerEvents = "none";
  oval.style.zIndex = "10000";

  document.body.appendChild(oval);
  currentElement = oval;

  // Agregar evento de clic al elemento original
  element.addEventListener("click", () => {
    alert("CLICK")
    console.log(`Elemento clicado para x_path: ${x_path}`);
    sendMessageToWebSocket({
      event: "elementClicked",
      x_path, 
      timestamp: new Date().toISOString(),
    });
    removeHighlight(); // Opcional: remover el highlight después del clic
  });
}

// Función para remover el highlight
function removeHighlight() {
  if (currentElement) {
    currentElement.remove();
    currentElement = null;
  }
}

// Función para enviar mensaje al WebSocket
function sendMessageToWebSocket(data) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(data));
    console.log("Mensaje enviado al WebSocket:", data);
  } else {
    console.error("WebSocket no conectado. Mensaje no enviado:", data);
  }
}
