# parse-jhi-translate
Avoid the manual writing of your jhipster translations files. Make an npm command from this node script, it will parse your code, search for the "parse-jhi-translate" directives, extracts keys/values and store them in json files.

* Put the parse-jhi-translate anywhere you want in your project. Might be a good choice to put it under a path like 'src/main/resources/script/custom'.
* Edit your package.json file, add in the 'script section' : "parse-jhi-translate": "node src/main/resources/script/custom/parse-jhi-translate.js". Of course, use the location you did put the script in.
* Execute 'npm run parse-jhi-translate', et voilà !
