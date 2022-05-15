(() => {
	// Client library
	const engineWaitId = setInterval(() => {
		if (VS.Client) {
			clearInterval(engineWaitId);
			prepClient();
			buildCamera();
		}
	});
	
	const MAX_PLANE = 999999;
	const TILE_SIZE = VS.World.getTileSize();

	const validEase = [ 
		'linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInSine', 'easeOutSine', 'easeInOutSine', 'easeInExpo', 
		'easeOutExpo', 'easeInOutExpo', 'easeInCirc', 'easeOutCirc', 'easeInOutCirc', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 
		'easeInQuart', 'easeOutQuart', 'easeInOutQuart','easeInQuint', 'easeOutQuint', 'easeInOutQuint', 'easeInElastic', 'easeOutElastic', 
		'easeInOutElastic', 'easeInBack', 'easeOutBack', 'easeInOutBack', 'easeInBounce', 'easeOutBounce', 'easeInOutBounce'
	]

	const prepClient = () => {
		// update will allow us to just check `mapView.scale.x` when veek presets the definitions of all the objects
		// you don't have a object scale set
		if (typeof(VS.Client.mapView.scale) !== 'object') {
			VS.Client.mapView.scale = { 'x': VS.Client.mapView.scale, 'y': VS.Client.mapView.scale };
		}

		VS.Client.mapView.anchor = { 'x': 0.5, 'y': 0.5 };
		VS.Client.setMapView(VS.Client.mapView);

		if (VS.Client.timeScale === undefined) {
			VS.Client.timeScale = 1;
		}
	}

	const assignCamera = (aCamera) => {
		const MAX_ELAPSED_MS = VS.Client.maxFPS ? (1000 / VS.Client.maxFPS) * 2 : 33.34;
		const TICK_FPS = VS.Client.maxFPS ? (1000 / VS.Client.maxFPS) : 16.67;
		VS.Client.___EVITCA_aCamera = true;
		VS.Client.aCamera = aCamera;
		VS.World.global.aCamera = aCamera;
		// the version of the camera
		aCamera.version = 'v1.6.0';
		// a object that stores the icon sizes of icons used in this library
		aCamera.cachedResourcesInfo = {};
		// whether the camera has been created and is ready for use or not
		aCamera.init = true;
		// whether the camera is attached to something and will follow it
		aCamera.attached = false;
		aCamera.isMoving = false;
		aCamera.isZooming = false;
		aCamera.isSpectating = false;
		aCamera.isShaking = false;
		aCamera.isScrolling = false;
		aCamera.isPanning = false;

		const prototypeDiob = VS.newDiob();
		prototypeDiob.constructor.prototype.aCenterPos = { 'x': 0, 'y': 0 };
		prototypeDiob.constructor.prototype.getTrueCenterPos = function() {
			const tileSize = VS.World.getTileSize();
			this.aCenterPos.x = Math.round(this.xPos + (this.aIconInfo ? this.aIconInfo.halfWidth : tileSize.width) + this.xIconOffset);
			this.aCenterPos.y = Math.round(this.yPos + (this.aIconInfo ? this.aIconInfo.halfHeight : tileSize.height) + this.yIconOffset);
			return this.aCenterPos;
		};
		VS.delDiob(prototypeDiob);
		
		if (!aCamera.onScreenRenderSet) {
			aCamera._onScreenRender = VS.Client.onScreenRender;
			aCamera.onScreenRenderSet = true;
			VS.Client.onScreenRender = function(pT) {
				if (this.aCamera.init) {
					if (this.___EVITCA_aPause) {
						if (this.aPause.paused) {
							this.aCamera.settings.loop.lastTime = pT;
							return;
						}
					}
					if (pT > this.aCamera.settings.loop.lastTime) {
						this.aCamera.settings.loop.elapsedMS = pT - this.aCamera.settings.loop.lastTime;
						if (this.aCamera.settings.loop.elapsedMS > MAX_ELAPSED_MS) {
							// check here, if warnings are showing up about setInterval taking too long
							this.aCamera.settings.loop.elapsedMS = MAX_ELAPSED_MS;
						}
						this.aCamera.settings.loop.deltaTime = (this.aCamera.settings.loop.elapsedMS / TICK_FPS) * this.timeScale;
						this.aCamera.settings.loop.elapsedMS *= this.timeScale;
					}

					if (this.___EVITCA_aParallax && this.aCamera.attached) {
						this.aParallax.update((this.aCamera.following.getTrueCenterPos().x-this.aCamera.oldPos.x) * this.aCamera.settings.loop.deltaTime, (this.aCamera.following.getTrueCenterPos().y-this.aCamera.oldPos.y) * this.aCamera.settings.loop.deltaTime)
					}
					this.aCamera.update(this.aCamera.settings.loop.elapsedMS, this.aCamera.settings.loop.deltaTime);
					this.aCamera.settings.loop.lastTime = pT;
				}
				if (this.aCamera._onScreenRender) {
					this.aCamera._onScreenRender.apply(this, arguments);
				}
			}
		}
		
		VS.Client.attachCamera = function(pSettings) {
			this.aCamera.settings.zoom.currentLevel.x = this.mapView.scale.x;
			this.aCamera.settings.zoom.currentLevel.y = this.mapView.scale.y;
			this.aCamera.assignIconSize(this.mob);
			this.aCamera.following = this.mob;
			this.aCamera.setPos(this.mob.getTrueCenterPos().x, this.mob.getTrueCenterPos().y, this.mob.mapName);
			this.aCamera.oldPos.x = this.aCamera.xPos;
			this.aCamera.oldPos.y = this.aCamera.yPos;
			this.aCamera.attached = true;

			if (pSettings) {
				if (typeof(pSettings) === 'object' && pSettings.constructor === Object) {
					if (pSettings.duration) {
						if (typeof(pSettings.duration) === 'object' && pSettings.duration.constructor === Object) {
							if (typeof(pSettings.duration.x) === 'number' && typeof(pSettings.duration.y) === 'number') {
								this.aCamera.settings.custom.duration.x = pSettings.duration.x;
								this.aCamera.settings.custom.duration.y = pSettings.duration.y;
							} else {
								this.aCamera.settings.custom.duration.x = this.aCamera.settings.custom.duration.y = 1000;
								if (this.debugging) {
									console.warn('aCamera Module: Invalid variable type passed for the %cpSettings.duration.x || pSettings.duration.y', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.duration === 'number')) {
							this.aCamera.settings.custom.duration.x = this.aCamera.settings.custom.duration.y = pSettings.duration;
						} else {
							this.aCamera.settings.custom.duration.x = this.aCamera.settings.custom.duration.y = 1000;
							if (this.debugging) {
								console.warn('aCamera Module: Invalid variable type passed for the %cpSettings.duration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						this.aCamera.settings.custom.duration.x = this.aCamera.settings.custom.duration.y = 1000;
						if (this.debugging) {
							console.warn('aCamera Module: No %cpSettings.duration', 'font-weight: bold', 'parameter passed. Reverted to default');
						}
					}

					if (pSettings.ease) {
						if (typeof(pSettings.ease) === 'object' && pSettings.ease.constructor === Object) {
							if (typeof(pSettings.ease.x) === 'string' && typeof(pSettings.ease.y) === 'string') {
								if (validEase.includes(pSettings.ease.x) && validEase.includes(pSettings.ease.y)) {
									this.aCamera.settings.custom.ease.x = pSettings.ease.x;
									this.aCamera.settings.custom.ease.y = pSettings.ease.y;
								} else {
									this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = 'easeOutCubic';
									if (this.debugging) {
										console.warn('aCamera Module: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
									}
								}
							} else {
								this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module: Invalid variable type passed for the %cpSettings.ease.x || pSettings.ease.y', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.ease === 'string')) {
							if (validEase.includes(pSettings.ease)) {
								this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = pSettings.ease;
							} else {
								this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease. Reverted to default');
								}
							}
						} else {
							this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module: Invalid variable type passed for the %cpSettings.ease', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = 'easeOutCubic';
						if (this.debugging) {
							console.warn('aCamera Module: No %cpSettings.ease', 'font-weight: bold', 'parameter passed. Reverted to default');
						}		
					}

					this.aCamera.reset('standard');
					this.aCamera.custom = true;
					this.following = this.mob;
					this.aCamera.settings.custom.initialPos.x = this.aCamera.xPos;
					this.aCamera.settings.custom.initialPos.y = this.aCamera.yPos;
				} else {
					this.aCamera.reset('custom');
					this.aCamera.custom = false;
					this.aCamera.following = this.mob;
					this.aCamera.settings.standard.initialPos.x = this.aCamera.xPos;
					this.aCamera.settings.standard.initialPos.y = this.aCamera.yPos;
					if (this.debugging) {
						console.warn('aCamera Module: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Reverted to default');
					}
				}
			} else {
				this.aCamera.reset('custom');
				this.aCamera.custom = false;
				this.aCamera.following = this.mob;
				this.aCamera.settings.standard.initialPos.x = this.aCamera.xPos;
				this.aCamera.settings.standard.initialPos.y = this.aCamera.yPos;
			}
			
			this.aCamera.oldFollowingPos = { 'x': this.aCamera.following.xPos + this.aCamera.following.xIconOffset, 'y': this.aCamera.following.yPos + this.aCamera.following.yIconOffset }
			this.setViewEye(this.aCamera);
		}
	}

	const buildCamera = () => {
		const Ease = {};
		Ease.linear = function(t, b, c, d) {
			return c * t / d + b;
		}
		Ease.easeInQuad = function(t, b, c, d) {
			return c * (t /= d) * t + b;
		}
		Ease.easeOutQuad = function(t, b, c, d) {
			return -c * (t /= d) * (t - 2) + b;
		}
		Ease.easeInOutQuad = function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t + b;
			return -c / 2 * ((--t) * (t - 2) - 1) + b;
		}
		Ease.easeInSine = function(t, b, c, d) {
			return -c * Math.cos(t / d * (Math.PI / 2)) + c + b;
		}
		Ease.easeOutSine = function(t, b, c, d) {
			return c * Math.sin(t / d * (Math.PI / 2)) + b;
		}
		Ease.easeInOutSine = function(t, b, c, d) {
			return -c / 2 * (Math.cos(Math.PI * t / d) - 1) + b;
		}
		Ease.easeInExpo = function(t, b, c, d) {
			return (t == 0) ? b : c * Math.pow(2, 10 * (t / d - 1)) + b;
		}
		Ease.easeOutExpo = function(t, b, c, d) {
			return (t == d) ? b + c : c * (-Math.pow(2, -10 * t / d) + 1) + b;
		}
		Ease.easeInOutExpo = function(t, b, c, d) {
			if (t == 0) return b;
			if (t == d) return b + c;
			if ((t /= d / 2) < 1) return c / 2 * Math.pow(2, 10 * (t - 1)) + b;
			return c / 2 * (-Math.pow(2, -10 * --t) + 2) + b;
		}
		Ease.easeInCirc = function(t, b, c, d) {
			return -c * (Math.sqrt(1 - (t /= d) * t) - 1) + b;
		}
		Ease.easeOutCirc = function(t, b, c, d) {
			return c * Math.sqrt(1 - (t = t / d - 1) * t) + b;
		}
		Ease.easeInOutCirc = function(t, b, c, d) {
			if ((t /= d / 2) < 1) return -c / 2 * (Math.sqrt(1 - t * t) - 1) + b;
			return c / 2 * (Math.sqrt(1 - (t -= 2) * t) + 1) + b;
		}
		Ease.easeInCubic = function(t, b, c, d) {
			return c * (t /= d) * t * t + b;
		}
		Ease.easeOutCubic = function(t, b, c, d) {
			return c * ((t = t / d - 1) * t * t + 1) + b;
		}
		Ease.easeInOutCubic = function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t * t + b;
			return c / 2 * ((t -= 2) * t * t + 2) + b;
		}
		Ease.easeInQuart = function(t, b, c, d) {
			return c * (t /= d) * t * t * t + b;
		}
		Ease.easeOutQuart = function(t, b, c, d) {
			return -c * ((t = t / d - 1) * t * t * t - 1) + b;
		}
		Ease.easeInOutQuart = function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t * t * t + b;
			return -c / 2 * ((t -= 2) * t * t * t - 2) + b;
		}
		Ease.easeInQuint = function(t, b, c, d) {
			return c * (t /= d) * t * t * t * t + b;
		}
		Ease.easeOutQuint = function(t, b, c, d) {
			return c * ((t = t / d - 1) * t * t * t * t + 1) + b;
		}
		Ease.easeInOutQuint = function(t, b, c, d) {
			if ((t /= d / 2) < 1) return c / 2 * t * t * t * t * t + b;
			return c / 2 * ((t -= 2) * t * t * t * t + 2) + b;
		}
		Ease.easeInElastic = function(t, b, c, d) {
			var s = 1.70158;
			var p = 0;
			var a = c;
			if (t == 0) return b;
			if ((t /= d) == 1) return b + c;
			if (!p) p = d * .3;
			if (a < Math.abs(c)) {
				a = c;
				var s = p / 4;
			}
			else var s = p / (2 * Math.PI) * Math.asin(c / a);
			return -(a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
		}
		Ease.easeOutElastic = function(t, b, c, d) {
			var s = 1.70158;
			var p = 0;
			var a = c;
			if (t == 0) return b;
			if ((t /= d) == 1) return b + c;
			if (!p) p = d * .3;
			if (a < Math.abs(c)) {
				a = c;
				var s = p / 4;
			}
			else var s = p / (2 * Math.PI) * Math.asin(c / a);
			return a * Math.pow(2, -10 * t) * Math.sin((t * d - s) * (2 * Math.PI) / p) + c + b;
		}
		Ease.easeInOutElastic = function(t, b, c, d) {
			var s = 1.70158;
			var p = 0;
			var a = c;
			if (t == 0) return b;
			if ((t /= d / 2) == 2) return b + c;
			if (!p) p = d * (.3 * 1.5);
			if (a < Math.abs(c)) {
				a = c;
				var s = p / 4;
			}
			else var s = p / (2 * Math.PI) * Math.asin(c / a);
			if (t < 1) return -.5 * (a * Math.pow(2, 10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p)) + b;
			return a * Math.pow(2, -10 * (t -= 1)) * Math.sin((t * d - s) * (2 * Math.PI) / p) * .5 + c + b;
		}
		Ease.easeInBack = function(t, b, c, d) {
			var s = 1.70158;
			return c * (t /= d) * t * ((s + 1) * t - s) + b;
		}
		Ease.easeOutBack = function(t, b, c, d) {
			var s = 1.70158;
			return c * ((t = t / d - 1) * t * ((s + 1) * t + s) + 1) + b;
		}
		Ease.easeInOutBack = function(t, b, c, d) {
			var s = 1.70158;
			if ((t /= d / 2) < 1) return c / 2 * (t * t * (((s *= (1.525)) + 1) * t - s)) + b;
			return c / 2 * ((t -= 2) * t * (((s *= (1.525)) + 1) * t + s) + 2) + b;
		}

		Ease.easeInBounce = function(t, b, c, d) {
			return c - this.easeOutBounce(d - t, 0, c, d) + b;
		}

		Ease.easeOutBounce = function(t, b, c, d) {
			t /= d;
			if (t < 1/2.75) {
				return c * 7.5625 * t * t + b;
			}
			
			if (t < 2/2.75) {
				t -= 1.5/2.75;
				return c * (7.5625 * t * t + 0.75) + b;
			}
			
			if (t < 2.5/2.75) {
				t -= 2.25/2.75;
				return c * (7.5625 * t * t + 0.9375) + b;
			} else {
				t -= 2.625/2.75;
				return c * (7.5625 * t * t + 0.984375) + b;
			}
		}

		Ease.easeInOutBounce = function(t, b, c, d) {
			if (t < d*0.5) {
				return (this.easeInBounce(t*2, 0, c, d)*0.5 + b);
			}
			return (this.easeOutBounce(t*2 - d, 0, c, d)*0.5 + c*0.5 + b);
		}
		
		const ZERO = 0;
		const MAX_CAMERA_SHAKE_FORCE = 100;
		const aCamera = VS.newDiob();

		aCamera.atlasName = '';
		aCamera.width = 1;
		aCamera.height = 1;
		aCamera.color = { 'tint': 0xFF69B4 };
		aCamera.mouseOpacity = 0;
		aCamera.touchOpacity = 0;
		aCamera.density = 0;
		aCamera.plane = MAX_PLANE;
		aCamera.invisibility = MAX_PLANE;
		// set when the player gives the camera settings to follow
		aCamera.custom = false;
		 // who owns this camera
		aCamera.owner = VS.Client;
		aCamera.following;
		// // debugging is whether this library is in debug mode. Extra warnings will be thrown in this mode to help explain any issues that may arise. if the camera is currently being debugged, (shows icon info for the camera)
		aCamera.debugging = false;
		aCamera.preventScreenRelayer = true;
		aCamera.preventInterpolation = true;
		aCamera.ONE = 1;
		aCamera.TWO = 2;
		aCamera.THREE = 3;
		aCamera.FOUR = 4;
		aCamera.FIVE = 5;
		aCamera.SIX = 6;
		aCamera.oldPos = { 'x': 0, 'y': 0 };
		aCamera.oldFollowingPos = { 'x': 0, 'y': 0 };
		aCamera.settings = {
			'zoom': { // allows separate dimension zooming
				'active': { 'x': false, 'y': false },
				'time': { 'x': 0, 'y': 0 },
				'duration': { 'x': 1000 , 'y': 1000 },
				'initialLevel': { 'x': null, 'y': null },
				'currentLevel': { 'x': null , 'y': null },
				'destinationLevel': { 'x': null, 'y': null },
				'differenceLevel': { 'x': null, 'y': null },
				'ease': { 'x': 'easeOutCubic', 'y': 'easeOutCubic' },
				'callback': null
			},

			'shake': { // allows separate dimension shaking
				'active': { 'x': false, 'y': false },
				'time': { 'x': 0, 'y': 0 },
				'duration': { 'x': 1000, 'y': 1000 },
				'intensity': { 'x': 1, 'y': 1 },
				'rotational': false, // if the camera tilts while shaking.
				'concurrentShaking': [], // saved 
				'callback': null
			},

			'pan': { // allows separate dimension moving // when the camera moves from one object to another and then back to the starting object
				'active': { 'x': false, 'y': false }, // if the camera is active or not
				'time': { 'x': 0, 'y': 0, 'z': 0, 'y': null }, // the current time in the ease
				'destination': { 'x': null, 'y': null }, // the end position the camera will go to
				'ease': { 'x': 'easeOutCubic', 'y': 'easeOutCubic' }, // the ease in each axis the camera will use
				'duration': { 'x': 1000, 'y': 1000 }, // how long in each axis the ease will take
				'target': null, // the panTo diob
				'storedDir': null, // the direction that is stored so it can be given back to the diob when the pan is over
				'returning': null, // if the pan is on the `returning` stage
				'forceDirChange': true, // if the panning forces the person the camera is attached to to change direction in the direction of the pan. This also disables movement.
				'pauseDuration': 0, // how long to stay at the object you've panned to before continuing to pan back
				'attach': false, // if when panning to the object, the object now becomes the target that the camera is following
				'initialPos': { 'x': null, 'y': null }, // the initial position of the camera
				'finalDuration': { 'x': 1000, 'y': 1000 }, // when the camera is panning back to whatever it panned from
				'finalEase': { 'x': 'easeOutCubic', 'y': 'easeOutCubic' }, // the ease used to pan back
				'pannedCallback': null, // when you reach the object, this callback is called.
				'finalCallback': null // when the camera pans back to the initiator, this callback is called.
			},

			'scroll': { // when grabbing the map and dragging it so you can see more of the map
				'active': false,
				'time': 0,
				'duration': null,
				'ease': null
			},

			'standard': { // default camera movement settings, // allows separate dimension moving
				'active': { 'x': false, 'y': false },
				'time': { 'x': 0, 'y': 0 },
				'duration': { 'x': 1000, 'y': 1000 },
				'destination': { 'x': null, 'y': null },
				'initialPos': { 'x': null, 'y': null },
				'ease': { 'x': 'easeOutCubic', 'y': 'easeOutCubic' }
			},

			'custom': { // custom applied camera movement settings, // allows separate dimension moving
				'active': { 'x': false, 'y': false },
				'time': { 'x': 0, 'y': 0 },
				'duration': { 'x': 1000, 'y': 1000 },
				'destination': { 'x': null, 'y': null },
				'initialPos': { 'x': null, 'y': null },
				'ease': { 'x': 'easeOutCubic', 'y': 'easeOutCubic' }
			},

			'spectate': {
				'forcePos': true,
				'preventMovement': true,
				'player': null
			},

			'loop': { // tracking elpasedMS and deltaTime
				'lastTime': 0,
				'deltaTime': 0,
				'elapsedMS': 0
			},
			'zooming': false,
			'panning': false,
			'scrolling': false,
			'spectating': false,
			'shaking': false
		};

		aCamera.decimalRand = function(pNum, pNum2, pPlaces=1) {
			const result = Number((Math.random() * (pNum - pNum2) + pNum2).toFixed(pPlaces));
			return (result >= 1 ? Math.floor(result) : result);
		}

		aCamera.assignIconSize = function(pDiob) {
			if (pDiob.aIconInfo) return;
			const resourceID = (pDiob.atlasName + '_' + (pDiob.iconName ? pDiob.iconName : '') + '_' + (pDiob.iconState ? pDiob.iconState : '')).trim();
			pDiob.aIconInfo = {};

			if (this.cachedResourcesInfo[resourceID]) {
				pDiob.aIconInfo = JSON.parse(JSON.stringify(this.cachedResourcesInfo[resourceID]));
			} else {
				pDiob.aIconInfo.width = Math.round(TILE_SIZE.width);
				pDiob.aIconInfo.height = Math.round(TILE_SIZE.height);
				pDiob.aIconInfo.halfWidth = Math.round(TILE_SIZE.width/2);
				pDiob.aIconInfo.halfHeight = Math.round(TILE_SIZE.height/2);
			}
			
			const setIconSize = function() {
				const iconSize = VS.Icon.getIconSize(pDiob.atlasName, pDiob.iconName);
				this.cachedResourcesInfo[resourceID] = {
					'width': Math.round(iconSize.width),
					'height': Math.round(iconSize.height),
					'halfWidth': Math.round(iconSize.width / 2),
					'halfHeight': Math.round(iconSize.height / 2)
				};
				pDiob.aIconInfo.width = this.cachedResourcesInfo[resourceID].width;
				pDiob.aIconInfo.height = this.cachedResourcesInfo[resourceID].height;
				pDiob.aIconInfo.halfWidth = this.cachedResourcesInfo[resourceID].halfWidth;
				pDiob.aIconInfo.halfHeight = this.cachedResourcesInfo[resourceID].halfHeight;
			}
			if (pDiob.atlasName) {
				VS.Resource.loadResource('icon', pDiob.atlasName, setIconSize.bind(this));
			} else {
				console.warn('aCamera Module [assignIconSize]: No %cpDiob.atlasName', 'font-weight: bold', 'to load.');
			}
		}

		aCamera.reset = function(pMethod) {
			switch (pMethod) {
				case 'zoomX':
					this.settings.zoom.active.x = false;
					this.settings.zoom.time.x = 0;
					this.settings.zoom.ease.x = 'easeOutCirc';
					break;

				case 'zoomY':
					this.settings.zoom.active.y = false;
					this.settings.zoom.time.y = 0;
					this.settings.zoom.ease.y = 'easeOutCirc';
					break;

				case 'zoom':
					this.settings.zoom.callback = null;
					this.settings.zoom.time.x = this.settings.zoom.time.y = 0;
					this.settings.zoom.active.x = this.settings.zoom.active.y = false;
					this.settings.zoom.initialLevel.x = this.settings.zoom.initialLevel.y = null;
					this.settings.zoom.destinationLevel.x = this.settings.zoom.destinationLevel.y = null;
					this.settings.zoom.differenceLevel.x = this.settings.zoom.differenceLevel.y = null;
					this.settings.zoom.duration.x = this.settings.zoom.duration.y = null;	
					this.settings.zoom.ease.x = this.settings.zoom.ease.y = null;
					this.settings.zooming = false;
					this.isZooming = false;
					break;

				case 'panX':
					this.settings.pan.active.x = false;
					this.settings.pan.time.x = 0;
					break;

				case 'panY':
					this.settings.pan.active.y = false;
					this.settings.pan.time.y = 0;
					break;

				case 'pan':
					this.settings.pan.returning = false;
					this.settings.pan.attach = false;
					this.settings.pan.forceDirChange = true;
					this.settings.pan.target = null;
					this.settings.pan.storedDir = null;
					this.settings.pan.pannedCallback = null;
					this.settings.pan.finalCallback = null;
					this.settings.pan.pauseDuration = 0;
					this.settings.pan.time.x = this.settings.pan.time.y = 0;
					this.settings.pan.initialPos.x = this.settings.pan.initialPos.y = null;
					this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = null;
					this.settings.pan.ease.x = this.settings.pan.ease.y = null;
					this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = null;
					this.settings.pan.active.x = this.settings.pan.active.y = false;
					this.settings.pan.duration.x = this.settings.pan.duration.y = null;
					this.settings.pan.destination.x = this.settings.pan.destination.y = null;
					this.settings.panning = false;
					this.isPanning = false;
					break;

				case 'standardX':
					this.settings.standard.active.x = false;
					this.settings.standard.time.x = 0;
					this.settings.standard.initialPos.x = this.xPos;
					break;

				case 'standardY':
					this.settings.standard.active.y = false;
					this.settings.standard.time.y = 0;
					this.settings.standard.initialPos.y = this.yPos;
					break;

				case 'standard':
					this.settings.standard.active.x = this.settings.standard.active.y = false;
					this.settings.standard.time.x = this.settings.standard.time.y = 0;

					this.settings.standard.initialPos.x = this.xPos;
					this.settings.standard.initialPos.y = this.yPos;
					this.isMoving = false;
					break;

				case 'customX':
					this.settings.custom.active.x = false;
					this.settings.custom.time.x = 0;
					this.settings.custom.initialPos.x = this.xPos;
					break;

				case 'customY':
					this.settings.custom.active.y = false;
					this.settings.custom.time.y = 0;
					this.settings.custom.initialPos.y = this.yPos;
					break;

				case 'custom':
					this.settings.custom.active.x = this.settings.custom.active.y = false;
					this.settings.custom.time.x = this.settings.custom.time.y = 0;

					this.settings.custom.initialPos.x = this.xPos;
					this.settings.custom.initialPos.y = this.yPos;
					this.isMoving = false;
					break;

				case 'scroll':
					this.settings.scrolling = false;
					break;

				case 'shakeX':
					this.settings.shake.time.x = 0;
					this.settings.shake.active.x = false;
					VS.Client.setViewEyeOffsets(0, VS.Client.getViewEyeOffsets().y)
					break;

				case 'shakeY':
					this.settings.shake.time.y = 0;
					this.settings.shake.active.y = false;
					VS.Client.setViewEyeOffsets(VS.Client.getViewEyeOffsets().x, 0)
					break;

				case 'shake':
					this.settings.shake.callback = null;
					this.settings.shake.rotational = false;
					// this.settings.shake.concurrentShaking = ;

					this.settings.shake.time.x = this.settings.shake.time.y = 0;
					this.settings.shake.active.x = this.settings.shake.active.y = false;
					this.settings.shake.duration.x = this.settings.shake.duration.y = 0;
					this.settings.shake.intensity.x = this.settings.shake.intensity.y = 0;
					VS.Client.setViewEyeOffsets(0, 0)
					VS.Client.mapView.angle = 0;
					VS.Client.setMapView(VS.Client.mapView);
					this.isShaking = false;
					break;

				case 'spectate':
					this.settings.spectate.player = null;
					this.settings.spectate.forcePos = false;
					this.settings.spectate.preventMovement = false;
					this.settings.spectating = false;
					this.isSpectating = false;
					break;
			}
		}

		aCamera.zoomUpdate = function(pElapsedMS, pDeltaTime) {
			if (this.settings.zoom.active.x) {
				this.settings.zoom.time.x += pElapsedMS;
				this.settings.zoom.currentLevel.x = Ease[this.settings.zoom.ease.x](this.settings.zoom.time.x, this.settings.zoom.initialLevel.x, this.settings.zoom.differenceLevel.x, this.settings.zoom.duration.x);
				const stepSizeX = ((this.settings.zoom.currentLevel.x - VS.Client.mapView.scale.x) * pDeltaTime) / VS.Client.timeScale;
				VS.Client.mapView.scale.x += stepSizeX;
			}

			if (this.settings.zoom.active.y) {
				this.settings.zoom.time.y += pElapsedMS
				this.settings.zoom.currentLevel.y = Ease[this.settings.zoom.ease.y](this.settings.zoom.time.y, this.settings.zoom.initialLevel.y, this.settings.zoom.differenceLevel.y, this.settings.zoom.duration.y);
				const stepSizeY = ((this.settings.zoom.currentLevel.y - VS.Client.mapView.scale.y) * pDeltaTime) / VS.Client.timeScale;
				VS.Client.mapView.scale.y += stepSizeY;
			}

			if (VS.Client.___EVITCA_aInventory) {
				VS.Client.aInventory.outlineFilter.thickness = VS.Client.aInventory.outlineDefaultThickness * mainM.mapScaleWidth;
			}

			VS.Client.setMapView(VS.Client.mapView);

			if (this.settings.zoom.time.x >= this.settings.zoom.duration.x) {
				this.reset('zoomX');
			}

			if (this.settings.zoom.time.y >= this.settings.zoom.duration.y) {
				this.reset('zoomY');
			}

			if (!this.settings.zoom.active.x && !this.settings.zoom.active.y) {
				this.onZoomEnd();
			}
		}

		aCamera.shakeUpdate = function(pElapsedMS, pDeltaTime) {
			let angle;
			let xForce;
			let yForce;
			if (this.settings.shake.rotational) {
				let seed;
				let seed2;
				if (this.settings.shake.active.x && this.settings.shake.active.y) {
					seed = this.settings.shake.intensity.x;
					seed2 = this.settings.shake.intensity.y;
				} else if (this.settings.shake.active.x) {
					seed = this.settings.shake.intensity.x;
					seed2 = seed*0.5;				
				} else if (this.settings.shake.active.y) {
					seed = this.settings.shake.intensity.y;
					seed2 = seed*0.5;	
				}

				angle = this.decimalRand(-this.decimalRand(seed, seed2) / 200, this.decimalRand(seed, seed2) / 200) * pDeltaTime;
				VS.Client.mapView.angle = angle;
				VS.Client.setMapView(VS.Client.mapView);
			}

			if (this.settings.shake.active.x) {
				const seed = this.settings.shake.intensity.x;
				const seed2 = seed*0.5;
				xForce = this.decimalRand(-this.decimalRand(seed, seed2), this.decimalRand(seed, seed2)) * pDeltaTime;
				this.settings.shake.time.x += pElapsedMS;
			}

			if (this.settings.shake.active.y) {
				const seed = this.settings.shake.intensity.y;
				const seed2 = seed*0.5;
				yForce = this.decimalRand(-this.decimalRand(seed, seed2), this.decimalRand(seed, seed2)) * pDeltaTime;
				this.settings.shake.time.y += pElapsedMS;
			}

			VS.Client.setViewEyeOffsets(xForce ? xForce : 0, yForce ? yForce : 0);

			if (this.settings.shake.time.x >= this.settings.shake.duration.x) {
				this.reset('shakeX');
			}

			if (this.settings.shake.time.y >= this.settings.shake.duration.y) {
				this.reset('shakeY');
			}

			if (!this.settings.shake.active.x && !this.settings.shake.active.y) {
				this.onShakeEnd();
			}
		}

		aCamera.pan = function(pSettings) {
			if (this.settings.panning && !this.settings.pan.returning) {
				console.error('aCamera Module [Pan]: You are already %cpanning', 'font-weight: bold', '. Pan failed');
				return;
			}
			if (this.settings.spectating) {
				console.error('aCamera Module [Pan]: You are %cspectating', 'font-weight: bold', 'and cannot pan right now. Pan failed');
				return;
			}
			if (typeof(pSettings) === 'object' && pSettings.constructor === Object) {
				const settingsProps = Object.keys(pSettings);
				if (settingsProps.includes('target')) {
					// target
					if (typeof(pSettings.target) === 'object' && pSettings.target.constructor === Diob) {
						if (typeof(pSettings.target.xPos) === 'number' && typeof(pSettings.target.yPos) === 'number' && typeof(pSettings.target.mapName) === 'string') {
							if (pSettings.target === this.following) {
								console.error('aCamera Module [Pan]: You %ccannot', 'font-weight: bold', 'pan to yourself. Pan failed');
								return
							}
							this.assignIconSize(pSettings.target);
							this.settings.pan.target = pSettings.target;
						} else {
							console.error('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.target.xPos || pSettings.target.yPos || *pSettings.target.mapName', 'font-weight: bold', 'parameter. Pan failed');
							return
						}
					} else {
						console.error('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.target', 'font-weight: bold', 'property. Pan failed');
						return;
					}

					// ease
					if (pSettings.ease) {
						if (typeof(pSettings.ease) === 'object' && pSettings.ease.constructor === Object) {
							if (typeof(pSettings.ease.x) === 'string' && typeof(pSettings.ease.y) === 'string') {
								if (validEase.includes(pSettings.ease.x) && validEase.includes(pSettings.ease.y)) {
									this.settings.pan.ease.x = pSettings.ease.x;
									this.settings.pan.ease.y = pSettings.ease.y;
								} else {
									this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
									if (this.debugging) {
										console.warn('aCamera Module [Pan]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
									}
								}
							} else {
								this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.ease.x || pSettings.ease.y', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.ease) === 'string') {
							if (validEase.includes(pSettings.ease)) {
								this.settings.pan.ease.x = this.settings.pan.ease.y = pSettings.ease;
							} else {
								this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
								}
							}
						} else {
							this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.ease', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: No %cease', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
							}
					}

					// finalEase
					if (pSettings.finalEase) {
						if (typeof(pSettings.finalEase) === 'object' && pSettings.finalEase.constructor === Object) {
							if (typeof(pSettings.finalEase.x) === 'string' && typeof(pSettings.finalEase.y) === 'string') {
								if (validEase.includes(pSettings.finalEase.x) && validEase.includes(pSettings.finalEase.y)) {
									this.settings.pan.finalEase.x = pSettings.finalEase.x;
									this.settings.pan.finalEase.y = pSettings.finalEase.y;
								} else {
									this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = 'easeOutCubic';
									if (this.debugging) {
										console.warn('aCamera Module [Pan]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.finalEase.x || pSettings.finalEase.y. Reverted to default');
									}
								}
							} else {
								this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.finalEase.x || pSettings.finalEase.y', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.finalEase) === 'string') {
							if (validEase.includes(pSettings.finalEase)) {
								this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = pSettings.finalEase;
							} else {
								this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.finalEase.x || pSettings.finalEase.y. Reverted to default');
								}
							}
						} else {
							this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.finalEase', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: No %cfinalEase', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
							}
					}

					//duration
					if (pSettings.duration) {
						if (typeof(pSettings.duration) === 'object' && pSettings.duration.constructor === Object) {
							if (typeof(pSettings.duration.x) === 'number' && typeof(pSettings.duration.y) === 'number') {
								this.settings.pan.duration.x = pSettings.duration.x;
								this.settings.pan.duration.y = pSettings.duration.y;
							} else {
								this.settings.pan.duration.x = this.settings.pan.duration.y = 2000;
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.duration.x || pSettings.duration.y', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.duration) === 'number') {
								this.settings.pan.duration.x = this.settings.pan.duration.y = pSettings.duration;
						} else {
							this.settings.pan.duration.x = this.settings.pan.duration.y = 2000;
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.duration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.duration.x = this.settings.pan.duration.y = 2000;
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: No %cduration', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
							}
					}

					// finalDuration
					if (pSettings.finalDuration) {
						if (typeof(pSettings.finalDuration) === 'object' && pSettings.finalDuration.constructor === Object) {
							if (typeof(pSettings.finalDuration.x) === 'number' && typeof(pSettings.finalDuration.y) === 'number') {
								this.settings.pan.finalDuration.x = pSettings.finalDuration.x;
								this.settings.pan.finalDuration.y = pSettings.finalDuration.y;
							} else {
								this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = 2000;
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.finalDuration.x || pSettings.finalDuration.y', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.finalDuration) === 'number') {
								this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = pSettings.finalDuration;
						} else {
							this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = 2000;
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.finalDuration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = 2000;
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: No %cfinalDuration', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
							}
					}

					// pauseDuration
					if (pSettings.pauseDuration) {
						if (typeof(pSettings.pauseDuration) === 'number') {
							this.settings.pan.pauseDuration = pSettings.pauseDuration;
						} else {
							this.settings.pan.pauseDuration = 0;
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.pauseDuration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					}

					// attach
					this.settings.pan.attach = pSettings.attach;
					// forceDirChange
					this.settings.pan.forceDirChange = pSettings.forceDirChange;
					// initialPos
					this.settings.pan.initialPos.x = this.xPos;
					this.settings.pan.initialPos.y = this.yPos;

					if (this.settings.pan.forceDirChange) {
						// disable movement
						VS.Client.toggleMacroCapture(false);
						this.settings.pan.storedDir = this.following.dir;
						this.following.dir = VS.Map.getDir(this.following, this.settings.pan.target);
					}
					// pannedCallback
					if (pSettings.pannedCallback) {
						if (typeof(pSettings.pannedCallback) === 'function') {
							this.settings.pan.pannedCallback = pSettings.pannedCallback;
						} else {
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.pannedCallback', 'font-weight: bold', 'property.');
							}
						}
					}

					// finalCallback
					if (pSettings.finalCallback) {
						if (typeof(pSettings.finalCallback) === 'function') {
							this.settings.pan.finalCallback = pSettings.finalCallback;
						} else {
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.finalCallback', 'font-weight: bold', 'property.');
							}
						}
					}

					if (this.xPos !== this.settings.pan.target.xPos) {
						this.settings.pan.active.x = true;
					}

					if (this.yPos !== this.settings.pan.target.yPos) {
						this.settings.pan.active.y = true;
					}

				} else {
					console.error('aCamera Module [Pan]: No %ctarget', 'font-weight: bold', 'property included inside of the pSettings parameter. Pan failed');
				}

			} else {
				console.error('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Pan failed');
			}
			this.settings.panning = true;
			this.isPanning = true;
		}

		aCamera.onPanned = function() {
			if (this.settings.pan.pannedCallback) {
				this.settings.pan.pannedCallback();
				this.settings.pan.pannedCallback = null;
			}
			if (this.settings.pan.attach) {
				if (this.settings.pan.target && typeof(this.settings.pan.target) === 'object') {
					if (this.settings.pan.target.constructor === Diob) {
						VS.Client.toggleMacroCapture(true);
						this.following = this.settings.pan.target;
						this.reset('pan');
					} else {
						if (this.debugging) {
							console.warn('aCamera Module [Pan]: Cannot attach to a non %cdiob', 'font-weight: bold', 'type. Attachment failed');
						}
					}
				}
			} else {
				this.settings.pan.target = this.following;
				this.settings.pan.initialPos.x = this.xPos;
				this.settings.pan.initialPos.y = this.yPos;
				this.settings.pan.time.x = this.settings.pan.time.y = 0;
				this.settings.pan.duration.x = this.settings.pan.finalDuration.x;
				this.settings.pan.duration.y = this.settings.pan.finalDuration.y;
				this.settings.pan.ease.x = this.settings.pan.finalEase.x;
				this.settings.pan.ease.y = this.settings.pan.finalEase.y;
				this.settings.pan.returning = true;
			}
		}

		aCamera.onPanFinish = function() {
			if (this.settings.pan.forceDirChange) {
				this.following.dir = this.settings.pan.storedDir;
			}
			this.reset('pan');
			// allow players to move again
			VS.Client.toggleMacroCapture(true);
			if (this.settings.pan.returnCallback) {
				this.settings.pan.returnCallback();
				this.settings.pan.returnCallback = null;
			}
		}

		aCamera.follow = function(pMethod, pElapsedMS, pDeltaTime) {
			let distanceX;
			let distanceY;

			let stepSizeX;
			let stepSizeY;

			let target;

			if (pMethod === 'pan') {
				// now check to see if there is a paused duration you want the camera to stay at the panned object for before moving back
				if (this.settings[pMethod].returning) {
					if (this.settings[pMethod].pauseDuration) {
						this.settings[pMethod].pauseDuration -= pElapsedMS
						if (this.settings[pMethod].pauseDuration <= 0) {
							this.settings[pMethod].pauseDuration = 0;
						} else {
							return;
						}
					}
					if (this.xPos !== this.settings.pan.target.getTrueCenterPos().x) {
						this.settings.pan.active.x = true;
					}

					if (this.yPos !== this.settings.pan.target.getTrueCenterPos().y) {
						this.settings.pan.active.y = true;
					}
				}
				if (this.settings[pMethod].active.x) {
					this.settings[pMethod].destination.x = this.settings[pMethod].target.getTrueCenterPos().x;
				}
				if (this.settings[pMethod].active.y) {
					this.settings[pMethod].destination.y = this.settings[pMethod].target.getTrueCenterPos().y;
				}
				target = this.settings[pMethod].target;
			} else {
				if (this.settings[pMethod].active.x) {
					this.settings[pMethod].destination.x = this.following.getTrueCenterPos().x;
				}
				if (this.settings[pMethod].active.y) {
					this.settings[pMethod].destination.y = this.following.getTrueCenterPos().y;
				}
				target = this.following;		
			}

			if (this.settings[pMethod].active.x) {
				this.settings[pMethod].time.x += pElapsedMS;
				distanceX = this.settings[pMethod].destination.x - this.settings[pMethod].initialPos.x;
				const xPos = Ease[this.settings[pMethod].ease.x](this.settings[pMethod].time.x, this.settings[pMethod].initialPos.x, distanceX, this.settings[pMethod].duration.x);
				// the dividing by `VS.Client.timeScale` is done to keep the duration's time calculation separate from the `timeScale`. This makes sure the position is in the correct place 
				stepSizeX = ((xPos - this.xPos) * pDeltaTime) / VS.Client.timeScale;
				this.xPos += stepSizeX;
			}

			if (this.settings[pMethod].active.y) {
				this.settings[pMethod].time.y += pElapsedMS;
				distanceY = this.settings[pMethod].destination.y - this.settings[pMethod].initialPos.y;
				const yPos = Ease[this.settings[pMethod].ease.y](this.settings[pMethod].time.y, this.settings[pMethod].initialPos.y, distanceY, this.settings[pMethod].duration.y);
				// the dividing by `VS.Client.timeScale` is done to keep the duration's time calculation separate from the `timeScale`. This makes sure the position is in the correct place 
				stepSizeY = ((yPos - this.yPos) * pDeltaTime) / VS.Client.timeScale;
				this.yPos += stepSizeY;
			}
			
			this.mapName = target.mapName;

			// if (isNaN(this.xPos)) {
			// 	this.xPos = target.getTrueCenterPos().x;
			// }

			// if (isNaN(this.yPos)) {
			// 	this.yPos = target.getTrueCenterPos().y;
			// } 

			if (this.settings[pMethod].time.x >= this.settings[pMethod].duration.x) {
				this.xPos = target.getTrueCenterPos().x;
				if (pMethod === 'pan') {
					this.reset('panX');
				} else if (pMethod === 'standard') {
					this.reset('standardX');
				} else if (pMethod === 'custom') {
					this.reset('customX');
				}
			}

			if (this.settings[pMethod].time.y >= this.settings[pMethod].duration.y) {
				this.yPos = target.getTrueCenterPos().y;
				if (pMethod === 'pan') {
					this.reset('panY');
				} else if (pMethod === 'standard') {
					this.reset('standardY');
				} else if (pMethod === 'custom') {
					this.reset('customY');
				}
			}

			if (pMethod === 'standard') {
				if (!this.settings[pMethod].active.x && !this.settings[pMethod].active.y) {
					if (pMethod === 'standard') {
						this.reset('standard');
					} else if (pMethod === 'custom') {
						this.reset('custom');
					}
				}
			}

			if (pMethod === 'pan') {
				if (!this.settings[pMethod].active.x && !this.settings[pMethod].active.y) {
					if (this.settings[pMethod].returning) {
						// you have panned on every axis and now can call the pan return callback
						this.onPanFinish();
					} else {
						// you have panned on every axis and now can call the pan callback
						this.onPanned();
					}
				}
			}

			this.oldPos.x = this.xPos;
			this.oldPos.y = this.yPos;
		}

		aCamera.update = function(pElapsedMS, pDeltaTime) {
			// zoom
			if (this.settings.zoom.active.x || this.settings.zoom.active.y) {
				this.zoomUpdate(pElapsedMS, pDeltaTime);
			}

			// scroll
			if (this.settings.scroll.active) {
				// this.settings.scrolling = true;
			}
			
			// shake
			if (this.settings.shake.active.x || this.settings.shake.active.y) {
				// this.settings.shaking = true;
				this.shakeUpdate(pElapsedMS, pDeltaTime);
			}

			if (this.attached) {
				// pan
				if (!this.settings.scrolling && (this.settings.pan.active.x || this.settings.pan.active.y || this.settings.pan.returning)) {
					this.follow('pan', pElapsedMS, pDeltaTime);
				}
				// camera moving after whatever its following
				if (!this.settings.scrolling && !this.settings.panning && this.following) {
					const xFollowingPos = this.following.getTrueCenterPos().x;
					const yFollowingPos = this.following.getTrueCenterPos().y;
					if (this.following.isMoving || this.oldFollowingPos.x !== xFollowingPos || this.oldFollowingPos.y !== yFollowingPos) {
						this.isMoving = true;
						if (this.custom) {
							this.settings.custom.time.x = 0;
							this.settings.custom.active.x = (this.xPos !== xFollowingPos ? true : false);
							this.settings.custom.initialPos.x = this.xPos;

							this.settings.custom.time.y = 0;
							this.settings.custom.active.y = (this.yPos !== yFollowingPos ? true : false);
							this.settings.custom.initialPos.y = this.yPos;
						} else {
							this.settings.standard.time.x = 0;
							this.settings.standard.active.x = (this.xPos !== xFollowingPos ? true : false);
							this.settings.standard.initialPos.x = this.xPos;

							this.settings.standard.time.y = 0;
							this.settings.standard.active.y = (this.yPos !== yFollowingPos ? true : false);
							this.settings.standard.initialPos.y = this.yPos;
						}
					}

					// custom camera moving
					if (this.custom) {
						if (this.settings.custom.active.x || this.settings.custom.active.y) {
							this.follow('custom', pElapsedMS, pDeltaTime);
						}
					// default camera moving
					} else {
						if (this.settings.standard.active.x || this.settings.standard.active.y) {
							this.follow('standard', pElapsedMS, pDeltaTime);
						}
					}
					this.oldFollowingPos.x = xFollowingPos;
					this.oldFollowingPos.y = yFollowingPos;
				}
			}
		}

		aCamera.zoom = function(pDestinationLevel={'x': 1, 'y': 1}, pDuration={'x': 1000, 'y': 1000}, pEase={'x': 'easeOutCirc', 'y': 'easeOutCirc'}, pCallback) {
			if (this.settings.zoom.active.x || this.settings.zoom.active.y) {
				return;
			}
			// destination level
			let dx;
			let dy;
			if (pDestinationLevel || pDestinationLevel === 0) {
				if (typeof(pDestinationLevel) !== 'object') {
					if (typeof(pDestinationLevel) === 'number') {
						dx = dy = pDestinationLevel;
					} else {
						dx = dy = 1;
						if (this.debugging) {
							console.warn('aCamera Module [Zoom]: Invalid variable type passed for the %cpDestinationLevel', 'font-weight: bold', 'parameter. Reverted to default');
						}							
					}
				} else {
					if (typeof(pDestinationLevel.x) === 'number' && typeof(pDestinationLevel.y) === 'number') {
						dx = pDestinationLevel.x;
						dy = pDestinationLevel.y;
					} else {
						dx = dy = 1;
						if (this.debugging) {
							console.warn('aCamera Module [Zoom]: Invalid variable type passed for the %cpDestinationLevel.x || pDestinationLevel.y', 'font-weight: bold', 'parameter. Reverted to default');
						}		
					}
				}
			} else {
				dx = dy = 1;
				if (this.debugging) {
					console.warn('aCamera Module [Zoom]: No %cpDestinationLevel', 'font-weight: bold', 'parameter passed. Reverted to default');
				}	
			}

			if (this.settings.zoom.destinationLevel.x !== dx) {
				if (this.settings.zoom.active.x) {
					this.reset('zoomX');
				}
				this.settings.zoom.active.x = true;
				this.settings.zoom.destinationLevel.x = dx;
				this.settings.zoom.initialLevel.x = VS.Client.mapView.scale.x;
				this.settings.zoom.differenceLevel.x = Math.round((this.settings.zoom.destinationLevel.x - this.settings.zoom.initialLevel.x) * 10) / 10;
			}

			if (this.settings.zoom.destinationLevel.y !== dy) {
				if (this.settings.zoom.active.y) {
					this.reset('zoomY');
				}
				this.settings.zoom.active.y = true;
				this.settings.zoom.destinationLevel.y = dy;
				this.settings.zoom.initialLevel.y = VS.Client.mapView.scale.y;
				this.settings.zoom.differenceLevel.y = Math.round((this.settings.zoom.destinationLevel.y - this.settings.zoom.initialLevel.y) * 10) / 10;
			}

			// duration
			if (pDuration) {
				if (typeof(pDuration) !== 'object') {
					if (typeof(pDuration) === 'number') {
						this.settings.zoom.duration.x = pDuration;
						this.settings.zoom.duration.y = pDuration;
					} else {
						this.settings.zoom.duration.x = this.settings.zoom.duration.y = 1000;
						if (this.debugging) {
							console.warn('aCamera Module [Zoom]: Invalid variable type passed for the %cpDuration', 'font-weight: bold', 'parameter. Reverted to default');
						}
					}
				} else {
					if (typeof(pDuration) === 'object') {
						if (typeof(pDuration.x) === 'number' && typeof(pDuration.y) === 'number') {
							this.settings.zoom.duration = pDuration;
						} else {
							this.settings.zoom.duration.x = this.settings.zoom.duration.y = 1000;
							if (this.debugging) {
								console.warn('aCamera Module [Zoom]: Invalid variable type passed for the %cpDuration.x || pDuration.y', 'font-weight: bold', 'parameter. Reverted to default');
							}
						}
					}
				}
			} else {
				this.settings.zoom.duration.x = this.settings.zoom.duration.y = 1000;
				if (this.debugging) {
					console.warn('aCamera Module [Zoom]: No %cpDuration', 'font-weight: bold', 'parameter passed. Reverted to default');
				}	
			}

			// ease 
			if (pEase) {
				if (typeof(pEase) !== 'object') {
					if (typeof(pEase) === 'string') {
						if (validEase.includes(pEase)) {
							this.settings.zoom.ease.x = this.settings.zoom.ease.y = pEase;
						} else {
							this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
							if (this.debugging) {
								console.warn('aCamera Module [Zoom]: Invalid %cpEase', 'font-weight: bold', 'name passed. Reverted to default');
							}
						}
					} else {
						this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
						if (this.debugging) {
							console.warn('aCamera Module [Zoom]: Invalid variable type passed for the %cpEase', 'font-weight: bold', 'parameter. Reverted to default');
						}
					}

				} else {
					if (typeof(pEase) === 'object') {
						if (typeof(pEase.x) === 'string' && typeof(pEase.y) === 'string') {
							if (validEase.includes(pEase.x) && validEase.includes(pEase.y)) {
								this.settings.zoom.ease = pEase;
							} else {
								this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
								if (this.debugging) {
									console.warn('aCamera Module [Zoom]: Invalid %cpEase', 'font-weight: bold', 'name passed for pEase.x || pEase.y. Reverted to default');
								}
							}
							
						} else {
							this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
							if (this.debugging) {
								console.warn('aCamera Module [Zoom]: Invalid variable type passed for the %cpEase.x || pEase.y', 'font-weight: bold', 'parameter. Reverted to default');
							}
						}
					}				
				}
			} else {
				this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
				if (this.debugging) {
					console.warn('aCamera Module [Zoom]: No %cpEase', 'font-weight: bold', 'parameter passed. Reverted to default');
				}		
			}

			// callback
			if (pCallback) {
				if (typeof(pCallback) === 'function') {
					this.settings.zoom.callback = pCallback;
				} else {
					if (this.debugging) {
						console.warn('aCamera Module [Zoom]: Invalid variable type passed for the %pCallback', 'font-weight: bold', 'property.');
					}
				}
			}
			this.settings.zooming = true;
			this.isZooming = true;
		}

		aCamera.onZoomEnd = function() {
			if (this.settings.zoom.callback) {
				this.settings.zoom.callback();
			}
			VS.Client.mapView.scale.x = Math.round(this.settings.zoom.destinationLevel.x * 10) / 10;
			VS.Client.mapView.scale.y = Math.round(this.settings.zoom.destinationLevel.y * 10) / 10;
			VS.Client.setMapView(VS.Client.mapView);
			this.reset('zoom');
		}

		aCamera.setSettings = function(pSettings) {
			if (pSettings) {
				if (typeof(pSettings) === 'object' && pSettings.constructor === Object) {
					if (pSettings.duration) {
						if (typeof(pSettings.duration) === 'object' && pSettings.duration.constructor === Object) {
							if (typeof(pSettings.duration.x) === 'number' && typeof(pSettings.duration.y) === 'number') {
								this.settings.custom.duration.x = pSettings.duration.x;
								this.settings.custom.duration.y = pSettings.duration.y;
							} else {
								this.settings.custom.duration.x = this.settings.custom.duration.y = 1000;
								if (this.debugging) {
									console.warn('aCamera Module [setSettings]: Invalid variable type passed for the %cpSettings.duration.x || pSettings.duration.y', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.duration === 'number')) {
							this.settings.custom.duration.x = this.settings.custom.duration.y = pSettings.duration;
						} else {
							this.settings.custom.duration.x = this.settings.custom.duration.y = 1000;
							if (this.debugging) {
								console.warn('aCamera Module [setSettings]: Invalid variable type passed for the %cpSettings.duration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						this.settings.custom.duration.x = this.settings.custom.duration.y = 1000;
						if (this.debugging) {
							console.warn('aCamera Module [setSettings]: No %cpSettings.duration', 'font-weight: bold', 'parameter passed. Reverted to default');
						}
					}

					if (pSettings.ease) {
						if (typeof(pSettings.ease) === 'object' && pSettings.ease.constructor === Object) {
							if (typeof(pSettings.ease.x) === 'string' && typeof(pSettings.ease.y) === 'string') {
								if (validEase.includes(pSettings.ease.x) && validEase.includes(pSettings.ease.y)) {
									this.settings.custom.ease.x = pSettings.ease.x;
									this.settings.custom.ease.y = pSettings.ease.y;
								} else {
									this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
									if (this.debugging) {
										console.warn('aCamera Module [setSettings]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
									}
								}
							} else {
								this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [setSettings]: Invalid variable type passed for the %cpSettings.ease.x || pSettings.ease.y', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.ease === 'string')) {
							if (validEase.includes(pSettings.ease)) {
								this.settings.custom.ease.x = this.settings.custom.ease.y = pSettings.ease;
							} else {
								this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [setSettings]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease. Reverted to default');
								}
							}
						} else {
							this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module [setSettings]: Invalid variable type passed for the %cpSettings.ease', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
						if (this.debugging) {
							console.warn('aCamera Module [setSettings]: No %cpSettings.ease', 'font-weight: bold', 'parameter passed. Reverted to default');
						}
					}

					this.reset('standard');
					this.custom = true;
					this.settings.custom.initialPos.x = this.xPos;
					this.settings.custom.initialPos.y = this.yPos;
				} else {
					this.reset('custom');
					this.custom = false;
					this.settings.standard.initialPos.x = this.xPos;
					this.settings.standard.initialPos.y = this.yPos;
					if (this.debugging) {
						console.warn('aCamera Module [setSettings]: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Reverted to default');
					}
				}
			} else {
				this.reset('custom');
				this.custom = false;
				this.settings.standard.initialPos.x = this.xPos;
				this.settings.standard.initialPos.y = this.yPos;
				if (this.debugging) {
					console.warn('aCamera Module [setSettings]: No %cpSettings', 'font-weight: bold', 'parameter passed. Reverted to default');
				}
			}
		}

		aCamera.spectate = function(pSettings) {
			if (this.settings.panning) {
				console.error('aCamera Module [spectate]: Cannot spectate camera is currently %cpanning', 'font-weight: bold', '. Spectate failed');
				return;
			}
			if (pSettings) {
				if (typeof(pSettings) === 'object' && pSettings.constructor === Object) {
					if (typeof(pSettings.target) === 'object') {
						if (typeof(pSettings.target.xPos) === 'number' && typeof(pSettings.target.yPos) === 'number' && typeof(pSettings.target.mapName) === 'string') {
							this.assignIconSize(pSettings.target);
							this.settings.spectate.preventMovement = false;
							this.settings.spectate.forcePos = false;
							// If you are using the aBlip library
							if (VS.Client.___EVITCA_aBlip) {
								// when you start spectating there should be no blips at all so they should be all hidden
								VS.Client.aBlip.destroyAllBlips();
							}

							// prevents player from moving while spectating
							if (pSettings.preventMovement) {
								this.settings.spectate.preventMovement = pSettings.preventMovement;
								VS.Client.toggleMacroCapture(false);
							}
							// doesn't ease to the spectatee
							if (pSettings.forcePos) {
								this.settings.spectate.forcePos = pSettings.forcePos;
								this.setPos(pSettings.target.getTrueCenterPos().x, pSettings.target.getTrueCenterPos().y, pSettings.target.mapName);
							} else {
								// if the distance is too far, then just force the position
								if (VS.Map.getDist(this.following, pSettings.target) > 1000) {
									this.settings.spectate.forcePos = true;
									this.setPos(pSettings.target.getTrueCenterPos().x, pSettings.target.getTrueCenterPos().y, pSettings.target.mapName);							
								}
							}
							if (!this.settings.spectate.player) {
								this.settings.spectate.player = this.following;
							}
							this.following = pSettings.target;
						} else {
							console.error('aCamera Module [spectate]: Invalid variable type passed for the %cpSettings.target.xPos || pSettings.target.yPos || pSettings.target.mapName', 'font-weight: bold', 'property. Spectate failed');
							return;
						}
					}
				} else {
					console.error('aCamera Module [spectate]: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Spectate failed');
					return;
				}
			} else {
				console.error('aCamera Module [spectate]: No %cpSettings', 'font-weight: bold', 'parameter passed. Spectate failed');
				return
			}
			this.settings.spectating = true;
			this.isSpectating = true;
		}

		aCamera.cancelSpectate = function() {
			if (this.settings.spectate.forcePos) {
				this.setPos(this.settings.spectate.player.getTrueCenterPos().x, this.settings.spectate.player.getTrueCenterPos().y, this.settings.spectate.player.mapName);
			}
			this.following = this.settings.spectate.player;
			if (this.settings.spectate.preventMovement) {
				VS.Client.toggleMacroCapture(true);
			}
			if (VS.Client.onSpectateEnd && typeof(VS.Client.onSpectateEnd) === 'function') VS.Client.onSpectateEnd();
			this.reset('spectate');
		}

		aCamera.detach = function() {
			if (!this.attached) {
				console.error('aCamera Module [detach]: aCamera is already %cdetached!', 'font-weight: bold');
				return;
			}

			this.reset('spectate');
			this.following = VS.Client.mob;
			this.setSettings();
			this.attached = false;
			this.setLoc();
			VS.Client.setViewEye(this.following);
		}

		aCamera.attach = function(pDiob) {
			if (typeof(pDiob) === 'object') {
				if (pDiob.constructor !== Diob) {
					console.error('aCamera Module [attach]: Nothing to %cattach', 'font-weight: bold', 'to. Attachment failed');
					return;
				}
			}
			if (this.attached) {
				console.warn('aCamera Module [attach]: aCamera is already %cattached!', 'font-weight: bold');
			}
			this.assignIconSize(pDiob);
			this.following = pDiob;
			this.oldPos.x = this.following.xPos;
			this.oldPos.y = this.following.yPos;
			this.setPos(this.following.getTrueCenterPos().x, this.following.getTrueCenterPos().y, this.following.mapName);
			this.attached = true;
			VS.Client.setViewEye(this);
		}

		aCamera.shake = function(pIntensity, pDuration, pRotational=false, pCallback) {
			const intensityValue = { 'x': 1, 'y': 1 };
			const durationValue = { 'x': 1000, 'y': 1000 };
			if (pIntensity) {
				if (typeof(pIntensity) === 'object' && pIntensity.constructor === Object) {
					if (pIntensity.x || pIntensity.x === 0) {
						if (typeof(pIntensity.x) === 'number') {
							intensityValue.x = Math.clamp(pIntensity.x, 0, MAX_CAMERA_SHAKE_FORCE);
						} else {
							if (this.debugging) {
								console.warn('aCamera Module [Shake]: Invalid variable type for %cpIntensity.x', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						if (this.debugging) {
							console.warn('aCamera Module [Shake]: No %cpIntensity.x', 'font-weight: bold', 'property value passed. Reverted to default');
						}
					}

					if (pIntensity.y || pIntensity.y === 0) {
						if (typeof(pIntensity.y) === 'number') {
							intensityValue.y = Math.clamp(pIntensity.y, 0, MAX_CAMERA_SHAKE_FORCE);
						} else {
							if (this.debugging) {
								console.warn('aCamera Module [Shake]: Invalid variable type for %cpIntensity.y', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						if (this.debugging) {
							console.warn('aCamera Module [Shake]: No %cpIntensity.y', 'font-weight: bold', 'property value passed. Reverted to default');
						}
					}

				} else if (typeof(pIntensity) === 'number') {
					intensityValue.x = intensityValue.y = Math.clamp(pIntensity, 0, MAX_CAMERA_SHAKE_FORCE);
				} else {
					if (this.debugging) {
						console.warn('aCamera Module [Shake]: Invalid variable type for %cpIntensity', 'font-weight: bold', 'parameter passed. Reverted to default');
					}
				}

			} else {
				if (this.debugging) {
					console.warn('aCamera Module [Shake]: No %cpIntensity', 'font-weight: bold', 'parameter passed. Reverted to default');
				}
			}

			if (pDuration) {
				if (typeof(pDuration) === 'object' && pDuration.constructor === Object) {
					if (pDuration.x || pDuration.x === 0) {
						if (typeof(pDuration.x) === 'number') {
							durationValue.x = pDuration.x;
						} else {
							if (this.debugging) {
								console.warn('aCamera Module [Shake]: Invalid variable type for %cpDuration.x', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						if (this.debugging) {
							console.warn('aCamera Module [Shake]: No %cpDuration.x', 'font-weight: bold', 'property value passed. Reverted to default');
						}
					}

					if (pDuration.y || pDuration.y === 0) {
						if (typeof(pDuration.y) === 'number') {
							durationValue.y = pDuration.y;
						} else {
							if (this.debugging) {
								console.warn('aCamera Module [Shake]: Invalid variable type for %cpDuration.y', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						if (this.debugging) {
							console.warn('aCamera Module [Shake]: No %cpDuration.y', 'font-weight: bold', 'property value passed. Reverted to default');
						}
					}
				} else if (typeof(pDuration) === 'number') {
					durationValue.x = durationValue.y = Math.clamp(pDuration, 0, MAX_CAMERA_SHAKE_FORCE);
				} else {
					if (this.debugging) {
						console.warn('aCamera Module [Shake]: Invalid variable type passed for the %cpDuration.x || pDuration.y', 'font-weight: bold', 'property. Reverted to default');
					}
				}
				
			} else {
				if (this.debugging) {
					console.warn('aCamera Module [Shake]: No %cpDuration ', 'font-weight: bold', 'parameter passed. Reverted to default');
				}
			}

			if (pRotational) {
				this.settings.shake.rotational = true;
			}

			if (pCallback) {
				if (typeof(pCallback) === 'function') {
					this.settings.shake.callback = pCallback;
				} else {
					if (this.debugging) {
						console.warn('aCamera Module [Shake]: Invalid variable type passed for the %cpCallback', 'font-weight: bold', 'property.');
					}
				}
			}

			// if (this.settings.shake.active.x || this.settings.shake.active.y) {
			// 	const intensityObject = { 'x': 0, 'y': 0 };

			// 	if (this.settings.shake.intensity.x === intensityValue.x) {
			// 		if (durationValue.x > (this.settings.shake.duration.x - this.settings.shake.time.x)) {
			// 			intensityObject.x = intensityValue.x;
			// 		}
			// 	} else if (this.settings.shake.intensity.x > intensityValue.x) {
			// 		intensityObject.x = intensityValue.x;
			// 	}

			// 	if (this.settings.shake.intensity.y === intensityValue.y) {
			// 		if (durationValue.y > (this.settings.shake.duration.y - this.settings.shake.time.y)) {
			// 			intensityObject.y = intensityValue.y;
			// 		}
			// 	} else if (this.settings.shake.intensity.y > intensityValue.y) {
			// 		intensityObject.y = intensityValue.y;
			// 	}

			// 	if (intensityObject.x || intensityObject.y) {
			// 		this.settings.shake.concurrentShaking.push({ 'intensity': intensityObject, 'duration': durationValue });
			// 		return
			// 	}
			// }

			if (intensityValue.x && durationValue.x) {
				this.settings.shake.intensity.x = intensityValue.x;
				this.settings.shake.duration.x = durationValue.x;
				this.settings.shake.active.x = true;
			}

			if (intensityValue.y && durationValue.y) {
				this.settings.shake.intensity.y = intensityValue.y;
				this.settings.shake.duration.y = durationValue.y;
				this.settings.shake.active.y = true;
			}
			this.isShaking = true;
		}

		aCamera.onShakeEnd = function() {
			if (this.settings.shake.callback) {
				this.settings.shake.callback();
				VS.Client.setViewEyeOffsets(0, 0);
			}
			this.reset('shake');
		}

		aCamera.toggleDebug = function() {
			this.debugging = (this.debugging ? false : true);
			this.invisibility = (this.debugging ? 0 : 999999);
		}

		aCamera.destroy = function() {
			this.init = false;
			this.attached = false;
			this.reset('spectate');
			this.setSettings();
			this.setLoc();
			VS.Client.setViewEye(VS.Client.mob);
		}

		assignCamera(aCamera);
	}
}
)();
