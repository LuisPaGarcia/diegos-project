const json2csv = require("json2csv");
const fs = require("fs/promises");

async function convert2csv() {
  const type = process.argv[2];
  const year = process.argv[3];
  let data;
  let folderPath = "./output/" + type + "/data/";

  try {
    data = require(folderPath + year + "-data.json");
  } catch (error) {
    throw Error("Must enter a valid type and year.");
  }

  console.log("Start to convert data of", type, "of year", year, "to csv...");
  // codigo de parseo
  const firstNode = data[0]; // {key:value, key2:value2}
  const keys = Object(firstNode).keys; // [key, key2]
  const config = { fields: keys }; // {fields: [key, key2] }
  const parser = new json2csv.Parser(config); // Crea la instancia del parser
  const csv = parser.parse(data); // Usamos el parser
  const csvFilePath = folderPath + year + ".csv"; // ./output/compra-directa/data/2011.csv

  await fs.writeFile(csvFilePath, csv);
  console.log("Finished here.", csvFilePath);
}

convert2csv();
