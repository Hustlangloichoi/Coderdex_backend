const fs = require("fs");
const csv = require("csvtojson");
const path = require("path");

const createPokemon = async () => {
  let newData = await csv().fromFile("pokemon.csv");
  let Data = newData.map((pokemon, index) => {
    return {
      id: index + 1,
      name: pokemon.Name.toLowerCase(),
      types: [
        pokemon.Type1.toLowerCase(),
        pokemon.Type2 ? pokemon.Type2.toLowerCase() : null,
      ].filter(Boolean),
      url: "",
    };
  });

  let finalData = {
    data: Data,
    totalPokemons: Data.length,
  };
  fs.writeFileSync(dbFile, JSON.stringify(finalData, null, 2));
  addImgLinks();
};

const imgDir = path.join(__dirname, "public/pokemon_img");
const dbFile = path.join(__dirname, "db.json");

function addImgLinks() {
  let dbData = JSON.parse(fs.readFileSync(dbFile, "utf8"));
  const imgFiles = fs.readdirSync(imgDir);

  let filteredData = dbData.data.filter((pokemon) => {
    const imgName = `${pokemon.id}.jpg`;
    if (imgFiles.includes(imgName)) {
      // Set URL as relative path for frontend public folder
      pokemon.url = `/pokemon_img/${imgName}`;
      return true;
    } else {
      return false;
    }
  });
  let finalData = {
    data: filteredData,
    totalPokemons: filteredData.length,
  };
  fs.writeFileSync(dbFile, JSON.stringify(finalData, null, 2));
  console.log("img added");
}
createPokemon();
