# parse-jhi-translate
Avoid the manual writing of your jhipster translations files. Make an npm command from this node script, it will parse your code, search for the "parse-jhi-translate" directives, extracts keys/values and store them in json files.

# set up
* Put the parse-jhi-translate anywhere you want in your project, like a /scripts folder.
* Edit your package.json file, add in the 'script section' : "parse-jhi-translate": "node scripts/parse-jhi-translate.js" (use the location you did put the script in).
* Execute 'npm run parse-jhi-translate', et voilà !

# notes
* If the directive is boxed or if the key is an interpolation, the directive will be ignored.
* First part of a translation key is considered to be the name of the translation file, eg "messages.warn.lightwarn.plzretry" will be expected to be in the messages.json file.
* If an expected translation file does not exists, it will be created.
* If a json translation file already exists and contain a translation key, the associated value will be considered as the correct one, and reused. Meaning, the code will not have precedence over an existing translation file.
* New translation keys will be added if the file already exists.
