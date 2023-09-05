createApp({
  data() {
    return {
      isLogged: false,
      userInfo: null,
      userToken: null,
      graphUrl: "https://core.prod.beatstars.net/studio/graphql"
    }
  },
  async beforeMount() {    
    this.userToken = this.getUserToken()
    if(!this.userToken) return
    
    await this.getMember(this.userToken)
    if(!this.userInfo) return
    
    this.isLogged = true
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
  updated(){
    this.$nextTick(function () {
        //RE-INIT WF as Vue.js init breaks WF interactions
        Webflow.destroy();
        Webflow.ready();
        Webflow.require('ix2').init();
    });
  },
  methods: {
    showZendesk(){
          window.zE(() => {
            window.zE.activate()
          });
          return this.btnClicked = true
    },
    getUserToken(){
      //console.log("getUserToken function ran!")
      //Get token from the URL
      userUrl = window.location.search;
      urlParams = new URLSearchParams(userUrl)
      userToken = urlParams.get('access_token')      
      
      if(userToken){
        localStorage.setItem('access_token', userToken);

        let refreshToken = urlParams.get('refresh_token');
        localStorage.setItem('refresh_token', refreshToken);
        
        let expirationDate = urlParams.get('expiration_date');
        localStorage.setItem('access_token_expiration', expirationDate);

        return userToken
      }
      
      //Access localStorage to get token      
      userToken = localStorage.getItem("access_token")
      if(userToken) return userToken

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
    async getMember(token){
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
          if(response.ok) return response.json()
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
    login(){
      window.location.replace(`https://oauth.beatstars.com/verify?version=3.14.0&origin=${window.location.href}&send_callback=true`)
    },
    openProfile(){
      window.location.replace(`https://beatstars.com/${this.userInfo.profile.username}`) 
    },
    logout(){
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
      currentUrl = window.location.href;
      url = new URL(currentUrl);
      url.search = '';
      const modifiedUrl = url.href;
      
      setTimeout(() => {
        window.location.href = modifiedUrl;
      }, 1000);
    },
    deleteCookie(name) {
      document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;domain=.beatstars.com;path=/";
    },
    popupLogin() {
      let url = `https://oauth.beatstars.com/verify?version=3.14.0&origin=${window.location.href}&send_callback=true&t=dark-theme`
      let CLIENT_URL = window.location.href
      //const popup = window.open(url, "popup", "popup=true, width=500, height=500");
      const popup = this.popupwindow(url, "popup", 600, 600)
      const checkPopup = setInterval(() => {
        if (popup.window.location.href.includes(CLIENT_URL)) {
          popup.close();
          setTimeout(() => { window.location.reload(); }, 300);
        }
        if (!popup || popup.closed) return;
        clearInterval(checkPopup);
      }, 1000);
    },
    popupwindow(url, title, w, h) {
      var y = window.outerHeight / 2 + window.screenY - ( h / 2)
      var x = window.outerWidth / 2 + window.screenX - ( w / 2)
      return window.open(url, title, 'toolbar=no, location=no, directories=no, status=no, menubar=no, scrollbars=no, resizable=no, copyhistory=no, width=' + w + ', height=' + h + ', top=' + y + ', left=' + x);
    },
  }
}).mount('#navbar')