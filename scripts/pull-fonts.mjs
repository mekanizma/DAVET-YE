const res = await fetch("https://davetiyemgo.com/onizleme/tema/guz-masali");
const html = await res.text();
const i = html.indexOf("font-face");
console.log(html.slice(i - 40, i + 700));
console.log("---count", (html.match(/font-face/g) || []).length);
