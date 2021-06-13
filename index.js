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
  const page = await browser.newPage();
  await page.setViewport({
    width: 1200,
    height: 800,
  });
  await page.goto(
    "https://www.guatecompras.gt/reportes/Rpt_PublicacionesNPGModalidad.aspx"
  );

  await page.evaluate(() => {
    localStorage.setItem(
      "trustedsite_visit",
      JSON.stringify({ value: 1, expiry: 1652861739 })
    );
  });
  const year = process.argv[2];
  if (year === undefined) {
    console.log("Usted no metio año");
    process.exit();
  }
  await page.select("#MasterGC_ContentBlockHolder_ddlAnioA", year);
  await page.select("#MasterGC_ContentBlockHolder_ddlTipoEntidad", "1");
  await page.waitForSelector(
    "#MasterGC_ContentBlockHolder_ddlSubTipoEntidad > option:nth-child(3)"
  );
  await page.select("#MasterGC_ContentBlockHolder_ddlSubTipoEntidad", "6");
  await page.click("#MasterGC_ContentBlockHolder_BtnBuscar");
  await page.waitForSelector(
    "#MasterGC_ContentBlockHolder_gvResultado > tbody"
  );

  const urls = await page.evaluate(function () {
    let listOfUrls = [
      ...document.querySelectorAll(
        "#MasterGC_ContentBlockHolder_gvResultado > tbody .FilaTablaDetalle td:nth-child(2) a"
      ),
    ];

    let listOfHrefs = listOfUrls.map(function (anchor) {
      return anchor.href;
    });

    return listOfHrefs;
  });

  // Escribiendo sobre el file
  await escrituraLectura.escribirArchivo(year + "-links.json", urls);

  // Ciclo de click sobre la paginacion
  const paginas = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 11, 12, 13, 14, 15];
  for (const index of paginas) {
    const query =
      "#MasterGC_ContentBlockHolder_gvResultado > tbody > tr.FooterTablaDetalle > td > table > tbody > tr > td:nth-child(" +
      index +
      ") > a";

    const linkExist = await page.evaluate(function (query) {
      return document.querySelector(query);
    }, query);

    if (linkExist !== null) {
      await page.click(query);
      await page.waitForSelector(
        "#MasterGC_ContentBlockHolder_gvResultado > tbody"
      );

      const urls = await page.evaluate(function () {
        let listOfUrls = [
          ...document.querySelectorAll(
            "#MasterGC_ContentBlockHolder_gvResultado > tbody .FilaTablaDetalle td:nth-child(2) a"
          ),
        ];

        let listOfHrefs = listOfUrls.map(function (anchor) {
          return anchor.href;
        });

        return listOfHrefs;
      });
      // Escribiendo sobre el file
      await escrituraLectura.escribirArchivo(year + "-links.json", urls);

      console.log("Cambio de pagina");
    }
  }

  await browser.close();
})();
