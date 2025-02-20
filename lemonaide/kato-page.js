/***************************
 * The following const are *
 * stored on the Webflow ***
 * header script tag. ******
 * *************************
 * graphUrl - Get GraphQL URL
 * authUrl - Get OAuth URL
 * currentEnv - Get current Env
 * *************************/

import { producers } from './producers-data.js'
import { getUserToken, getMemberDetails } from './../utils/users-functions';


const fullPage = createApp({
  data() {
    return {
      graphUrl: graphUrl,
      plans: {},
      userToken: null,
      userInfo: null,
      isLogged: false,
      currentAudio: null,
      audioNumber: null,
      isPlaying: false,
      waveSurfer: null,
      tracks: producers[0].tracklist
    }
  },
  async beforeMount() {
    console.log('Vue Loaded!')
    //Get user token from user's device
    this.userToken = await getUserToken(window.location.href);
    if (!this.userToken) this.isTrial = true
    //If user has a token on client - Request user data
    if (this.userToken) this.userInfo = await getMemberDetails(this.graphUrl, this.userToken);
    //If userInfo is sucefully fetched, update isLogged variable to update UI
    if (this.userInfo) this.isLogged = true
    //Validate Token to get user plan to check if there's special promo
    let token = this.userToken ? this.userToken : undefined;
    //Mount Waveform UI based on selected file
    this.waveSurfer = WaveSurfer.create({
      container: '#waveform',
      height: 0
    })
  },
  methods: {
    async playTrack(item, index) {
      //Get Play button
      let actionButton = this.getItemOnDOM(index);
      //Handle existing music player
      if (index !== this.audioNumber) {
        //Load new audio
        await this.waveSurfer.load(this.tracks[index].audioTrack);
        //Handle play button replacement
        if (this.audioNumber !== null) {
          let oldButton = this.getItemOnDOM(this.audioNumber)

          this.updateInterface(oldButton, "ENDED");
          this.updateInterface(actionButton, "STARTED");
        }
        //Assign new music playing
        this.audioNumber = index;
      }

      //Pause or play the current Audio file
      this.waveSurfer.playPause();
      //Get Audio status
      let isPaused = this.waveSurfer.media.paused

      //Update Button interface audio after audio ends
      this.waveSurfer.media.onended = () => this.updateInterface(actionButton, "ENDED");
      //Update Button interface according play status
      isPaused ?
        this.updateInterface(actionButton, "ENDED") :
        this.updateInterface(actionButton, "STARTED");
    },
    getItemOnDOM(index) {
      let trackList = document.querySelectorAll('.track_player--item');
      return trackList[index]
    },
    updateInterface(item, status) {
      //Get items that will be updated
      const buttonBackground = item.querySelector('.tracket_player--button');
      const buttonText = buttonBackground.firstElementChild;
      //Handle Button if playback is true
      if (status === "ENDED") {
        buttonBackground.classList.remove("pressed")
        buttonText.classList.remove("pressed")
        buttonText.innerText = '󰐊'
        return
      }
      //Handle Button if playback is false
      buttonBackground.classList.add("pressed")
      buttonText.classList.add("pressed")
      buttonText.innerText = '󰏤'
    }
  },
  mounted() {
    this.$nextTick(function () {
      //RE-INIT WF as Vue.js init breaks WF interactions
      Webflow.destroy();
      Webflow.ready();
      Webflow.require('ix2').init();
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
});

fullPage.mount('#app')

