((window, document) => {
    let freshTimer = null;
    let tipsTimer = null;
    let waitNumber = 0;
    let lastTime = 0;

    class Html5Video {
        constructor(selectorStr, options) {
            if (!selectorStr) {
                throw 'input video container selector';
            }
            this.selector = document.querySelector(selectorStr);
            this.options = Object.assign({
                fullscreen: false,
                fullscreenRatio: 0.95,
                title: '视频播放',
                volume: 1,
                playbackRate: 1,
                loop: false,
                preload: 'auto'
            }, options);
            this.player = null;
        }

        // 初始化插件
        init() {
            this.selector.addEventListener('click', this.clickHandler.bind(this));
            this.selector.innerHTML = Html5Video.renderHtml();
            this.player = this.selector.querySelector('.html-5-video-player');
            this.player.src = this.options.src;
            this.player.poster = this.options.poster;
            this.player.preload = this.options.preload;
            this.selector.querySelector('.html-5-video-title-text').innerText = this.options.title;
            this.setVideoPlaySpeed(true);
            this.setVideoLoop(true);
            this.videoPlayListener();
            this.videoProgressRangeListener();
            if (Html5Video.getOs().ios) { // ios系统无法设置音量，隐藏组件
                this.selector.querySelector('#voiceTitle').style.display = 'none';
                this.selector.querySelector('.html-5-video-drawer-voice-progress').style.display = 'none';
            } else {
                this.setVideoVolume(true);
                this.videoVoiceRangeListener();
            }
        }

        // 设置音量
        setVideoVolume(silence) {
            this.player.volume = this.options.volume;
            const percent = parseInt(this.player.volume * 100);
            this.selector.querySelector('.html-5-video-drawer-voice-range').value = percent;
            this.selector.querySelector('.html-5-video-drawer-voice-range').style.backgroundSize = percent + "% 100%";
            !silence && this.showTips(`音量 ${percent}%`);
        }


        // 设置播放速度
        setVideoPlaySpeed(silence) {
            this.player.playbackRate = this.options.playbackRate;
            if (this.selector.querySelector(`.html-5-video-drawer-speed-item.active`)) {
                this.selector.querySelector(`.html-5-video-drawer-speed-item.active`).classList.remove('active');
            }
            if (this.selector.querySelector(`.html-5-video-drawer-speed-item[data-speed="${this.player.playbackRate}"]`)) {
                this.selector.querySelector(`.html-5-video-drawer-speed-item[data-speed="${this.player.playbackRate}"]`).classList.add('active');
            }
            !silence && this.showTips(`播放速度 x${this.player.playbackRate.toFixed(2)}`);
        }

        // 设置视频循环播放
        setVideoLoop(silence) {
            this.player.loop = this.options.loop;
            if (this.selector.querySelector(`.html-5-video-drawer-loop-item.active`)) {
                this.selector.querySelector(`.html-5-video-drawer-loop-item.active`).classList.remove('active');
            }
            const str = this.player.loop ? 'open' : 'close';
            this.selector.querySelector(`.html-5-video-drawer-loop-item[data-loop="${str}"]`).classList.add('active');
            !silence && this.showTips(this.player.loop ? `循环播放已开启` : `循环播放已关闭`);
        }

        // 播放相关监听
        videoPlayListener() {
            // 元数据加载完成
            this.player.addEventListener('loadedmetadata', () => {
                this.selector.querySelector('.html-5-video-controls-total-time').innerText = Html5Video.formatToMinute(this.player.duration);
            });

            // 播放时间更新
            this.player.addEventListener("timeupdate", () => {
                const val = (100 / this.player.duration) * this.player.currentTime;
                this.selector.querySelector('.html-5-video-progress-range').value = val;
                this.selector.querySelector('.html-5-video-progress-range').style.backgroundSize = "" + val + "% 100%";
                this.selector.querySelector('.html-5-video-controls-current-time').innerText = Html5Video.formatToMinute(this.player.currentTime);
            });

            // 正在播放
            this.player.addEventListener("playing", () => {
                waitNumber = 0;
            });

            // 播放结束
            this.player.addEventListener("ended", () => {
                if (!this.options.loop) {
                    this.player.currentTime = 0;
                    this.pause();
                }
            });

            // 卡顿三秒，显示loading
            setInterval(() => {
                if (!this.player.paused && !this.player.ended) {
                    if (waitNumber === 3) {
                        this.selector.querySelector('.html-5-video-loading-icon').style.display = 'block';
                        return;
                    } else {
                        this.selector.querySelector('.html-5-video-loading-icon').style.display = 'none';
                    }
                    if (lastTime === this.player.currentTime) {
                        waitNumber++;
                    }
                    lastTime = this.player.currentTime;
                }
            }, 1000);
        }

        // 进度条事件监听
        videoProgressRangeListener() {
            const range = this.selector.querySelector('.html-5-video-progress-range');
            // 拖动进度条
            range.addEventListener("change", () => {
                const val = range.value;
                range.style.backgroundSize = "" + val + "% 100%";
                this.player.currentTime = this.player.duration * (val / 100);

            });
            // 点击进度条
            range.addEventListener("input", () => {
                const val = range.value;
                range.style.backgroundSize = "" + val + "% 100%";

            });
        }

        // 音量条事件监听
        videoVoiceRangeListener() {
            const range = this.selector.querySelector('.html-5-video-drawer-voice-range');
            // 拖动进度条
            range.addEventListener("change", () => {
                this.options.volume = range.value / 100;
                this.setVideoVolume();
                this.toggleSettingDrawer(false);
            });
            // 点击进度条
            range.addEventListener("input", () => {
                this.options.volume = range.value / 100;
                this.setVideoVolume();
            });
        }

        // 展示提示框
        showTips(str) {
            clearTimeout(tipsTimer);
            this.selector.querySelector('.html-5-video-tips').innerText = str || '';
            this.selector.querySelector('.html-5-video-tips').style.display = 'block';
            tipsTimer = setTimeout(() => {
                this.selector.querySelector('.html-5-video-tips').style.display = 'none';
            }, 2000);
        }

        // 播放视频
        play() {
            this.player.play();
            this.setPlayerClassName('playing', 'fresh');
        }

        // 暂停视频
        pause() {
            this.player.pause();
            this.setPlayerClassName('pause');
        }

        // 切换全屏播放
        toggleFullscreen() {
            if (this.options.fullscreen) {
                // 退出全屏
                this.options.fullscreen = false;
                document.body.style.background = '#fff';
                this.selector.style.cssText = '';
                this.selector.querySelector('.html-5-video-container').classList.remove('fullscreen');
                this.selector.querySelector('.html-5-video-container').style.cssText = '';
            } else {
                // 进入全屏
                this.options.fullscreen = true;
                const clientWidth = document.documentElement.clientWidth;
                const clientHeight = document.documentElement.clientHeight;
                const videoWidth = this.player.offsetWidth;
                const videoHeight = this.player.offsetHeight;
                let width;
                let height;
                document.body.style.background = '#000';
                this.selector.style.cssText = 'z-index: 999; position: fixed; width: 100%; height: 100%; left: 0; top: 0; background: #000;';
                this.selector.querySelector('.html-5-video-container').classList.add('fullscreen');
                if (clientHeight > clientWidth) {
                    let fullscreenRatio = this.options.fullscreenRatio;
                    if ((clientHeight * videoHeight / videoWidth) < clientWidth) {
                        width = clientHeight * fullscreenRatio;
                        height = clientHeight * videoHeight / videoWidth * fullscreenRatio;
                    } else {
                        width = clientWidth * videoWidth / videoHeight * fullscreenRatio;
                        height = clientWidth * fullscreenRatio;
                    }
                    this.selector.querySelector('.html-5-video-container').style.cssText = `transform: rotate(90deg) translate(${(clientHeight - height) / 2}px, ${(width - clientWidth) / 2}px); width: ${width}px`;
                }
            }
        }

        // 切换设置抽屉
        toggleSettingDrawer(type) {
            if (typeof type === 'boolean') {
                this.selector.querySelector('.html-5-video-setting-drawer-container').classList.toggle('active', type);
            } else {
                this.selector.querySelector('.html-5-video-setting-drawer-container').classList.toggle('active');
            }

        }

        // 切换播放器样式类
        setPlayerClassName() {
            this.selector.querySelector('.html-5-video-container').className = 'html-5-video-container';
            if (this.options.fullscreen) {
                this.selector.querySelector('.html-5-video-container').classList.add('fullscreen');
            }
            document.body.classList.add.apply(this.selector.querySelector('.html-5-video-container').classList, arguments);
        }

        // 点击事件收集
        clickHandler(event) {
            const targetId = event.target.id;
            switch (targetId) {
                case 'playIcon':
                    clearTimeout(freshTimer);
                    this.toggleSettingDrawer(false);
                    this.play();
                    break;
                case 'pauseIcon':
                    clearTimeout(freshTimer);
                    this.toggleSettingDrawer(false);
                    this.pause();
                    break;
                case 'videoPlayer':
                    this.toggleSettingDrawer(false);
                    if (!this.player.paused) {
                        clearTimeout(freshTimer);
                        this.setPlayerClassName('playing');
                        freshTimer = setTimeout(() => {
                            this.setPlayerClassName('playing', 'fresh');
                        }, 1500);
                    }
                    break;
                case 'fullscreenIcon':
                case 'backIcon':
                    this.toggleFullscreen();
                    break;
                case 'settingIcon':
                    if (this.options.fullscreen && Html5Video.getOs().ios) {
                        this.toggleFullscreen();
                    }
                    this.toggleSettingDrawer();
                    break;
                default:
                    if (event.target.classList.contains('html-5-video-drawer-speed-item')) {
                        this.options.playbackRate = event.target.getAttribute('data-speed');
                        this.setVideoPlaySpeed();
                        this.toggleSettingDrawer(false);
                    } else if (event.target.classList.contains('html-5-video-drawer-loop-item')) {
                        this.options.loop = event.target.getAttribute('data-loop') === 'open';
                        this.setVideoLoop();
                        this.toggleSettingDrawer(false);
                    }
                    break;
            }
        }

        // 渲染UI
        static renderHtml() {
            return `<div class="html-5-video-container">
                        <video class="html-5-video-player" id="videoPlayer" "webkit-playsinline"="webkit-playsinline" playsinline="playsinline"></video>
                        <span class="html-5-video-title-container">
                            <span class="html-5-video-back-icon" id="backIcon"></span>
                            <span class="html-5-video-title-text"></span>
                        </span>
                        <span class="html-5-video-loading-icon"></span>
                        <span class="html-5-video-play-icon" id="playIcon"></span>
                        <span class="html-5-video-pause-icon" id="pauseIcon"></span>
                        <div class="html-5-video-tips"></div>
                        <div class="html-5-video-controls-container">
                            <span class="html-5-video-controls-current-time">00:00</span>
                            <div class="html-5-video-progress-total">
                                <div class="html-5-video-progress-right">
                                    <input class="html-5-video-progress-range" type="range" value="0" min="0" max="100">
                                </div>
                            </div>
                            <span class="html-5-video-controls-total-time">--:--</span>
                            <span class="html-5-video-fullscreen-icon" id="fullscreenIcon"></span>
                            <span class="html-5-video-setting-icon" id="settingIcon"></span>
                        </div>
                        <div class="html-5-video-setting-drawer-container">
                            <p class="html-5-video-drawer-title" id="voiceTitle">播放音量</p>
                            <div class="html-5-video-drawer-voice-progress">
                                <input class="html-5-video-drawer-voice-range" type="range" value="100" min="0" max="100">
                            </div>
                            <p class="html-5-video-drawer-title">循环播放</p>
                            <div class="html-5-video-drawer-loop-list">
                                <a href="javascript:;" class="html-5-video-drawer-loop-item" data-loop="close">关闭</a>
                                <a href="javascript:;" class="html-5-video-drawer-loop-item" data-loop="open">开启</a>
                            </div>
                            <p class="html-5-video-drawer-title">播放速度</p>
                            <div class="html-5-video-drawer-speed-list">
                                <a href="javascript:;" class="html-5-video-drawer-speed-item" data-speed="0.75">x 0.75 倍</a>
                                <a href="javascript:;" class="html-5-video-drawer-speed-item" data-speed="1">x 1.00 倍</a>
                                <a href="javascript:;" class="html-5-video-drawer-speed-item" data-speed="1.25">x 1.25 倍</a>
                                <a href="javascript:;" class="html-5-video-drawer-speed-item" data-speed="1.5">x 1.50 倍</a>
                                <a href="javascript:;" class="html-5-video-drawer-speed-item" data-speed="2">x 2.00 倍</a>
                            </div>
                        </div>
                    </div>`
        }

        // 格式化时间
        static formatToMinute(second) {
            const hour = parseInt(second / (60 * 60));
            const minute = parseInt((second / 60) % 60);
            second = parseInt(second % 60);
            return (hour > 0 ? ((hour < 10 ? "0" + hour : hour) + ":") : "") + (minute < 10 ? "0" + minute : minute) + ":" + (second < 10 ? "0" + second : second);
        }

        static getOs() {
            return {
                android: /Android/.test(navigator.userAgent),
                ios: /iPhone\sOS/.test(navigator.userAgent)
            }
        }
    }

    window.html5Video = (selector, options) => {
        return new Html5Video(selector, options);
    }
})(window, document);
