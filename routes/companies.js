/** Routes about cats. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");


/** GET / - returns `{cats: [cat, ...]}` */

router.get("/", async function (req, res, next) {
  const results = await db.query("SELECT id, name FROM cats");
  const cats = results.rows;

  return res.json({ cats });
});


/** GET /[id] - return data about one cat: `{cat: cat}` */

router.get("/:id", async function (req, res, next) {
  const id = req.params.id;
  const results = await db.query(
    "SELECT id, name FROM cats WHERE id = $1", [id]);
  const cat = results.rows[0];

  if (!cat) throw new NotFoundError(`No matching cat: ${id}`);
  return res.json({ cat });
});


/** POST / - create cat from data; return `{cat: cat}` */

router.post("/", async function (req, res, next) {
  if (req.body === undefined) throw new BadRequestError();
  const results = await db.query(
    `INSERT INTO cats (name)
         VALUES ($1)
         RETURNING id, name`,
    [req.body.name]);
  const cat = results.rows[0];

  return res.status(201).json({ cat });
});


/** PATCH /[id] - update fields in cat; return `{cat: cat}` */

router.patch("/:id", async function (req, res, next) {
  if (req.body === undefined || "id" in req.body) {
    throw new BadRequestError("Not allowed");
  }

  const id = req.params.id;
  const results = await db.query(
    `UPDATE cats
         SET name=$1
         WHERE id = $2
         RETURNING id, name`,
    [req.body.name, id]);
  const cat = results.rows[0];

  if (!cat) throw new NotFoundError(`No matching cat: ${id}`);
  return res.json({ cat });
});


/** DELETE /[id] - delete cat, return `{message: "Cat deleted"}` */

router.delete("/:id", async function (req, res, next) {
  const id = req.params.id;
  const results = await db.query(
    "DELETE FROM cats WHERE id = $1 RETURNING id", [id]);
  const cat = results.rows[0];

  if (!cat) throw new NotFoundError(`No matching cat: ${id}`);
  return res.json({ message: "Cat deleted" });
});


module.exports = router;
