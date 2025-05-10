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
      name: z.string().optional(),
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

    let { name, type, limit, page } = result.data;

    if (name) {
      name = name.toLowerCase();
      pokemons = pokemons.filter((p) => p.name.toLowerCase().includes(name));
    }

    if (type) {
      type = type.toLowerCase();
      pokemons = pokemons.filter((p) =>
        p.types.some((t) => t.toLowerCase() === type)
      );
    }

    limit = limit ? parseInt(limit, 10) : 10;
    page = page ? parseInt(page, 10) : 1;

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedData = pokemons.slice(startIndex, endIndex);

    res.status(200).json({ data: paginatedData });
  } catch (err) {
    next(err);
  }
});

router.get("/", async (res, req, next) => {
  // define schema for validation
  // validate by defined schema + safeParse (not throw error by default --> be able to customize how to handle error)
  // handle error
  // response logic
});

module.exports = router;
