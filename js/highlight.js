let currentElement = null; // Elemento actualmente resaltado

// Escucha mensajes enviados desde el background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "highlight") {
    const xPath = message.x_path;
    console.log(`Procesando paso para x_path: ${xPath}`);
    const element = findElementByXPath(xPath);
    if (element) {
      highlightElement(element, xPath); // Resaltar el elemento
    } else {
      console.warn(`Elemento no encontrado para x_path: ${xPath}. Observando cambios...`);

      // Crear un MutationObserver para detectar cambios en el DOM
      const observer = new MutationObserver(() => {
        const newElement = findElementByXPath(xPath);
        if (newElement) {
          console.log(`Elemento encontrado para x_path: ${xPath} via observer`);
          highlightElement(newElement, xPath); // Resaltar el nuevo elemento
          observer.disconnect(); // Detener el observer
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
    }
  }
});

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
  Object.assign(oval.style, {
    position: "absolute",
    width: `${rect.width + 40}px`,
    height: `${rect.height + 20}px`,
    border: "2px solid red", // Cambiado a rojo para mayor visibilidad
    borderRadius: "50%",
    boxShadow: "0 0 20px 5px rgba(255, 0, 0, 0.8)",
    backgroundColor: "transparent",
    top: `${rect.top - 10 + window.scrollY}px`,
    left: `${rect.left - 20 + window.scrollX}px`,
    pointerEvents: "none",
    zIndex: "10000",
  });

  document.body.appendChild(oval);
  currentElement = oval;

  // Agregar evento de clic al elemento original
  const handleClick = () => {
    console.log(`Elemento clicado para x_path: ${x_path}`);

    // Enviar mensaje al background script
    chrome.runtime.sendMessage(
      { action: "sendToWebSocket", data: { x_path: x_path } },
      (response) => {
        console.log("Respuesta del background:", response);
      }
    );

    removeHighlight(); // Opcional: remover el highlight después del clic
    element.removeEventListener("click", handleClick); // Remover listener
  };

  element.addEventListener("click", handleClick);
}

// Función para remover el highlight
function removeHighlight() {
  if (currentElement) {
    currentElement.remove();
    currentElement = null;
  }
}
