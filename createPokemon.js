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
  // imgFiles.sort((a, b) => {
  //   const numA = parseInt(a.replace(/\D+/g, ""), 10);
  //   const numB = parseInt(b.replace(/\D+/g, ""), 10);
  //   if (numA !== numB) {
  //     return numA - numB;
  //   } else {
  //     const hasTextA = /\D/.test(a.replace(".jpg", ""));
  //     const hasTextB = /\D/.test(b.replace(".jpg", ""));
  //     return hasTextA - hasTextB;
  //   }
  // });
  // console.log(imgFiles.length);
  // dbData.data[5].url = "haha";
  // console.log(dbData.data[5].url);
  // imgFiles.forEach((name, index) => {
  //   const pokeName = name.split(".")[0].toLowerCase();
  //   if (index < dbData.data.length) {
  //     dbData.data[index].url = `http://localhost:5000/pokemon_img/${pokeName}`;
  //   }
  // });

  let filteredData = dbData.data.filter((pokemon) => {
    const imgName = `${pokemon.id}.jpg`;
    if (imgFiles.includes(imgName)) {
      pokemon.url = `http://localhost:3000/pokemon_img/${imgName}`;
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
