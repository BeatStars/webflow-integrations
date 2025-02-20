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

const dashboard = createApp({
    data() {
      return {
        isLogged: false,
        sessionToken: null,
        userInfo: null,
        userToken: null,
        graphUrl: graphUrl,
        authUrl: authUrl,
        middlewareUrl: webflowApi,
        tax: 0,
        discount: 0,
        shipping: 0,
        ammountPaid: 0,
        subtotal: 0,
        listing: [
        {
          description: '',
          quantity: 1,
          rate: 0,
          ammount: function () {
            return this.quantity * this.rate;
          }
        }]
      }
    },
    async beforeMount() {
      console.log("Vue Running!");
  
      /*********************************************
       **** CALL BTS BACKEND TO FETCH USER DATA ****
       *********************************************/
  
      //Verify if user has Token on localStorage
      this.userToken = this.getUserToken()
      // if (!this.userToken) return this.redirectUserToHome()
  
      //Get User details from GraphQL
      await this.getMember(this.userToken)
      // if (!this.userInfo) return this.redirectUserToHome()
  
      //Update UI to show Logged User
      this.isLogged = true
      // let userUi = document.getElementById("loginInfo");
      // userUi.classList.remove('hide')
  
      /*********************************************
       ** VERIFY IF USER IS CRA MEMBER ON ZOHOCRM **
       *********************************************/
      let zohoData = await this.getZohoData(this.userInfo.account.email);
      //If user not find, redirect to home
      if (zohoData.error || !zohoData["CRA Member"]) return window.location.href =
        '/creator-rights-agency/?error=You need to be a CRA Member to access this page&message='
    },
    methods: {
      updateAmountValue(event, index, type) {
        this.listing[index][type] = event.target.value;
        this.getSubtotalValue(this.listing);
        this.getTotalValue();
      },
      addNewItem() {
        this.listing.push({
          description: '',
          quantity: 1,
          rate: 0,
          ammount: function () {
            return this.quantity * this.rate;
          }
        })
      },
      getSubtotalValue(list) {
        const sum = list.reduce((accumulator, object) => {
          return accumulator + object.ammount();
        }, 0);
        return this.subtotal = sum
      },
      getTotalValue() {
        let addDiscount = this.minusPercent(this.subtotal, this.discount)
        let addTax = this.plustPercent(addDiscount, this.tax)
        let addShipping = addTax + parseFloat(this.shipping)
        let addAmmount = addShipping - parseFloat(this.ammountPaid)
        let finalValue = addAmmount;
        return finalValue
      },
      async getZohoData(email) {
        let url = this.middlewareUrl + "/v2/find-user?email=" + email;
        let options = {};
        let response = await fetch(url, options);
        let data = await response.json();
        return data
      },
      minusPercent(n, p) {
        return n - (n * (p / 100));
      },
      plustPercent(n, p) {
        return n + (n * (p / 100));
      },
      redirectUserToHome() {
        window.location.href = '/'
      },
      getUserToken() {
        //console.log("getUserToken function ran!")
        //Get token from the URL
        userUrl = window.location.search;
        urlParams = new URLSearchParams(userUrl)
        userToken = urlParams.get('access_token')
  
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
                  email
                    accountType
                    subscriptionPlan
                  }
                  details {
                    firstName
                    lastName
                    __typename
                  }
                  profile {
                    memberId
                    avatar {
                      sizes {
                        small
                      }
                    }
                    location
                    displayName
                    username
                  }
                  config {
                    maxPromoteDailyBudget {
                      amount
                      currency
                      __typename
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
      login() {
        window.location.replace(
          `${this.authUrl}verify?version=3.14.0&origin=${window.location.href}&send_callback=true`
        )
      },
      openProfile() {
        window.location.replace(`https://beatstars.com/${this.userInfo.profile.username}`)
      },
      logout() {
        //DESTROY ALL COKKIES
        //AND LOCAL STORAGE            
        this.deleteCookie('access_token');
        this.deleteCookie('expiration_date');
        this.deleteCookie('access_token_expiration');
        this.deleteCookie('refresh_token');
  
        localStorage.removeItem("access_token");
        localStorage.removeItem("expiration_date");
        localStorage.removeItem("access_token_expiration");
        localStorage.removeItem("refresh_token");
  
        //Change Status to Update Vue UI
        this.islogged = false
  
        //Remove URL params for prevent infinite loop
        window.location.href = "/"
      },
      deleteCookie(name) {
        document.cookie = name +
          "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=.beatstars.com;path=/";
      },
      popupLogin() {
        let url =
          `${this.authUrl}verify?version=3.14.0&origin=${window.location.href}&send_callback=true&t=dark-theme`
        let CLIENT_URL = window.location.href
        //const popup = window.open(url, "popup", "popup=true, width=500, height=500");
        const popup = this.popupwindow(url, "popup", 600, 600)
        const checkPopup = setInterval(() => {
          if (popup.window.location.href.includes(CLIENT_URL)) {
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
        //RE-INIT WF as Vue.js init breaks WF interactions
        Webflow.destroy();
        Webflow.ready();
        Webflow.require('ix2').init();
      });
    },
  })
  
  dashboard.mount("#app")
  