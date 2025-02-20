/***************************
 * The following const are *
 * stored on the Webflow ***
 * header script tag. ******
 * *************************
 * graphUrl - Get GraphQL URL
 * authUrl - Get OAuth URL
 * currentEnv - Get current Env
 * webflowApi - API for CRA
 * *************************/

import {
    getProducersPlans,
    createAnnualPlans,
    createMonthlyPlans,
  } from './../contests/pricing-services.js';
  
  import {
    getUserToken,
    getMemberDetails
  } from './../contests/users-services.js';
  
  const intakeForm = createApp({
    data() {
      return {
        graphUrl: graphUrl,
        authUrl: authUrl,
        isLogged: false,
        sessionToken: null,
        userInfo: null,
        userToken: null,
        showUpsell: false,
        showPublishingUpsell: false,
        middlewareUrl: webflowApi,
        plans: null,
        products: null,
        userToken: null,
        isTrial: null,
        intakeForm: {
          First_Name: '',
          Last_Name: '',
          BTS_email: '',
          CRA_Preferred_Email: '',
          CRA_Number_of_Placements1: '',
          CRA_Interest: [],
          CRA_Referral: '',
          acceptedTos: null,
          CRA_Marketing_Opt_In: null,
          origin: {
            select: '',
            complement: ''
          },
          marketplaceData: {}
        },
        toast: {
          show: true,
          title: '',
          message: ''
        },
        isLoading: false,
        isTrial: null,
        annualy: [],
        monthly: [],
        featuresNotIncludeds: [
          "BeatStars Publishing",
          "PROkits Access",
          "3 Monthly Beat ID Credits",
          "5% off Promote Campaigns",
          "$50 Annual Promote Credits",
          "Seeds by Lemonaide Monthly Credits"
        ]
      }
    },
    async beforeMount() {
      console.log("Vue Running!");
      //Verify if user has Token on localStorage
      this.userToken = await getUserToken(window.location.href)
      //Validate Token to get user plan to check if there's special promo
      let token = this.userToken ? this.userToken : undefined;
      this.products = await getProducersPlans(this.graphUrl, token);
      //Create Annual Plan to pricing Section
      this.annualy = createAnnualPlans(this.products)
      //Create Monthly Plan to pricing Section
      this.monthly = createMonthlyPlans(this.products)
      if (!this.userToken) return this.showUpsell = true;
      this.userInfo = await getMemberDetails(this.graphUrl, this.userToken);
      // if (!this.userInfo) return this.redirectUserToHome()
  
      this.isLogged = true
  
      /*********************************************
       ** VERIFY IF USER IS CRA MEMBER ON ZOHOCRM **
       *********************************************/
      let zohoData = await this.getZohoData(this.userInfo.account.email);
      if (zohoData["CRA Member"]) return window.location.href =
        "/creator-rights-agency/dashboard"
      //Redirect User if not Publishing and Pro user
      if (
        !this.userInfo.account.subscriptions.includes("UNLIMITED")
      ) return this.showUpsell = true;
  
      if (
        this.userInfo.publishingDeal.status !== "PUBLISHED"
      ) return this.showPublishingUpsell = true;
  
      /**********************************************
       *** POPULATE INPUTS WITH DATA FROM GRAPHQL ***
       **********************************************/
  
      //Send the BeatStars user data to ZohoCRM
      this.intakeForm.marketplaceData = this.userInfo;
  
      //Assign form within BeatStars account information
      this.intakeForm.First_Name = this.userInfo.details.firstName;
      this.intakeForm.Last_Name = this.userInfo.details.lastName;
      this.intakeForm.BTS_email = this.userInfo.account.email;
      this.intakeForm.CRA_Preferred_Email = this.userInfo.account.email;
    },
    methods: {
      async submitForm(event) {
        event.preventDefault();
        //Init loading status on button
        this.isLoading = true
        // Check if Form is has empty fields
        let emptyFields = this.getEmptyFields(this.intakeForm)
        if (emptyFields.length > 0) {
          this.callToast({
            title: "All fields are required",
            message: "Please, check your fields and fill all inputs"
          })
          this.isLoading = false
          return
        }
        //Check if accepted terms of service
        if (!this.intakeForm.acceptedTos) {
          this.callToast({ title: "You must agree to our Terms of Service", message: "" })
          this.isLoading = false
          return
        }
        //Call new route to edit info on ZohoCRM
        const editCraUser = await this.registerIntakeForm(this.intakeForm);
  
        console.log(editCraUser)
  
        if (editCraUser.code === 'FAILED') {
          this.callToast({
            title: "Ops! Something went wrong!",
            message: editCraUser.message
          })
          this.isLoading = false
          return
        }
        //Succefully edit, redirect to dashboard
        if (editCraUser.code === 'SUCCESS') {
          window.location.href = '/creator-rights-agency/dashboard?welcome=true'
          return
        }
      },
      getEmptyFields(form) {
        let emptyFields = [];
        Object.keys(form).forEach(key => {
          let value = form[key]
  
          switch (typeof value) {
  
          case 'object':
            //Validate if the object is an Array 
            if (
              typeof value === "object" &&
              (value instanceof Object && value instanceof Array)
            ) {
              //If array from Checkboxes is 0, push the input to emptyFields
              if (value.length === 0) return emptyFields.push(key)
              return
            }
            //If object is not array, execute
            //check for empty fields inside JSON
  
            //Ignore MarketPlace data, this is autofilled
            //by requesting from BeatStars BE
            if (key === "marketplaceData") return
            break;
  
          default:
            if (value === '') return emptyFields.push(key)
          }
        })
        return emptyFields;
      },
      async registerIntakeForm(form) {
        let url = this.middlewareUrl + "/v2/edit-cra-user";
        let options = {
          method: 'POST',
          headers: {
            /* "Authorization": `Zoho-oauthtoken ${token}`, */
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(form)
        }
  
        let response = await fetch(url, options);
        let data = await response.json();
        return data
      },
      async getZohoData(email) {
        let url = this.middlewareUrl + "/v2/find-user?email=" + email;
        let options = {};
        let response = await fetch(url, options);
        let data = await response.json();
        return data
      },
      callToast(content) {
        //Get Toast and Progress Bar HTML Element and Store
        let toast = document.getElementById("toastMessage");
        let progressBar = document.getElementById("progressBar");
        //Toggle .hide-msg classList that is added by default
        toast.classList.toggle('hide-msg');
        progressBar.classList.toggle('progress-bar-red')
        //Edit Toastify data within current error
        this.toast = { ...this.toast, ...content }
        //Set timeout and hide the Toastify
        setTimeout(() => {
          toast.classList.toggle('hide-msg');
          progressBar.classList.toggle('progress-bar-red');
        }, 5000)
      },
      redirectUserToHome() {
        if (this.graphUrl === graphqlUrlDev) return window.location.href =
          'https://app.dev.beatstars.net/creator-rights-agency/'
  
        window.location.href = 'https://beatstars.com/creator-rights-agency/'
      },
  
      getCurrencyType(value) {
        let currency = this.products[0].plans[0].price.currency
        if (value === undefined) {
          return (0).toLocaleString('en-US', {
            style: 'currency',
            currency: currency
          })
        }
        let x = value.toLocaleString('en-US', { style: 'currency', currency: currency })
        return x
      },
      renderIcon(feature) {
        if (
          feature === "true" ||
          feature === "PRO_PAGE_GOOGLE_ANALYTICS_INTEGRATION_VALUE" ||
          feature === "PRO_PAGE_FACEBOOK_PIXEL_INTEGRATION_VALUE"
        ) return `<div><span class="icon__material-font-xl is--green" style="font-family: Materialdesignicons Webfont, sans-serif;font-size: 21px; color: #00d36e;">󰗠</span></div>`
        if (feature === "false")
          return `<div><span class="icon__material-font-xl is--gray" style="font-family: Materialdesignicons Webfont, sans-serif;font-size: 21px;">󰗠</span></div>`
        return feature
      },
      getPlanLink(name, payment) {
        if (name === 'Free')
          return `https://beatstars.com/onboarding/subscription-checkout?onboardingType=seller&backEnabled=false&plan=free&paymentFrequency=${payment}`
        if (name === 'Starter')
          return `https://beatstars.com/onboarding/subscription-checkout?onboardingType=seller&backEnabled=false&plan=marketplace&paymentFrequency=${payment}`
        if (name === 'Professional')
          return `https://beatstars.com/onboarding/subscription-checkout?onboardingType=seller&backEnabled=false&plan=proPage&paymentFrequency=${payment}`
      },
      popupLogin() {
        let url =
          `${this.authUrl}verify?version=3.14.0&origin=${window.location.href}&send_callback=true&t=dark-theme`
        let CLIENT_URL = window.location.href
        //const popup = window.open(url, "popup", "popup=true, width=500, height=500");
        const popup = this.popupwindow(url, "popup", 600, 600)
        const checkPopup = setInterval(() => {
          if (popup.window.location.href?.includes(CLIENT_URL)) {
            popup.close();
            setTimeout(() => { window.location.reload(); }, 1000);
          }
          if (!popup || popup.closed) return;
          clearInterval(checkPopup);
        }, 1000);
      },
      popupwindow(url, title, w, h) {
        var y = window.outerHeight / 2 + window.screenY - (h / 2)
        var x = window.outerWidth / 2 + window.screenX - (w / 2)
        return window.open(url, title,
          'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' +
          w + ', height=' + h + ', top=' + y + ', left=' + x);
      },
    },
    mounted() {
      this.$nextTick(function () {
        //RE-INIT WF as Vue.js init breaks WF interactions
        Webflow.destroy();
        Webflow.ready();
        Webflow.require('ix2').init();
        //Uncomment this before going to product
      });
    },
    updated() {
      this.$nextTick(function () {
        let banner = document.getElementById('upsellBanner');
        if (banner) banner.classList.remove("hide")
        let pBanner = document.getElementById('publishingBanner')
        if (pBanner) pBanner.classList.remove('hide')
        //RE-INIT WF as Vue.js init breaks WF interactions
        Webflow.destroy();
        Webflow.ready();
        Webflow.require('ix2').init();
      });
    },
  })
  
  intakeForm.mount("#app");
  