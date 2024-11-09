console.log("CARGO CONTENT");

// Variable global para manejar el elemento resaltado
let currentElement = null;

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
document.body.appendChild(dropdown);

// Mostrar el dropdown al hacer clic en el botón flotante
botonFlotante.addEventListener("click", () => {
  if (dropdown.style.display === "none") {
    dropdown.style.display = "block";
    setTimeout(() => {
      dropdown.style.opacity = "1";
      dropdown.style.transform = "scale(1)";
    }, 10);
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
  }, 300);
}

// Manejar el evento del botón "Enviar"
document.getElementById("enviar").addEventListener("click", () => {
  const codigo = document.getElementById("codigo").value;
  if (codigo.trim() === "") {
    alert("Por favor, introduce un código válido.");
    return;
  }
  const mensaje = document.getElementById("mensaje");
  mensaje.textContent = `El código "${codigo}" se ha enviado correctamente.`;
  enviarMensaje({ type: "codigoIntroducido", codigo });
  document.getElementById("codigo").value = "";
});

// Función para enviar un mensaje al background.js
function enviarMensaje(data) {
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
}

// Escucha mensajes enviados desde el background script para resaltar elementos
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Mensaje recibido:", message);
  if (message.action === "highlight") {
    const xPath = message.x_path;
    const element = findElementByXPath(xPath);
    if (element) {
      highlightElement(element, xPath);
    } else {
      console.warn(`Elemento no encontrado para x_path: ${xPath}. Observando cambios...`);
      const observer = new MutationObserver(() => {
        const newElement = findElementByXPath(xPath);
        if (newElement) {
          highlightElement(newElement, xPath);
          observer.disconnect();
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
  if (currentElement) {
    removeHighlight();
  }
  const rect = element.getBoundingClientRect();
  const oval = document.createElement("div");
  Object.assign(oval.style, {
    position: "absolute",
    width: `${rect.width + 40}px`,
    height: `${rect.height + 20}px`,
    border: "2px solid red",
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

  element.addEventListener("click", () => {
    chrome.runtime.sendMessage(
      { action: "sendToWebSocket", data: { x_path } },
      (response) => {
        console.log("Respuesta del background:", response);
      }
    );
    removeHighlight();
  });
}

// Función para remover el highlight
function removeHighlight() {
  if (currentElement) {
    currentElement.remove();
    currentElement = null;
  }
}
