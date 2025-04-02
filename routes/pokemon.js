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

router.get("/", async (req, res, next) => {
  try {
    //define schema for validation
    const requestQuerySchema = z.object({
      search: z.string().optional(),
      type: z.enum(pokemonTypes).optional(),
      limit: z.coerce.number().int().min(1).max(100).default(10),
      page: z.coerce.number().int().min(1).default(1),
    });

    // validate by defined schema + safeParse (not throw error by default --> be able to customize how to handle error)
    const result = requestQuerySchema.safeParse(req.query);
    // handle error
    if (!result.success) {
      return res.status(400).json({
        message: "BAD REQUEST",
      });
    }

    let { search, type, limit, page } = result.data;

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
});

router.get("/:id", async (req, res, next) => {
  try {
    // define schema for validation
    const requestQuerySchema = z.object({
      id: z.coerce.number().int(),
    });
    // validate by defined schema + safeParse (not throw error by default --> be able to customize how to handle error)
    const result = requestQuerySchema.safeParse(req.params);
    // handle error
    if (!result.success) {
      return res.status(400).json({
        message: "BAD REQUEST",
      });
    }
    // response logic
    const { id } = result.data;
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
});

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
