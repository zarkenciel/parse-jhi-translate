const path = require('path');
const fs = require('fs');

parseJhiTranslate();

function parseJhiTranslate() {
    console.log('-- start parsing jhiTranslate');

    const filepaths = findFiles('.', '.component.html');
    const directivesModel = seekDirectivesInFiles(filepaths);
    const translationModel = buildTranslationJson(directivesModel);
    writeTranslationFiles(translationModel);

    console.log('-- stop parsing jhiTranslate');
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

function seekDirectivesInFiles(filepaths) {
    const allDirectives = [];
    for (const path of filepaths) {
        const directivesInFile = seekDirectives(path);
        if (directivesInFile.directivesArray.length > 0) {
            allDirectives.push(directivesInFile);
        }
    }

    return allDirectives;
}

function seekDirectives(filepath) {
    const fileContent = fs.readFileSync(filepath, 'utf8');
    const indexes = findIndexesOfDirectives(fileContent);
    const directivesDatas = extractDirectiveDatas(fileContent, indexes);
    const directivesInFile = {
        filepath: filepath,
        directivesArray: directivesDatas,
    };
    return directivesInFile;
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

function extractDirectiveDatas(fileContent, indexes) {
    const datas = [];
    for (const index of indexes) {
        const directiveData = {
            index: index,
            isEval: isBoxed(fileContent, index),
            trKey: extractKey(fileContent, index),
            trValue: extractValue(fileContent, index),
        }

        const isInterpolation = directiveData.trKey.startsWith('{{');
        if (isInterpolation) {
            directiveData.isEval = true;
        }

        datas.push(directiveData);
    }
    return datas;
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

function buildTranslationJson(allDirectives) {
    const translationsJson = {};

    for (const directivesInFile of allDirectives) {
        // console.log('--- ' + directivesInFile.filepath + ' #' + directivesInFile.directivesArray.length);
        for (const directiveData of directivesInFile.directivesArray) {
            if (!directiveData.isEval) {
                // console.log('---- [' + (directiveData.isEval ? 'isEval' : 'noEval' ) + '] ' + directiveData.trKey + ' : ' + directiveData.trValue);
                const keyParts = directiveData.trKey.split('.');
                let currObj = translationsJson;
                for (let i = 0; i < keyParts.length; i++) {
                    const keyPart = keyParts[i];
                    if (!currObj[keyPart]) {
                        if (i == keyParts.length - 1) {
                            currObj[keyPart] = directiveData.trValue;
                        } else {
                            currObj[keyPart] = {};
                        }
                    }
                    currObj = currObj[keyPart];
                }
            }
        }
    }

    return translationsJson;
}

function writeTranslationFiles(translationJson) {
    const outputPath = './test-parse-tr/';
    Object.keys(translationJson).forEach((key, index) => {
        const fileModel = {};
        fileModel[key] = translationJson[key];
        const fileContent = JSON.stringify(fileModel, null, 4);
        const destinationFile = path.join(outputPath, key) + '.json';
        fs.writeFileSync(destinationFile, fileContent);
    });
}
