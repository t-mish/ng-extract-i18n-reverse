export interface ArbDifference {
    original: string;
    result: string,
    files: XLocation[]
}

export interface XLocation {
    file: string,
    start: { "line": string, "column": string },
    end: { "line": string, "column": string }
}

interface ArbValue {
    value: string,
    meta: {
        description?: string,
        "x-locations": XLocation[]
    }
}

interface ArbObject {
    [key: string]: any;
}

export function getDifferenceBetweenArbObjects(source: ArbObject, target: ArbObject): ArbDifference[] {
    const sourceValues = getValues(source);
    const targetValues = getValues(target);

    return Object.keys(targetValues).reduce((acc: ArbDifference[], curr:string) => {
        if (sourceValues[curr] && sourceValues[curr].value !== targetValues[curr].value) {
            return [...acc, {original: sourceValues[curr].value, result: targetValues[curr].value, files: targetValues[curr].meta['x-locations'] ?? []}];
        } else {
            return acc;
        }
    }, []);
}

function getValues(resource: {[key: string]: any}): {[key: string]: ArbValue} {
    let res: {[key: string]: ArbValue} = {};

    for (let key in resource) {
        if (resource.hasOwnProperty(`@${key}`)) {
            res[key] = {
                value: resource[key],
                meta: resource[`@${key}`]
            }
        }
    }

    return res;
}