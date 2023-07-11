import { PROD_URL } from "https://cdn.jsdelivr.net/gh/BeatStars/webflow-integrations/config.js";

/* START
    Get Total Votes per Entry
*/
const submissionCards = document.querySelectorAll("[submissionCard]")
fetch(PROD_URL + '/total-votes/')
  .then(response => response.json())
  .then(json => {
    let videoIds = Object.keys(json); //Get IDs from backend response - FROM AIRTABLE
    let totalVotes = Object.values(json); //Get totalVotes from backend response - AIRTABLE.length

    submissionCards.forEach(card => {
      let voteNumber = card.querySelector(".vote_number"); /*Get all Cards from listing*/
      let entryHasVote = videoIds.includes(voteNumber.id); /*Check if IDs from backend has IDs from list*/

      if (!entryHasVote) return

      let getIndex = videoIds.indexOf(voteNumber.id)
      voteNumber.innerText = totalVotes[getIndex]
    })
  })
/* END
    Get Total Votes per Entry
*/


/* START
    Reduce length of long
    strings on contest
    submissions cards
*/
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
/* END
    Reduce length of long
    strings on contest
    submissions cards
*/



/* START - SCHEDULER BUILDER */

// Get the current date and time
var currentDate = new Date();

// Convert the current date to the same format as the "from" and "to" attributes
var currentDateString = currentDate.toLocaleString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });

// Get all the contest schedule cards
var cards = document.querySelectorAll('.contest-schedule_card');

// Loop through each card and check if it should be displayed
cards.forEach(function (card) {
    var status = card.getAttribute('status');
    var from = card.getAttribute('from');
    var to = card.getAttribute('to');

    // Convert the "from" and "to" attributes to date objects
    var fromDate = new Date(from);
    var toDate = new Date(to);

    // Check if the card should be displayed based on the current moment
    if (
        (status === 'future' && currentDate < fromDate) ||
        (status === 'past' && currentDate > toDate) ||
        (status === 'current' && currentDate >= fromDate && currentDate <= toDate)
    ) {
        card.style.display = 'flex';
    }
});

// Get all elements with the class "countdown-label"
const countdownLabels = document.getElementsByClassName('countdown-label');

// Iterate through each countdown label
Array.from(countdownLabels).forEach(label => {
    // Get the date string from the label's content
    const dateString = label.textContent;

    // Create a new Date object from the date string
    const targetDate = new Date(dateString);

    // Update the label's content with the countdown text
    setInterval(() => {
        const now = new Date();
        const timeDifference = targetDate - now;

        // Calculate the remaining days, hours, and minutes
        const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));

        // Format the countdown text as "dd:hh:mm"
        const countdownText = `${days.toString().padStart(2, '0')}D ${hours.toString().padStart(2, '0')}H ${minutes.toString().padStart(2, '0')}M`;

        // Update the label's content with the countdown text
        label.textContent = countdownText;
    }, 1000);
});
/* END - SCHEDULER BUILDER */