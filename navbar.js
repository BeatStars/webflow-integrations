const { createApp } = Vue

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
        localStorage.setItem('access_token', userToken)
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
      localStorage.clear();
      this.islogged = false
      currentUrl = window.location.href;
      url = new URL(currentUrl);
      url.search = '';
      const modifiedUrl = url.href;
      window.location.replace(modifiedUrl);
    }
  }
}).mount('#navbar')