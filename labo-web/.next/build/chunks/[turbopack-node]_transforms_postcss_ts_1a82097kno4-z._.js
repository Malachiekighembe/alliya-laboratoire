module.exports = [
"[turbopack-node]/transforms/postcss.ts?config=[project]/labo-web/postcss.config.js { CONFIG => \"[project]/labo-web/postcss.config.js_.loader.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript, async loader)", ((__turbopack_context__) => {

__turbopack_context__.v((parentImport) => {
    return Promise.all([
  "chunks/0ttg_0-_9f6bbl-ihk._.js",
  "chunks/[root-of-the-server]__11pu2d93ac6q6._.js"
].map((chunk) => __turbopack_context__.l(chunk))).then(() => {
        return parentImport("[turbopack-node]/transforms/postcss.ts?config=[project]/labo-web/postcss.config.js { CONFIG => \"[project]/labo-web/postcss.config.js_.loader.mjs [postcss] (ecmascript)\" } [postcss] (ecmascript)");
    });
});
}),
];