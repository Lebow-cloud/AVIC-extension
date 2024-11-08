let currentElement = null; // Currently highlighted element

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

// Function to highlight an element with a white oval
function highlightElement(element) {
  // Remove previous highlight if it exists
  if (currentElement) {
    removeHighlight();
  }

  const rect = element.getBoundingClientRect();
  const oval = document.createElement("div");

  // Styling the oval
  oval.style.position = "absolute";
  oval.style.width = `${rect.width + 40}px`; // Add padding to the oval
  oval.style.height = `${rect.height + 20}px`;
  oval.style.border = "2px solid black";
  oval.style.borderRadius = "50%";
  oval.style.boxShadow = "0 0 15px 5px white";
  oval.style.backgroundColor = "transparent";
  oval.style.top = `${rect.top - 10 + window.scrollY}px`;
  oval.style.left = `${rect.left - 20 + window.scrollX}px`;
  oval.style.pointerEvents = "none"; // Prevent interaction with the oval
  oval.style.zIndex = "10000";

  // Append the oval directly to the body
  document.body.appendChild(oval);

  // Save reference for removal later
  currentElement = oval;
}

// Function to remove highlighting
function removeHighlight() {
  if (currentElement) {
    currentElement.remove();
    currentElement = null;
  }
}

// Function to handle a specific step
function handleStep(step) {
  const { x_path, text } = step;

  console.log(`Handling step: ${text}`);

  const node = findElementByXPath(x_path);

  if (node) {
    // Highlight the new element
    highlightElement(node);

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
