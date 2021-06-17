const puppeteer = require("puppeteer");
const escrituraLectura = require("./escritura-lectura");

(async function () {
  try {
    const type = process.argv[2];
    const year = process.argv[3];
    // node testPageJump.js compra-directa 2011
    const browser = await puppeteer.launch({
      headless: false,
      executablePath:
        "./node_modules/puppeteer/.local-chromium/win64-869685/chrome-win/chrome.exe",
    });
    const url =
      "https://www.guatecompras.gt/reportes/RptDetallePublicacionesNPG.aspx?rt=1&mod=1&ecn=97&yy=2011&te=1&ste=6";
    const page = await browser.newPage();
    await page.goto(url);

    // get total of pages
    const totalPages = await page.evaluate(() => {
      const rowsPerPage = 25;
      return Math.ceil(
        Number(
          document
            .querySelector("#MasterGC_ContentBlockHolder_lblCantidad")
            .innerText.replace(",", "")
        ) / rowsPerPage
      );
    });
    // captute the general data
    const generalData = await getGeneralData(page);
    // capture table data from page 1
    let data = [];
    let tableData = await getTableData(page, generalData);
    data = data.concat(tableData);
    console.log("Get data from page 1");
    console.log("data size:", data.length);

    // validate that we have more than 1 page
    if (totalPages > 1) {
      // if yes, create a list from [2,3,4...N]
      let pageIndexArray = [];
      for (let index = 2; index <= totalPages; index++) {
        pageIndexArray.push(index);
      }
      // itearate over the list
      for (const pageIndex of pageIndexArray) {
        // create the nextPage link (1-> 2) (8 -> 9) (N-1 -> N)
        await page.evaluate((pageIndex) => {
          const anchor = document.createElement("a");
          anchor.href =
            "javascript:__doPostBack('MasterGC$ContentBlockHolder$gvResultado','Page$" +
            pageIndex +
            "')";
          anchor.classList.add("next-link");
          anchor.innerText = "Diego ama el ceviche peruano";
          document
            .querySelector("#MasterGC_ContentBlockHolder_lblTituloPrincipal")
            .append(anchor);
        }, pageIndex);
        // click to the nextPage link AND we will wait until the next page loads
        await Promise.all([page.click(".next-link"), page.waitForNavigation()]);
        console.log("Current page:", pageIndex);
        const tableDataN = await getTableData(page, generalData);
        data = data.concat(tableDataN);
        console.log("data size:", data.length);
      }
    }
    // write into the year file
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
    cantidadPublicacionesNpgNumber,
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
      cantidadPublicacionesNpgNumber:
        Number(
          document
            .querySelector("#MasterGC_ContentBlockHolder_lblCantidad")
            ?.innerText.replace(",", "")
        ) || "",
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
    "Cantidad de Publicaciones NPG Numero": cantidadPublicacionesNpgNumber,
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
        monto: row.querySelector("td:nth-child(4)")?.innerText.trim() || "",
        montoNumero: Number(
          row
            .querySelector("td:nth-child(4)")
            ?.innerText.replace(",", "")
            .trim()
        ),
      });
    });
    return valuesInner;
  }, generalData);
  return values;
}
