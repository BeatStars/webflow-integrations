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

const submitRequestForm = createApp({
    setup() {},
    data() {
      return {
        graphUrl: graphUrl,
        authUrl: authUrl,
        isLogged: false,
        sessionToken: null,
        userInfo: null,
        userToken: null,
        showUpsell: false,
        formSend: false,
        middlewareUrl: webflowApi,
        requestForm: {
          UDF_TEXT2: '',
          UDF_MULTI1: '',
          BeatStars_URL: '',
          UDF_TEXT7: '',
          acceptedTos: null,
          marketplaceData: {}
        },
        files: [],
        zohoData: null,
        isLoading: false,
        toast: {
          show: true,
          title: '',
          message: ''
        }
      }
    },
    async beforeMount() {
      console.log("Vue Running!!");
  
      /*********************************************
       **** CALL BTS BACKEND TO FETCH USER DATA ****
       *********************************************/
  
      //Verify if user has Token on localStorage
      this.userToken = this.getUserToken()
      if (!this.userToken) return this.redirectUserToHome()
  
      //Get User details from GraphQL
      await this.getMember(this.userToken)
      if (!this.userInfo) return this.redirectUserToHome()
  
      //Update UI to show Logged User
      this.isLogged = true
  
      /*********************************************
       ** VERIFY IF USER IS CRA MEMBER ON ZOHOCRM **
       *********************************************/
      this.zohoData = await this.getZohoData(this.userInfo.account.email);
      //If user not find, redirect to home
      // if (this.zohoData.error || !this.zohoData["CRA Member"]) return window.location.href =
      //   '/creator-rights-agency/?error=You need to be a CRA Member to access this page&message='
  
      //Send the BeatStars user data to ZohoCRM
      this.requestForm.marketplaceData = this.userInfo;
      //Assign form within BeatStars account information
      this.requestForm.UDF_TEXT2 = this.userInfo.profile.displayName;
      this.requestForm.BeatStars_URL = 'https://beatstars.com/' + this.userInfo.account
        .username;
    },
    methods: {
      async submitForm(event) {
        event.preventDefault();
  
        if (!this.requestForm.acceptedTos) return this.callToast({
          title: "You must agree to our Terms of Service",
          message: ""
        })
  
        this.isLoading = true;
  
        /**********************************************
         ** Generate a token before calling Zoho API **
         **********************************************/
        this.sessionToken = await this.generateSesstionToken();
  
        /**********************************************
         Send Form Data to ZohoAPI to create a Project
         **********************************************/
        let sendFormData = await this.sendSubmitRequest(
          this.requestForm,
          this.sessionToken.access_token
        )
        //If API returns any error, display a error toast messasge to the user
        if (!sendFormData.created) {
          switch (sendFormData.type) {
          case "FIELDS_VALIDATION_ERROR":
            this.callToast({
              title: "Please verify your responses",
              message: "Looks like one or more fields are incorrects, please check your responses and try again"
            })
            break
          default:
            this.callToast({
              title: "Ops, something went wrong!",
              message: "Please contact our team at help@beatstars.com"
            })
          }
        };
        //If success, redirect user to a success page
        this.formSend = true;
        console.log(
          "Form created! Note for Development: Enable the function to direct to success page")
        return
        // return window.location.href = '/submit-request-success'
      },
      async sendSubmitRequest(form, token) {
        let url = this.middlewareUrl + "/submit-request";
        let options = {
          method: 'POST',
          headers: {
            "Authorization": `Zoho-oauthtoken ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            ...form,
            name: `CRA Help request - ${this.userInfo.profile.displayName}`,
            layout_id: "2196888000000274029"
          })
        }
  
        let response = await fetch(url, options);
        let data = await response.json();
        return data
      },
      reloadPage() {
        window.location.reload()
      },
      handleFiles(event) {
        let myFile = event.target.files || event.dataTransfer.files;
  
        var fileToLoad = myFile[0];
        // FileReader function for read the file.
        var fileReader = new FileReader();
        var base64;
        // Onload of file read the file content
        fileReader.onload = function (fileLoadedEvent) {
          return this.files = fileLoadedEvent.target.result;
        };
        // Convert data to base64
        fileReader.readAsDataURL(fileToLoad);
        console.log(this.files)
      },
      handleOptionChange(event) {},
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
  
            console.log(value)
            console.log(Object.entries(value))
            break;
  
          default:
            if (value === '') return emptyFields.push(key)
          }
        })
        return emptyFields;
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
        window.location.href = '/'
      },
      getUserToken() {
        //Get token from the URL
        let userUrl = window.location.search;
        let urlParams = new URLSearchParams(userUrl)
        let userToken = urlParams.get('access_token')
  
        if (userToken) {
          localStorage.setItem('access_token', userToken);
  
          let refreshToken = urlParams.get('refresh_token');
          localStorage.setItem('refresh_token', refreshToken);
  
          let expirationDate = urlParams.get('expiration_date');
          localStorage.setItem('access_token_expiration', expirationDate);
  
          return userToken
        }
        //Access localStorage to get token      
        userToken = localStorage.getItem("access_token")
        if (userToken) return userToken
        //Access cookies to get token
        cookies = document.cookie.split(";")
        cookieName = "access_token=";
        for (var i = 0; i < cookies.length; i++) {
          var cookie = cookies[i].trim();
  
          // Verify
          if (cookie.indexOf(cookieName) === 0) {
            accessToken = cookie.substring(cookieName.length, cookie.length);
            // Add token to localStorage
            localStorage.setItem('access_token', accessToken);
            userToken = accessToken
            return userToken;
          }
        }
  
        //Returns userToken as false
        return false
      },
      async getMember(token) {
        //console.log("getMember function ran!")
  
        await fetch(this.graphUrl, {
            method: "POST",
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
              query: `
              query getMember {
                member {
                  id
                  account{
                    username
                    firstName
                    lastName
                    type   
                    email
                    accountType
                    subscriptionPlan
                    address{
                      country
                      city
                      postalCode
                      region
                      street1
                    }
                  }
                  profile {
                    avatar {
                      sizes {
                        small
                      }
                    }
                    location
                    displayName
                    socialLinks{
                      friendlyName
                      profileName
                      network
                      link
                    }
                  }
                  config {
                    maxPromoteDailyBudget {
                      currency
                    }
                  }
                }
              }
            `
            })
          })
          .then((response) => {
            if (response.ok) return response.json()
            return Promise.reject(response)
          })
          .then((res) => {
            this.userInfo = res.data.member
            return this.userInfo
          })
          .catch(err => {
            console.log(err)
            return false
          })
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
      console.log(this.zohoData)
      if (this.zohoData) {
        let injectDiv = document.getElementById('iframeDiv')
        injectDiv.innerHTML =
          `<iframe aria-label='TEST CRA Form' frameborder="0" style="height:100%;width:100%;border:none;" src='https://forms.zohopublic.com/beatstars/form/TESTCRAForm/formperma/wK1t_siJr4QIu8GrFadBJQMS98xoaJdLTHrXtXtTU1Q?BeatStarsEmail=${this.zohoData['Member Email']}'></iframe>`
  
        let loadingDiv = document.getElementById('loadingSpinner')
        loadingDiv.style.display = 'none'
      }
  
      this.$nextTick(function () {
        let banner = document.querySelector('.welcome_banner')
        if (banner) { banner.classList.remove("hide") }
        //RE-INIT WF as Vue.js init breaks WF interactions
        Webflow.destroy();
        Webflow.ready();
        Webflow.require('ix2').init();
      });
    },
  })
  
  submitRequestForm.mount("#app");
  
  