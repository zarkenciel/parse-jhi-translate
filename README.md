# parse-jhi-translate
Avoid the manual writing of your jhipster translations files. Make an npm command from this node script, it will parse your code, search for the "parse-jhi-translate" directives, extracts keys/values and store them in json files.

* Put the parse-jhi-translate anywhere you want in your project, like a /scripts folder.
* Edit your package.json file, add in the 'script section' : "parse-jhi-translate": "node scripts/parse-jhi-translate.js" (use the location you did put the script in).
* Execute 'npm run parse-jhi-translate', et voilà !

If the directive is boxed or if the key is an interpolation, the directive will be ignored.
