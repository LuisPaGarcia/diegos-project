const fs = require("fs");
const path = require("path");

function createFileStructure(year = process.argv[2], tipo = "compra-directa") {
  const startPath = path.join(__dirname, "output", tipo, "data");
  // add year folder
  const filesFolder = path.join(startPath, `${year}`);
  if (!fs.existsSync(filesFolder)) {
    fs.mkdirSync(filesFolder);
  }

  // add data.json
  const dataJsonFile = path.join(filesFolder, "data.json");
  if (!fs.existsSync(dataJsonFile)) {
    fs.writeFileSync(dataJsonFile, "");
  }

  // add general.json
  const generalJsonFile = path.join(filesFolder, "general.json");
  if (!fs.existsSync(generalJsonFile)) {
    fs.writeFileSync(generalJsonFile, "");
  }

  // add processed_urls.json
  const processedJsonFile = path.join(filesFolder, "processed_urls.json");
  if (!fs.existsSync(processedJsonFile)) {
    fs.writeFileSync(processedJsonFile, "");
  }
}

createFileStructure();
