const content = '# Hello\r\n\r\n# World\r\n';
const lines = content.split('\n');
const headingRegex = /^(#{1,6})\s+(.+)$/;
const items = [];
lines.forEach((line, index) => {
  const match = line.match(headingRegex);
  if (match) {
    items.push({
      level: match[1].length,
      text: match[2],
      line: index + 1,
    });
  }
});
console.log(items);
