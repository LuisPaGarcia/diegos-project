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

  // Esperar hasta que aparezca el selector que tiene el total de entidades
  // de este total sacamos el total de páginas
  await page.waitForSelector("#MasterGC_ContentBlockHolder_lblFilas");

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
  let ulrsAccum = [];
  const urls = await page.evaluate(function() {
    let listOfUrls = [
      ...document.querySelectorAll(
        "#MasterGC_ContentBlockHolder_gvResultado > tbody .FilaTablaDetalle td:nth-child(2) a"
      ),
    ];

    let listOfHrefs = listOfUrls.map(function(anchor) {
      return anchor.href;
    });

    return listOfHrefs;
  });
  ulrsAccum = [ ...urls ];
  // Escribiendo sobre el file
  console.log(
    "Current Page:",
    1 + "/" + totalPages,
    "Data size:",
    urls.length,
    "Accum size:",
    ulrsAccum.length
  );

  // Crear una lista de páginas a dar click, desde 2 hasta N
  // Output: [2,3,4,5,6... N]
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
      anchor.innerText = "Diego ama el café turco";
      document
        .querySelector(
          "#aspnetForm > div.container-fluid > div:nth-child(8) > span"
        )
        .append(anchor);
    }, pageIndex);

    // click to the nextPage link AND we will wait until the next page loads
    await Promise.all([ page.click(".next-link"), page.waitForNavigation() ]);

    const urls = await page.evaluate(function() {
      let listOfUrls = [
        ...document.querySelectorAll(
          "#MasterGC_ContentBlockHolder_gvResultado > tbody .FilaTablaDetalle td:nth-child(2) a"
        ),
      ];

      let listOfHrefs = listOfUrls.map(function(anchor) {
        return anchor.href;
      });

      return listOfHrefs;
    });

    const repeatedInPage = ulrsAccum.filter(function(val) {
      return urls.indexOf(val) != -1;
    });
    ulrsAccum = [ ...ulrsAccum, ...urls ];

    console.log(
      "Current Page:",
      pageIndex + "/" + totalPages,
      "Data size:",
      urls.length,
      "Accum size:",
      ulrsAccum.length,
      "Repeated",
      repeatedInPage.length
    );
  }

  const uniques = [ ...new Set(ulrsAccum) ];
  await escrituraLectura.escribirArchivoSinEvitarRepetidos(
    year + "-links.json",
    uniques
  );

  await escrituraLectura.escribirArchivoSinEvitarRepetidos(
    year + "-links-all.json",
    ulrsAccum
  );

  console.log("-- Saved:", uniques.length, "on ", year + "-links.json");
  console.log(
    "-- Saved all:",
    ulrsAccum.length,
    "on ",
    year + "-links-all.json"
  );

  await browser.close();
})();
