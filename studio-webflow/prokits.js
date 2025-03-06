/***************************
 * The following values are*
 * stored on the Webflow ***
 * header script tag. ******
 * *************************
 * graphUrl - Get GraphQL URL
 * authUrl - Get OAuth URL
 * currentEnv - Get current Env
 * *************************/

import { getUserToken, getMemberDetails, logoutUser } from './../utils/users-functions.js';

const fullPage = createApp({
    data() {
      return {
        graphUrl,
        authUrl,
        pageLink: window.location.href,
        isFetching: true,
        userToken: null,
        userInfo: null,
        isTrial: false,
        ressetedAnimations: false
      };
    },
    computed: {
      isLogged() {return !!this.userInfo}
    },
    async mounted() {
      console.log("Vue Loaded!");
      //Get Token from user device
      this.userToken = await getUserToken(window.location.href);
      this.isTrial = !this.userToken; //If user is not logged in, show trial button
      //Get data if user is logged
      if (this.userToken) {
        this.userInfo = await getMemberDetails(this.graphUrl, this.userToken);
      }
      this.isFetching = false; //Finish loading
    },
    methods: {
      getAnchor() {
        return document.URL.split("#")[1] || null;
      },
      logout() {
        logoutUser();
      }
    },
    updated() {
      this.$nextTick(() => {
         //Fix scroll to anchor due Vue Lifecycle
        const anchor = this.getAnchor();
        if (anchor) {document.getElementById(anchor)?.scrollIntoView();}
  
        //Re-init Webflow anitamations due Vue Lifecycle
        if (!this.ressetedAnimations) {
          Webflow.destroy();
          Webflow.ready();
          Webflow.require("ix2").init();
        }
      });
    }
  });
  
  fullPage.mount("#app");
  
