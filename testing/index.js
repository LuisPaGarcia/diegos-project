// Arrow Function
// Si importa el orden de creacion
const ageInDogYears = (age) => {
  return age * 7;
};

const ageInDogValue = ageInDogYears(10); // 70
const ageInCatValue = ageInCatYears(18); // 2
console.log(ageInDogValue, ageInCatValue);

// Regular Function
// no importa el orden de creacion
function ageInCatYears(age) {
  return age / 9;
}

// Immediately-Invoked Function Expression (IIFE)

// Forma normal de escribir y ejecutar una funcion
// - Reusable
// - Nombre necesario
// - Ejecución a demanda
function sendMessage() {
  console.log("hey! vamos por ceviche peruano, pana");
}

sendMessage();

// IIFE
// - Nombre no necesario
// - Ejecucion inmediata
// - No es reusable
(function () {
  console.log("hey! messi ya no tiene contrato con puta cataluña");
})();

// IIFE con argumentos
(function (age, name) {
  console.log("la edad de esta persona es", age, "y su nombre es", name);
})(33, "Sara");
