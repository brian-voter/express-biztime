/** Routes about invoices. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");


/** GET / - returns `{invoices: [invoice, ...]}` */
router.get("/", async function (req, res, next) {
    const results = await db.query("SELECT * FROM invoices ORDER BY add_date");
    const invoices = results.rows;

    return res.json({ invoices });
});


/** GET /:id - return data about one invoice and its company:
 *  `{invoice: invoice, company: company}` */

router.get("/:id", async function (req, res, next) {
    const id = req.params.id;

//TODO: refactor to a single query with a join

    const invoiceResult = await db.query(
        "SELECT * FROM invoices WHERE id = $1", [id]);
    const invoice = invoiceResult.rows[0];

    if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);

    const companyResult = await db.query(
        "SELECT * FROM companies WHERE code = $1", [invoice.comp_code]);
    const company = companyResult.rows[0];

    invoice.company = company;
    delete invoice.comp_code;
    return res.json({ invoice });
});


/** POST / - create invoice from data; return `{invoice: invoice}` */

router.post("/", async function (req, res, next) {
    if (req.body === undefined) throw new BadRequestError();

    const results = await db.query(
        `INSERT INTO invoices (comp_code, amt)
         VALUES ($1, $2)
         RETURNING *`,
        [req.body.comp_code, req.body.amt]);
    const invoice = results.rows[0];

    return res.status(201).json({ invoice });
});


/** PUT /:id - update amount for invoice; return `{invoice: invoice}` */

router.put("/:id", async function (req, res, next) {
    if (req.body === undefined
        || Object.keys(req.body).length != 1
        || !("amt" in req.body)) {
        throw new BadRequestError("Expects exactly one key/val pair: amt");
    }

    const id = req.params.id;
    const results = await db.query(
        `UPDATE invoices
         SET amt = $1
         WHERE id = $2
         RETURNING *`,
        [req.body.amt, req.params.id]);
    const invoice = results.rows[0];

    if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
    return res.json({ invoice });
});


/** DELETE /:code - delete invoice, return `{status: "deleted"}` */

router.delete("/:id", async function (req, res, next) {
    const id = req.params.id;
    const results = await db.query(
        "DELETE FROM invoices WHERE id = $1 RETURNING id", [id]);
    const invoice = results.rows[0];

    if (!invoice) throw new NotFoundError(`No matching invoice: ${id}`);
    return res.json({ status: "deleted" });
});

module.exports = router;