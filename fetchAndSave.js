const puppeteer = require("puppeteer");
const escrituraLectura = require("./escritura-lectura");

function delay(msDelay) {
  return new Promise(function (resolve) {
    setTimeout(resolve, msDelay);
  });
}

(async function () {
  const browser = await puppeteer.launch({
    headless: false,
    executablePath:
      "./node_modules/puppeteer/.local-chromium/win64-869685/chrome-win/chrome.exe",
  });
  const year = process.argv[2];
  let pageUrlsJson;
  try {
    pageUrlsJson = require(`./output/compra-directa/links/${year}-links.json`);
  } catch (error) {
    console.error("Error: You must enter a valid year.");
    process.exit();
  }
  const firstUrl = pageUrlsJson[0];
  const pageFirst = await browser.newPage();
  await pageFirst.setViewport({
    width: 1200,
    height: 800,
  });
  await pageFirst.goto(firstUrl);
  // Obtener la info general de la tabla
  const {
    fechaCreacion,
    tipoEntidadSector,
    subtipoEntidad,
    entidadCompradora,
    modalidad,
    cantidadPublicacionesNpg,
    montoTotalPublicacionesNpg,
  } = await pageFirst.evaluate(() => {
    return {
      fechaCreacion: document.querySelector(
        "#MasterGC_ContentBlockHolder_lblAnio"
      ).innerText,
      tipoEntidadSector: document.querySelector(
        "#MasterGC_ContentBlockHolder_tblResumen > tbody > tr:nth-child(1) > td > table:nth-child(2) > tbody > tr > td.EtiquetaFormMoradoDetalle"
      ).innerText,
      subtipoEntidad: document.querySelector(
        "#MasterGC_ContentBlockHolder_tblResumen > tbody > tr:nth-child(1) > td > table:nth-child(3) > tbody > tr > td.EtiquetaFormMoradoDetalle"
      ).innerText,
      entidadCompradora: document.querySelector(
        "#MasterGC_ContentBlockHolder_tblResumen > tbody > tr:nth-child(1) > td > table:nth-child(4) > tbody > tr > td.EtiquetaFormMoradoDetalle"
      ).innerText,
      modalidad: document.querySelector(
        "#MasterGC_ContentBlockHolder_tblResumen > tbody > tr:nth-child(1) > td > table:nth-child(5) > tbody > tr > td.EtiquetaFormMoradoDetalle"
      ).innerText,
      cantidadPublicacionesNpg: document.querySelector(
        "#MasterGC_ContentBlockHolder_lblCantidad"
      ).innerText,
      montoTotalPublicacionesNpg: document.querySelector(
        "#MasterGC_ContentBlockHolder_lblMontoTotal"
      ).innerText,
    };
  });
  const generalData = {
    "Fecha de Creación": fechaCreacion,
    "Tipo de Entidad Sector": tipoEntidadSector,
    "SubTipo de Entidad": subtipoEntidad,
    "Entidad Compradora": entidadCompradora,
    Modalidad: modalidad,
    "Cantidad de Publicaciones NPG": cantidadPublicacionesNpg,
    "Monto Total de Publicaciones NPG": montoTotalPublicacionesNpg,
  };
  let acummuladorAEscribir = [];
  console.log("Page:", 1);
  let datos = await capturarTablaDatos(pageFirst, generalData);
  acummuladorAEscribir = acummuladorAEscribir.concat(datos);
  await pageFirst.close();

  const pagesIndexFirst = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const pagesIndexNext = [4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  const pagesIndexArray = [
    ...pagesIndexFirst,
    ...Array(20).fill(pagesIndexNext).flat(),
  ];
  for (const pageUrl of pageUrlsJson) {
    const page = await browser.newPage();
    await page.goto(pageUrl);
    // Has multiple pages
    const dataPages = await page.evaluate(() => [
      ...document.querySelectorAll(
        "#MasterGC_ContentBlockHolder_gvResultado > tbody > tr.TablaPagineo > td > table > tbody > tr > td a"
      ),
    ]);
    datos = await capturarTablaDatos(page, generalData);
    acummuladorAEscribir = acummuladorAEscribir.concat(datos);

    if (dataPages.length > 0) {
      let index = 0;
      for (const pageLinkIndex of pagesIndexArray) {
        const query = `#MasterGC_ContentBlockHolder_gvResultado > tbody > tr.TablaPagineo > td > table > tbody > tr > td:nth-child(${pageLinkIndex}) > a`;
        const elementExist = await page.evaluate(function (query) {
          const element = document.querySelector(query)
            ? document.querySelector(query).innerText
            : null;
          return element;
        }, query);

        if (elementExist) {
          console.log("Page:", elementExist);
          await page.click(query);
          await page.waitForSelector(
            "#MasterGC_ContentBlockHolder_gvResultado > tbody"
          );
          await delay(100);
          // leer y guardar datoss
          datos = await capturarTablaDatos(page, generalData);
          acummuladorAEscribir = acummuladorAEscribir.concat(datos);
          index++;
        } else {
          break;
        }
      }
    }
    await escrituraLectura.escribirArchivo(
      year + "-data.json",
      acummuladorAEscribir,
      "compra-directa",
      "data"
    );
    console.log("escrito!");
    await page.close();
  }

  await browser.close();
})();

async function capturarTablaDatos(page, generalData) {
  const values = await page.evaluate((generalData) => {
    var valuesInner = [];
    document.querySelectorAll("[class^='TablaFilaMix']").forEach((row) => {
      valuesInner.push({
        ...generalData,
        numeroCompra: row.querySelector(
          "td:nth-child(1) label:nth-child(1) > a"
        ).innerText,
        numero_compra_url: row.querySelector(
          "td:nth-child(1) label:nth-child(1) > a"
        ).href,
        fecha: row.querySelector("td:nth-child(1) label:nth-child(3)")
          .innerText,
        estado: row.querySelector("td:nth-child(1) label:nth-child(5)")
          .innerText,
        sistema_que_publico_la_compra: row.querySelector(
          "td:nth-child(1) label:nth-child(7)"
        ).innerText,
        entidad_publica: row.querySelector("td:nth-child(2) label:nth-child(1)")
          .innerText,
        modalidad_con_la_que_publico: row.querySelector(
          "td:nth-child(2) label:nth-child(3)"
        ).innerText,
        descripcion: row.querySelector("td:nth-child(2) > div").innerText,
        nit_proveedor: row.querySelector("td:nth-child(3) > div label")
          .innerText,
        nombre_proveedor: row.querySelector("td:nth-child(3) > div a")
          .innerText,
        nombre_proveedor_url: row.querySelector("td:nth-child(3) > div a").href,
      });
    });
    return valuesInner;
  }, generalData);
  return values;
}
