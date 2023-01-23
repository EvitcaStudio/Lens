/**
 * @license
 * Lens is free software, available under the terms of a MIT style License.
 * 
 * Copyright (c) 2022 Evitca Studio
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * This software cannot be sold by itself. It must be used in a project and the project itself can be sold. In the case it is not, you the "user" of this software are breaking the license and agreeing to forfeit its usage.
 * 
 * Neither the name “EvitcaStudio” or "Lens" nor the names of its contributors may be used to endorse or promote products derived from this software without specific prior written permission.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(() => {
	const engineWaitId = setInterval(() => {
		if (VYLO.Client) {
			clearInterval(engineWaitId);
			prepClient();
			buildCamera();
		}
	});
	
	const MAX_PLANE = 999999;
	const TILE_SIZE = VYLO.World.getTileSize();

	const validEase = [ 
		'linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInSine', 'easeOutSine', 'easeInOutSine', 'easeInExpo', 
		'easeOutExpo', 'easeInOutExpo', 'easeInCirc', 'easeOutCirc', 'easeInOutCirc', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 
		'easeInQuart', 'easeOutQuart', 'easeInOutQuart','easeInQuint', 'easeOutQuint', 'easeInOutQuint', 'easeInElastic', 'easeOutElastic', 
		'easeInOutElastic', 'easeInBack', 'easeOutBack', 'easeInOutBack', 'easeInBounce', 'easeOutBounce', 'easeInOutBounce'
	]

	const prepClient = () => {
		// you don't have a object scale set
		if (typeof(VYLO.Client.mapView.scale) !== 'object') {
			VYLO.Client.mapView.scale = { 'x': VYLO.Client.mapView.scale, 'y': VYLO.Client.mapView.scale };
		}

		VYLO.Client.mapView.anchor = { 'x': 0.5, 'y': 0.5 };
		VYLO.Client.setMapView(VYLO.Client.mapView);
	}

	const assignCamera = (Lens) => {
		VYLO.global.Lens = Lens;
		window.Lens = Lens;
		// the version of the camera
		Lens.version = 'v1.0.0';
		// a object that stores the icon sizes of icons used in this library
		Lens.cachedResourcesInfo = {};
		// whether the camera has been created and is ready for use or not
		Lens.init = true;
		// whether the camera is attached to something and will follow it
		Lens.attached = false;
		Lens.isMoving = false;
		Lens.isZooming = false;
		Lens.isSpectating = false;
		Lens.isShaking = false;
		Lens.isScrolling = false;
		Lens.isPanning = false;

		// Another plugin that could be used while in tandem with this one already presets this information, so we check to make sure we don't set it again.
		// If the other plugin is not used, then this is preset for use in positioning calculations.
		const protoDiob = VYLO.newDiob();
		if (!protoDiob.__proto__.constructor.prototype.getTrueCenterPos) {
			protoDiob.__proto__.constructor.prototype.getTrueCenterPos = function() {
				const tileSize = VYLO.World.getTileSize();
				const position = { x: Math.round(this.x + (this.aIconInfo ? this.aIconInfo.halfWidth : tileSize.width) + this.xIconOffset), y: Math.round(this.y + (this.aIconInfo ? this.aIconInfo.halfHeight : tileSize.height) + this.yIconOffset) };
				return position;
			};
		}
		VYLO.delDiob(protoDiob);
		
		EListener.on(VYLO.Client, 'onScreenRender', function(pT) {
			if (Lens.init) {
				const now = pT;
				// Legacy code, will be removed
				if (this.___EVITCA_aPause) {
					if (aPause && aPause.paused) {
						Lens.settings.loop.lastTime = now;
						return;
					}
				}
				if (!Lens.settings.loop.lastTime) Lens.settings.loop.lastTime = now;
				const elapsedMS = (now - Lens.settings.loop.lastTime);
				let dt = elapsedMS / 1000;
				Lens.settings.loop.elapsedMS = elapsedMS;
				Lens.settings.loop.deltaTime = dt;
				// PINGABLE
				// legacy code for aParallax plugin (will be removed)
				if (this.___EVITCA_aParallax && Lens.attached) {
					this.aParallax.update((Lens.following.getTrueCenterPos().x-Lens.oldPos.x), (Lens.following.getTrueCenterPos().y-Lens.oldPos.y))
				}
				Lens.update(Lens.settings.loop.elapsedMS, Lens.settings.loop.deltaTime);
				Lens.settings.loop.lastTime = now;
			}
		});
		
		VYLO.Client.attachCamera = function(pSettings) {
			Lens.settings.zoom.currentLevel.x = this.mapView.scale.x;
			Lens.settings.zoom.currentLevel.y = this.mapView.scale.y;
			Lens.assignIconSize(this.mob);
			Lens.following = this.mob;
			Lens.setPos(this.mob.getTrueCenterPos().x, this.mob.getTrueCenterPos().y, this.mob.mapName);
			Lens.oldPos.x = Lens.xPos;
			Lens.oldPos.y = Lens.yPos;
			Lens.attached = true;

			if (pSettings) {
				if (typeof(pSettings) === 'object' && pSettings.constructor === Object) {
					if (pSettings.duration) {
						if (typeof(pSettings.duration) === 'object' && pSettings.duration.constructor === Object) {
							if (typeof(pSettings.duration.x) === 'number' && typeof(pSettings.duration.y) === 'number') {
								Lens.settings.custom.duration.x = pSettings.duration.x;
								Lens.settings.custom.duration.y = pSettings.duration.y;
							} else {
								Lens.settings.custom.duration.x = Lens.settings.custom.duration.y = 1000;
								if (this.debugging) {
									console.warn('Lens: Invalid variable type passed for the %cpSettings.duration.x || pSettings.duration.y', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.duration === 'number')) {
							Lens.settings.custom.duration.x = Lens.settings.custom.duration.y = pSettings.duration;
						} else {
							Lens.settings.custom.duration.x = Lens.settings.custom.duration.y = 1000;
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.duration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						Lens.settings.custom.duration.x = Lens.settings.custom.duration.y = 1000;
						if (this.debugging) {
							console.warn('Lens: No %cpSettings.duration', 'font-weight: bold', 'parameter passed. Reverted to default');
						}
					}

					if (pSettings.ease) {
						if (typeof(pSettings.ease) === 'object' && pSettings.ease.constructor === Object) {
							if (typeof(pSettings.ease.x) === 'string' && typeof(pSettings.ease.y) === 'string') {
								if (validEase.includes(pSettings.ease.x) && validEase.includes(pSettings.ease.y)) {
									Lens.settings.custom.ease.x = pSettings.ease.x;
									Lens.settings.custom.ease.y = pSettings.ease.y;
								} else {
									Lens.settings.custom.ease.x = Lens.settings.custom.ease.y = 'easeOutCubic';
									if (this.debugging) {
										console.warn('Lens: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
									}
								}
							} else {
								Lens.settings.custom.ease.x = Lens.settings.custom.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('Lens: Invalid variable type passed for the %cpSettings.ease.x || pSettings.ease.y', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.ease === 'string')) {
							if (validEase.includes(pSettings.ease)) {
								Lens.settings.custom.ease.x = Lens.settings.custom.ease.y = pSettings.ease;
							} else {
								Lens.settings.custom.ease.x = Lens.settings.custom.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('Lens: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease. Reverted to default');
								}
							}
						} else {
							Lens.settings.custom.ease.x = Lens.settings.custom.ease.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.ease', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						Lens.settings.custom.ease.x = Lens.settings.custom.ease.y = 'easeOutCubic';
						if (this.debugging) {
							console.warn('Lens: No %cpSettings.ease', 'font-weight: bold', 'parameter passed. Reverted to default');
						}		
					}

					Lens.reset('standard');
					Lens.custom = true;
					this.following = this.mob;
					Lens.settings.custom.initialPos.x = Lens.xPos;
					Lens.settings.custom.initialPos.y = Lens.yPos;
				} else {
					Lens.reset('custom');
					Lens.custom = false;
					Lens.following = this.mob;
					Lens.settings.standard.initialPos.x = Lens.xPos;
					Lens.settings.standard.initialPos.y = Lens.yPos;
					if (this.debugging) {
						console.warn('Lens: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Reverted to default');
					}
				}
			} else {
				Lens.reset('custom');
				Lens.custom = false;
				Lens.following = this.mob;
				Lens.settings.standard.initialPos.x = Lens.xPos;
				Lens.settings.standard.initialPos.y = Lens.yPos;
			}
			
			Lens.oldFollowingPos = { 'x': Lens.following.xPos + Lens.following.xIconOffset, 'y': Lens.following.yPos + Lens.following.yIconOffset }
			this.setViewEye(Lens);
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
		const Lens = VYLO.newDiob();

		Lens.atlasName = '';
		Lens.width = 1;
		Lens.height = 1;
		Lens.color = { 'tint': 0xFF69B4 };
		Lens.mouseOpacity = 0;
		Lens.touchOpacity = 0;
		Lens.density = 0;
		Lens.plane = 1;
		Lens.layer = MAX_PLANE;
		Lens.invisibility = MAX_PLANE;
		// set when the player gives the camera settings to follow
		Lens.custom = false;
		 // who owns this camera
		Lens.owner = VYLO.Client;
		Lens.following = null;
		// // debugging is whether this library is in debug mode. Extra warnings will be thrown in this mode to help explain any issues that may arise. if the camera is currently being debugged, (shows icon info for the camera)
		Lens.debugging = false;
		Lens.preventScreenRelayer = true;
		Lens.preventInterpolation = true;
		Lens.ONE = 1;
		Lens.TWO = 2;
		Lens.THREE = 3;
		Lens.FOUR = 4;
		Lens.FIVE = 5;
		Lens.SIX = 6;
		Lens.oldPos = { 'x': 0, 'y': 0 };
		Lens.oldFollowingPos = { 'x': 0, 'y': 0 };
		Lens.settings = {
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
				'time': { 'x': 0, 'y': 0, 'z': 0 }, // the current time in the ease
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

		Lens.decimalRand = function(pNum, pNum2, pPlaces=1) {
			const result = Number((Math.random() * (pNum - pNum2) + pNum2).toFixed(pPlaces));
			return (result >= 1 ? Math.floor(result) : result);
		}

		Lens.assignIconSize = function(pDiob) {
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
				const iconSize = VYLO.Icon.getIconSize(pDiob.atlasName, pDiob.iconName);
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
				VYLO.Resource.loadResource('icon', pDiob.atlasName, setIconSize.bind(this));
			} else {
				console.warn('Lens: No %cpDiob.atlasName', 'font-weight: bold', 'to load.');
			}
		}

		Lens.reset = function(pMethod) {
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
					VYLO.Client.setViewEyeOffsets(0, VYLO.Client.getViewEyeOffsets().y)
					break;

				case 'shakeY':
					this.settings.shake.time.y = 0;
					this.settings.shake.active.y = false;
					VYLO.Client.setViewEyeOffsets(VYLO.Client.getViewEyeOffsets().x, 0)
					break;

				case 'shake':
					this.settings.shake.callback = null;
					this.settings.shake.rotational = false;
					// this.settings.shake.concurrentShaking = ;

					this.settings.shake.time.x = this.settings.shake.time.y = 0;
					this.settings.shake.active.x = this.settings.shake.active.y = false;
					this.settings.shake.duration.x = this.settings.shake.duration.y = 0;
					this.settings.shake.intensity.x = this.settings.shake.intensity.y = 0;
					VYLO.Client.setViewEyeOffsets(0, 0)
					VYLO.Client.mapView.angle = 0;
					VYLO.Client.setMapView(VYLO.Client.mapView);
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

		Lens.zoomUpdate = function(pElapsedMS, pDeltaTime) {
			if (this.settings.zoom.active.x) {
				this.settings.zoom.time.x = Math.min(this.settings.zoom.time.x + pElapsedMS, this.settings.zoom.duration.x);
				this.settings.zoom.currentLevel.x = Ease[this.settings.zoom.ease.x](this.settings.zoom.time.x, this.settings.zoom.initialLevel.x, this.settings.zoom.differenceLevel.x, this.settings.zoom.duration.x);
				const stepSizeX = ((this.settings.zoom.currentLevel.x - VYLO.Client.mapView.scale.x));
				VYLO.Client.mapView.scale.x += stepSizeX;
			}

			if (this.settings.zoom.active.y) {
				this.settings.zoom.time.y = Math.min(this.settings.zoom.time.y + pElapsedMS, this.settings.zoom.duration.y);
				this.settings.zoom.currentLevel.y = Ease[this.settings.zoom.ease.y](this.settings.zoom.time.y, this.settings.zoom.initialLevel.y, this.settings.zoom.differenceLevel.y, this.settings.zoom.duration.y);
				const stepSizeY = ((this.settings.zoom.currentLevel.y - VYLO.Client.mapView.scale.y));
				VYLO.Client.mapView.scale.y += stepSizeY;
			}

			VYLO.Client.setMapView(VYLO.Client.mapView);

			if (this.settings.zoom.time.x === this.settings.zoom.duration.x) {
				this.reset('zoomX');
			}

			if (this.settings.zoom.time.y === this.settings.zoom.duration.y) {
				this.reset('zoomY');
			}

			if (!this.settings.zoom.active.x && !this.settings.zoom.active.y) {
				this.onZoomEnd();
			}
		}

		Lens.shakeUpdate = function(pElapsedMS, pDeltaTime) {
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

				angle = this.decimalRand(-this.decimalRand(seed, seed2) / 200, this.decimalRand(seed, seed2) / 200);
				VYLO.Client.mapView.angle = angle;
				VYLO.Client.setMapView(VYLO.Client.mapView);
			}

			if (this.settings.shake.active.x) {
				const seed = this.settings.shake.intensity.x;
				const seed2 = seed*0.5;
				xForce = this.decimalRand(-this.decimalRand(seed, seed2), this.decimalRand(seed, seed2));
				this.settings.shake.time.x = Math.min(this.settings.shake.time.x + pElapsedMS, this.settings.shake.duration.x);
			}

			if (this.settings.shake.active.y) {
				const seed = this.settings.shake.intensity.y;
				const seed2 = seed*0.5;
				yForce = this.decimalRand(-this.decimalRand(seed, seed2), this.decimalRand(seed, seed2));
				this.settings.shake.time.y = Math.min(this.settings.shake.time.y + pElapsedMS, this.settings.shake.duration.y);
			}

			VYLO.Client.setViewEyeOffsets(xForce ? xForce : 0, yForce ? yForce : 0);

			if (this.settings.shake.time.x === this.settings.shake.duration.x) {
				this.reset('shakeX');
			}

			if (this.settings.shake.time.y === this.settings.shake.duration.y) {
				this.reset('shakeY');
			}

			if (!this.settings.shake.active.x && !this.settings.shake.active.y) {
				this.onShakeEnd();
			}
		}

		Lens.pan = function(pSettings) {
			if (this.settings.panning && !this.settings.pan.returning) {
				console.error('Lens: You are already %cpanning', 'font-weight: bold', '. Pan failed');
				return;
			}
			if (this.settings.spectating) {
				console.error('Lens: You are %cspectating', 'font-weight: bold', 'and cannot pan right now. Pan failed');
				return;
			}
			if (typeof(pSettings) === 'object' && pSettings.constructor === Object) {
				const settingsProps = Object.keys(pSettings);
				if (settingsProps.includes('target')) {
					// target
					// Check if its a diob
					if (typeof(pSettings.target) === 'object' && pSettings.target.baseType) {
						if (typeof(pSettings.target.xPos) === 'number' && typeof(pSettings.target.yPos) === 'number' && typeof(pSettings.target.mapName) === 'string') {
							if (pSettings.target === this.following) {
								console.error('Lens: You %ccannot', 'font-weight: bold', 'pan to yourself. Pan failed');
								return
							}
							this.assignIconSize(pSettings.target);
							this.settings.pan.target = pSettings.target;
						} else {
							console.error('Lens: Invalid variable type passed for the %cpSettings.target.xPos || pSettings.target.yPos || *pSettings.target.mapName', 'font-weight: bold', 'parameter. Pan failed');
							return
						}
					} else {
						console.error('Lens: Invalid variable type passed for the %cpSettings.target', 'font-weight: bold', 'property. Pan failed');
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
										console.warn('Lens: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
									}
								}
							} else {
								this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('Lens: Invalid variable type passed for the %cpSettings.ease.x || pSettings.ease.y', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.ease) === 'string') {
							if (validEase.includes(pSettings.ease)) {
								this.settings.pan.ease.x = this.settings.pan.ease.y = pSettings.ease;
							} else {
								this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('Lens: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
								}
							}
						} else {
							this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.ease', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('Lens: No %cease', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
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
										console.warn('Lens: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.finalEase.x || pSettings.finalEase.y. Reverted to default');
									}
								}
							} else {
								this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('Lens: Invalid variable type passed for the %cpSettings.finalEase.x || pSettings.finalEase.y', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.finalEase) === 'string') {
							if (validEase.includes(pSettings.finalEase)) {
								this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = pSettings.finalEase;
							} else {
								this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('Lens: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.finalEase.x || pSettings.finalEase.y. Reverted to default');
								}
							}
						} else {
							this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.finalEase', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.finalEase.x = this.settings.pan.finalEase.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('Lens: No %cfinalEase', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
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
									console.warn('Lens: Invalid variable type passed for the %cpSettings.duration.x || pSettings.duration.y', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.duration) === 'number') {
								this.settings.pan.duration.x = this.settings.pan.duration.y = pSettings.duration;
						} else {
							this.settings.pan.duration.x = this.settings.pan.duration.y = 2000;
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.duration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.duration.x = this.settings.pan.duration.y = 2000;
							if (this.debugging) {
								console.warn('Lens: No %cduration', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
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
									console.warn('Lens: Invalid variable type passed for the %cpSettings.finalDuration.x || pSettings.finalDuration.y', 'font-weight: bold', 'parameter. Reverted to default');
								}
							}
						} else if (typeof(pSettings.finalDuration) === 'number') {
								this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = pSettings.finalDuration;
						} else {
							this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = 2000;
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.finalDuration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
							this.settings.pan.finalDuration.x = this.settings.pan.finalDuration.y = 2000;
							if (this.debugging) {
								console.warn('Lens: No %cfinalDuration', 'font-weight: bold', 'property included inside of the pSettings parameter. Reverted to default');
							}
					}

					// pauseDuration
					if (pSettings.pauseDuration) {
						if (typeof(pSettings.pauseDuration) === 'number') {
							this.settings.pan.pauseDuration = pSettings.pauseDuration;
						} else {
							this.settings.pan.pauseDuration = 0;
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.pauseDuration', 'font-weight: bold', 'property. Reverted to default');
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
						VYLO.Client.toggleMacroCapture(false);
						this.settings.pan.storedDir = this.following.dir;
						this.following.dir = VYLO.Map.getDir(this.following, this.settings.pan.target);
					}
					// pannedCallback
					if (pSettings.pannedCallback) {
						if (typeof(pSettings.pannedCallback) === 'function') {
							this.settings.pan.pannedCallback = pSettings.pannedCallback;
						} else {
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.pannedCallback', 'font-weight: bold', 'property.');
							}
						}
					}

					// finalCallback
					if (pSettings.finalCallback) {
						if (typeof(pSettings.finalCallback) === 'function') {
							this.settings.pan.finalCallback = pSettings.finalCallback;
						} else {
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.finalCallback', 'font-weight: bold', 'property.');
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
					console.error('Lens: No %ctarget', 'font-weight: bold', 'property included inside of the pSettings parameter. Pan failed');
				}

			} else {
				console.error('Lens: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Pan failed');
			}
			this.settings.panning = true;
			this.isPanning = true;
		}

		Lens.onPanned = function() {
			if (this.settings.pan.pannedCallback) {
				this.settings.pan.pannedCallback();
				this.settings.pan.pannedCallback = null;
			}
			if (this.settings.pan.attach) {
				if (this.settings.pan.target && typeof(this.settings.pan.target) === 'object') {
					// Check if its a diob
					if (this.settings.pan.target.baseType) {
						VYLO.Client.toggleMacroCapture(true);
						this.following = this.settings.pan.target;
						this.reset('pan');
					} else {
						if (this.debugging) {
							console.warn('Lens: Cannot attach to a non %cdiob', 'font-weight: bold', 'type. Attachment failed');
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

		Lens.onPanFinish = function() {
			if (this.settings.pan.forceDirChange) {
				this.following.dir = this.settings.pan.storedDir;
			}
			this.reset('pan');
			// allow players to move again
			VYLO.Client.toggleMacroCapture(true);
			if (this.settings.pan.returnCallback) {
				this.settings.pan.returnCallback();
				this.settings.pan.returnCallback = null;
			}
		}

		Lens.follow = function(pMethod, pElapsedMS, pDeltaTime) {
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
				this.settings[pMethod].time.x = Math.min(this.settings[pMethod].time.x + pElapsedMS, this.settings[pMethod].duration.x);
				distanceX = this.settings[pMethod].destination.x - this.settings[pMethod].initialPos.x;
				const xPos = Ease[this.settings[pMethod].ease.x](this.settings[pMethod].time.x, this.settings[pMethod].initialPos.x, distanceX, this.settings[pMethod].duration.x);
				stepSizeX = (xPos - this.xPos);
				this.xPos += stepSizeX;
			}

			if (this.settings[pMethod].active.y) {
				this.settings[pMethod].time.y = Math.min(this.settings[pMethod].time.y + pElapsedMS, this.settings[pMethod].duration.y);
				distanceY = this.settings[pMethod].destination.y - this.settings[pMethod].initialPos.y;
				const yPos = Ease[this.settings[pMethod].ease.y](this.settings[pMethod].time.y, this.settings[pMethod].initialPos.y, distanceY, this.settings[pMethod].duration.y);
				stepSizeY = (yPos - this.yPos);
				this.yPos += stepSizeY;
			}

			this.mapName = target.mapName;

			// if (isNaN(this.xPos)) {
			// 	this.xPos = target.getTrueCenterPos().x;
			// }

			// if (isNaN(this.yPos)) {
			// 	this.yPos = target.getTrueCenterPos().y;
			// } 

			if (this.settings[pMethod].time.x === this.settings[pMethod].duration.x) {
				this.xPos = target.getTrueCenterPos().x;
				if (pMethod === 'pan') {
					this.reset('panX');
				} else if (pMethod === 'standard') {
					this.reset('standardX');
				} else if (pMethod === 'custom') {
					this.reset('customX');
				}
			}

			if (this.settings[pMethod].time.y === this.settings[pMethod].duration.y) {
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

		Lens.update = function(pElapsedMS, pDeltaTime) {
			// zoom
			if (this.settings.zoom.active.x || this.settings.zoom.active.y) {
				this.zoomUpdate(pElapsedMS, pDeltaTime);
			}

			// scroll
			// if (this.settings.scroll.active) {
			// 	// this.settings.scrolling = true;
			// }
			
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

		Lens.zoom = function(pDestinationLevel={'x': 1, 'y': 1}, pDuration={'x': 1000, 'y': 1000}, pEase={'x': 'easeOutCirc', 'y': 'easeOutCirc'}, pCallback) {
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
							console.warn('Lens: Invalid variable type passed for the %cpDestinationLevel', 'font-weight: bold', 'parameter. Reverted to default');
						}							
					}
				} else {
					if (typeof(pDestinationLevel.x) === 'number' && typeof(pDestinationLevel.y) === 'number') {
						dx = pDestinationLevel.x;
						dy = pDestinationLevel.y;
					} else {
						dx = dy = 1;
						if (this.debugging) {
							console.warn('Lens: Invalid variable type passed for the %cpDestinationLevel.x || pDestinationLevel.y', 'font-weight: bold', 'parameter. Reverted to default');
						}		
					}
				}
			} else {
				dx = dy = 1;
				if (this.debugging) {
					console.warn('Lens: No %cpDestinationLevel', 'font-weight: bold', 'parameter passed. Reverted to default');
				}	
			}

			if (this.settings.zoom.destinationLevel.x !== dx) {
				if (this.settings.zoom.active.x) {
					this.reset('zoomX');
				}
				this.settings.zoom.active.x = true;
				this.settings.zoom.destinationLevel.x = dx;
				this.settings.zoom.initialLevel.x = VYLO.Client.mapView.scale.x;
				this.settings.zoom.differenceLevel.x = Math.round((this.settings.zoom.destinationLevel.x - this.settings.zoom.initialLevel.x) * 10) / 10;
			}

			if (this.settings.zoom.destinationLevel.y !== dy) {
				if (this.settings.zoom.active.y) {
					this.reset('zoomY');
				}
				this.settings.zoom.active.y = true;
				this.settings.zoom.destinationLevel.y = dy;
				this.settings.zoom.initialLevel.y = VYLO.Client.mapView.scale.y;
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
							console.warn('Lens: Invalid variable type passed for the %cpDuration', 'font-weight: bold', 'parameter. Reverted to default');
						}
					}
				} else {
					if (typeof(pDuration) === 'object') {
						if (typeof(pDuration.x) === 'number' && typeof(pDuration.y) === 'number') {
							this.settings.zoom.duration = pDuration;
						} else {
							this.settings.zoom.duration.x = this.settings.zoom.duration.y = 1000;
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpDuration.x || pDuration.y', 'font-weight: bold', 'parameter. Reverted to default');
							}
						}
					}
				}
			} else {
				this.settings.zoom.duration.x = this.settings.zoom.duration.y = 1000;
				if (this.debugging) {
					console.warn('Lens: No %cpDuration', 'font-weight: bold', 'parameter passed. Reverted to default');
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
								console.warn('Lens: Invalid %cpEase', 'font-weight: bold', 'name passed. Reverted to default');
							}
						}
					} else {
						this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
						if (this.debugging) {
							console.warn('Lens: Invalid variable type passed for the %cpEase', 'font-weight: bold', 'parameter. Reverted to default');
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
									console.warn('Lens: Invalid %cpEase', 'font-weight: bold', 'name passed for pEase.x || pEase.y. Reverted to default');
								}
							}
							
						} else {
							this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpEase.x || pEase.y', 'font-weight: bold', 'parameter. Reverted to default');
							}
						}
					}				
				}
			} else {
				this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
				if (this.debugging) {
					console.warn('Lens: No %cpEase', 'font-weight: bold', 'parameter passed. Reverted to default');
				}		
			}

			// callback
			if (pCallback) {
				if (typeof(pCallback) === 'function') {
					this.settings.zoom.callback = pCallback;
				} else {
					if (this.debugging) {
						console.warn('Lens: Invalid variable type passed for the %pCallback', 'font-weight: bold', 'property.');
					}
				}
			}
			this.settings.zooming = true;
			this.isZooming = true;
		}

		Lens.onZoomEnd = function() {
			if (this.settings.zoom.callback) {
				this.settings.zoom.callback();
			}
			VYLO.Client.mapView.scale.x = Math.round(this.settings.zoom.destinationLevel.x * 10) / 10;
			VYLO.Client.mapView.scale.y = Math.round(this.settings.zoom.destinationLevel.y * 10) / 10;
			VYLO.Client.setMapView(VYLO.Client.mapView);
			this.reset('zoom');
		}

		Lens.setSettings = function(pSettings) {
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
									console.warn('Lens: Invalid variable type passed for the %cpSettings.duration.x || pSettings.duration.y', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.duration === 'number')) {
							this.settings.custom.duration.x = this.settings.custom.duration.y = pSettings.duration;
						} else {
							this.settings.custom.duration.x = this.settings.custom.duration.y = 1000;
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.duration', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						this.settings.custom.duration.x = this.settings.custom.duration.y = 1000;
						if (this.debugging) {
							console.warn('Lens: No %cpSettings.duration', 'font-weight: bold', 'parameter passed. Reverted to default');
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
										console.warn('Lens: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
									}
								}
							} else {
								this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('Lens: Invalid variable type passed for the %cpSettings.ease.x || pSettings.ease.y', 'font-weight: bold', 'property. Reverted to default');
								}
							}
						} else if (typeof(pSettings.ease === 'string')) {
							if (validEase.includes(pSettings.ease)) {
								this.settings.custom.ease.x = this.settings.custom.ease.y = pSettings.ease;
							} else {
								this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
								if (this.debugging) {
									console.warn('Lens: Invalid %cease', 'font-weight: bold', 'name passed for pSettings.ease. Reverted to default');
								}
							}
						} else {
							this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
							if (this.debugging) {
								console.warn('Lens: Invalid variable type passed for the %cpSettings.ease', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
						if (this.debugging) {
							console.warn('Lens: No %cpSettings.ease', 'font-weight: bold', 'parameter passed. Reverted to default');
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
						console.warn('Lens: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Reverted to default');
					}
				}
			} else {
				this.reset('custom');
				this.custom = false;
				this.settings.standard.initialPos.x = this.xPos;
				this.settings.standard.initialPos.y = this.yPos;
				if (this.debugging) {
					console.warn('Lens: No %cpSettings', 'font-weight: bold', 'parameter passed. Reverted to default');
				}
			}
		}

		Lens.spectate = function(pSettings) {
			if (this.settings.panning) {
				console.error('Lens: Cannot spectate camera is currently %cpanning', 'font-weight: bold', '. Spectate failed');
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
							if (VYLO.Client.___EVITCA_aBlip) {
								// when you start spectating there should be no blips at all so they should be all hidden
								VYLO.Client.aBlip.destroyAllBlips();
							}

							// prevents player from moving while spectating
							if (pSettings.preventMovement) {
								this.settings.spectate.preventMovement = pSettings.preventMovement;
								VYLO.Client.toggleMacroCapture(false);
							}
							// doesn't ease to the spectatee
							if (pSettings.forcePos) {
								this.settings.spectate.forcePos = pSettings.forcePos;
								this.setPos(pSettings.target.getTrueCenterPos().x, pSettings.target.getTrueCenterPos().y, pSettings.target.mapName);
							} else {
								// if the distance is too far, then just force the position
								if (VYLO.Map.getDist(this.following, pSettings.target) > 1000) {
									this.settings.spectate.forcePos = true;
									this.setPos(pSettings.target.getTrueCenterPos().x, pSettings.target.getTrueCenterPos().y, pSettings.target.mapName);							
								}
							}
							if (!this.settings.spectate.player) {
								this.settings.spectate.player = this.following;
							}
							this.following = pSettings.target;
						} else {
							console.error('Lens: Invalid variable type passed for the %cpSettings.target.xPos || pSettings.target.yPos || pSettings.target.mapName', 'font-weight: bold', 'property. Spectate failed');
							return;
						}
					}
				} else {
					console.error('Lens: Invalid variable type passed for the %cpSettings', 'font-weight: bold', 'parameter. Spectate failed');
					return;
				}
			} else {
				console.error('Lens: No %cpSettings', 'font-weight: bold', 'parameter passed. Spectate failed');
				return
			}
			this.settings.spectating = true;
			this.isSpectating = true;
		}

		Lens.cancelSpectate = function() {
			if (this.settings.spectate.forcePos) {
				this.setPos(this.settings.spectate.player.getTrueCenterPos().x, this.settings.spectate.player.getTrueCenterPos().y, this.settings.spectate.player.mapName);
			}
			this.following = this.settings.spectate.player;
			if (this.settings.spectate.preventMovement) {
				VYLO.Client.toggleMacroCapture(true);
			}
			if (typeof(VYLO.Client.onSpectateEnd) === 'function') VYLO.Client.onSpectateEnd();
			this.reset('spectate');
		}

		Lens.detach = function() {
			if (!this.attached) {
				console.error('Lens: Lens is already %cdetached!', 'font-weight: bold');
				return;
			}

			this.reset('spectate');
			this.following = VYLO.Client.mob;
			this.setSettings();
			this.attached = false;
			this.setLoc();
			VYLO.Client.setViewEye(this.following);
		}

		Lens.attach = function(pDiob) {
			if (typeof(pDiob) === 'object') {
				const protoDiob = VYLO.newDiob();
				if (pDiob.constructor !== protoDiob.__proto__.constructor) {
					console.error('Lens: Nothing to %cattach', 'font-weight: bold', 'to. Attachment failed');
					return;
				}
			}
			if (this.attached) {
				console.warn('Lens: Lens is already %cattached!', 'font-weight: bold');
			}
			this.assignIconSize(pDiob);
			this.following = pDiob;
			this.oldPos.x = this.following.xPos;
			this.oldPos.y = this.following.yPos;
			this.setPos(this.following.getTrueCenterPos().x, this.following.getTrueCenterPos().y, this.following.mapName);
			this.attached = true;
			VYLO.Client.setViewEye(this);
		}

		Lens.shake = function(pIntensity, pDuration, pRotational=false, pCallback) {
			const intensityValue = { 'x': 1, 'y': 1 };
			const durationValue = { 'x': 1000, 'y': 1000 };
			if (pIntensity) {
				if (typeof(pIntensity) === 'object' && pIntensity.constructor === Object) {
					if (pIntensity.x || pIntensity.x === 0) {
						if (typeof(pIntensity.x) === 'number') {
							intensityValue.x = Math.clamp(pIntensity.x, 0, MAX_CAMERA_SHAKE_FORCE);
						} else {
							if (this.debugging) {
								console.warn('Lens: Invalid variable type for %cpIntensity.x', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						if (this.debugging) {
							console.warn('Lens: No %cpIntensity.x', 'font-weight: bold', 'property value passed. Reverted to default');
						}
					}

					if (pIntensity.y || pIntensity.y === 0) {
						if (typeof(pIntensity.y) === 'number') {
							intensityValue.y = Math.clamp(pIntensity.y, 0, MAX_CAMERA_SHAKE_FORCE);
						} else {
							if (this.debugging) {
								console.warn('Lens: Invalid variable type for %cpIntensity.y', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						if (this.debugging) {
							console.warn('Lens: No %cpIntensity.y', 'font-weight: bold', 'property value passed. Reverted to default');
						}
					}

				} else if (typeof(pIntensity) === 'number') {
					intensityValue.x = intensityValue.y = Math.clamp(pIntensity, 0, MAX_CAMERA_SHAKE_FORCE);
				} else {
					if (this.debugging) {
						console.warn('Lens: Invalid variable type for %cpIntensity', 'font-weight: bold', 'parameter passed. Reverted to default');
					}
				}

			} else {
				if (this.debugging) {
					console.warn('Lens: No %cpIntensity', 'font-weight: bold', 'parameter passed. Reverted to default');
				}
			}

			if (pDuration) {
				if (typeof(pDuration) === 'object' && pDuration.constructor === Object) {
					if (pDuration.x || pDuration.x === 0) {
						if (typeof(pDuration.x) === 'number') {
							durationValue.x = pDuration.x;
						} else {
							if (this.debugging) {
								console.warn('Lens: Invalid variable type for %cpDuration.x', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						if (this.debugging) {
							console.warn('Lens: No %cpDuration.x', 'font-weight: bold', 'property value passed. Reverted to default');
						}
					}

					if (pDuration.y || pDuration.y === 0) {
						if (typeof(pDuration.y) === 'number') {
							durationValue.y = pDuration.y;
						} else {
							if (this.debugging) {
								console.warn('Lens: Invalid variable type for %cpDuration.y', 'font-weight: bold', 'property. Reverted to default');
							}
						}
					} else {
						if (this.debugging) {
							console.warn('Lens: No %cpDuration.y', 'font-weight: bold', 'property value passed. Reverted to default');
						}
					}
				} else if (typeof(pDuration) === 'number') {
					durationValue.x = durationValue.y = pDuration;
				} else {
					if (this.debugging) {
						console.warn('Lens: Invalid variable type passed for the %cpDuration.x || pDuration.y', 'font-weight: bold', 'property. Reverted to default');
					}
				}
				
			} else {
				if (this.debugging) {
					console.warn('Lens: No %cpDuration ', 'font-weight: bold', 'parameter passed. Reverted to default');
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
						console.warn('Lens: Invalid variable type passed for the %cpCallback', 'font-weight: bold', 'property.');
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

		Lens.onShakeEnd = function() {
			if (this.settings.shake.callback) {
				this.settings.shake.callback();
				VYLO.Client.setViewEyeOffsets(0, 0);
			}
			this.reset('shake');
		}

		Lens.toggleDebug = function() {
			this.debugging = (this.debugging ? false : true);
			this.invisibility = (this.debugging ? 0 : 999999);
		}

		Lens.destroy = function() {
			this.init = false;
			this.attached = false;
			this.reset('spectate');
			this.setSettings();
			this.setLoc();
			VYLO.Client.setViewEye(VYLO.Client.mob);
		}

		assignCamera(Lens);
	}
}
)();
