# diegos-project

## How to start

1. Intall the dependencies

```sh
$ npm install
```

2. Run the index file passing a year from 2005 to 2021.

```sh
$ node index.js 2011
```

3. The output will be the list of links where do we need to start scrapping all the final data. Will be saved at the `/output/links/Compra Directa/{year}-links.json` as an JSON array format.

## TODO

- [x] Get `Compra Directa` links by year
- [ ] Fetch and get all the data from the fetched `Compra directa` urls.
- [ ] Get `Casos de Excepcion` links by year
- [ ] Fetch and get all the data from the fetched `Casos de Excepcion` urls.
