const path = require('path');
const fs = require('fs');

let defaultLang = 'de';
let previousTranslationFilesPath = './src/main/webapp/i18n/'+defaultLang+'/'
let outputPath = previousTranslationFilesPath;
let fileExtension = '.component.html';
let sourcePath = './src/main/webapp/app/pages/';

parseJhiTranslate();

function parseJhiTranslate() {
    console.log('-- start parsing jhiTranslate');

    grabParams();
    const filepaths = findFiles(sourcePath, fileExtension);
    const directivesModel = buildDirectivesModel(filepaths);
    const translationsModel = buildTranslationModel(directivesModel);
    writeTranslationFiles(translationsModel);

    console.log('-- stop parsing jhiTranslate');
}

function grabParams() {
    sourcePath = process.argv[2] || sourcePath;
    fileExtension = process.argv[3] || fileExtension;
    outputPath = process.argv[4] || outputPath;
    previousTranslationFilesPath = process.argv[5] || previousTranslationFilesPath;
    defaultLang = process.argv[6] || defaultLang;
}

function findFiles(startingPath, fileExtension) {
    const filepaths = [];
    doFindFiles(startingPath, fileExtension, filepaths);
    return filepaths;
}

function doFindFiles(startingPath, criteria, resultArray) {
    if (!fs.existsSync(startingPath)) {
        console.log("-- dir does not exists", startingPath);
        return;
    }

    const fileStatus = fs.lstatSync(startingPath);
    if (!fileStatus.isDirectory()) {
        resultArray.push(startingPath);
        return resultArray;
    }

    const files = fs.readdirSync(startingPath);
    for (let i = 0; i < files.length; i++) {
        const filepath = path.join(startingPath, files[i]);
        const fileStatus = fs.lstatSync(filepath);
        if (fileStatus.isDirectory()) {
            doFindFiles(filepath, criteria, resultArray);
        } else if (filepath.endsWith(criteria)) {
            resultArray.push(filepath);
        }
    }
}

function buildDirectivesModel(filepaths) {
    const allDirectives = [];

    for (const path of filepaths) {
        const directives = seekDirectives(path);
        if (directives.length > 0) {
            allDirectives.push(...directives);
        }
    }

    return allDirectives;
}

function seekDirectives(filepath) {
    const fileContent = fs.readFileSync(filepath, 'utf8');
    const indexes = findIndexesOfDirectives(fileContent);
    const directives = extractDirectiveDatas(filepath, fileContent, indexes);
    return directives;
}

function findIndexesOfDirectives(fileContent) {
    const regex = /jhiTranslate/gi;
    const indexes = [];
    while ((result = regex.exec(fileContent))) {
        if (result) {
            indexes.push(result.index);
        }
    }
    return indexes;
}

function extractDirectiveDatas(filepath, fileContent, indexes) {
    const directives = [];
    for (const index of indexes) {
        const directiveData = {
            file: filepath,
            index: index,
            isEval: isBoxed(fileContent, index),
            trKey: extractKey(fileContent, index),
            trValue: extractValue(fileContent, index),
        }

        const isInterpolation = directiveData.trKey.startsWith('{{');
        if (isInterpolation) {
            directiveData.isEval = true;
        }

        directives.push(directiveData);
    }
    return directives;
}

function isBoxed(content, index) {
    const prevChar = content.charAt(index - 1);
    return prevChar == '[';
}

function extractKey(content, index) {
    const firstQuote = content.indexOf('"', index);
    const endQuote = content.indexOf('"', firstQuote + 1);
    const translationKey = content.substring(firstQuote + 1, endQuote);
    return translationKey;
}

function extractValue(content, index) {
    const endingTag = content.indexOf('>', index);
    const nextOpeningTag = content.indexOf('<', endingTag + 1);
    let translationValue = content.substring(endingTag + 1, nextOpeningTag).trim();
    return translationValue;
}

function buildTranslationModel(directivesModel) {
    const translationModel = {};

    for (const directive of directivesModel) {
        if (directive.isEval) {
            continue;
        }

        let currObj = translationModel;
        const keyParts = directive.trKey.split('.');
        const previousModel = loadPreviousTranslationModel(keyParts[0]);
        for (let i = 0; i < keyParts.length; i++) {
            const keyPart = keyParts[i];
            if (!currObj[keyPart]) {
                const lastKey = (i == keyParts.length - 1);
                if (lastKey) {
                    const previousTranslation = getFromModel(previousModel, keyParts);
                    if (previousTranslation) {
                        currObj[keyPart] = previousTranslation;
                    } else {
                        currObj[keyPart] = directive.trValue;
                    }
                } else {
                    currObj[keyPart] = {};
                }
            }
            currObj = currObj[keyPart];
        }
    }

    return translationModel;
}

function loadPreviousTranslationModel(filename) {
    try {
        const fileContent = fs.readFileSync(path.join(previousTranslationFilesPath, filename) + '.json', 'utf8');
        const model = JSON.parse(fileContent);
        return model;
    } catch (e) {
        return null;
    }
}

function getFromModel(model, keyParts) {
    let currObj = model;
    for (const keyPart of keyParts) {
        if (currObj) {
            currObj = currObj[keyPart];
        }
    }
    return currObj;
}

function writeTranslationFiles(translationModel) {
    Object.keys(translationModel).forEach((key, index) => {
        const fileModel = {};
        fileModel[key] = translationModel[key];
        const fileContent = JSON.stringify(fileModel, null, 4);
        const destinationFile = path.join(outputPath, key) + '.json';
        fs.writeFileSync(destinationFile, fileContent);
    });
}
