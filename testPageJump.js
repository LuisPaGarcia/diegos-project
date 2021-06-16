const puppeteer = require("puppeteer");
const escrituraLectura = require("./escritura-lectura");

(async function () {
  try {
    const type = process.argv[2];
    const year = process.argv[3];
    const browser = await puppeteer.launch({
      headless: false,
      executablePath:
        "./node_modules/puppeteer/.local-chromium/win64-869685/chrome-win/chrome.exe",
    });
    const url =
      "https://www.guatecompras.gt/reportes/RptDetallePublicacionesNPG.aspx?rt=1&mod=1&ecn=97&yy=2011&te=1&ste=6";
    const page = await browser.newPage();
    await page.goto(url);

    // get total pages using
    const totalPages = await page.evaluate(() => {
      return Math.ceil(
        Number(
          document
            .querySelector("#MasterGC_ContentBlockHolder_lblCantidad")
            .innerText.replace(",", "")
        ) / 25
      );
    });
    const generalData = getGeneralData(page);
    let data = [];
    // -> Get data of first page and append to data
    let tableData = await getTableData(page, generalData);
    data = data.concat(tableData);

    console.log("Get data from page 1");
    // console.log("Save on file data from page 1");
    console.log("data size:", data.length);

    // If there's pagination
    if (totalPages > 1) {
      // default pages array
      const pageIndexArray = Array.from(
        // [2...totalPages]
        { length: totalPages - 1 },
        (_, i) => i + 2
      );

      // We start on 1, so Iterate over [2...totalPages]
      for (const pageIndex of pageIndexArray) {
        await page.evaluate((pageIndex) => {
          // Mimic an anchor to click it and go to the next page
          const anchor = document.createElement("a");
          anchor.href = `javascript:__doPostBack('MasterGC$ContentBlockHolder$gvResultado','Page$${pageIndex}')`;
          anchor.classList.add("next-link");
          anchor.innerText = "next-link";
          document
            .querySelector("#MasterGC_ContentBlockHolder_lblTituloPrincipal")
            .append(anchor);
        }, pageIndex);

        await Promise.all([page.click(".next-link"), page.waitForNavigation()]);

        console.log("Current page:", pageIndex);
        // -> Get data of pageIndex page and append to data
        tableData = await getTableData(page, generalData);
        data = data.concat(tableData);
        // console.log("Get data from page", pageIndex);
        console.log("data size:", data.length, "new:", tableData.length);
      }
    }
    // -> Save data of pageIndex page on file
    await escrituraLectura.escribirArchivo(
      year + "-data.json",
      data,
      type,
      "data"
    );
    console.log("Save on file data from url", url);
    await page.close();
    await browser.close();
  } catch (error) {
    console.log(error);
  }
})();

async function getGeneralData(page) {
  const {
    fechaCreacion,
    tipoEntidadSector,
    subtipoEntidad,
    entidadCompradora,
    modalidad,
    cantidadPublicacionesNpg,
    montoTotalPublicacionesNpg,
  } = await page.evaluate(() => {
    return {
      fechaCreacion:
        document.querySelector("#MasterGC_ContentBlockHolder_lblAnio")
          ?.innerText || "",
      tipoEntidadSector:
        document.querySelector(
          "#MasterGC_ContentBlockHolder_tblResumen > tbody > tr:nth-child(1) > td > table:nth-child(2) > tbody > tr > td.EtiquetaFormMoradoDetalle"
        )?.innerText || "",
      subtipoEntidad:
        document.querySelector(
          "#MasterGC_ContentBlockHolder_tblResumen > tbody > tr:nth-child(1) > td > table:nth-child(3) > tbody > tr > td.EtiquetaFormMoradoDetalle"
        )?.innerText || "",
      entidadCompradora:
        document.querySelector(
          "#MasterGC_ContentBlockHolder_tblResumen > tbody > tr:nth-child(1) > td > table:nth-child(4) > tbody > tr > td.EtiquetaFormMoradoDetalle"
        )?.innerText || "",
      modalidad:
        document.querySelector(
          "#MasterGC_ContentBlockHolder_tblResumen > tbody > tr:nth-child(1) > td > table:nth-child(5) > tbody > tr > td.EtiquetaFormMoradoDetalle"
        )?.innerText || "",
      cantidadPublicacionesNpg:
        document.querySelector("#MasterGC_ContentBlockHolder_lblCantidad")
          ?.innerText || "",
      montoTotalPublicacionesNpg:
        document.querySelector("#MasterGC_ContentBlockHolder_lblMontoTotal")
          ?.innerText || "",
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
  return generalData;
}

async function getTableData(page, generalData) {
  const values = await page.evaluate((generalData) => {
    var valuesInner = [];
    document.querySelectorAll("[class^='TablaFilaMix']").forEach((row) => {
      valuesInner.push({
        ...generalData,
        numeroCompra:
          row.querySelector("td:nth-child(1) label:nth-child(1) > a")
            ?.innerText || "",
        numero_compra_url:
          row.querySelector("td:nth-child(1) label:nth-child(1) > a")?.href ||
          "",
        fecha:
          row.querySelector("td:nth-child(1) label:nth-child(3)")?.innerText ||
          "",
        estado:
          row.querySelector("td:nth-child(1) label:nth-child(5)")?.innerText ||
          "",
        sistema_que_publico_la_compra:
          row.querySelector("td:nth-child(1) label:nth-child(7)")?.innerText ||
          "",
        entidad_publica:
          row.querySelector("td:nth-child(2) label:nth-child(1)")?.innerText ||
          "",
        modalidad_con_la_que_publico:
          row.querySelector("td:nth-child(2) label:nth-child(3)")?.innerText ||
          "",
        descripcion: row.querySelector("td:nth-child(2) > div")?.innerText,
        nit_proveedor:
          row.querySelector("td:nth-child(3) > div label")?.innerText || "",
        nombre_proveedor:
          row.querySelector("td:nth-child(3) > div a")?.innerText || "",
        nombre_proveedor_url:
          row.querySelector("td:nth-child(3) > div a")?.href || "",
      });
    });
    return valuesInner;
  }, generalData);
  return values;
}
