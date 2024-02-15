import { Tween } from './vendor/tween.min.mjs';
import { Pulse } from './vendor/pulse.min.mjs';
import { Utils } from './vendor/utils.min.mjs';
import { Logger } from './vendor/logger.min.mjs';

/**
* A powerful plugin that will allow you to attach a camera to your player and use its rich API for some cool effects.
* @class Lens
* @license Lens is free software, available under the terms of a MIT style License.
* @author https://github.com/doubleactii
*/
class LensComponent {
	/**
	 * The max display a diob can be displayed at.
	 * @private
	 * @type {number}
	 */
	static MAX_DISPLAY = 999999;
	/**
	 * The max force the camera can shake at.
	 * @private
	 * @type {number}
	 */
	static MAX_CAMERA_SHAKE_FORCE = 100;
	/**
	 * The version of the module.
	 */
	version = "VERSION_REPLACE_ME";
	/**
	 * Shorthand for zooming to 1 scale
	 * @type {number}
	 */
	ONE = 1;
	/**
	 * Shorthand for zooming to 2 scale
	 * @type {number}
	 */
	TWO = 2;
	/**
	 * Shorthand for zooming to 3 scale
	 * @type {number}
	 */
	THREE = 3;
	/**
	 * Shorthand for zooming to 4 scale
	 * @type {number}
	 */
	FOUR = 4;
	/**
	 * Shorthand for zooming to 5 scale
	 * @type {number}
	 */
	FIVE = 5;
	/**
	 * Shorthand for zooming to 6 scale
	 * @type {number}
	 */
	SIX = 6;
	/**
	 * An array of valid ease names.
	 * @private
	 * @type {Array}
	 */
	static validEase = [
		'linear', 'easeInQuad', 'easeOutQuad', 'easeInOutQuad', 'easeInSine', 'easeOutSine', 'easeInOutSine', 'easeInExpo', 
		'easeOutExpo', 'easeInOutExpo', 'easeInCirc', 'easeOutCirc', 'easeInOutCirc', 'easeInCubic', 'easeOutCubic', 'easeInOutCubic', 
		'easeInQuart', 'easeOutQuart', 'easeInOutQuart','easeInQuint', 'easeOutQuint', 'easeInOutQuint', 'easeInElastic', 'easeOutElastic', 
		'easeInOutElastic', 'easeInBack', 'easeOutBack', 'easeInOutBack', 'easeInBounce', 'easeOutBounce', 'easeInOutBounce'
	];
	/**
	 * The camera that lens controls.
	 * @type {Object}
	 */
	camera = null;
	/** 
	 * Whether the camera has been created and is ready for use or not.
	 * @private
	 * @type {boolean}
	 */
	init = false;
	/**
	 * Whether the camera is attached to something and will follow it.
	 * @private
	 * @type {boolean}
	 */
	attached = false;
	/**
	 * If this camera is using custom settings currently.
	 * @private
	 * @type {boolean}
	 */
	custom = false;
	/**
	 * The current diob instance this camera is following.
	 * @private
	 * @type {Object}
	 */
	following = null;
	/**
	 * The old position that the camera was following in the last tick.
	 * @private
	 * @type {Object}
	 */
	oldFollowingPos = { 'x': 0, 'y': 0 };
	/**
	 * The settings this camera uses to operate.
	 * @private
	 * @type {Object}
	 */
	settings = {
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
			'panBackDuration': { 'x': 1000, 'y': 1000 }, // when the camera is panning back to whatever it panned from
			'panBackEase': { 'x': 'easeOutCubic', 'y': 'easeOutCubic' }, // the ease used to pan back
			'panToCallback': null, // when you reach the object, this callback is called.
			'panBackCallback': null // when the camera pans back to the initiator, this callback is called.
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
	/**
	 * Whether the camera is current moving or not.
	 * @private
	 * @type {boolean}
	 */
	currentlyMoving = false;
	/**
	 * Whether the camera is currently zooming or not.
	 * @private
	 * @type {boolean}
	 */
	currentlyZooming = false;
	/**
	 * Whether the camera is currently spectating.
	 * @private
	 * @type {boolean}
	 */
	currentlySpectating = false;
	/**
	 * Whether the camera is currently shaking.
	 * @private
	 * @type {boolean}
	 */
	currentlyShaking = false;
	/**
	 * Whether the camera is currently panning.
	 * @private
	 * @type {boolean}
	 */
	currentlyPanning = false;
	/**
	 * Weakmap to track data belonging to instances used in this module.
	 * @private
	 * @type {WeakMap}
	 */
	instanceWeakMap = new WeakMap();
    /**
     * Whether the mapview has been initialized.
     * @private
     * @type {boolean}
     */
	mapViewInit = false
	/**
	 * A callback to be called when the camera is updated.
	 * @param {number} - pDiffX - The difference in position between the camera's old x position and it's new position.
	 * @param {number} - pDiffY - The difference in position between the camera's old y position and it's new position.
	 */
	updateWithCamera;

	constructor() {
        /** The logger module this module uses to log errors / logs.
         * @private
         * @type {Object}
         */
        this.logger = new Logger();
        this.logger.registerType('Lens-Module', '#ff6600');

		Pulse.on(VYLO.Client, 'onScreenRender', (pT) => {
			if (this.init) {
				const now = pT;
				if (!this.settings.loop.lastTime) this.settings.loop.lastTime = now;
				const elapsedMS = (now - this.settings.loop.lastTime);
				let dt = elapsedMS / 1000;
				this.settings.loop.elapsedMS = elapsedMS;
				this.settings.loop.deltaTime = dt;
				this.update(this.settings.loop.elapsedMS, this.settings.loop.deltaTime);
				// Call callback to update with camera
				if (this.attached && this.updateWithCamera) {
					this.updateWithCamera(dt);
				}
				this.settings.loop.lastTime = now;
			}
		});
		// Init the camera
		this.initCamera();
	}
	/**
	 * Builds and initiates the camera and assigns some presets to it
	 * @private
	 */
	initCamera() {
		if (this.init) return;
		// Create the camera
		this.camera = VYLO.newDiob();
		// Assign some presets to the camera
		this.camera.owner = this;
		this.camera.atlasName = '';
		this.camera.width = 1;
		this.camera.height = 1;
		this.camera.tint = 0xFF69B4;
		// Remove all touch / mouse events
		this.camera.mouseOpacity = 0;
		this.camera.touchOpacity = 0;
		// Do not allow this diob to interact with the environment
		this.camera.density = false;
		this.camera.plane = LensComponent.MAX_DISPLAY;
		this.camera.layer = LensComponent.MAX_DISPLAY;
		this.camera.invisibility = LensComponent.MAX_DISPLAY;
		this.camera.preventScreenRelayer = true;
		this.camera.preventInterpolation = true;
		this.init = true;
	}
	/**
	 * Returns the true center position by using the x and y position and adding half of the icon's width / height.
	 * @private
	 * @param {Object} pInstance - The instance to get the true center position of.
	 * @returns {Object} Object containing the true center position of the instance.
	 */
	getTrueCenterPos(pInstance) {
		const instanceIconWidthHalf = pInstance.icon ? pInstance.icon.width / 2: 32;
		const instanceIconHeightHalf = pInstance.icon ? pInstance.icon.height / 2: 32;
		let centerObject = this.instanceWeakMap.get(pInstance);
		// If it can pull any data it means no data was ever set, so we need to set the data and then grab it
		if (!centerObject) {
			this.instanceWeakMap.set(pInstance, { 'x': 0, 'y': 0 });
			centerObject = this.instanceWeakMap.get(pInstance);
		}
		centerObject.x = pInstance.x + instanceIconWidthHalf;
		centerObject.y = pInstance.y + instanceIconHeightHalf;
		return centerObject;
	}
	/**
	 * Resets the camera based on the method passed.
	 * @private
	 * @param {string} pMethod - The method to reset.
	 */
	reset(pMethod) {
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
				this.currentlyZooming = false;
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
				this.settings.pan.panToCallback = null;
				this.settings.pan.panBackCallback = null;
				this.settings.pan.pauseDuration = 0;
				this.settings.pan.time.x = this.settings.pan.time.y = 0;
				this.settings.pan.initialPos.x = this.settings.pan.initialPos.y = null;
				this.settings.pan.panBackDuration.x = this.settings.pan.panBackDuration.y = null;
				this.settings.pan.ease.x = this.settings.pan.ease.y = null;
				this.settings.pan.panBackEase.x = this.settings.pan.panBackEase.y = null;
				this.settings.pan.active.x = this.settings.pan.active.y = false;
				this.settings.pan.duration.x = this.settings.pan.duration.y = null;
				this.settings.pan.destination.x = this.settings.pan.destination.y = null;
				this.settings.panning = false;
				this.currentlyPanning = false;
				break;

			case 'standardX':
				this.settings.standard.active.x = false;
				this.settings.standard.time.x = 0;
				this.settings.standard.initialPos.x = this.camera.x;
				break;

			case 'standardY':
				this.settings.standard.active.y = false;
				this.settings.standard.time.y = 0;
				this.settings.standard.initialPos.y = this.camera.y;
				break;

			case 'standard':
				this.settings.standard.active.x = this.settings.standard.active.y = false;
				this.settings.standard.time.x = this.settings.standard.time.y = 0;

				this.settings.standard.initialPos.x = this.camera.x;
				this.settings.standard.initialPos.y = this.camera.y;
				this.currentlyMoving = false;
				break;

			case 'customX':
				this.settings.custom.active.x = false;
				this.settings.custom.time.x = 0;
				this.settings.custom.initialPos.x = this.camera.x;
				break;

			case 'customY':
				this.settings.custom.active.y = false;
				this.settings.custom.time.y = 0;
				this.settings.custom.initialPos.y = this.camera.y;
				break;

			case 'custom':
				this.settings.custom.active.x = this.settings.custom.active.y = false;
				this.settings.custom.time.x = this.settings.custom.time.y = 0;

				this.settings.custom.initialPos.x = this.camera.x;
				this.settings.custom.initialPos.y = this.camera.y;
				this.currentlyMoving = false;
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
				this.currentlyShaking = false;
				break;

			case 'spectate':
				this.settings.spectate.player = null;
				this.settings.spectate.forcePos = false;
				this.settings.spectate.preventMovement = false;
				this.settings.spectating = false;
				this.currentlySpectating = false;
				break;
		}
	}
	/**
	 * The method to update the zoom when it is active.
	 * @private
	 * @param {number} pElapsedMS - The amount of ms that has passed since the last tick
	 * @param {number} pDeltaTime - The delta time
	 */
	zoomUpdate(pElapsedMS, pDeltaTime) {
		if (this.settings.zoom.active.x) {
			this.settings.zoom.time.x = Math.min(this.settings.zoom.time.x + pElapsedMS, this.settings.zoom.duration.x);
			this.settings.zoom.currentLevel.x = Tween[this.settings.zoom.ease.x](this.settings.zoom.time.x, this.settings.zoom.initialLevel.x, this.settings.zoom.differenceLevel.x, this.settings.zoom.duration.x);
			const stepSizeX = ((this.settings.zoom.currentLevel.x - VYLO.Client.mapView.scale.x));
			VYLO.Client.mapView.scale.x += stepSizeX;
		}

		if (this.settings.zoom.active.y) {
			this.settings.zoom.time.y = Math.min(this.settings.zoom.time.y + pElapsedMS, this.settings.zoom.duration.y);
			this.settings.zoom.currentLevel.y = Tween[this.settings.zoom.ease.y](this.settings.zoom.time.y, this.settings.zoom.initialLevel.y, this.settings.zoom.differenceLevel.y, this.settings.zoom.duration.y);
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
	/**
	 * The method to update shaking when it is active.
	 * @private
	 * @param {number} pElapsedMS - The amount of ms that has passed since the last tick
	 * @param {number} pDeltaTime - The delta time
	 */
	shakeUpdate(pElapsedMS, pDeltaTime) {
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

			angle = Utils.decimalRand(-Utils.decimalRand(seed, seed2) / 200, Utils.decimalRand(seed, seed2) / 200);
			VYLO.Client.mapView.angle = angle;
			VYLO.Client.setMapView(VYLO.Client.mapView);
		}

		if (this.settings.shake.active.x) {
			const seed = this.settings.shake.intensity.x;
			const seed2 = seed*0.5;
			xForce = Utils.decimalRand(-Utils.decimalRand(seed, seed2), Utils.decimalRand(seed, seed2));
			this.settings.shake.time.x = Math.min(this.settings.shake.time.x + pElapsedMS, this.settings.shake.duration.x);
		}

		if (this.settings.shake.active.y) {
			const seed = this.settings.shake.intensity.y;
			const seed2 = seed*0.5;
			yForce = Utils.decimalRand(-Utils.decimalRand(seed, seed2), Utils.decimalRand(seed, seed2));
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
	/**
	 * Pans the camera from one view to another view. This pan can be customized in both axis. This pan has callbacks and settings that allow further customization.
	 * @param {Object} pSettings - A Object holding settings that control this pan.
	 * @param {Object} pSettings.target - A Object holding settings that control this pan.
	 * @param {Object} pSettings.ease - A Object holding settings that control this pan.
	 * @param {string} pSettings.ease.x - A Object holding settings that control this pan.
	 * @param {string} pSettings.ease.y - A Object holding settings that control this pan.
	 * @param {Object} pSettings.panBackEase - A Object holding settings that control this pan.
	 * @param {string} pSettings.panBackEase.x - A Object holding settings that control this pan.
	 * @param {string} pSettings.panBackEase.y - A Object holding settings that control this pan.
	 * @param {Object} pSettings.duration - A Object holding settings that control this pan.
	 * @param {number} pSettings.duration.x - A Object holding settings that control this pan.
	 * @param {number} pSettings.duration.y - A Object holding settings that control this pan.
	 * @param {Object} pSettings.panBackDuration - A Object holding settings that control the duration of the pan.
	 * @param {number} pSettings.panBackDuration.x - The duration of the ease in the x dimension.
	 * @param {number} pSettings.panBackDuration.y - The duration of the ease in the y dimension.
	 * @param {number} pSettings.pauseDuration - How long the camera will stay at the target after panning to it before completing the pan.
	 * @param {boolean} pSettings.attach - Whether or not to attach the camera to the target when the pan to it is completed. This automatically forfeits the panBack nature of this and no panBack callback will be called.
	 * @param {boolean} pSettings.forceDirChange - Whether panning to a target changes your direction to face the target.
	 * @param {Function} pSettings.panToCallback - Callback function to be called when the pan to the target is completed.
	 * @param {Function} pSettings.panBackCallback - Callback function to be called when the pan from the target back to the camera's target is completed.
	 */
	pan(pSettings) {
		if (this.settings.panning && !this.settings.pan.returning) {
			this.logger.prefix('Lens-Module').error('You are already panning. Pan failed');
			return;
		}
		if (this.settings.spectating) {
			this.logger.prefix('Lens-Module').error('You are spectating and cannot pan right now. Pan failed');
			return;
		}
		if (typeof(pSettings) === 'object' && pSettings.constructor === Object) {
			const settingsProps = Object.keys(pSettings);
			if (settingsProps.includes('target')) {
				// target
				// Check if its a diob
				if (typeof(pSettings.target) === 'object' && pSettings.target.baseType) {
					if (typeof(pSettings.target.x) === 'number' && typeof(pSettings.target.y) === 'number' && typeof(pSettings.target.mapName) === 'string') {
						if (pSettings.target === this.following) {
							this.logger.prefix('Lens-Module').error('You cannot pan to yourself. Pan failed');
							return
						}
						this.settings.pan.target = pSettings.target;
					} else {
						this.logger.prefix('Lens-Module').error('Invalid variable type passed for the pSettings.target.x || pSettings.target.y || *pSettings.target.mapName parameter. Pan failed');
						return
					}
				} else {
					this.logger.prefix('Lens-Module').error('Invalid variable type passed for the pSettings.target property. Pan failed');
					return;
				}

				// ease
				if (pSettings.ease) {
					if (typeof(pSettings.ease) === 'object' && pSettings.ease.constructor === Object) {
						if (typeof(pSettings.ease.x) === 'string' && typeof(pSettings.ease.y) === 'string') {
							if (LensComponent.validEase.includes(pSettings.ease.x) && LensComponent.validEase.includes(pSettings.ease.y)) {
								this.settings.pan.ease.x = pSettings.ease.x;
								this.settings.pan.ease.y = pSettings.ease.y;
							} else {
								this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
								this.logger.prefix('Lens-Module').warn('Invalid ease name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
							}
						} else {
							this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
							this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.ease.x || pSettings.ease.y parameter. Reverted to default');
						}
					} else if (typeof(pSettings.ease) === 'string') {
						if (LensComponent.validEase.includes(pSettings.ease)) {
							this.settings.pan.ease.x = this.settings.pan.ease.y = pSettings.ease;
						} else {
							this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
							this.logger.prefix('Lens-Module').warn('Invalid ease name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
						}
					} else {
						this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
						this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.ease property. Reverted to default');
					}
				} else {
						this.settings.pan.ease.x = this.settings.pan.ease.y = 'easeOutCubic';
						this.logger.prefix('Lens-Module').warn('No ease property included inside of the pSettings parameter. Reverted to default');
				}

				// panBackEase
				if (pSettings.panBackEase) {
					if (typeof(pSettings.panBackEase) === 'object' && pSettings.panBackEase.constructor === Object) {
						if (typeof(pSettings.panBackEase.x) === 'string' && typeof(pSettings.panBackEase.y) === 'string') {
							if (LensComponent.validEase.includes(pSettings.panBackEase.x) && LensComponent.validEase.includes(pSettings.panBackEase.y)) {
								this.settings.pan.panBackEase.x = pSettings.panBackEase.x;
								this.settings.pan.panBackEase.y = pSettings.panBackEase.y;
							} else {
								this.settings.pan.panBackEase.x = this.settings.pan.panBackEase.y = 'easeOutCubic';
								this.logger.prefix('Lens-Module').warn('Invalid ease name passed for pSettings.panBackEase.x || pSettings.panBackEase.y. Reverted to default');
							}
						} else {
							this.settings.pan.panBackEase.x = this.settings.pan.panBackEase.y = 'easeOutCubic';
							this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.panBackEase.x || pSettings.panBackEase.y parameter. Reverted to default');
						}
					} else if (typeof(pSettings.panBackEase) === 'string') {
						if (LensComponent.validEase.includes(pSettings.panBackEase)) {
							this.settings.pan.panBackEase.x = this.settings.pan.panBackEase.y = pSettings.panBackEase;
						} else {
							this.settings.pan.panBackEase.x = this.settings.pan.panBackEase.y = 'easeOutCubic';
							this.logger.prefix('Lens-Module').warn('Invalid ease name passed for pSettings.panBackEase.x || pSettings.panBackEase.y. Reverted to default');
						}
					} else {
						this.settings.pan.panBackEase.x = this.settings.pan.panBackEase.y = 'easeOutCubic';
						this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.panBackEase property. Reverted to default');
					}
				} else {
						this.settings.pan.panBackEase.x = this.settings.pan.panBackEase.y = 'easeOutCubic';
						this.logger.prefix('Lens-Module').warn('No panBackEase property included inside of the pSettings parameter. Reverted to default');
				}

				//duration
				if (pSettings.duration) {
					if (typeof(pSettings.duration) === 'object' && pSettings.duration.constructor === Object) {
						if (typeof(pSettings.duration.x) === 'number' && typeof(pSettings.duration.y) === 'number') {
							this.settings.pan.duration.x = pSettings.duration.x;
							this.settings.pan.duration.y = pSettings.duration.y;
						} else {
							this.settings.pan.duration.x = this.settings.pan.duration.y = 2000;
							this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.duration.x || pSettings.duration.y parameter. Reverted to default');
						}
					} else if (typeof(pSettings.duration) === 'number') {
							this.settings.pan.duration.x = this.settings.pan.duration.y = pSettings.duration;
					} else {
						this.settings.pan.duration.x = this.settings.pan.duration.y = 2000;
						this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.duration property. Reverted to default');
					}
				} else {
						this.settings.pan.duration.x = this.settings.pan.duration.y = 2000;
						this.logger.prefix('Lens-Module').warn('No duration property included inside of the pSettings parameter. Reverted to default');
				}

				// panBackDuration
				if (pSettings.panBackDuration) {
					if (typeof(pSettings.panBackDuration) === 'object' && pSettings.panBackDuration.constructor === Object) {
						if (typeof(pSettings.panBackDuration.x) === 'number' && typeof(pSettings.panBackDuration.y) === 'number') {
							this.settings.pan.panBackDuration.x = pSettings.panBackDuration.x;
							this.settings.pan.panBackDuration.y = pSettings.panBackDuration.y;
						} else {
							this.settings.pan.panBackDuration.x = this.settings.pan.panBackDuration.y = 2000;
							this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.panBackDuration.x || pSettings.panBackDuration.y parameter. Reverted to default');
						}
					} else if (typeof(pSettings.panBackDuration) === 'number') {
							this.settings.pan.panBackDuration.x = this.settings.pan.panBackDuration.y = pSettings.panBackDuration;
					} else {
						this.settings.pan.panBackDuration.x = this.settings.pan.panBackDuration.y = 2000;
						this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.panBackDuration property. Reverted to default');
					}
				} else {
						this.settings.pan.panBackDuration.x = this.settings.pan.panBackDuration.y = 2000;
						this.logger.prefix('Lens-Module').warn('No panBackDuration property included inside of the pSettings parameter. Reverted to default');
				}

				// pauseDuration
				if (pSettings.pauseDuration) {
					if (typeof(pSettings.pauseDuration) === 'number') {
						this.settings.pan.pauseDuration = pSettings.pauseDuration;
					} else {
						this.settings.pan.pauseDuration = 0;
						this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.pauseDuration property. Reverted to default');
					}
				}

				// attach
				this.settings.pan.attach = pSettings.attach;
				// forceDirChange
				this.settings.pan.forceDirChange = pSettings.forceDirChange;
				// initialPos
				this.settings.pan.initialPos.x = this.camera.x;
				this.settings.pan.initialPos.y = this.camera.y;

				if (this.settings.pan.forceDirChange) {
					// disable movement
					/**
					 * @todo Add a option/settings var to control this to see if macros should be captured
					 */
					VYLO.Client.toggleMacroCapture(false);
					this.settings.pan.storedDir = this.following.dir;
					this.following.dir = Utils.getDirection(Utils.convertRaWAngleToVyloCoords(Utils.getAngle(this.following, this.settings.pan.target)));
				}
				// panToCallback
				if (pSettings.panToCallback) {
					if (typeof(pSettings.panToCallback) === 'function') {
						this.settings.pan.panToCallback = pSettings.panToCallback;
					} else {
						this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.panToCallback property.');
					}
				}

				// panBackCallback
				if (pSettings.panBackCallback) {
					if (typeof(pSettings.panBackCallback) === 'function') {
						this.settings.pan.panBackCallback = pSettings.panBackCallback;
					} else {
						this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.panBackCallback property.');
					}
				}

				if (this.camera.x !== this.settings.pan.target.x) {
					this.settings.pan.active.x = true;
				}

				if (this.camera.y !== this.settings.pan.target.y) {
					this.settings.pan.active.y = true;
				}

			} else {
				this.logger.prefix('Lens-Module').error('No target property included inside of the pSettings parameter. Pan failed');
			}

		} else {
			this.logger.prefix('Lens-Module').error('Invalid variable type passed for the pSettings parameter. Pan failed');
		}
		this.settings.panning = true;
		this.currentlyPanning = true;
	}
	/**
	 * @private
	 * Event handler for when the first part of the pan completes
	 */
	onPanned() {
		if (this.settings.pan.panToCallback) {
			this.settings.pan.panToCallback();
			this.settings.pan.panToCallback = null;
		}
		if (this.settings.pan.attach) {
			if (typeof(this.settings.pan.target) === 'object') {
				// Check if its a diob
				if (this.settings.pan.target.baseType) {
					/**
					 * @todo 
					 * Make a flag that determines if macros get captured
					 */
					VYLO.Client.toggleMacroCapture(true);
					this.following = this.settings.pan.target;
					this.reset('pan');
				} else {
					this.logger.prefix('Lens-Module').warn('Cannot attach to a non diob type. Attachment failed');
				}
			}
		} else {
			this.settings.pan.target = this.following;
			this.settings.pan.initialPos.x = this.camera.x;
			this.settings.pan.initialPos.y = this.camera.y;
			this.settings.pan.time.x = this.settings.pan.time.y = 0;
			this.settings.pan.duration.x = this.settings.pan.panBackDuration.x;
			this.settings.pan.duration.y = this.settings.pan.panBackDuration.y;
			this.settings.pan.ease.x = this.settings.pan.panBackEase.x;
			this.settings.pan.ease.y = this.settings.pan.panBackEase.y;
			this.settings.pan.returning = true;
		}
	}
	/**
	 * @private
	 * Event handler for when the second part of the pan completes
	 */
	onPanFinish() {
		if (this.settings.pan.forceDirChange) {
			this.following.dir = this.settings.pan.storedDir;
		}
		if (this.settings.pan.panBackCallback) {
			this.settings.pan.panBackCallback();
			this.settings.pan.panBackCallback = null;
		}
		this.reset('pan');
		/**
		 * @todo Add a flag to see if macros should be captured
		 */
		// Allow players to move again
		VYLO.Client.toggleMacroCapture(true);
	}
	/**
	 * Method to follow the target of the camera
	 * @private
	 * @param {string} pMethod - The method in which the camera is following
	 * @param {number} pElapsedMS - The amount of ms that has passed since the last tick
	 * @param {number} pDeltaTime - The delta time
	 */
	follow(pMethod, pElapsedMS, pDeltaTime) {
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
				// Get the center position of the target
				const centerPositionOfPanTarget = this.getTrueCenterPos(this.settings.pan.target);
				if (this.x !== centerPositionOfPanTarget.x) {
					this.settings.pan.active.x = true;
				}

				if (this.y !== centerPositionOfPanTarget.y) {
					this.settings.pan.active.y = true;
				}
			}
			// Get the center position of the target
			const centerPositionOfTarget = this.getTrueCenterPos(this.settings[pMethod].target);
			if (this.settings[pMethod].active.x) {
				this.settings[pMethod].destination.x = centerPositionOfTarget.x;
			}
			if (this.settings[pMethod].active.y) {
				this.settings[pMethod].destination.y = centerPositionOfTarget.y;
			}
			target = this.settings[pMethod].target;
		} else {
			// Get the center position of the target
			const centerPositionOfFollowing = this.getTrueCenterPos(this.following);
			if (this.settings[pMethod].active.x) {
				this.settings[pMethod].destination.x = centerPositionOfFollowing.x;
			}
			if (this.settings[pMethod].active.y) {
				this.settings[pMethod].destination.y = centerPositionOfFollowing.y;
			}
			target = this.following;		
		}

		if (this.settings[pMethod].active.x) {
			this.settings[pMethod].time.x = Math.min(this.settings[pMethod].time.x + pElapsedMS, this.settings[pMethod].duration.x);
			distanceX = this.settings[pMethod].destination.x - this.settings[pMethod].initialPos.x;
			const x = Tween[this.settings[pMethod].ease.x](this.settings[pMethod].time.x, this.settings[pMethod].initialPos.x, distanceX, this.settings[pMethod].duration.x);
			stepSizeX = (x - this.camera.x);
			this.camera.x += stepSizeX;
		}

		if (this.settings[pMethod].active.y) {
			this.settings[pMethod].time.y = Math.min(this.settings[pMethod].time.y + pElapsedMS, this.settings[pMethod].duration.y);
			distanceY = this.settings[pMethod].destination.y - this.settings[pMethod].initialPos.y;
			const y = Tween[this.settings[pMethod].ease.y](this.settings[pMethod].time.y, this.settings[pMethod].initialPos.y, distanceY, this.settings[pMethod].duration.y);
			stepSizeY = (y - this.camera.y);
			this.camera.y += stepSizeY;
		}

		this.camera.mapName = target.mapName;

		// Get the center position of the target
		const centerPositionOfTarget = this.getTrueCenterPos(target);

		if (this.settings[pMethod].time.x === this.settings[pMethod].duration.x) {
			this.camera.x = centerPositionOfTarget.x;
			if (pMethod === 'pan') {
				this.reset('panX');
			} else if (pMethod === 'standard') {
				this.reset('standardX');
			} else if (pMethod === 'custom') {
				this.reset('customX');
			}
		}

		if (this.settings[pMethod].time.y === this.settings[pMethod].duration.y) {
			this.camera.y = centerPositionOfTarget.y;
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
	}
	/**
	 * Update handler that is called each tick to update the camera's state
	 * @private
	 * @param {number} pElapsedMS - The amount of ms that has passed since the last tick
	 * @param {number} pDeltaTime - The delta time
	 */
	update(pElapsedMS, pDeltaTime) {
		// Zoom
		if (this.settings.zoom.active.x || this.settings.zoom.active.y) {
			this.zoomUpdate(pElapsedMS, pDeltaTime);
		}
		
		// Shake
		if (this.settings.shake.active.x || this.settings.shake.active.y) {
			// this.settings.shaking = true;
			this.shakeUpdate(pElapsedMS, pDeltaTime);
		}

		if (this.attached) {
			// Pan
			if (!this.settings.scrolling && (this.settings.pan.active.x || this.settings.pan.active.y || this.settings.pan.returning)) {
				this.follow('pan', pElapsedMS, pDeltaTime);
			}
			// Camera moving after whatever its following
			if (!this.settings.scrolling && !this.settings.panning && this.following) {
				// Get the center position of the target
				const centerPositionOfFollowing = this.getTrueCenterPos(this.following);
				const xFollowingPos = centerPositionOfFollowing.x;
				const yFollowingPos = centerPositionOfFollowing.y;
				if (this.following.isMoving || this.oldFollowingPos.x !== xFollowingPos || this.oldFollowingPos.y !== yFollowingPos) {
					this.currentlyMoving = true;
					if (this.custom) {
						this.settings.custom.time.x = 0;
						this.settings.custom.active.x = (this.camera.x !== xFollowingPos ? true : false);
						this.settings.custom.initialPos.x = this.camera.x;

						this.settings.custom.time.y = 0;
						this.settings.custom.active.y = (this.camera.y !== yFollowingPos ? true : false);
						this.settings.custom.initialPos.y = this.camera.y;
					} else {
						this.settings.standard.time.x = 0;
						this.settings.standard.active.x = (this.camera.x !== xFollowingPos ? true : false);
						this.settings.standard.initialPos.x = this.camera.x;

						this.settings.standard.time.y = 0;
						this.settings.standard.active.y = (this.camera.y !== yFollowingPos ? true : false);
						this.settings.standard.initialPos.y = this.camera.y;
					}
				}

				// Custom camera moving
				if (this.custom) {
					if (this.settings.custom.active.x || this.settings.custom.active.y) {
						this.follow('custom', pElapsedMS, pDeltaTime);
					}
				// Default camera moving
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
	/**
	 * Zooms the camera in via the passed in arguments.
	 * @param {Object} pDestinationLevel - An object containing the zoom level information.
	 * @param {number} pDestinationLevel.x - The x scale to zoom to.
	 * @param {number} pDestinationLevel.y - The y scale to zoom to.
	 * @param {number} pDuration - The duration of the zoom.
	 * @param {Object} pEase - An object containing the ease information for how the zoom will be performed.
	 * @param {string} pEase.x - The ease to use for the x scale zooming.
	 * @param {string} pEase.y - The ease to use for the y scale zooming.
	 * @param {Function} pCallback - The callback to call after the zoom ends.
	 * @returns 
	 */
	zoom(pDestinationLevel={'x': 1, 'y': 1}, pDuration={'x': 1000, 'y': 1000}, pEase={'x': 'easeOutCirc', 'y': 'easeOutCirc'}, pCallback) {
		if (this.settings.zoom.active.x || this.settings.zoom.active.y) {
			return;
		}
		// Preset the cameras current zoom level with info from the client if it isn't already set
		if (!this.settings.zoom.currentLevel.x) {
			this.settings.zoom.currentLevel.x = VYLO.Client.mapView.scale.x;
		}
		if (!this.settings.zoom.currentLevel.x) {
			this.settings.zoom.currentLevel.y = VYLO.Client.mapView.scale.y;
		}
		// Destination level
		let dx;
		let dy;
		if (pDestinationLevel || pDestinationLevel === 0) {
			if (typeof(pDestinationLevel) !== 'object') {
				if (typeof(pDestinationLevel) === 'number') {
					dx = dy = pDestinationLevel;
				} else {
					dx = dy = 1;
					this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pDestinationLevel parameter. Reverted to default');							
				}
			} else {
				if (typeof(pDestinationLevel.x) === 'number' && typeof(pDestinationLevel.y) === 'number') {
					dx = pDestinationLevel.x;
					dy = pDestinationLevel.y;
				} else {
					dx = dy = 1;
					this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pDestinationLevel.x || pDestinationLevel.y parameter. Reverted to default');	
				}
			}
		} else {
			dx = dy = 1;
			this.logger.prefix('Lens-Module').warn('No pDestinationLevel parameter passed. Reverted to default');
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
					this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pDuration parameter. Reverted to default');
				}
			} else {
				if (typeof(pDuration) === 'object') {
					if (typeof(pDuration.x) === 'number' && typeof(pDuration.y) === 'number') {
						this.settings.zoom.duration = pDuration;
					} else {
						this.settings.zoom.duration.x = this.settings.zoom.duration.y = 1000;
						console.warn('Invalid variable type passed for the pDuration.x || pDuration.y parameter. Reverted to default');
					}
				}
			}
		} else {
			this.settings.zoom.duration.x = this.settings.zoom.duration.y = 1000;
			this.logger.prefix('Lens-Module').warn('No pDuration parameter passed. Reverted to default');
		}

		// ease 
		if (pEase) {
			if (typeof(pEase) !== 'object') {
				if (typeof(pEase) === 'string') {
					if (LensComponent.validEase.includes(pEase)) {
						this.settings.zoom.ease.x = this.settings.zoom.ease.y = pEase;
					} else {
						this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
						this.logger.prefix('Lens-Module').warn('Invalid pEase name passed. Reverted to default');
					}
				} else {
					this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
					this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pEase parameter. Reverted to default');
				}

			} else {
				if (typeof(pEase) === 'object') {
					if (typeof(pEase.x) === 'string' && typeof(pEase.y) === 'string') {
						if (LensComponent.validEase.includes(pEase.x) && LensComponent.validEase.includes(pEase.y)) {
							this.settings.zoom.ease = pEase;
						} else {
							this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
							this.logger.prefix('Lens-Module').warn('Invalid pEase name passed for pEase.x || pEase.y. Reverted to default');
						}
						
					} else {
						this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
						this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pEase.x || pEase.y parameter. Reverted to default');
					}
				}				
			}
		} else {
			this.settings.zoom.ease.x = this.settings.zoom.ease.y = 'easeOutCirc';
			this.logger.prefix('Lens-Module').warn('No pEase parameter passed. Reverted to default');	
		}

		// callback
		if (typeof(pCallback) === 'function') {
			this.settings.zoom.callback = pCallback;
		} else {
			this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pCallback property.');
		}
		this.settings.zooming = true;
		this.currentlyZooming = true;
	}
	/**
	 * @private
	 * Event handler for when the zoom is finished
	 */
	onZoomEnd() {
		if (this.settings.zoom.callback) {
			this.settings.zoom.callback();
		}
		VYLO.Client.mapView.scale.x = Math.round(this.settings.zoom.destinationLevel.x * 10) / 10;
		VYLO.Client.mapView.scale.y = Math.round(this.settings.zoom.destinationLevel.y * 10) / 10;
		VYLO.Client.setMapView(VYLO.Client.mapView);
		this.reset('zoom');
	}
	/**
	 * Sets the camera to operate using these user defined settings.
	 * @param {Object} pSettings - An object that holds settings for how the canera will behave.
	 * @param {Object} pSettings.duration - An object that holds settings for how the canera will behave.
	 * @param {number} pSettings.duration.x - The duration of the ease in the x dimension.
	 * @param {number} pSettings.duration.y - The duration of the ease in the y dimension.
	 * @param {Object} pSettings.ease - An object that holds settings for how the canera will behave.
	 * @param {string} pSettings.ease.x - The ease to use in the x dimension.
	 * @param {string} pSettings.ease.y - The ease to use in the y dimension.
	 */
	setSettings(pSettings) {
		if (pSettings) {
			if (typeof(pSettings) === 'object' && pSettings.constructor === Object) {
				if (pSettings.duration) {
					if (typeof(pSettings.duration) === 'object' && pSettings.duration.constructor === Object) {
						if (typeof(pSettings.duration.x) === 'number' && typeof(pSettings.duration.y) === 'number') {
							this.settings.custom.duration.x = pSettings.duration.x;
							this.settings.custom.duration.y = pSettings.duration.y;
						} else {
							this.settings.custom.duration.x = this.settings.custom.duration.y = 1000;
							this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.duration.x || pSettings.duration.y property. Reverted to default');
						}
					} else if (typeof(pSettings.duration === 'number')) {
						this.settings.custom.duration.x = this.settings.custom.duration.y = pSettings.duration;
					} else {
						this.settings.custom.duration.x = this.settings.custom.duration.y = 1000;
						this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.duration property. Reverted to default');
					}
				} else {
					this.settings.custom.duration.x = this.settings.custom.duration.y = 1000;
					this.logger.prefix('Lens-Module').warn('No pSettings.duration parameter passed. Reverted to default');
				}

				if (pSettings.ease) {
					if (typeof(pSettings.ease) === 'object' && pSettings.ease.constructor === Object) {
						if (typeof(pSettings.ease.x) === 'string' && typeof(pSettings.ease.y) === 'string') {
							if (LensComponent.validEase.includes(pSettings.ease.x) && LensComponent.validEase.includes(pSettings.ease.y)) {
								this.settings.custom.ease.x = pSettings.ease.x;
								this.settings.custom.ease.y = pSettings.ease.y;
							} else {
								this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
								this.logger.prefix('Lens-Module').warn('Invalid ease name passed for pSettings.ease.x || pSettings.ease.y. Reverted to default');
							}
						} else {
							this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
							this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.ease.x || pSettings.ease.y property. Reverted to default');
						}
					} else if (typeof(pSettings.ease === 'string')) {
						if (LensComponent.validEase.includes(pSettings.ease)) {
							this.settings.custom.ease.x = this.settings.custom.ease.y = pSettings.ease;
						} else {
							this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
							this.logger.prefix('Lens-Module').warn('Invalid ease name passed for pSettings.ease. Reverted to default');
						}
					} else {
						this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
						this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings.ease property. Reverted to default');
					}
				} else {
					this.settings.custom.ease.x = this.settings.custom.ease.y = 'easeOutCubic';
					this.logger.prefix('Lens-Module').warn('No pSettings.ease parameter passed. Reverted to default');
				}

				this.reset('standard');
				this.custom = true;
				this.settings.custom.initialPos.x = this.camera.x;
				this.settings.custom.initialPos.y = this.camera.y;
			} else {
				this.reset('custom');
				this.custom = false;
				this.settings.standard.initialPos.x = this.camera.x;
				this.settings.standard.initialPos.y = this.camera.y;
				this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pSettings parameter. Reverted to default');
			}
		} else {
			this.reset('custom');
			this.custom = false;
			this.settings.standard.initialPos.x = this.camera.x;
			this.settings.standard.initialPos.y = this.camera.y;
			this.logger.prefix('Lens-Module').warn('No pSettings parameter passed. Reverted to default');
		}
	}
	/**
	 * Spectates another diob with the camera using the passed settings
	 * @todo Allow pSettings.target to also be a coordinate position, this will create a diob at that space and spectate that position.
	 * @param {Object} pSettings - Settings to control the spectate
	 * @param {Object} pSettings.target - The diob instance to spectate
	 * @param {boolean} pSettings.preventMovement - Prevent the client mob from moving while spectating
	 * @param {boolean} pSettings.forcePos - If the camera should spectate instantly without easing to the location. 
	 * If the location is over 1000m(pixels) away then the camera will automatically jump to that position.
	 */
	spectate(pSettings) {
		if (this.settings.panning) {
			console.error('Lens: Cannot spectate camera is currently %cpanning', 'font-weight: bold', '. Spectate failed');
			return;
		}
		if (pSettings) {
			if (typeof(pSettings) === 'object' && pSettings.constructor === Object) {
				if (typeof(pSettings.target) === 'object' && pSettings.target.baseType) {
					if (typeof(pSettings.target.x) === 'number' && typeof(pSettings.target.y) === 'number' && typeof(pSettings.target.mapName) === 'string') {
						this.settings.spectate.preventMovement = false;
						this.settings.spectate.forcePos = false;

						// Prevents player from moving while spectating
						if (pSettings.preventMovement) {
							this.settings.spectate.preventMovement = pSettings.preventMovement;
							VYLO.Client.toggleMacroCapture(false);
						}
						// Get the center position of the target
						const centerPositionOfTarget = this.getTrueCenterPos(pSettings.target);
						// Doesn't ease to the spectatee
						if (pSettings.forcePos) {
							this.settings.spectate.forcePos = pSettings.forcePos;
							this.camera.setPos(centerPositionOfTarget.x, centerPositionOfTarget.y, pSettings.target.mapName);
						} else {
							// If the distance is too far, then just force the position
							if (Utils.getDistance(this.following, pSettings.target) > 1000) {
								this.settings.spectate.forcePos = true;
								this.camera.setPos(centerPositionOfTarget.x, centerPositionOfTarget.y, pSettings.target.mapName);							
							}
						}
						if (!this.settings.spectate.player) {
							this.settings.spectate.player = this.following;
						}
						this.following = pSettings.target;
					} else {
						this.logger.prefix('Lens-Module').error('Invalid variable type passed for the pSettings.target.x || pSettings.target.y || pSettings.target.mapName property. Spectate failed');
						return;
					}
				} else {
					this.logger.prefix('Lens-Module').error('Invalid variable type passed for the pSettings.target property. Pan failed');
					return;
				}
			} else {
				this.logger.prefix('Lens-Module').error('Invalid variable type passed for the pSettings parameter. Spectate failed');
				return;
			}
		} else {
			this.logger.prefix('Lens-Module').error('No pSettings parameter passed. Spectate failed');
			return
		}
		this.settings.spectating = true;
		this.currentlySpectating = true;
	}
	/**
	 * Stops spectating. 
	 * If the setting 'forcePos' was set. Then the camera will immedietly jump to the original camera target.
	 * If the setting `preventMovement` was set. Then movement will be restored. This is only applicable to movement via macros.
	 */
	cancelSpectate() {
		if (this.currentlySpectating) {
			if (this.settings.spectate.forcePos) {
				const centerPositionOfFollowing = this.getTrueCenterPos(this.settings.spectate.player);
				this.camera.setPos(centerPositionOfFollowing.x, centerPositionOfFollowing.y, this.settings.spectate.player.mapName);
			}
			this.following = this.settings.spectate.player;
			if (this.settings.spectate.preventMovement) {
				VYLO.Client.toggleMacroCapture(true);
			}
			this.reset('spectate');
		}
	}
	/**
	 * Attaches the camera to the passed diob.
	 * @param {Object} pDiob - The diob to attach the camera to
	 * @param {Object} pSettings - An object that holds settings for how the canera will behave.
	 * @param {Object} pSettings.duration - An object that holds settings for how the canera will behave.
	 * @param {number} pSettings.duration.x - The duration of the ease in the x dimension.
	 * @param {number} pSettings.duration.y - The duration of the ease in the y dimension.
	 * @param {Object} pSettings.ease - An object that holds settings for how the canera will behave.
	 * @param {string} pSettings.ease.x - The ease to use in the x dimension.
	 * @param {string} pSettings.ease.y - The ease to use in the y dimension.
	 * @param {Function} pUpdateFunc - A callback that will be called when the camera is updated. pDiffX and pDiffY params are the difference in position between the last tick.
	 */
	attach(pDiob, pSettings, pUpdateFunc) {
		if (typeof(pDiob) === 'object') {
			if (!pDiob.baseType) {
				this.logger.prefix('Lens-Module').error('Nothing to attach to. Attachment failed');
				return;
			}
		}
		if (typeof(pUpdateFunc) === 'function') {
			this.updateWithCamera = pUpdateFunc;
		}
        // Initialize the mapView object
		if (!this.mapViewInit) {
            // Prep the client's mapview object
            if (VYLO.Client.mapView) {
                VYLO.Client.mapView.anchor = { 'x': 0.5, 'y': 0.5 };
            } else {
                VYLO.Client.mapView = { 'anchor': { 'x': 0.5, 'y': 0.5 } };
            }
            this.logger.prefix('Lens-Module').log('Client.mapview.anchor may have been changed. This module requires the mapview anchor to be 0.5');
            VYLO.Client.setMapView(VYLO.Client.mapView);
			this.mapViewInit = true;
		}
		// Assign the settings to the camera
		if (pSettings) {
			this.setSettings(pSettings);
		}

		this.following = pDiob;
		this.oldFollowingPos = { 'x': this.following.x + this.following.xIconOffset, 'y': this.following.y + this.following.yIconOffset };
		const centerPositionOfFollowing = this.getTrueCenterPos(this.following);
		this.camera.setPos(centerPositionOfFollowing.x, centerPositionOfFollowing.y, this.following.mapName);
		this.attached = true;
		VYLO.Client.setViewEye(this.camera);
	}
	/**
	 * Detaches the camera. The camera is no longer the view eye.
	 */
	detach() {
		if (!this.attached) {
			this.logger.prefix('Lens-Module').error('Camera is already detached!');
			return;
		}

		this.reset('spectate');
		this.following = VYLO.Client.mob;
		this.setSettings();
		this.attached = false;
		this.camera.setLoc();
		VYLO.Client.setViewEye(this.following);
	}
	/**
	 * Shakes the camera with the passed settings.
	 * @param {number} pIntensity - The intensity of the shaking effect. 0 - 100
	 * @param {number} pDuration - The duration of the shaking effect in ms.
	 * @param {boolean} pRotational - Whether the shaking consists of rotational shaking as well.
	 * @param {Function} pCallback - Callback function to call when the shaking is completed.
	 */
	shake(pIntensity, pDuration, pRotational=false, pCallback) {
		const intensityValue = { 'x': 1, 'y': 1 };
		const durationValue = { 'x': 1000, 'y': 1000 };
		if (pIntensity) {
			if (typeof(pIntensity) === 'object' && pIntensity.constructor === Object) {
				if (pIntensity.x || pIntensity.x === 0) {
					if (typeof(pIntensity.x) === 'number') {
						intensityValue.x = Utils.clamp(pIntensity.x, 0, LensComponent.MAX_CAMERA_SHAKE_FORCE);
					} else {
						this.logger.prefix('Lens-Module').warn('Invalid variable type for pIntensity.x property. Reverted to default');
					}
				} else {
					this.logger.prefix('Lens-Module').warn('No pIntensity.x property value passed. Reverted to default');
				}

				if (pIntensity.y || pIntensity.y === 0) {
					if (typeof(pIntensity.y) === 'number') {
						intensityValue.y = Utils.clamp(pIntensity.y, 0, LensComponent.MAX_CAMERA_SHAKE_FORCE);
					} else {
						this.logger.prefix('Lens-Module').warn('Invalid variable type for pIntensity.y property. Reverted to default');
					}
				} else {
					this.logger.prefix('Lens-Module').warn('No pIntensity.y property value passed. Reverted to default');
				}

			} else if (typeof(pIntensity) === 'number') {
				intensityValue.x = intensityValue.y = Utils.clamp(pIntensity, 0, LensComponent.MAX_CAMERA_SHAKE_FORCE);
			} else {
				this.logger.prefix('Lens-Module').warn('Invalid variable type for pIntensity parameter passed. Reverted to default');
			}

		} else {
			this.logger.prefix('Lens-Module').warn('No pIntensity parameter passed. Reverted to default');
		}

		if (pDuration) {
			if (typeof(pDuration) === 'object' && pDuration.constructor === Object) {
				if (pDuration.x || pDuration.x === 0) {
					if (typeof(pDuration.x) === 'number') {
						durationValue.x = pDuration.x;
					} else {
						this.logger.prefix('Lens-Module').warn('Invalid variable type for pDuration.x property. Reverted to default');
					}
				} else {
					this.logger.prefix('Lens-Module').warn('Lens: No pDuration.x property value passed. Reverted to default');
				}

				if (pDuration.y || pDuration.y === 0) {
					if (typeof(pDuration.y) === 'number') {
						durationValue.y = pDuration.y;
					} else {
						this.logger.prefix('Lens-Module').warn('Invalid variable type for pDuration.y property. Reverted to default');
					}
				} else {
					this.logger.prefix('Lens-Module').warn('No pDuration.y property value passed. Reverted to default');
				}
			} else if (typeof(pDuration) === 'number') {
				durationValue.x = durationValue.y = pDuration;
			} else {
				this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pDuration.x || pDuration.y property. Reverted to default');
			}
			
		} else {
			this.logger.prefix('Lens-Module').warn('No pDuration parameter passed. Reverted to default');
		}

		if (pRotational) {
			this.settings.shake.rotational = true;
		}

		if (typeof(pCallback) === 'function') {
			this.settings.shake.callback = pCallback;
		} else if (pCallback !== undefined) {
			this.logger.prefix('Lens-Module').warn('Invalid variable type passed for the pCallback property.');
		}

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
		this.currentlyShaking = true;
	}
	/**
	 * @private
	 * Event handler for when the camera is done shaking.
	 */
	onShakeEnd() {
		if (this.settings.shake.callback) {
			this.settings.shake.callback();
			// Reset the view eye offsets
			VYLO.Client.setViewEyeOffsets(0, 0);
		}
		this.reset('shake');
	}
}

export const Lens = new LensComponent();
