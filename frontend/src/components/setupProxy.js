// frontend/src/setupProxy.js
// Evita que webpack intente resolver modulos de Node.js (fs, path, electron)
// Este archivo es leido automaticamente por react-scripts

module.exports = function(app) {
  // proxy vacio - solo existe para que el proyecto no crashee
};
