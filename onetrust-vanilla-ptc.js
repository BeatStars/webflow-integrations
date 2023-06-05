import { getOneTrustCookies, getOneTrustPermissions, stringToObject, runAnalytics, runGTag, runMetaPixel } from './models.js'

var checkCookie = function () {
  console.log("Run 1")
  setTimeout(() => {
    console.log("Run 2")
    var lastCookie = document.cookie; // 'static' memory between function calls
    var lastOneTrustCookies = getOneTrustCookies(lastCookie)
    var lastPermissions = getOneTrustPermissions(lastOneTrustCookies)
  
    return function () {
      var currentCookie = document.cookie;
      var currentOneTrustCookies = getOneTrustCookies(currentCookie)
      var currentPermission = getOneTrustPermissions(currentOneTrustCookies)
  
      if(JSON.stringify(currentPermission) != JSON.stringify(lastPermissions)){
        lastPermissions = currentPermission
        window.location.reload()
      }
    }; 
  }, 1000);
}();

window.addEventListener('load', function () {
  setTimeout(() => {
    window.setInterval(checkCookie, 500);

    let oneTrustCookies = getOneTrustCookies(document.cookie);
    let oneTrustPermissions = getOneTrustPermissions(oneTrustCookies);

    //Mount object for run the scripts
    let oneTrustPermitedCookies = Object.entries(oneTrustPermissions);

    let renderPermitedCookies;
    oneTrustPermitedCookies.forEach(element => {
      let key = element[0];
      let value = element[1]
      renderPermitedCookies = {
        ...renderPermitedCookies,
        [key]: stringToObject(value)
      }
    })

    if (renderPermitedCookies.hosts.H16 === 1) {
      renderYoutubeVideo()
    }else{
      handleConsentContent()
    }

    filterScripts(oneTrustPermissions.groups, "groups")
    filterScripts(oneTrustPermissions.genVendors, "vendors")
  }, 1000)
})

function handleConsentContent(){
  let placeholder = document.getElementById("placeholder")
  placeholder.innerHTML = `
    <div class="c-container">
      <div class="c-cookie--banner">
        <h3 class="c-title">Content blocked by cookie preferences</h3>
        <p>If you want to see this content, please review your cookies permissions</p>
      </div>
    </div>
  `
}

function renderYoutubeVideo() {
  console.log("Rendering a youtube video")
  let placeholder = document.getElementById("placeholder")
  let ytLink = document.getElementById("link").split("=")[2]
  
  placeholder.innerHTML = `
    <div class="w-video w-embed">
      <iframe class="embedly-embed"
          src="//cdn.embedly.com/widgets/media.html?src=https%3A%2F%2Fwww.youtube.com%2Fembed%2F4S4U-kWCjBE&display_name=YouTube&url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3D4S4U-kWCjBE&key=96f1f04c5f4143bcb0f2e68c87d65feb&type=text%2Fhtml&schema=google"
          width="854" height="480" scrolling="no" title="YouTube embed" frameborder="0"
          allow="autoplay; fullscreen" allowfullscreen="true">
      </iframe>
    </div>
  `;
}

function filterScripts(type, category) {
  type.split(",").forEach(item => {
    let name = item.split(":")[0];
    let value = item.split(":")[1];

    if (value === "0") { return }
    if (category === "groups") {
      switch (name) {
        case "MUST":
          break;
        case "FUNC":
          break;
        case "PERF":  
          runAnalytics('G-K2C1Q6LDKP');
          runMetaPixel('657684799339646');
          break;
      }
    } else if (category === "vendors") {
      switch (name) {
        case "ga4":
          runAnalytics('G-K2C1Q6LDKP');
          break;
        case "face":
          runMetaPixel('657684799339646');
          break;
      }
    };
    return
  })
}