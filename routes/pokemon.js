const { getDefaultResultOrder } = require("dns");
const express = require("express");
const fs = require("fs");
const router = express.Router();
const path = require("path");
const { z } = require("zod");

const dbFile = path.resolve(__dirname, "../db.json");

const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flyingText",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];

const fileData = JSON.parse(fs.readFileSync(dbFile, "utf8"));
let pokemons = fileData.data;

const validateRequestMiddleware =
  (schema, requestParamPart) => (req, res, next) => {
    // requestParamPart có thể là body/query/params
    const result = requestQuerySchema.safeParse(req[requestParamPart]);
    // req.query = {}
    // sau khi parse, thì result.data = { limit: 10; page: 1}

    if (!result.success) {
      return res.status(400).json({
        error: result.error.issues,
        message: "Validation Failed",
      });
    }

    // requestParamPart = query
    // req.query = result.data;
    // req.query = { limit: 10; page: 1}
    req[requestParamPart] = result.data;
    next();
  };

const requestQuerySchema = z.object({
  search: z.string().optional(),
  type: z.enum(pokemonTypes).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  page: z.coerce.number().int().min(1).default(1),
});

const getPokemonByIdSchema = z.object({
  id: z.coerce.number().int(),
});

// middleware trong express là 1 function có 3 biến (req,res,) => {}
router.get(
  "/",
  validateRequestMiddleware(requestQuerySchema, "query"),
  async (req, res, next) => {
    try {
      let { search, type, limit, page } = req.query;

      let filteredPokemons = pokemons;

      if (search) {
        search = search.toLowerCase();
        filteredPokemons = pokemons.filter((p) =>
          p.name.toLowerCase().includes(search.toLowerCase())
        );
      }

      if (type) {
        type = type.toLowerCase();
        filteredPokemons = pokemons.filter((p) =>
          p.types.some((t) => t.toLowerCase() === type)
        );
      }

      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedData = filteredPokemons.slice(startIndex, endIndex);

      res.status(200).json({ data: paginatedData });
    } catch (err) {
      next(err);
    }
  }
);

router.get(
  "/:id",
  validateRequestMiddleware(getPokemonByIdSchema, "params"),
  async (req, res, next) => {
    try {
      // response logic
      const { id } = req.params;
      const currentIndex = pokemons.findIndex((p) => p.id === id);
      const totalPokemons = pokemons.length;
      const previousIndex = (currentIndex - 1 + totalPokemons) % totalPokemons;
      const nextIndex = (currentIndex + 1) % totalPokemons;
      const previousPokemon = pokemons[previousIndex];
      const pokemon = pokemons[currentIndex];
      const nextPokemon = pokemons[nextIndex];

      if (!pokemon) {
        return res.status(404).json({
          message: "NOT FOUND",
        });
      }
      res.status(200).json({ data: { pokemon, previousPokemon, nextPokemon } });
    } catch (err) {
      next(err);
    }
  }
);

router.post("/", async (req, res, next) => {
  try {
    const pokemonSchema = z.object({
      name: z.string().min(1, { message: "Name is required." }),
      type: z.enum(pokemonTypes, { message: "Invalid Pokémon type." }),
      url: z.string().url({ message: "URL must be valid." }),
    });

    const parsedData = pokemonSchema.parse(req.body);
    if (
      pokemons.some(
        (pokemon) =>
          pokemon.name.toLowerCase() === parsedData.name.toLowerCase()
      )
    ) {
      return res.status(400).json({ message: "The Pokémon already exists." });
    }

    const newId =
      pokemons.length > 0 ? Math.max(...pokemons.map((p) => p.id)) + 1 : 1;

    const newPokemon = {
      id: newId,
      name: parsedData.name,
      type: parsedData.type,
      url: parsedData.url,
    };

    pokemons.push(newPokemon);

    res.status(201).json({ data: newPokemon });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res
        .status(400)
        .json({ message: "Validation failed", errors: error.errors });
    }
    next(error);
  }
});
module.exports = router;
