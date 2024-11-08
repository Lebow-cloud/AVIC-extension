// Cambiar el color de fondo
document.body.style.backgroundColor = "lightblue";

// Cambiar el texto de los encabezados
const headers = document.querySelectorAll("h1, h2, h3");
headers.forEach(header => {
  header.textContent = "Texto modificado por mi extensión";
});

// Agregar un banner en la página
const banner = document.createElement('div');
banner.textContent = "Este es un banner agregado por mi extensión.";
banner.style.position = 'fixed';
banner.style.top = '0';
banner.style.width = '100%';
banner.style.backgroundColor = 'yellow';
banner.style.padding = '10px';
banner.style.textAlign = 'center';
banner.style.zIndex = '1000';
document.body.appendChild(banner);
