const { createApp } = Vue

createApp({
  data() {
    return {
      message: "Hello!",
      isLogged: false,
      userInfo: null,
      userToken: null,
      btnClicked: false,
      graphUrl: "https://core.dev.beatstars.net/studio/graphql"
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
        // Uncomment this before going to product
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
        if(!this.btnClicked){
          window.zE(() => {
            window.zE.activate()
          });
          return this.btnClicked = true
        }

        window.zE.hide();
        return this.btnClicked = false
    },
    getUserToken(){
      console.log("getUserToken function ran!")
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
      //Returns userToken as false
      return false
    },
    async getMember(token){
      console.log("getMember function ran!")

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
      window.location.replace(`https://oauth.dev.beatstars.net/verify?version=3.14.0&origin=${window.location.href}&send_callback=true`)
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