/** Routes about companies. */

const express = require("express");
const { NotFoundError, BadRequestError } = require("../expressError");

const router = new express.Router();
const db = require("../db");


/** GET / - returns `{companies: [company, ...]}` */

router.get("/", async function (req, res, next) {
    const results = await db.query("SELECT * FROM companies");
    const companies = results.rows;

    return res.json({ companies });
});


/** GET /:code - return data about one company: `{company: company}` */
//TODO: add to docstrings
router.get("/:code", async function (req, res, next) {
    const code = req.params.code;
    const companyResult = await db.query(
        "SELECT * FROM companies WHERE code = $1", [code]);
    const company = companyResult.rows[0];

    if (!company) throw new NotFoundError(`No matching company: ${code}`);

    const invoicesResult = await db.query(
        "SELECT * FROM invoices WHERE comp_code = $1", [code]);
    const invoicesIds = invoicesResult.rows.map((invoice) => invoice.id);

    company.invoices = invoicesIds;
    return res.json({ company });
});


/** POST / - create company from data; return `{company: company}` */

router.post("/", async function (req, res, next) {
    if (req.body === undefined) throw new BadRequestError();
    const results = await db.query(
        `INSERT INTO companies (code, name, description)
         VALUES ($1, $2, $3)
         RETURNING code, name, description`,
        [req.body.code, req.body.name, req.body.description]);
    const company = results.rows[0];

    return res.status(201).json({ company });
});


/** PUT /:code - edit all fields for company; return `{company: company}` */

router.put("/:code", async function (req, res, next) {
    if (req.body === undefined) {
        throw new BadRequestError();
    }

    if ("code" in req.body) {
        throw new BadRequestError("Modifying company code is disallowed");
    }

    const code = req.params.code;
    const results = await db.query(
        `UPDATE companies
         SET name=$1, description=$2
         WHERE code = $3
         RETURNING code, name, description`,
        [req.body.name, req.body.description, code]);
    const company = results.rows[0];

    if (!company) throw new NotFoundError(`No matching company: ${code}`);
    return res.json({ company });
});


/** DELETE /:code - delete company, return `{status: "deleted"}` */

router.delete("/:code", async function (req, res, next) {
    const code = req.params.code;
    const results = await db.query(
        "DELETE FROM companies WHERE code = $1 RETURNING code", [code]);
    const company = results.rows[0];

    if (!company) throw new NotFoundError(`No matching company: ${code}`);
    return res.json({ status: "deleted" });
});

module.exports = router;