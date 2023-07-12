import { PROD_URL } from "https://cdn.jsdelivr.net/gh/BeatStars/webflow-integrations/config.js";

const loadingOverlay = document.getElementById('loading-overlay');
const submitBtn = document.getElementById('submit-button');
const genericError = document.getElementById('generic-error')

$("#newEntryForm").submit(function (e) {
  e.preventDefault();
  const form = $(this); //Get Form info
  const actionUrl = form.attr('action'); //Get form action
  const data = form.serialize();
  const dataFields = data.split("&");

  //Create FormData
  var formData = {};
  dataFields.forEach(field => {
    let parts = field.split("=")
    let key = decodeURIComponent(parts[0]);
    let value = decodeURIComponent(parts[1]);
    formData[key] = value;
  });

  // Check for empty fields
  var isEmptyField = false;
  for (var key in formData) {
    if (formData.hasOwnProperty(key) && formData[key] === '') {
      isEmptyField = true;
      break;
    }
  }

  if (isEmptyField) {
    genericError.style.display = "block";
    genericError.innerText = "Ops! All fields are required, please fill your fields and try again"
    return
  }

  if (formData['title-input'].length > 100) {
    genericError.style.display = "block";
    genericError.innerText = "The title can have only 100 characters, please rename your file"
    return
  }

  loadingOverlay.style.display = 'flex';
  submitBtn.style.display = 'none';

  fetch(PROD_URL + '/submit/', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${userToken}`
    },
    body: JSON.stringify(formData)
  })
    .then(response => {
    return response.json()
  })
    .then(json => {
    if (json.submit === false) {
      loadingOverlay.style.display = 'none';
      submitBtn.style.display = 'block';
      genericError.style.display = 'block';
      genericError.innerText = json.message
      return
    }

    //console.log(json)
    window.location.href = `${window.location.hostname}/entry/${json.data.slug}?banner=true`
  })
    .catch(err => {
    console.log(err)
    return
  })
});

var newPhone = document.querySelector("#phone"),
    dialCode = document.querySelector(".dialCode")

var iti = intlTelInput(newPhone, {
  initialCountry: "us",
  placeholderNumberType: 'FIXED_LINE',
});

var updateInputValue = function (event) {
  dialCode.value = "+" + iti.getSelectedCountryData().dialCode;
};

newPhone.addEventListener('input', updateInputValue, false);
newPhone.addEventListener('countrychange', updateInputValue, false);

var errorMap = ["Invalid number", "Invalid country code", "Too short", "Too long", "Invalid number"];

var reset = function () {
  newPhone.classList.remove("error");
  errorMsg.innerHTML = "";
  errorMsg.classList.add("hide");
  validMsg.classList.add("hide");
};

newPhone.addEventListener('blur', function () {
  reset();
  if (newPhone.value.trim()) {
    if (iti.isValidNumber()) {
      validMsg.classList.remove("hide");
    } else {
      newPhone.classList.add("error");
      var errorCode = iti.getValidationError();
      errorMsg.innerHTML = errorMap[errorCode];
      errorMsg.classList.remove("hide");
    }
  }
});

newPhone.addEventListener('change', reset);
newPhone.addEventListener('keyup', reset);