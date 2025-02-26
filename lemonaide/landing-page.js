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
            isPlaying: false,
            selectedProducer: 0,
            selectedTrack: 0,
            producersData: producers,
            waveSurfer: null,
            ressetedAnimations: false,
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
        //Get Producer List on WaveForm div
        let producerList = this.getProducersList()
        //Update UI to select the first producer
        producerList[this.selectedProducer].classList.add("selected")

        //Mount Waveform UI based on selected file
        let waveOptions = {
            container: '#waveform',
            url: this.producersData[this.selectedProducer].tracklist[this.selectedTrack]
                .audioTrack,
            height: `${window.screen.height * .3}`,
            waveColor: '#3D5E5C',
            progressColor: '#79cbbb',
            cursorColor: '#eabc16',
            cursorWidth: 1,
            barWidth: 2,
            barGap: 3,
            barRadius: 100,
            barHeight: 0,
        }

        this.waveSurfer = WaveSurfer.create(waveOptions)

    },
    methods: {
        async changeMusic(type) {
            let currentProducer = this.producersData[this.selectedProducer]
            let trackList = currentProducer.tracklist

            if (type === "next") {
                //Prevent to broke max number of tracks
                if (trackList.length - 1 <= this.selectedTrack) {
                    this.selectedTrack = 0
                    await this.waveSurfer.load(this.producersData[this.selectedProducer].tracklist[this
                        .selectedTrack].audioTrack)
                    //Start new song
                    this.waveSurfer.play()
                    //Handle button UI
                    let isPaused = this.waveSurfer.media.paused
                    let playButton = document.getElementById("playButton")
                    isPaused ?
                        this.updateInterface(playButton, "ENDED") :
                        this.updateInterface(playButton, "STARTED");
                    return
                }
                //Update number of selected track
                this.selectedTrack = this.selectedTrack + 1
                //Handle UI while new audio is loading
                this.handleAudioLoading();
                //Stop previous song
                this.waveSurfer.stop()
                //Pass to the next song on array
                await this.waveSurfer.load(this.producersData[this.selectedProducer].tracklist[this
                    .selectedTrack].audioTrack)
                //Start new song
                this.waveSurfer.play()
                //Handle button UI
                let isPaused = this.waveSurfer.media.paused
                let playButton = document.getElementById("playButton")
                isPaused ?
                    this.updateInterface(playButton, "ENDED") :
                    this.updateInterface(playButton, "STARTED");
            }
            if (type === "prev") {
                //Prevent to broke max number of tracks
                if (this.selectedTrack === 0) {
                    this.selectedTrack = 4
                    await this.waveSurfer.load(this.producersData[this.selectedProducer].tracklist[this
                        .selectedTrack].audioTrack)
                    //Start new song
                    this.waveSurfer.play()
                    //Handle button UI
                    let isPaused = this.waveSurfer.media.paused
                    let playButton = document.getElementById("playButton")
                    isPaused ?
                        this.updateInterface(playButton, "ENDED") :
                        this.updateInterface(playButton, "STARTED");
                    return
                }
                //Update number of selected track
                this.selectedTrack = this.selectedTrack - 1
                //Handle UI while new audio is loading
                this.handleAudioLoading();
                //Stop previous song
                this.waveSurfer.stop()
                //Pass to the next song on array
                await this.waveSurfer.load(this.producersData[this.selectedProducer].tracklist[this
                    .selectedTrack].audioTrack)
                //Start new song
                this.waveSurfer.play()
                //Handle button UI
                let isPaused = this.waveSurfer.media.paused
                let playButton = document.getElementById("playButton")
                isPaused ?
                    this.updateInterface(playButton, "ENDED") :
                    this.updateInterface(playButton, "STARTED");
            }
        },
        playOrPause(event) {
            //Pause or play the current Audio file
            this.waveSurfer.playPause();
            //Get Audio status
            let isPaused = this.waveSurfer.media.paused
            //Get Play button
            let actionButton = event.target
            //Update Button interface audio after audio ends
            this.waveSurfer.media.onended = () => this.updateInterface(actionButton, "ENDED");
            //Update Button interface according play status
            isPaused ?
                this.updateInterface(actionButton, "ENDED") :
                this.updateInterface(actionButton, "STARTED");
        },
        updateInterface(item, status) {
            //Get items that will be updated
            const buttonBackground = document.getElementById("playButton");
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
        },
        async changeSelectedProducer(event, index) {
            this.unselectProducer(this.selectedProducer, index);
            this.selectedProducer = index;
            this.selectedTrack = 0;
            //Handle UI while new audio is loading
            this.handleAudioLoading();
            //Stop previous song
            this.waveSurfer.stop()
            //Load new Audio after changing producer
            await this.waveSurfer.load(this.producersData[this.selectedProducer].tracklist[0]
                .audioTrack)
            this.waveSurfer.play()
            let isPaused = this.waveSurfer.media.paused
            let playButton = document.getElementById("playButton")
            isPaused ?
                this.updateInterface(playButton, "ENDED") :
                this.updateInterface(playButton, "STARTED");

            //Update Button interface audio after audio ends
            this.waveSurfer.media.onended = () => this.updateInterface(playButton, "ENDED");
            return
        },
        handleAudioLoading() {
            let loader = document.getElementById("loader");
            this.waveSurfer.on('loading', (percent) => { loader.style.display = "flex" });
            this.waveSurfer.on('ready', (percent) => { loader.style.display = "none" });
            return
        },
        unselectProducer(prev, next) {
            //Get Producer List on WaveForm div
            let producerList = this.getProducersList()
            //Remove selected from previous button
            producerList[prev].classList.remove("selected")
            //Update UI to select the first producer
            producerList[next].classList.add("selected")
            return
        },
        getProducersList() {
            return document.querySelectorAll('.waveform_player--header_item')
        }
    },
    mounted() {
        this.$nextTick(function () {
            if (!this.ressetedAnimations) {
                Webflow.destroy();
                Webflow.ready();
                Webflow.require('ix2').init();
                this.ressetedAnimations = true;
            }
        });
    },
    updated() {
        this.$nextTick(function () {
            let anchor = this.getAnchor()
            if (anchor) {
                const pageSection = document.getElementById(anchor)
                if (pageSection) pageSection.scrollIntoView();
            }
            let page = document.getElementById('app')
            //RE-INIT WF as Vue.js init breaks WF interactions
            if (!this.ressetedAnimations) {
                Webflow.destroy();
                Webflow.ready();
                Webflow.require('ix2').init();
                this.ressetedAnimations = true;
            }
        });
    },
});

fullPage.mount('#app')
