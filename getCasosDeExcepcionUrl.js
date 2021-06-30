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
  console.log("Starting data using", year);
  await page.select("#MasterGC_ContentBlockHolder_ddlAnioA", year);
  await page.select("#MasterGC_ContentBlockHolder_ddlTipoEntidad", "1");
  await page.waitForSelector(
    "#MasterGC_ContentBlockHolder_ddlSubTipoEntidad > option:nth-child(3)"
  );
  await page.select("#MasterGC_ContentBlockHolder_ddlSubTipoEntidad", "6");
  await page.click("#MasterGC_ContentBlockHolder_BtnBuscar");
  console.log("Getting data...");
  await page.waitForSelector(
    "#MasterGC_ContentBlockHolder_gvResultado > tbody"
  );

  const indexes = Array.from(Array(30).keys());

  for (let index of indexes) {
    let query = `#MasterGC_ContentBlockHolder_gvResultado > tbody .FilaTablaDetalle:nth-child(${index}) td:nth-child(4) a`;

    const anchor = await page.evaluate((query) => {
      return document.querySelector(query);
    }, query);

    if (anchor) {
      const queryModalValue =
        "#MasterGC_ContentBlockHolder_UsrPop_SubMod_GrdCompras_ctl03_Lbl_Canridad > a";
      await page.click(query);

      await page.waitForSelector(queryModalValue, {
        visible: true,
      });

      const hrefModalValue = await page.evaluate((queryModalValue) => {
        const hrefToGet = document.querySelector(queryModalValue);
        const value = hrefToGet.href;
        hrefToGet.parentNode.removeChild(hrefToGet);
        return value;
      }, queryModalValue);

      await page.click(
        "#MasterGC_ContentBlockHolder_UsrPop_SubMod_Btn_Cancelar"
      );
      console.log("Captured Url:", hrefModalValue);
      // Escribiendo sobre el file
      await escrituraLectura.escribirArchivo(
        year + "-links.json",
        [hrefModalValue],
        "casos-de-excepcion"
      );
    }
  }

  // Ciclo de click sobre la paginacion
  const paginas = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 10, 11, 12, 13, 14, 15];
  for (const index of paginas) {
    const query =
      "#MasterGC_ContentBlockHolder_gvResultado > tbody > tr.FooterTablaDetalle > td > table > tbody > tr > td:nth-child(" +
      index +
      ") > a";

    const linkExist = await page.evaluate(function (query) {
      return document.querySelector(query)
        ? document.querySelector(query).innerText
        : null;
    }, query);

    if (linkExist !== null) {
      await page.click(query);
      await page.waitForSelector(
        "#MasterGC_ContentBlockHolder_gvResultado > tbody"
      );

      const indexes = Array.from(Array(30).keys());

      for (let index of indexes) {
        let query = `#MasterGC_ContentBlockHolder_gvResultado > tbody .FilaTablaDetalle:nth-child(${index}) td:nth-child(4) a`;

        const anchor = await page.evaluate((query) => {
          return document.querySelector(query);
        }, query);

        if (anchor) {
          const queryModalValue =
            "#MasterGC_ContentBlockHolder_UsrPop_SubMod_GrdCompras_ctl03_Lbl_Canridad > a";
          await page.click(query);

          await page.waitForSelector(queryModalValue, {
            visible: true,
          });

          const hrefModalValue = await page.evaluate((queryModalValue) => {
            const hrefToGet = document.querySelector(queryModalValue);
            const value = hrefToGet.href;
            hrefToGet.parentNode.removeChild(hrefToGet);
            return value;
          }, queryModalValue);

          await page.click(
            "#MasterGC_ContentBlockHolder_UsrPop_SubMod_Btn_Cancelar"
          );
          console.log("Captured Url:", hrefModalValue);
          // Escribiendo sobre el file
          await escrituraLectura.escribirArchivo(
            year + "-links.json",
            [hrefModalValue],
            "casos-de-excepcion"
          );
        }
      }

      console.log("Next page");
    }
  }

  await browser.close();
})();
