const SEAHORSE_EMOJI = '🧜‍♀️';
const MAX_OPERATIONS = 5_000_000;

const COMMAND_MAP = {
    1: '>', // Move pointer right
    2: '<', // Move pointer left
    3: '+', // Increment memory cell
    4: '-', // Decrement memory cell
    5: '.', // Output character
    6: ',', // Input character
    7: '[', // Loop start
    8: ']', // Loop end
};

function tokenize(code) {
    const tokens = code.match(/🧜‍♀️+/g) || [];
    return tokens.map(token => COMMAND_MAP[token.length]).filter(Boolean);
}

function buildJumpMap(commands) {
    const jumpMap = {};
    const stack = [];
    for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        if (command === '[') {
            stack.push(i);
        } else if (command === ']') {
            if (stack.length === 0) {
                throw new Error("Mismatched loop brackets: unexpected ']'");
            }
            const start = stack.pop();
            jumpMap[start] = i;
            jumpMap[i] = start;
        }
    }
    if (stack.length > 0) {
        throw new Error("Mismatched loop brackets: unclosed '['");
    }
    return jumpMap;
}

export async function runSeahorseCode(code, inputCallback, outputCallback) {
    const commands = tokenize(code);
    const jumpMap = buildJumpMap(commands);

    const tape = new Uint8Array(30000);
    let dataPointer = 0;
    let instructionPointer = 0;
    let operationsCount = 0;

    while (instructionPointer < commands.length) {
        if (operationsCount++ > MAX_OPERATIONS) {
            throw new Error("Maximum number of operations exceeded. Possible infinite loop.");
        }

        const command = commands[instructionPointer];

        switch (command) {
            case '>':
                dataPointer++;
                if (dataPointer >= tape.length) dataPointer = 0; // Wrap around
                break;
            case '<':
                dataPointer--;
                if (dataPointer < 0) dataPointer = tape.length - 1; // Wrap around
                break;
            case '+':
                tape[dataPointer]++; // Allows wrap-around via Uint8Array behavior
                break;
            case '-':
                tape[dataPointer]--; // Allows wrap-around via Uint8Array behavior
                break;
            case '.':
                outputCallback(String.fromCharCode(tape[dataPointer]));
                break;
            case ',':
                const val = inputCallback();
                tape[dataPointer] = typeof val === 'number' ? val : 0;
                break;
            case '[':
                if (tape[dataPointer] === 0) {
                    instructionPointer = jumpMap[instructionPointer];
                }
                break;
            case ']':
                if (tape[dataPointer] !== 0) {
                    instructionPointer = jumpMap[instructionPointer];
                }
                break;
        }
        instructionPointer++;
    }
}

