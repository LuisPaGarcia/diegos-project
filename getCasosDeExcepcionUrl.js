const puppeteer = require("puppeteer");
const escrituraLectura = require("./escritura-lectura");

function delay(msDelay) {
  return new Promise(function(resolve) {
    setTimeout(resolve, msDelay);
  });
}

(async function() {
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
  let urlsAccum = [];
  let urlsAccumPage = [];
  for (let index of indexes) {
    let query = `#MasterGC_ContentBlockHolder_gvResultado > tbody .FilaTablaDetalle:nth-child(${index}) td:nth-child(4) a`;

    const anchor = await page.evaluate(query => {
      return document.querySelector(query);
    }, query);

    if (anchor) {
      const queryModalValue =
        "#MasterGC_ContentBlockHolder_UsrPop_SubMod_GrdCompras_ctl03_Lbl_Canridad > a";
      await page.click(query);

      await page.waitForSelector(queryModalValue, {
        visible: true,
      });

      const hrefModalValue = await page.evaluate(queryModalValue => {
        const hrefToGet = document.querySelector(queryModalValue);
        const value = hrefToGet.href;
        hrefToGet.parentNode.removeChild(hrefToGet);
        return value;
      }, queryModalValue);

      await page.click(
        "#MasterGC_ContentBlockHolder_UsrPop_SubMod_Btn_Cancelar"
      );
      // console.log("Captured Url:", hrefModalValue);
      // Escribiendo sobre el file
      urlsAccumPage = [ ...urlsAccumPage, hrefModalValue ];
    }
  }
  urlsAccum = [ ...urlsAccum, ...urlsAccumPage ];
  // Ciclo de click sobre la paginacion
  const totalPages = await page.evaluate(function() {
    const municipiosPorPagina = 25;
    const totalEntidades = document.querySelector(
      "#MasterGC_ContentBlockHolder_lblFilas"
    ).innerText;

    // Transform `1 al 25 de 335 Entidades consultadas` a `335`
    return Math.ceil(
      Number(totalEntidades.split("de")[1].split("Entida")[0].trim()) /
        municipiosPorPagina
    );
  });

  console.log(
    "Current Page:",
    "1/" + totalPages,
    "Page size:",
    urlsAccumPage.length,
    "Accum size:",
    urlsAccum.length
  );
  let pageIndexArray = [];
  for (let index = 2; index <= totalPages; index++) {
    pageIndexArray.push(index);
  }

  for (const pageIndex of pageIndexArray) {
    await page.evaluate(pageIndex => {
      const anchor = document.createElement("a");
      anchor.href =
        "javascript:__doPostBack('MasterGC$ContentBlockHolder$gvResultado','Page$" +
        pageIndex +
        "')";
      anchor.classList.add("next-link");
      anchor.innerText = "Link go to next page";
      document
        .querySelector(
          "#aspnetForm > div.container-fluid > div:nth-child(8) > span"
        )
        .append(anchor);
    }, pageIndex);
    urlsAccumPage = [];

    // click to the nextPage link AND we will wait until the next page loads
    await Promise.all([ page.click(".next-link"), page.waitForNavigation() ]);

    const indexes = Array.from(Array(30).keys());

    for (let index of indexes) {
      let query = `#MasterGC_ContentBlockHolder_gvResultado > tbody .FilaTablaDetalle:nth-child(${index}) td:nth-child(4) a`;

      const anchor = await page.evaluate(query => {
        return document.querySelector(query);
      }, query);

      if (anchor) {
        const queryModalValue =
          "#MasterGC_ContentBlockHolder_UsrPop_SubMod_GrdCompras_ctl03_Lbl_Canridad > a";
        await page.click(query);

        await page.waitForSelector(queryModalValue, {
          visible: true,
        });

        const hrefModalValue = await page.evaluate(queryModalValue => {
          const hrefToGet = document.querySelector(queryModalValue);
          const value = hrefToGet.href;
          hrefToGet.parentNode.removeChild(hrefToGet);
          return value;
        }, queryModalValue);

        await page.click(
          "#MasterGC_ContentBlockHolder_UsrPop_SubMod_Btn_Cancelar"
        );
        // Escribiendo sobre el file
        urlsAccumPage = [ ...urlsAccumPage, hrefModalValue ];
      }
    }
    const repeatedInPage = urlsAccum.filter(function(val) {
      return urlsAccumPage.indexOf(val) != -1;
    });

    urlsAccum = [ ...urlsAccum, ...urlsAccumPage ];

    console.log(
      "Current Page:",
      pageIndex + "/" + totalPages,
      "Page size:",
      urlsAccumPage.length,
      "Accum size:",
      urlsAccum.length,
      "Repeated",
      repeatedInPage.length
    );
  }
  const uniques = [ ...new Set(urlsAccum) ];
  await escrituraLectura.escribirArchivoSinEvitarRepetidos(
    year + "-links.json",
    uniques,
    "casos-de-excepcion"
  );
  await escrituraLectura.escribirArchivoSinEvitarRepetidos(
    year + "-links-all.json",
    urlsAccum,
    "casos-de-excepcion"
  );

  console.log("-- Saved:", uniques.length, "on ", year + "-links.json");
  console.log(
    "-- Saved all:",
    urlsAccum.length,
    "on ",
    year + "-links-all.json"
  );

  await browser.close();
})();
