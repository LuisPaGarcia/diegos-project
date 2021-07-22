const filesystem = require("fs");
const path = require("path");
// como se llamara el archivo de output? -> {año}-urls.json
// debemos verificar si el archivo existe antes de escribir en el
// si no existe, crearlo y escribir en el
// si si existe, leerlo y añadir el nuevo contenido al final

/**
 *
 * @param {string} fileName el nombre del archivo dentro de links folder
 * @returns
 */
function leerArchivo(
  fileName,
  folderName = "compra-directa",
  subfolder = "links"
) {
  const linksPath = path.join(
    __dirname,
    "output",
    folderName,
    subfolder,
    fileName
  );
  // verificar que este archivo exista
  const content = filesystem.readFileSync(linksPath, {
    encoding: "utf8",
    flag: "r",
  });
  // si existe leerlo y retornarlo
  return content;
  // si no existe, no hacer nada
}

/**
 *
 * @param {string} filename indicar el nombre del archivo a guardar en links folder
 * @param {Object|Array} content el contenido a escribir (o añadir) al archivo
 */
async function escribirArchivo(
  filename,
  content,
  folderName = "compra-directa",
  subfolder = "links"
) {
  return new Promise((resolve) => {
    const linksPath = path.join(
      __dirname,
      "output",
      folderName,
      subfolder,
      filename
    );
    const fileExist = filesystem.existsSync(linksPath);
    if (fileExist) {
      // append (añadir el contenido)
      const contenidoDelArchivoExistente = JSON.parse(
        leerArchivo(filename, folderName, subfolder)
      );
      const nuevoContenido = [
        ...new Set([...contenidoDelArchivoExistente, ...content]),
      ];
      filesystem.writeFileSync(linksPath, JSON.stringify(nuevoContenido));
      resolve();
    } else {
      // lo creamos y le escribimos
      filesystem.writeFileSync(linksPath, JSON.stringify(content));
      resolve();
    }
  });
}
/**
 *
 * @param {string} filename indicar el nombre del archivo a guardar en links folder
 * @param {Object|Array} content el contenido a escribir (o añadir) al archivo
 */
async function escribirArchivoSinEvitarRepetidos(
  filename,
  content,
  folderName = "compra-directa",
  subfolder = "links"
) {
  return new Promise((resolve) => {
    const linksPath = path.join(
      __dirname,
      "output",
      folderName,
      subfolder,
      filename
    );
    const fileExist = filesystem.existsSync(linksPath);
    if (fileExist) {
      // append (añadir el contenido)
      const contenidoDelArchivoExistente = JSON.parse(
        leerArchivo(filename, folderName, subfolder)
      );
      const nuevoContenido = [...contenidoDelArchivoExistente, ...content];
      filesystem.writeFileSync(linksPath, JSON.stringify(nuevoContenido));
      resolve();
    } else {
      // lo creamos y le escribimos
      filesystem.writeFileSync(linksPath, JSON.stringify(content));
      resolve();
    }
  });
}

module.exports = {
  escribirArchivo,
  leerArchivo,
  escribirArchivoSinEvitarRepetidos,
};
