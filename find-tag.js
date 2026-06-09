const fs = require('fs');

const content = fs.readFileSync('src/app/components/idea-card/idea-card.component.html', 'utf-8');

const HTMLParser = require('htmlparser2'); // Assuming it might be installed, but if not we can use regex

const tags = [];
const lines = content.split('\n');

const stack = [];

let inString = false;
let currentTag = '';
let inTag = false;
let isClosing = false;
let lineNum = 1;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // simple regex matcher for tags
    // find <tagname and </tagname>

    const openMatches = [...line.matchAll(/<([a-zA-Z0-9\-]+)(?![^>]*\/>)[ \n\r>]/g)];
    for (const match of openMatches) {
        const tagName = match[1].toLowerCase();
        if (['br', 'img', 'input', 'hr', 'meta', 'link'].includes(tagName)) continue;
        stack.push({ tag: tagName, line: i + 1 });
    }

    const closeMatches = [...line.matchAll(/<\/([a-zA-Z0-9\-]+)>/g)];
    for (const match of closeMatches) {
        const tagName = match[1].toLowerCase();

        if (stack.length === 0) {
            console.error(`Unmatched closing tag </${tagName}> at line ${i + 1}`);
            continue;
        }

        const last = stack.pop();
        if (last.tag !== tagName) {
            console.error(`Mismatched: expected </${last.tag}> (opened at ${last.line}), got </${tagName}> at line ${i + 1}`);
            stack.push(last); // keep it on stack
        }
    }
}

console.log("Remaining on stack:", stack);
