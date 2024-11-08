let currentElement = null; // Currently highlighted element
let overlay = null; // Overlay for fade effect

// Function to find an element by XPath
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

// Function to create overlay for fade effect
function createOverlay() {
  overlay = document.createElement("div");
  overlay.style.position = "fixed";
  overlay.style.top = "0";
  overlay.style.left = "0";
  overlay.style.width = "100%";
  overlay.style.height = "100%";
  overlay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
  overlay.style.zIndex = "9999";
  overlay.style.pointerEvents = "none"; // Prevent interaction with the overlay
  document.body.appendChild(overlay);
}

// Function to highlight an element with a white circle
function highlightElement(element) {
  if (!overlay) {
    createOverlay();
  }

  const rect = element.getBoundingClientRect();
  const circle = document.createElement("div");

  circle.style.position = "absolute";
  circle.style.width = `${rect.width + 20}px`; // Add padding to the circle
  circle.style.height = `${rect.height + 20}px`;
  circle.style.border = "2px solid white";
  circle.style.borderRadius = "50%";
  circle.style.boxShadow = "0 0 15px 5px white";
  circle.style.top = `${rect.top - 10 + window.scrollY}px`;
  circle.style.left = `${rect.left - 10 + window.scrollX}px`;
  circle.style.pointerEvents = "none"; // Prevent interaction with the circle
  circle.style.zIndex = "10000";

  overlay.appendChild(circle);
}

// Function to remove highlighting and overlay
function removeHighlight() {
  if (overlay) {
    overlay.remove();
    overlay = null;
  }
}

// Function to handle a specific step
function handleStep(step) {
  const { x_path, text } = step;

  console.log(`Handling step: ${text}`);

  const node = findElementByXPath(x_path);

  if (node) {
    // Remove previous highlight
    removeHighlight();

    // Highlight the new element
    highlightElement(node);
    currentElement = node;

    // Add click event to advance
    node.addEventListener("click", () => {
      console.log(`Step completed: ${text}`);
      sendMessageToWebSocket({
        event: "stepCompleted",
        details: text,
        timestamp: new Date().toISOString(),
      });

      // Example: Advance to the next step (this logic depends on your flow)
      // handleNextStep();
    });
  } else {
    console.warn(`Element not found for step: ${text}. Observing DOM changes...`);

    // Observe DOM changes to wait for the element to appear
    const observer = new MutationObserver(() => {
      const newNode = findElementByXPath(x_path);
      if (newNode) {
        console.log(`Element found for step: ${text} via observer`);

        // Highlight the element
        highlightElement(newNode);
        currentElement = newNode;

        newNode.addEventListener("click", () => {
          sendMessageToWebSocket({
            event: "stepCompleted",
            details: text,
            timestamp: new Date().toISOString(),
          });

          // Example: Advance to the next step
          // handleNextStep();
        });

        observer.disconnect(); // Stop observing once found
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}

// Function to send message to WebSocket
function sendMessageToWebSocket(data) {
  chrome.runtime.sendMessage(
    { type: "sendToWebSocket", data },
    (response) => {
      if (response.status === "Message sent to WebSocket") {
        console.log("Event sent to WebSocket:", data);
      } else {
        console.error("Error sending event to WebSocket:", response.status);
      }
    }
  );
}

// Test: Highlight the first step
const testStep = {
  x_path: '//*[@id="hTContainer"]/div/div[1]/div[2]/nav/div/div/ul/li[5]/button',
  text: "Situacions de vida",
};
handleStep(testStep);
