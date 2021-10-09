#ENABLE LOCALCLIENTCODE
#BEGIN CLIENTCODE
#BEGIN JAVASCRIPT

(function () {
	let engineWaitId = setInterval(function() {
		if (VS.Client) {
			clearInterval(engineWaitId);
			prepClient();
			buildCamera();
		}
	});
	const MAX_PLANE = 999999;

	let validEase = [ 
		'linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInSine', 'easeOutSine', 'easeInOutSine', 'easeInExpo', 
		'easeOutExpo', 'easeInOutExpo', 'easeInCirc', 'easeOutCirc', 'easeInOutCirc', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 
		'easeInQuart', 'easeOutQuart', 'easeInOutQuart','easeInQuint', 'easeOutQuint', 'easeInOutQuint', 'easeInElastic', 'easeOutElastic', 
		'easeInOutElastic', 'easeInBack', 'easeOutBack', 'easeInOutBack', 'easeInBounce', 'easeOutBounce', 'easeInOutBounce'
	]

	let prepClient = function() {
		// update will allow us to just check `mapView.scale.x` when veek presets the definitions of all the objects
		// you don't have a object scale set
		if (typeof(VS.Client.mapView.scale) !== 'object') {
			VS.Client.mapView.scale = { 'x': 1, 'y': 1 };
			VS.Client.setMapView(VS.Client.mapView);
		}

		if (VS.Client.timeScale === undefined) {
			VS.Client.timeScale = 1;
		}
	}

	let assignCamera = function(aCamera) {
		VS.Client.aCamera = aCamera;
		VS.Client.___EVITCA_aCamera = true;
		VS.World.global.aCamera = aCamera;
		// the version of the camera
		aCamera.version = 'v1.1.0';
		// whether the camera has been created and is ready for use or not
		aCamera.init = true;
		// whether the camera is attached to something and will follow it
		aCamera.attached = false;
		aCamera.updateLoop();
		
		VS.Client.attachCamera = function(pSettings) {
			// if no iCenter, give a initial default value
			if (!this.mob.iCenter) {
				this.mob.iCenter = { 'x': 16, 'y': 16, 'z': 0 };
			}
			// if no zPos, give a initial value
			if (!this.mob.zPos) {
				this.mob.zPos = 0;
				this.aCamera.zPos = 0;
			}
			this.aCamera.settings.zoom.currentLevel.x = this.mapView.scale.x;
			this.aCamera.settings.zoom.currentLevel.y = this.mapView.scale.y;
			this.aCamera.following = this.mob;
			this.aCamera.setPos(this.mob.xPos, (this.mob.yPos) - (this.aCamera.zPos + this.mob.iCenter.z), this.mob.mapName);
			this.aCamera.oldPos.x = this.aCamera.xPos;
			this.aCamera.oldPos.y = this.aCamera.yPos;
			this.aCamera.oldPos.z = this.aCamera.zPos;
			this.aCamera.attached = true;

			if (pSettings) {
				if (typeof(pSettings) === 'object' && !Array.isArray(pSettings)) {
					if (pSettings.duration) {
						if (typeof(pSettings.duration) === 'object' && !Array.isArray(pSettings.duration)) {
							if (!pSettings.duration.z) {
								pSettings.duration.z = 1000;
							}
							if (typeof(pSettings.duration?.x) === 'number' && typeof(pSettings.duration?.y) === 'number' && typeof(pSettings.duration?.z) === 'number') {
								this.aCamera.settings.custom.duration.x = pSettings.duration.x;
								this.aCamera.settings.custom.duration.y = pSettings.duration.y;
								this.aCamera.settings.custom.duration.z = pSettings.duration.z;
							} else {
								this.aCamera.settings.custom.duration.x = this.aCamera.settings.custom.duration.y = this.aCamera.settings.custom.duration.z = 1000;
								if (this.debugging) {
									console.warn('aCamera Module: Invalid variable type passed for the %cpSettings.duration.x || pSettings.duration.y || *pSettings.duration.z', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.duration === 'number')) {
							this.aCamera.settings.custom.duration.x = this.aCamera.settings.custom.duration.y = this.aCamera.settings.custom.duration.z = pSettings.duration;
						} else {
							this.aCamera.settings.custom.duration.x = this.aCamera.settings.custom.duration.y = this.aCamera.settings.custom.duration.z = 1000;
							if (this.debugging) {
								console.warn('aCamera Module: Invalid variable type passed for the %cpSettings.duration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						this.aCamera.settings.custom.duration.x = this.aCamera.settings.custom.duration.y = this.aCamera.settings.custom.duration.z = 1000;
						if (this.debugging) {
							console.warn('aCamera Module: No %cpSettings.duration', 'font-weight: bold', 'parameter passed. Reverted to default');
						}
					}

					if (pSettings.ease) {
						if (typeof(pSettings.ease) === 'object' && !Array.isArray(pSettings.ease)) {
							if (!pSettings.ease.z) {
								pSettings.ease.z = 'easeOutCubic';
							}
							if (typeof(pSettings.ease?.x) === 'string' && typeof(pSettings.ease?.y) === 'string' && typeof(pSettings.ease?.z) === 'string') {
								if (validEase.includes(pSettings.ease?.x) && validEase.includes(pSettings.ease?.y) && validEase.includes(pSettings.ease?.z)) {
									this.aCamera.settings.custom.ease.x = pSettings.ease.x;
									this.aCamera.settings.custom.ease.y = pSettings.ease.y;
									this.aCamera.settings.custom.ease.z = pSettings.ease.z;
								} else {
									this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = this.aCamera.settings.custom.ease.z = 'easeOutCubic';
									if (this.debugging) {
										console.warn('aCamera Module: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y || *pSettings.ease.z. Reverted to default');
									}
								}
							} else {
								this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = this.aCamera.settings.custom.ease.z = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module: Invalid variable type passed for the %cpSettings.ease.x || pSettings.ease.y || *pSettings.ease.z', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.ease === 'string')) {
							if (validEase.includes(pSettings.ease)) {
								this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = this.aCamera.settings.custom.ease.z = pSettings.ease;
							} else {
								this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = this.aCamera.settings.custom.ease.z = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease. Reverted to default');
								}
							}
						} else {
							this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = this.aCamera.settings.custom.ease.z = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module: Invalid variable type passed for the %cpSettings.ease', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						this.aCamera.settings.custom.ease.x = this.aCamera.settings.custom.ease.y = this.aCamera.settings.custom.ease.z = 'easeOutCubic';
						if (this.debugging) {
							console.warn('aCamera Module: No %cpSettings.ease', 'font-weight: bold', 'parameter passed. Reverted to default');
						}		
					}

					this.aCamera.reset('standard');
					this.aCamera.custom = true;
					this.following = this.mob;
					this.aCamera.settings.custom.initialPos.x = this.aCamera.xPos;
					this.aCamera.settings.custom.initialPos.y = this.aCamera.yPos;
					this.aCamera.settings.custom.initialPos.z = this.aCamera.zPos;
				} else {
					this.aCamera.reset('custom');
					this.aCamera.custom = false;
					this.aCamera.following = this.mob;
					this.aCamera.settings.standard.initialPos.x = this.aCamera.xPos;
					this.aCamera.settings.standard.initialPos.y = this.aCamera.yPos;
					this.aCamera.settings.standard.initialPos.z = this.aCamera.zPos;
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
				this.aCamera.settings.standard.initialPos.z = this.aCamera.zPos;
			}
			
			this.aCamera.oldFollowingPos = { 'x': this.aCamera.following.xPos, 'y': this.aCamera.following.yPos, 'z': this.aCamera.following.zPos }
			this.setViewEye(this.aCamera);
		}
	}

	let buildCamera = function() {
		let Ease = {};
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
		const MAX_ELAPSED_MS = 20;
		const TICK_FPS = 16.67;
		const MAX_PARALLAX_OBJECTS = 100;

		let aCamera = VS.newDiob();

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
		// if the camera is currently being debugged, (shows icon info for the camera)
		aCamera.debugging = false;
		aCamera.preventScreenRelayer = true;
		aCamera.preventInterpolation = true;
		aCamera.ONE = 1;
		aCamera.TWO = 2;
		aCamera.THREE = 3;
		aCamera.FOUR = 4;
		aCamera.FIVE = 5;
		aCamera.SIX = 6;
		aCamera.oldPos = { 'x': 0, 'y': 0, 'y': 0 };
		aCamera.oldFollowingPos = { 'x': 0, 'y': 0, 'z': 0 };
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
				'active': { 'x': false, 'y': false, 'z': false }, // if the camera is active or not
				'time': { 'x': 0, 'y': 0, 'z': 0, 'y': null }, // the current time in the ease
				'destination': { 'x': null, 'y': null, 'z': null }, // the end position the camera will go to
				'ease': { 'x': 'easeOutCubic', 'y': 'easeOutCubic', 'z': 'easeOutCubic' }, // the ease in each axis the camera will use
				'duration': { 'x': 1000, 'y': 1000, 'z': 1000 }, // how long in each axis the ease will take
				'target': null, // the panTo diob
				'storedDir': null, // the direction that is stored so it can be given back to the diob when the pan is over
				'returning': null, // if the pan is on the `returning` stage
				'forceDirChange': true, // if the panning forces the person the camera is attached to to change direction in the direction of the pan. This also disables movement.
				'pauseDuration': 0, // how long to stay at the object you've panned to before continuing to pan back
				'attach': false, // if when panning to the object, the object now becomes the target that the camera is following
				'initialPos': { 'x': null, 'y': null, 'z': null }, // the initial position of the camera
				'finalDuration': { 'x': 1000, 'y': 1000, 'z': 1000 }, // when the camera is panning back to whatever it panned from
				'finalEase': { 'x': 'easeOutCubic', 'y': 'easeOutCubic', 'z': 'easeOutCubic' }, // the ease used to pan back
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
				'active': { 'x': false, 'y': false, 'z': false },
				'time': { 'x': 0, 'y': 0, 'z': 0 },
				'duration': { 'x': 1000, 'y': 1000, 'z': 1000 },
				'destination': { 'x': null, 'y': null, 'z': null },
				'initialPos': { 'x': null, 'y': null, 'z': null },
				'ease': { 'x': 'easeOutCubic', 'y': 'easeOutCubic', 'z': 'easeOutCubic' }
			},

			'custom': { // custom applied camera movement settings, // allows separate dimension moving
				'active': { 'x': false, 'y': false, 'z': false },
				'time': { 'x': 0, 'y': 0, 'z': 0 },
				'duration': { 'x': 1000, 'y': 1000, 'z': 1000 },
				'destination': { 'x': null, 'y': null, 'z': null },
				'initialPos': { 'x': null, 'y': null, 'z': null },
				'ease': { 'x': 'easeOutCubic', 'y': 'easeOutCubic', 'z': 'easeOutCubic' }
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
			let result = Number((Math.random() * (pNum - pNum2) + pNum2).toFixed(pPlaces));
			return (result >= 1 ? Math.floor(result) : result);
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
					break;

				case 'panX':
					this.settings.pan.active.x = false;
					this.settings.pan.time.x = 0;
					break;

				case 'panY':
					this.settings.pan.active.y = false;
					this.settings.pan.time.y = 0;
					break;

				case 'panZ':
					this.settings.pan.active.z = false;
					this.settings.pan.time.z = 0;
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
					this.settings.pan.time.x = this.settings.pan.time.y = this.settings.pan.time.z = 0;
					this.settings.pan.initialPos.x = this.settings.pan.initialPos.y = this.settings.pan.initialPos.z = null;
					this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = this.settings.pan.finalDuration.z = null;
					this.settings.pan.ease.x = this.settings.pan.ease.y = this.settings.pan.ease.z = null;
					this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = this.settings.pan.finalEase.z = null;
					this.settings.pan.active.x = this.settings.pan.active.y = this.settings.pan.active.z = false;
					this.settings.pan.duration.x = this.settings.pan.duration.y = this.settings.pan.duration.z = null;
					this.settings.pan.destination.x = this.settings.pan.destination.y = this.settings.pan.destination.z = null;
					this.settings.panning = false;
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

				case 'standardZ':
					this.settings.standard.active.z = false;
					this.settings.standard.time.z = 0;
					this.settings.standard.initialPos.z = this.zPos;
					break;

				case 'standard':
					this.settings.standard.active.x = this.settings.standard.active.y = this.settings.standard.active.z = false;
					this.settings.standard.time.x = this.settings.standard.time.y = this.settings.standard.time.z = 0;

					this.settings.standard.initialPos.x = this.xPos;
					this.settings.standard.initialPos.y = this.yPos;
					this.settings.standard.initialPos.z = this.zPos;
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

				case 'customZ':
					this.settings.custom.active.z = false;
					this.settings.custom.time.z = 0;
					this.settings.custom.initialPos.z = this.zPos;
					break;

				case 'custom':
					this.settings.custom.active.x = this.settings.custom.active.y = this.settings.custom.active.z= false;
					this.settings.custom.time.x = this.settings.custom.time.y = this.settings.custom.time.z = 0;

					this.settings.custom.initialPos.x = this.xPos;
					this.settings.custom.initialPos.y = this.yPos;
					this.settings.custom.initialPos.z = this.zPos;
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
					break;

				case 'spectate':
					this.settings.spectate.player = null;
					this.settings.spectate.forcePos = false;
					this.settings.spectate.preventMovement = false;
					this.settings.spectating = false;
					break;
			}
		}

		aCamera.zoomUpdate = function(pElapsedMS, pDeltaTime) {
			if (this.settings.zoom.active.x) {
				this.settings.zoom.time.x += pElapsedMS;
				this.settings.zoom.currentLevel.x = Ease[this.settings.zoom.ease.x](this.settings.zoom.time.x, this.settings.zoom.initialLevel.x, this.settings.zoom.differenceLevel.x, this.settings.zoom.duration.x);
				let stepSizeX = (this.settings.zoom.currentLevel.x - VS.Client.mapView.scale.x) * pDeltaTime
				VS.Client.mapView.scale.x += stepSizeX;
			}

			if (this.settings.zoom.active.y) {
				this.settings.zoom.time.y += pElapsedMS
				this.settings.zoom.currentLevel.y = Ease[this.settings.zoom.ease.y](this.settings.zoom.time.y, this.settings.zoom.initialLevel.y, this.settings.zoom.differenceLevel.y, this.settings.zoom.duration.y);
				let stepSizeY = (this.settings.zoom.currentLevel.y - VS.Client.mapView.scale.y) * pDeltaTime
				VS.Client.mapView.scale.y += stepSizeY;
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
			// let xView = Math.lerp(Client.xViewEyeOffset, 0, 0.5) * pDeltaTime;
			// let yView = Math.lerp(Client.yViewEyeOffset, 0, 0.5) * pDeltaTime;

			// if (this.settings.shake.rotational) {
			// 	var angle = Math.lerp(Client.mapView.angle, 0, 0.1) * pDeltaTime
			// 	Client.mapView.angle = Math.clamp(angle, 0, 1)
			// 	Client.setMapView(Client.mapView)				
			// }
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

				var angle = this.decimalRand(-this.decimalRand(seed, seed2) / 100, this.decimalRand(seed, seed2) / 100) * pDeltaTime;
				VS.Client.mapView.angle = angle;
				VS.Client.setMapView(VS.Client.mapView);
			}

			if (this.settings.shake.active.x) {
				let seed = this.settings.shake.intensity.x;
				let seed2 = seed*0.5;
				var xForce = this.decimalRand(-this.decimalRand(seed, seed2), this.decimalRand(seed, seed2)) * pDeltaTime;
				this.settings.shake.time.x += pElapsedMS;
			}

			if (this.settings.shake.active.y) {
				let seed = this.settings.shake.intensity.y;
				let seed2 = seed*0.5;
				var yForce = this.decimalRand(-this.decimalRand(seed, seed2), this.decimalRand(seed, seed2)) * pDeltaTime;
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
			if (typeof(pSettings) === 'object' && !Array.isArray(pSettings)) {
				let settingsProps = Object.keys(pSettings);
				if (settingsProps.includes('target')) {
					// target
					if (typeof(pSettings.target) === 'object' && !Array.isArray(pSettings.target)) {
						if (typeof(pSettings.target?.xPos) === 'number' && typeof(pSettings.target?.yPos) === 'number' && typeof(pSettings.target?.mapName) === 'string') {
							if (!pSettings.target.zPos) {
								pSettings.target.zPos = 0;
							}
							if (pSettings.target === this.following) {
								console.error('aCamera Module [Pan]: You %ccannot', 'font-weight: bold', 'pan to yourself. Pan failed');
								return
							}
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
						if (typeof(pSettings.ease) === 'object' && !Array.isArray(pSettings.ease)) {
							if (!pSettings.ease.z) {
								pSettings.ease.z = 'easeOutCubic';
							}
							if (typeof(pSettings.ease?.x) === 'string' && typeof(pSettings.ease?.y) === 'string' && typeof(pSettings.ease?.z) === 'string') {
								if (validEase.includes(pSettings.ease?.x) && validEase.includes(pSettings.ease?.y) && validEase.includes(pSettings.ease?.z)) {
									this.settings.pan.ease.x = pSettings.ease.x;
									this.settings.pan.ease.y = pSettings.ease.y;
									this.settings.pan.ease.z = pSettings.ease.z;
								} else {
									this.settings.pan.ease.x = this.settings.pan.ease.y = this.settings.pan.ease.z = 'easeOutCubic';
									if (this.debugging) {
										console.warn('aCamera Module [Pan]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y || *pSettings.ease.z. Reverted to default');
									}
								}
							} else {
								this.settings.pan.ease.x = this.settings.pan.ease.y = this.settings.pan.ease.z = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.ease.x || pSettings.ease.y || *pSettings.ease.z', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.ease) === 'string') {
							if (validEase.includes(pSettings.ease)) {
								this.settings.pan.ease.x = this.settings.pan.ease.y = this.settings.pan.ease.z = pSettings.ease;
							} else {
								this.settings.pan.ease.x = this.settings.pan.ease.y = this.settings.pan.ease.z = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y || *pSettings.ease.z. Reverted to default');
								}
							}
						} else {
							this.settings.pan.ease.x = this.settings.pan.ease.y = this.settings.pan.ease.z = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.ease', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.ease.x = this.settings.pan.ease.y = this.settings.pan.ease.z = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: No %cease', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
							}
					}

					// finalEase
					if (pSettings.finalEase) {
						if (typeof(pSettings.finalEase) === 'object' && !Array.isArray(pSettings.finalEase)) {
							if (!pSettings.finalEase.z) {
								pSettings.finalEase.z = 'easeOutCubic';
							}
							if (typeof(pSettings.finalEase?.x) === 'string' && typeof(pSettings.finalEase?.y) === 'string' && typeof(pSettings.finalEase?.z) === 'string') {
								if (validEase.includes(pSettings.finalEase?.x) && validEase.includes(pSettings.finalEase?.y) && validEase.includes(pSettings.finalEase?.z)) {
									this.settings.pan.finalEase.x = pSettings.finalEase.x;
									this.settings.pan.finalEase.y = pSettings.finalEase.y;
									this.settings.pan.finalEase.z = pSettings.finalEase.z;
								} else {
									this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = this.settings.pan.finalEase.z = 'easeOutCubic';
									if (this.debugging) {
										console.warn('aCamera Module [Pan]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.finalEase.x || pSettings.finalEase.y || *pSettings.finalEase.z. Reverted to default');
									}
								}
							} else {
								this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = this.settings.pan.finalEase.z = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.finalEase.x || pSettings.finalEase.y || *pSettings.finalEase.z', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.finalEase) === 'string') {
							if (validEase.includes(pSettings.finalEase)) {
								this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = this.settings.pan.finalEase.z = pSettings.finalEase;
							} else {
								this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = this.settings.pan.finalEase.z = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.finalEase.x || pSettings.finalEase.y || *pSettings.finalEase.z. Reverted to default');
								}
							}
						} else {
							this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = this.settings.pan.finalEase.z = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.finalEase', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = this.settings.pan.finalEase.z = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: No %cfinalEase', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
							}
					}

					//duration
					if (pSettings.duration) {
						if (typeof(pSettings.duration) === 'object' && !Array.isArray(pSettings.duration)) {
							if (!pSettings.duration.z) {
								pSettings.duration.z = 1000;
							}
							if (typeof(pSettings.duration?.x) === 'number' && typeof(pSettings.duration?.y) === 'number' && typeof(pSettings.duration?.z) === 'number') {
								this.settings.pan.duration.x = pSettings.duration.x;
								this.settings.pan.duration.y = pSettings.duration.y;
								this.settings.pan.duration.z = pSettings.duration.z;
							} else {
								this.settings.pan.duration.x = this.settings.pan.duration.y = this.settings.pan.duration.z = 2000;
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.duration.x || pSettings.duration.y || *pSettings.duration.z', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.duration) === 'number') {
								this.settings.pan.duration.x = this.settings.pan.duration.y = this.settings.pan.duration.z = pSettings.duration;
						} else {
							this.settings.pan.duration.x = this.settings.pan.duration.y = this.settings.pan.duration.z = 2000;
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.duration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.duration.x = this.settings.pan.duration.y = this.settings.pan.duration.z = 2000;
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: No %cduration', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
							}
					}

					// finalDuration
					if (pSettings.finalDuration) {
						if (typeof(pSettings.finalDuration) === 'object' && !Array.isArray(pSettings.finalDuration)) {
							if (!pSettings.finalDuration.z) {
								pSettings.finalDuration.z = 1000;
							}
							if (typeof(pSettings.finalDuration?.x) === 'number' && typeof(pSettings.finalDuration?.y) === 'number' && typeof(pSettings.finalDuration?.z) === 'number') {
								this.settings.pan.finalDuration.x = pSettings.finalDuration.x;
								this.settings.pan.finalDuration.y = pSettings.finalDuration.y;
								this.settings.pan.finalDuration.z = pSettings.finalDuration.z;
							} else {
								this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = this.settings.pan.finalDuration.z = 2000;
								if (this.debugging) {
									console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.finalDuration.x || pSettings.finalDuration.y || *pSettings.finalDuration.z', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.finalDuration) === 'number') {
								this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = this.settings.pan.finalDuration.z = pSettings.finalDuration;
						} else {
							this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = this.settings.pan.finalDuration.z = 2000;
							if (this.debugging) {
								console.warn('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings.finalDuration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = this.settings.pan.finalDuration.z = 2000;
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
					this.settings.pan.initialPos.z = this.zPos;

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

					if (this.zPos !== this.settings.pan.target.zPos) {
						this.settings.pan.active.z = true;
					}

				} else {
					console.error('aCamera Module [Pan]: No %ctarget', 'font-weight: bold', 'property included inside of the pSettings parameter. Pan failed');
				}

			} else {
				console.error('aCamera Module [Pan]: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Pan failed');
			}
			this.settings.panning = true;
		}

		aCamera.onPanned = function() {
			if (this.settings.pan.pannedCallback) {
				this.settings.pan.pannedCallback();
				this.settings.pan.pannedCallback = null;
			}
			if (this.settings.pan.attach) {
				if (this.settings.pan.target?.type) {
					if (!this.settings.pan.target.iCenter) {
						this.settings.pan.target.iCenter = { 'x': 16, 'y': 16, 'z': 0 };
					}
					if (this.settings.pan.target.zPos === undefined) {
						this.settings.pan.target.zPos = 0;
					}
					VS.Client.toggleMacroCapture(true);
					this.following = this.settings.pan.target;
					this.reset('pan');
				} else {
					if (this.debugging) {
						console.warn('aCamera Module [Pan]: Cannot attach to a non %cdiob', 'font-weight: bold', 'type. Attachment failed');
					}
				}
			} else {
				this.settings.pan.target = this.following;
				this.settings.pan.initialPos.x = this.xPos;
				this.settings.pan.initialPos.y = this.yPos;
				this.settings.pan.initialPos.z = this.zPos;
				this.settings.pan.time.x = this.settings.pan.time.y = this.settings.pan.time.z = 0;
				this.settings.pan.duration.x = this.settings.pan.finalDuration.x;
				this.settings.pan.duration.y = this.settings.pan.finalDuration.y;
				this.settings.pan.duration.z = this.settings.pan.finalDuration.z;
				this.settings.pan.ease.x = this.settings.pan.finalEase.x;
				this.settings.pan.ease.y = this.settings.pan.finalEase.y;
				this.settings.pan.ease.z = this.settings.pan.finalEase.z;
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
			let distanceZ;

			let xPos;
			let yPos;
			let zPos;

			let stepSizeX;
			let stepSizeY;
			let stepSizeZ;

			let target;

			if (pMethod === 'pan') {
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
						if (this.xPos !== this.settings.pan.target.xPos) {
							this.settings.pan.active.x = true;
						}

						if (this.yPos !== this.settings.pan.target.yPos) {
							this.settings.pan.active.y = true;
						}

						if (this.zPos !== this.settings.pan.target.zPos) {
							this.settings.pan.active.z = true;
						}
					}
				}
				if (this.settings[pMethod].active.x) {
					this.settings[pMethod].destination.x = this.settings[pMethod].target.xPos;
				}
				if (this.settings[pMethod].active.y) {
					this.settings[pMethod].destination.y = this.settings[pMethod].target.yPos;
				}
				if (this.settings[pMethod].active.z) {
					this.settings[pMethod].destination.z = this.settings[pMethod].target.zPos;
				}
				target = this.settings[pMethod].target;
			} else {
				if (this.settings[pMethod].active.x) {
					this.settings[pMethod].destination.x = this.following.xPos;
				}
				if (this.settings[pMethod].active.y) {
					this.settings[pMethod].destination.y = this.following.yPos;
				}
				if (this.settings[pMethod].active.z) {
					this.settings[pMethod].destination.z = this.following.zPos;
				}
				target = this.following;		
			}

			if (this.settings[pMethod].active.x) {
				this.settings[pMethod].time.x += pElapsedMS;
				distanceX = this.settings[pMethod].destination.x - this.settings[pMethod].initialPos.x;
				xPos = Ease[this.settings[pMethod].ease.x](this.settings[pMethod].time.x, this.settings[pMethod].initialPos.x, distanceX, this.settings[pMethod].duration.x);
				stepSizeX = (xPos - this.xPos) * pDeltaTime;
				this.xPos += stepSizeX
			}

			if (this.settings[pMethod].active.z) {
				this.settings[pMethod].time.z += pElapsedMS;
				distanceZ = this.settings[pMethod].destination.z - this.settings[pMethod].initialPos.z;
				zPos = Ease[this.settings[pMethod].ease.z](this.settings[pMethod].time.z, this.settings[pMethod].initialPos.z, distanceZ, this.settings[pMethod].duration.z);
				stepSizeZ = (zPos - this.zPos) * pDeltaTime;
			}

			if (this.settings[pMethod].active.y) {
				this.settings[pMethod].time.y += pElapsedMS;
				distanceY = this.settings[pMethod].destination.y - this.settings[pMethod].initialPos.y;
				yPos = Ease[this.settings[pMethod].ease.y](this.settings[pMethod].time.y, this.settings[pMethod].initialPos.y, distanceY, this.settings[pMethod].duration.y);
				stepSizeY = (yPos - this.yPos) * pDeltaTime;
				this.yPos += stepSizeY - (stepSizeZ ? stepSizeZ : 0);
			}
			
			this.mapName = target.mapName;

			if (isNaN(this.xPos)) {
				this.xPos = target.xPos;
			}

			if (isNaN(this.yPos)) {
				this.yPos = target.yPos;
			}

			if (isNaN(this.zPos)) {
				this.zPos = 0;
			}

			if (this.settings[pMethod].time.x >= this.settings[pMethod].duration.x) {
				this.xPos = target.xPos/*  + (target.iCenter?.x ? target.iCenter.x : 16) */;
				if (pMethod === 'pan') {
					this.reset('panX');
				} else if (pMethod === 'standard') {
					this.reset('standardX');
				} else if (pMethod === 'custom') {
					this.reset('customX');
				}
			}

			if (this.settings[pMethod].time.y >= this.settings[pMethod].duration.y) {
				this.yPos = (target.yPos/*  + (target.iCenter?.y ? target.iCenter.y : 16) */);
				if (pMethod === 'pan') {
					this.reset('panY');
				} else if (pMethod === 'standard') {
					this.reset('standardY');
				} else if (pMethod === 'custom') {
					this.reset('customY');
				}
			}

			if (this.settings[pMethod].time.z >= this.settings[pMethod].duration.z) {
				if (pMethod === 'pan') {
					this.reset('panZ');
				} else if (pMethod === 'standard') {
					this.reset('standardZ');
				} else if (pMethod === 'custom') {
					this.reset('customZ');
				}
			}

			if (pMethod === 'standard') {
				if (!this.settings[pMethod].active.x && !this.settings[pMethod].active.y && !this.settings[pMethod].active.z) {
					if (pMethod === 'standard') {
						this.reset('standard');
					} else if (pMethod === 'custom') {
						this.reset('custom');
					}
				}
			}

			if (pMethod === 'pan') {
				if (!this.settings[pMethod].active.x && !this.settings[pMethod].active.y && !this.settings[pMethod].active.z) {
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
			this.oldPos.z = this.zPos;
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
			if (this.settings.shake.active.x || this.settings.shake.active.y || this.settings.shake.active.z) {
				// this.settings.shaking = true;
				this.shakeUpdate(pElapsedMS, pDeltaTime);
			}

			if (this.attached) {
				// pan
				if (!this.settings.scrolling && (this.settings.pan.active.x || this.settings.pan.active.y || this.settings.pan.active.z || this.settings.pan.returning)) {
					this.follow('pan', pElapsedMS, pDeltaTime);
				}
				// camera moving after whatever its following
				if (!this.settings.scrolling && !this.settings.panning && this.following) {
					if (this.oldFollowingPos) {
						if (this.following.isMoving || this.oldFollowingPos.x !== this.following.xPos || this.oldFollowingPos.y !== this.following.yPos || this.oldFollowingPos.z !== this.following.zPos) {
							if (this.custom) {
								this.settings.custom.time.x = 0;
								this.settings.custom.active.x = (this.xPos !== this.following.xPos ? true : false);
								this.settings.custom.initialPos.x = this.xPos;

								this.settings.custom.time.y = 0;
								this.settings.custom.active.y = (this.yPos !== this.following.yPos ? true : false);
								this.settings.custom.initialPos.y = this.yPos;

								this.settings.custom.time.z = 0;
								this.settings.custom.active.z = (this.zPos !== this.following.zPos ? true : false);
								this.settings.custom.initialPos.z = this.zPos;

							} else {
								this.settings.standard.time.x = 0;
								this.settings.standard.active.x = (this.xPos !== this.following.xPos ? true : false);
								this.settings.standard.initialPos.x = this.xPos;

								this.settings.standard.time.y = 0;
								this.settings.standard.active.y = (this.yPos !== this.following.yPos ? true : false);
								this.settings.standard.initialPos.y = this.yPos;

								this.settings.standard.time.z = 0;
								this.settings.standard.active.z = (this.zPos !== this.following.zPos ? true : false);
								this.settings.standard.initialPos.z = this.zPos;
							}
						}
					}

					// custom camera moving
					if (this.custom) {
						if (this.settings.custom.active.x || this.settings.custom.active.y || this.settings.custom.active.z) {
							this.follow('custom', pElapsedMS, pDeltaTime);
						}
					// default camera moving
					} else {
						if (this.settings.standard.active.x || this.settings.standard.active.y || this.settings.standard.active.z) {
							this.follow('standard', pElapsedMS, pDeltaTime);
						}
					}
					this.oldFollowingPos.x = this.following.xPos;
					this.oldFollowingPos.y = this.following.yPos;
					this.oldFollowingPos.z = this.following.zPos;
				}
			}
		}

		aCamera.updateLoop = function() {
			let update = function (pCurrentTime = Date.now()) {
				if (this.init) {
					if (VS.Client.___EVITCA_aPause) {
						if (VS.Client.aPause.paused) {
							this.settings.loop.lastTime = pCurrentTime;
							window.requestAnimationFrame(update.bind(this));
							return;
						}
					}
					if (pCurrentTime > this.settings.loop.lastTime) {
						this.settings.loop.elapsedMS = pCurrentTime - this.settings.loop.lastTime;

						if (this.settings.loop.elapsedMS > MAX_ELAPSED_MS) {
							this.settings.loop.elapsedMS = MAX_ELAPSED_MS;
						} else {
							this.settings.loop.deltaTime = 1;
						}
						this.settings.loop.deltaTime = (this.settings.loop.elapsedMS / TICK_FPS) * VS.Client.timeScale;
						this.settings.loop.elapsedMS *= VS.Client.timeScale;
					}
					if (VS.Client.___EVITCA_aParallax && this.attached) {
						VS.Client.aParallax.update((this.following.xPos-this.oldPos.x) * this.settings.loop.deltaTime, (this.following.yPos-this.oldPos.y) * this.settings.loop.deltaTime)
					}
					this.update(this.settings.loop.elapsedMS, this.settings.loop.deltaTime);
					this.settings.loop.lastTime = pCurrentTime;
					window.requestAnimationFrame(update.bind(this));
				}
			}
			window.requestAnimationFrame(update.bind(this));
		}

		aCamera.zoom = function(pDestinationLevel={'x': 1, 'y': 1}, pDuration={'x': 1000, 'y': 1000}, pEase={'x': 'easeOutCirc', 'y': 'easeOutCirc'}, pCallback) {
			if (this.settings.zoom.active.x || this.settings.zoom.active.y) {
				return;
			}
			var dx;
			var dy;
			if (pDestinationLevel) {
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
				this.settings.zoom.differenceLevel.x = Math.round(this.settings.zoom.destinationLevel.x - this.settings.zoom.initialLevel.x);
			}

			if (this.settings.zoom.destinationLevel.y !== dy) {
				if (this.settings.zoom.active.y) {
					this.reset('zoomY');
				}
				this.settings.zoom.active.y = true;
				this.settings.zoom.destinationLevel.y = dy;
				this.settings.zoom.initialLevel.y = VS.Client.mapView.scale.y;
				this.settings.zoom.differenceLevel.y = Math.round(this.settings.zoom.destinationLevel.y - this.settings.zoom.initialLevel.y);
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
					if (typeof(pDuration?.x) === 'number' && typeof(pDuration?.y) === 'number') {
						this.settings.zoom.duration = pDuration;
					} else {
						this.settings.zoom.duration.x = this.settings.zoom.duration.y = 1000;
						if (this.debugging) {
							console.warn('aCamera Module [Zoom]: Invalid variable type passed for the %cpDuration.x || pDuration.y', 'font-weight: bold', 'parameter. Reverted to default');
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
					if (typeof(pEase?.x) === 'string' && typeof(pEase?.y) === 'string') {
						if (validEase.includes(pEase?.x) && validEase.includes(pEase?.y)) {
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
		}

		aCamera.onZoomEnd = function() {
			if (this.settings.zoom.callback) {
				this.settings.zoom.callback();
				this.settings.zoom.callback = null;
			}
			VS.Client.mapView.scale.x = Math.round(this.settings.zoom.destinationLevel.x);
			VS.Client.mapView.scale.y = Math.round(this.settings.zoom.destinationLevel.y);
			VS.Client.setMapView(VS.Client.mapView);
			this.reset('zoom');
		}

		aCamera.setSettings = function(pSettings) {
			if (pSettings) {
				if (typeof(pSettings) === 'object' && !Array.isArray(pSettings)) {
					if (pSettings.duration) {
						if (typeof(pSettings.duration) === 'object' && !Array.isArray(pSettings.duration)) {
							if (!pSettings.duration.z) {
								pSettings.duration.z = 1000;
							}
							if (typeof(pSettings.duration?.x) === 'number' && typeof(pSettings.duration?.y) === 'number' && typeof(pSettings.duration?.z) === 'number') {
								this.settings.custom.duration.x = pSettings.duration.x;
								this.settings.custom.duration.y = pSettings.duration.y;
								this.settings.custom.duration.z = pSettings.duration.z;
							} else {
								this.settings.custom.duration.x = this.settings.custom.duration.y = this.settings.custom.duration.z = 1000;
								if (this.debugging) {
									console.warn('aCamera Module [setSettings]: Invalid variable type passed for the %cpSettings.duration.x || pSettings.duration.y || *pSettings.duration.z', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.duration === 'number')) {
							this.settings.custom.duration.x = this.settings.custom.duration.y = this.settings.custom.duration.z = pSettings.duration;
						} else {
							this.settings.custom.duration.x = this.settings.custom.duration.y = this.settings.custom.duration.z = 1000;
							if (this.debugging) {
								console.warn('aCamera Module [setSettings]: Invalid variable type passed for the %cpSettings.duration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						this.settings.custom.duration.x = this.settings.custom.duration.y = this.settings.custom.duration.z = 1000;
						if (this.debugging) {
							console.warn('aCamera Module [setSettings]: No %cpSettings.duration', 'font-weight: bold', 'parameter passed. Reverted to default');
						}
					}

					if (pSettings.ease) {
						if (typeof(pSettings.ease) === 'object' && !Array.isArray(pSettings.ease)) {
							if (!pSettings.ease.z) {
								pSettings.ease.z = 'easeOutCubic';
							}
							if (typeof(pSettings.ease?.x) === 'string' && typeof(pSettings.ease?.y) === 'string' && typeof(pSettings.ease?.z) === 'string') {
								if (validEase.includes(pSettings.ease?.x) && validEase.includes(pSettings.ease?.y) && validEase.includes(pSettings.ease?.z)) {
									this.settings.custom.ease.x = pSettings.ease.x;
									this.settings.custom.ease.y = pSettings.ease.y;
									this.settings.custom.ease.z = pSettings.ease.z;
								} else {
									this.settings.custom.ease.x = this.settings.custom.ease.y = this.settings.custom.ease.z = 'easeOutCubic';
									if (this.debugging) {
										console.warn('aCamera Module [setSettings]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y || *pSettings.ease.z. Reverted to default');
									}
								}
							} else {
								this.settings.custom.ease.x = this.settings.custom.ease.y = this.settings.custom.ease.z = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [setSettings]: Invalid variable type passed for the %cpSettings.ease.x || pSettings.ease.y || *pSettings.ease.z', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.ease === 'string')) {
							if (validEase.includes(pSettings.ease)) {
								this.settings.custom.ease.x = this.settings.custom.ease.y = this.settings.custom.ease.z = pSettings.ease;
							} else {
								this.settings.custom.ease.x = this.settings.custom.ease.y = this.settings.custom.ease.z = 'easeOutCubic';
								if (this.debugging) {
									console.warn('aCamera Module [setSettings]: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease. Reverted to default');
								}
							}
						} else {
							this.settings.custom.ease.x = this.settings.custom.ease.y = this.settings.custom.ease.z = 'easeOutCubic';
							if (this.debugging) {
								console.warn('aCamera Module [setSettings]: Invalid variable type passed for the %cpSettings.ease', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						this.settings.custom.ease.x = this.settings.custom.ease.y = this.settings.custom.ease.z = 'easeOutCubic';
						if (this.debugging) {
							console.warn('aCamera Module [setSettings]: No %cpSettings.ease', 'font-weight: bold', 'parameter passed. Reverted to default');
						}
					}

					this.reset('standard');
					this.custom = true;
					this.settings.custom.initialPos.x = this.xPos;
					this.settings.custom.initialPos.y = this.yPos;
					this.settings.custom.initialPos.z = this.zPos;
				} else {
					this.reset('custom');
					this.custom = false;
					this.settings.standard.initialPos.x = this.xPos;
					this.settings.standard.initialPos.y = this.yPos;
					this.settings.standard.initialPos.z = this.zPos;
					if (this.debugging) {
						console.warn('aCamera Module [setSettings]: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Reverted to default');
					}
				}
			} else {
				this.reset('custom');
				this.custom = false;
				this.settings.standard.initialPos.x = this.xPos;
				this.settings.standard.initialPos.y = this.yPos;
				this.settings.standard.initialPos.z = this.zPos;
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
				if (typeof(pSettings) === 'object' && !Array.isArray(pSettings)) {
					if (typeof(pSettings.target?.xPos) === 'number' && typeof(pSettings.target?.yPos) === 'number' && typeof(pSettings.target?.mapName) === 'string') {
						this.settings.spectate.preventMovement = false;
						this.settings.spectate.forcePos = false;

						if (!pSettings.target.iCenter) {
							pSettings.target.iCenter = { 'x': 16, 'y': 16, 'z': 0 };
						}
						if (pSettings.target.zPos === undefined) {
							pSettings.target.zPos = 0;
						}
						// prevents player from moving while spectating
						if (pSettings.preventMovement) {
							this.settings.spectate.preventMovement = pSettings.preventMovement;
							VS.Client.toggleMacroCapture(false);
						}
						// doesn't ease to the spectatee
						if (pSettings.forcePos) {
							this.settings.spectate.forcePos = pSettings.forcePos;
							this.setPos(pSettings.target.xPos, pSettings.target.yPos, pSettings.target.mapName);
						} else {
							if (pSettings.target.width && pSettings.target.height) {
								if (typeof(pSettings.target.width) !== 'number') {
									pSettings.target.width = 32;
								}
								if (typeof(pSettings.target.height) !== 'number') {
									pSettings.target.height = 32;
								}
							} else {
								pSettings.target.width = 32;
								pSettings.target.height = 32;
							}
							// if the distance is too far, then just force the position
							if (VS.Map.getDist(this.following, pSettings.target) > 1000) {
								this.settings.spectate.forcePos = true;
								this.setPos(pSettings.target.xPos, pSettings.target.yPos, pSettings.target.mapName);								
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
				} else {
					console.error('aCamera Module [spectate]: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Spectate failed');
					return;
				}
			} else {
				console.error('aCamera Module [spectate]: No %cpSettings', 'font-weight: bold', 'parameter passed. Spectate failed');
				return
			}
			this.settings.spectating = true;
		}

		aCamera.cancelSpectate = function() {
			if (this.settings.spectate.forcePos) {
				this.setPos(this.settings.spectate.player.xPos, this.settings.spectate.player.yPos, this.settings.spectate.player.mapName);
			}
			this.following = this.settings.spectate.player;
			if (this.settings.spectate.preventMovement) {
				VS.Client.toggleMacroCapture(true);
			}
			this.reset('spectate');
		}

		aCamera.detach = function() {
			if (!this.attached) {
				console.error('aCamera Module [detach]: aCamera is already %cdetached!', 'font-weight: bold');
			}
			if (!this.following?.id) {
				console.error('aCamera Module [detach]: Nothing to %cdeatach', 'font-weight: bold', 'from. Attachment failed');
			}
			this.setPos(this.following.xPos, (this.following.yPos) - (this.zPos + this.following.iCenter.z), this.following.mapName);
			VS.Client.setViewEye(this.following);
			this.attached = false;
			this.setLoc();
		}

		aCamera.attach = function() {
			if (this.attached) {
				console.error('aCamera Module [attach]: aCamera is already %cattached!', 'font-weight: bold');
			}
			if (!this.following?.id && !this.following?.mapName) {
				console.error('aCamera Module [attach]: Nothing to %cattach', 'font-weight: bold', 'to. Attachment failed');
			}
			this.oldPos.x = this.following.xPos;
			this.oldPos.y = this.following.yPos;
			this.oldPos.z = 0; // might be an issue, but update loop should fix it in a frame, should grab the followers zPos
			this.setPos(this.following.xPos, (this.following.yPos) - (this.zPos + this.following.iCenter.z), this.following.mapName);
			VS.Client.setViewEye(this);
			this.attached = true;
		}

		aCamera.shake = function(pIntensity, pDuration, pRotational=false, pCallback) {
			let intensityValue = { 'x': 1, 'y': 1 };
			let durationValue = { 'x': 1000, 'y': 1000 };
			if (pIntensity) {
				if (typeof(pIntensity) === 'object' && !Array.isArray(pIntensity)) {
					if (pIntensity?.x || pIntensity.x === 0) {
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

					if (pIntensity?.y || pIntensity.y === 0) {
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
				if (typeof(pDuration) === 'object' && !Array.isArray(pDuration)) {
					if (pDuration?.x || pDuration.x === 0) {
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

					if (pDuration?.y || pDuration.y === 0) {
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
			// 	let intensityObject = { 'x': 0, 'y': 0 };

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
		}

		aCamera.onShakeEnd = function() {
			if (this.settings.shake.callback) {
				this.settings.shake.callback();
				this.settings.shake.callback = null;
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
			VS.Client.setViewEye(VS.Client.mob);
			VS.delDiob(this);
		}

		assignCamera(aCamera);
	}
}
)();

#END JAVASCRIPT
#END CLIENTCODE
