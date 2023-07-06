//Get Card Titles and
//reduce the size of
//long strings
const cardTitles = document.getElementsByClassName('is-thumb-title')
  
for (let i = 0; i < cardTitles.length; i++) {
let title = cardTitles[i].textContent;
cardTitles[i].textContent = reduceString(title);
}
  
function reduceString(text) {
if (text.length > 32) {
    return text.slice(0, 52) + "...";
} else {
    return text;
}
}