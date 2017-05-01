/**
 * modal plugin code Starts
 *
 */
(function($, window){
	"use strict";
	$.fn.extend({
		modal: function(option) {

			var $document = $(document),
				$window = $(window),
				$body = $('body'),
				isTouch = 'ontouchstart' in document.documentElement,
				timer, // Holds the setTimeout timer
				bAdjustScrollTop = true, // Flag to denote if scroll top should be adjusted
				adjustScrollTop = function(element) {
					var el = element,
						isTop = el.scrollTop < 1,
						isBottom = el.scrollHeight === (el.scrollTop + el.clientHeight);
					if(isTop){
						el.scrollTop = 1;
						bAdjustScrollTop = false;
					}
					if(isBottom){
						el.scrollTop = el.scrollTop - 1;
						bAdjustScrollTop = false;
					}
				},

				isOpen = false,

				bind = function($elem, $wrapper, $backdrop) {
					$elem.on('click.close.modal', '.lens-modal-close', function(e){
						hide($elem);
						e.preventDefault();
					});
					// $backdrop.on('click.close.model.backdrop', function(){
					// 	hide($elem);
					// });
					$document.on('keyup.close.modal', function (e) {
						if(e.which === 27) {
							hide($elem);
						}
					});
					// unbind focusin then rebind - prevent range overflow in multiple modal cases
					$document.off('focusin.aria.modal');
					$document.on('focusin.aria.modal', function (e) {
						var target = e.target || e.srcElement;

						if (isOpen && (target !== $elem[0]) && !$elem.find(target).length) {
							e.stopPropagation();
							$elem[0].focus();
						}
					});
					if(isTouch) {
						$wrapper.on('touchstart.modal', function(){
							adjustScrollTop($wrapper.get(0));
						});
						$wrapper.on('touchend.modal touchcancel.modal', function(){
							bAdjustScrollTop = true;
						});
						$wrapper.on('scroll.modal', function() {
							if(!bAdjustScrollTop) {
								return;
							}
							clearTimeout(timer);
							timer = setTimeout(function(){
								adjustScrollTop($wrapper.get(0));
							}, 16.66);
						});
					}
				},

				unbind = function($elem, $wrapper, $backdrop) {
					$elem.off('click.close.modal');
					$backdrop.off('click.close.modal.backdrop');
					$document.off('keyup.close.modal');
					$document.off('focusin.aria.modal');
					if(isTouch) {
						$wrapper.off('scroll.modal touchstart.modal touchend.modal touchcancel.modal');
					}
				},

				hide = function($elem) {
					var $backdrop = $('#lens-modal-backdrop' + $elem.data('index')),
						$wrapper = $('#lens-modal-wrapper' + $elem.data('index'));
					// Check if modal is already hidden
					if($elem.filter(':hidden').length) {
						return;
					}
					unbind($elem, $wrapper, $backdrop);
					$wrapper.hide();
					$elem.hide().attr('aria-hidden', true);
					$elem.trigger('hide');
					isOpen = false;
					// release the body scroll only if no other modal is visible
					if(!$('.lens-modal').filter(':visible').length) {
						$body.removeClass('prevent-scroll');
					}
				},

				show = function($elem) {

					var $backdrop = $('#lens-modal-backdrop' + $elem.data('index')),
						$wrapper = $('#lens-modal-wrapper' + $elem.data('index'));
					// Check if modal is already visible
					if($elem.filter(':visible').length) {
						return;
					}
					// lock the body
					$body.addClass('prevent-scroll');
					// bind events
					bind($elem, $wrapper, $backdrop);
					// Show & enable ARIA
					$wrapper.show();
					$elem.show().attr('aria-hidden', false);
					$elem[0].focus();
					// position the close button
					// positionClose($elem);
					// trigger event
					$elem.trigger('show');
					isOpen = true;
				},

				// positionClose = function($elem) {
				// 	// Calculate right position, 80 px is the width of the close button container
				// 	var right = $window.width() - $elem.offset().left - $elem.outerWidth() - 80;
				// 	if(right < 0) {
				// 		// force it to 0
				// 		right = 0;
				// 	}
				// 	$elem.find('.lens-modal-close').css('right', right);
				// },

				resize = function($elem) {
					// Set the element width first
					$elem.css('width', 'auto');
					// Calculate left position
					var left = Math.max($window.width() - $elem.outerWidth(), 0) / 2;
					$elem.css({
						"margin-left": "auto",
						"left": left + $window.scrollLeft()
					});
					// position the close button
					// positionClose($elem);
				};

			return this.each(function() {
				var $this = $(this),
					opt = option || 'default';
					console.log('options', option)
				switch(opt) {
					case 'hide':
						hide($this);
						break;
					case 'resize':
						resize($this);
						break;
					default:
						show($this);
				}
			});
		}
	});
})(window.jQuery, window);


/** Lens engine code starts here **/
(function($, config) {
	'use strict';

	config = config || {};

	var Lens = function(options) {
		var t = this;

		// Instance variables
		t.options = $.extend(true, {}, Lens.defaults, config, options);	// Normalize the options first
		t.restBase = t.options.restBase[t.getEnv(location.hostname)];
		t.sid = t.options.sid || window.sid; // Getting the sid (Source ID) from options or from global
		t.$modal = t.createLensElements(); // Create the lens elements for this instance
		t.$triggerElem = null;
		t.$container = null;
		// t.currentItemId = null; // Holds the current Item ID
		t.currentCta = null; // Holds the current CTA ('pb', 'bo', 'atc')
		t.mainTemplate = null; // Holds the main template for the layer
		t.resourceLoaded = {}; // Flag to hold the resource load status, hashmap to different cta
		t.data = null; // holds the dynamic data
		t.actionHash = null; // Holds the URL lens action hash
		t.dataAttributes = null; // The data attributes associated with the item
		t.inFlight = null; // Object holds the current inflight requests

		// Update Lens cache settings with provided options
		Lens.cache.settings(t.options.cache);
		// Bind the events
		t.listen();

		// Trigger lens action if any, e.g., open the layer with has bolp === 1;
		t.triggerAction();
	};

	Lens.prototype = {

		listen: function() {
			var t = this,
				$triggerElem,
				selector;
				console.log(t.options);
			// Check if event delegation is needed
			if(t.options.delegator) {
				$triggerElem = $(t.options.delegator); // Trigger elem becomes the delegator
				selector = t.options.trigger; // Event will be delegated to this selector
			} else {
				$triggerElem = $(t.options.trigger); // Trigger will be the actual trigger element
				selector = null; // no selector, apply the event to the trigger itself
			}

			$triggerElem.on('click', selector, function(e) {
				console.log('trigger');
				// If a meta key is pressed then do the default
				if(e.metaKey) {
					return true;
				}
				// Start execution & prevent defaults
				if(t.exec($(e.currentTarget || e.srcElement))) {
					// Prevent defaults
					e.stopPropagation();
					e.preventDefault();
				}
			});
		},

		getEnv: function(hostname) {

			if (/(\.|^)qa\.ebay/i.test(hostname)) { //matches QA environments
				return 'qa';
			} else if (/(\.|^)corp\.ebay/i.test(hostname)) { //matches CORP environments
				return 'qa';
			} else if (/(\.|^)dev\.ebay/i.test(hostname)) { //matches pretty URL environments
				return 'qa';
			} else if(/latest/i.test(hostname)) { //matches pre-prod URLs
				return 'preprod';
			}
			return 'prod';
		},

		triggerAction: function() {
			var hash = window.location.hash,
				actionVerifier = this.options.actionVerifier,
				action;
			if(!hash) {
				return; // Return if no hash
			}
			// If action verifier is present, first verify the action
			if(actionVerifier && !actionVerifier(this.getActionType(hash))) {
				return;
			}
			action = /#lensaction=([0-9]+-?[0-9]*)\|/i.exec(hash);
			if(action && action[1]) {
				// set the data attributes
				this.dataAttributes = this.getActionDataAttributes(action[1]);
				// Set the action hash to instance
				this.actionHash = hash;
				// Activate the lens
				console.log('triggerAction');
				this.activateLens(this.dataAttributes && this.dataAttributes.cta);
			}
		},

		getActionDataAttributes: function(action) {
			if(!action) {
				return null;
			}
			var dataList = action.split('-');
			return {
				"id": dataList[0],
				"var": dataList[1]
			};
		},

		/** Do signin redirection **/
		authRedirect: function(signinURL, actionType, actionData) {
			var redirectURL = this.getRedirectURL(signinURL, actionType, actionData);
			if(redirectURL) {
				window.location = redirectURL;
			}
		},

		getRedirectURL: function(signinURL, actionType, actionData) {
			if(!signinURL) { // Check for signinURL first
				return null;
			}
			var loc = window.location,
				redirectURL = loc.toString().replace(loc.hash, ''),
				variationId = this.dataAttributes && this.dataAttributes['var'],
				delimiter = '|';

			// Normalize action Type & data
			actionType = actionType || '';
			actionData = actionData || '';

			// Add hash to the redirectURL
			redirectURL += '#lensaction=' +
							this.currentItemId +
							(variationId? '-' + variationId: '') +
							delimiter +
							actionType +
							delimiter +
							encodeURIComponent(actionData);
			return signinURL + '&ru=' + encodeURIComponent(redirectURL);
		},

		/** Returns the action type from the hash **/
		getActionType: function(actionHash) {
			if(!actionHash) {
				return null;
			}
			var typeMatch = /#lensaction=[0-9]+-?[0-9]*\|([^\|]+)\|/i.exec(actionHash),
				type = null;
			if(typeMatch) {
				type = typeMatch[1];
			}
			return type;
		},

		/** Returns the action data from the hash **/
		getActionData: function(actionHash) {
			if(!actionHash) {
				return null;
			}
			var dataMatch = /#lensaction=[0-9]+-?[0-9]*\|[^\|]+\|(.+)/i.exec(actionHash),
				data = null;
			if(dataMatch) {
				data = dataMatch[1];
			}
			return data;
		},

		updateDataAttributes: function(obj) {
			this.dataAttributes = $.extend(this.dataAttributes, obj);
		},

		reset: function() {
			// Reset action hash on every close to prevent multiple entries
			if(this.actionHash === window.location.hash) {
				this.actionHash = null;
			}
			// Set currentItemId to null
			this.currentItemId = null;
			// set data attributes to null
			this.dataAttributes = null;
			// abort inflight requests
			if(this.inFlight) {
				this.inFlight.abort();
			}
			// trigger unload event
			this.fire('lensUnload');
		},

		exec: function($elem) {
			console.log('exec');
			var _this = this;
			// Top level try-catch block to fallback to default browser behavior
			try{
				// get the cta
				var cta = $elem.data('cta');

				// if item ID empty just return
				if(!cta) {
					return null;
				}
				// set the trigger element
				_this.$triggerElem = $elem;
				// Set the data attributes
				_this.dataAttributes = $elem.data();
				// Activate the lens
				_this.activateLens(cta);
			} catch(ex) {
				return 0;
			}
			// Return 1 for successfull activation
			return 1;
		},

		activateLens: function(cta) {
			console.log('active', cta);
			if(!cta) {
				return;
			}
			var url = this.buildAjaxUrl(cta);
			console.log('buildAjaxUrl', url);

			// Set the current Item Id
			// this.currentURL	= url;

			// Show the dialog
			this.show();

			//Set the current CTA
			this.currentCta = cta;

			// Load data & paint when done
			this.load(url);
		},

		fallback: function() {
			// First check if there is a trigger element
			if(!this.$triggerElem) {
				// Close the modal and return
				this.close();
				return;
			}
			// Fallback to the original url
			var href = this.$triggerElem.attr('href');

			// Close the modal
			this.close();
			// Redirect to end point if href is available
			if(href) {
				window.location = href;
			}
		},

		getCacheKey: function(id) {
			if(!id) {
				return null;
			}
			return id + '-' + this.$modal.data('index');
		},

		buildAjaxUrl: function(cta) {
			var _this = this;
			var dataAttrs = _this.dataAttributes;
			var url;
			// Using the passed URL
			if (dataAttrs['url']) {
				url = dataAttrs['url'];
			} else {
			// Or using the default one based on cta
				url = _this.urlHandle(_this.restBase, cta, dataAttrs);
			}

			var	sep = /\?/.test(url)? '&':'?',
				sid = _this.sid || '',
				dataOnly = _this.options.dataOnly;

			// Override sid value if present as a data attribute
			if(dataAttrs && dataAttrs.sid) {
				sid = dataAttrs.sid;
			}

			return url + sep +
					'_trksid=' + sid + // sid
					(dataOnly?'&data=1':''); // data only
		},

		extractItemId: function() {
			var	url = location.href;
			console.log('url', url);
			if(url) {
				var	itemUrlPattern = /http:\/\/[^\/]+\.ebay\.[^\/]+\/(soc\/)?itm\//,
					cgiUrlPattern = /http:\/\/[^\/]+\.ebay\.[^\/]+\/ws\/eBayISAPI.dll\?ViewItem&item=(\d+)/,
					itemId,
					urlParts;
				if(itemUrlPattern.test(url)) {
					urlParts = url.split('/');
					itemId = urlParts[urlParts.length - 1].split('?')[0];
				} else if(cgiUrlPattern.test(url)) {
					urlParts = url.match(cgiUrlPattern);
					itemId = urlParts[1];
				} else {
					urlParts = url.split('/');
					itemId = urlParts[urlParts.length - 1].split('?')[0];
				}
				itemId = parseInt(itemId, 10);
				if(isNaN(itemId)) {
					itemId = 0;
				}
			}
			return itemId;
		},


		urlHandle: function(restBase, cta, dataAttributes) {
			console.log('here', restBase, cta, dataAttributes);
			restBase = 'http://lm-sjc-11002779.corp.ebay.com:8080/bfl';
			var params = [],
				itemId = 0,
				query = '',
				key;

			itemId = this.extractItemId();
			// if(dataAttributes) {
			// 	for(key in dataAttributes) {
			// 		if(key === 'cta') {
			// 			continue;
			// 		}
			// 		params.push(key + '=' + encodeURIComponent(dataAttributes[key]));
			// 	}
			// }
			// if(params.length) {
			// 	query = '?' + params.join('&');
			// }
			return restBase + '/' + cta + '/' + itemId;
		},

		isAjaxable: function(url) {
			if(!url) {
				return false;
			}
			var urlHost = url.match(/\/\/([^\/]+)\//);
			if(urlHost) {
				// Get the host name alone
				urlHost = urlHost[1];
			}
			if(!urlHost) {
				// it is a relative url so Ajaxable
				return true;
			}
			// Check if the page host is the same as the URL host
			return location.hostname === urlHost;
		},

		fetch: function(url, callback, resourceOnly) {
			console.log('fetch');
			var t = this,
				// useAJAX = t.isAjaxable(url),
				// dataType = useAJAX?"json": "jsonp";
				dataType = "json";

			t.inFlight = $.ajax({
				timeout: 10000,
				dataType: dataType,
				url: url,
				success: function(resp) {
					resp.html = '<div class="placebid_layer_wrapper" id="w0" data-widget="/offerview$0.0.1/src/pages/placebid/widget"><div class="app-bidlayer-main-wrapper" id="w0-w0" data-widget="/offerview$0.0.1/src/ui-modules/app-bidlayer-main-container/index"><div class="app-bidlayer-itemsummary-wrapper"><div class="placebid_layer_priceinfo"><span class="placebid_layer_priceinfo_price"><span class="  "><span class="cc-text-spans--BOLD">US $0.99</span></span></span><span class="placebid_layer_priceinfo_plus">+</span><span class="placebid_layer_priceinfo_shipping"><span><span>$7.20 for shipping</span></span></span></div><div class="placebid_layer_bidinfo"><span class="app-counter-wrapper " id="_counter_itemEndDate" data-urgencytime="3600" data-secondsleft="52537" data-counterstarttime="3600" data-widget="/offerview$0.0.1/src/ui-modules/app-counter-bidlayer/index"><span id="_counter_itemEndDate_hour" class="showInline">14</span><span id="_counter_itemEndDate_hourText" class="showInline">h</span><span id="_counter_itemEndDate_minute" class="showInline">35</span><span id="_counter_itemEndDate_minuteText" class="showInline">m</span><span id="_counter_itemEndDate_second" class="showInline">37</span><span id="_counter_itemEndDate_secondText" class="showInline">s</span></span><span class="seperator">|</span><span class="placebid_layer_bidcount"><span><span>0 Bids</span></span></span></div></div><div class="placebid_layer_powerbid_warpper"><div class="app-bidlayer-education-wrapper"><div class="placebid_layer_title"><span><span class="cc-text-spans--BOLD">Place your bid</span></span><button aria-label="Help button. Click to get more details on bidding" class="placebid_cir" id="PB_HELP_ICON"><span class="ui-component-icon-wrapper ui-component-icon__HELP"></span></button></div><div class="placebid_layer_education" id="PB_HELP_CONTENT"><div class="cc-textblock"><div class="row"><span class=" cc-textblock--block"><span>Consider bidding the highest amount you\'re willing to pay. We\'ll bid for you, just enough to keep you in the lead. We\'ll keep your high bid amount hidden from everyone else.</span></span></div></div><div class="placebid_layer_education" id="PB_HELP_SEEMORE_CONTENT"><div class="cc-textblock"><div class="row"><span class=" cc-textblock--block"><span class="cc-text-spans--BOLD">Here\'s how bidding works:</span></span></div><div class="row"><span class=" cc-textblock--block"><span>If the current bid is $20, and you bid $30, we bid $21 for you.</span></span></div><div class="row"><span class=" cc-textblock--block"><span>If no one else bids, you win and pay $21.</span></span></div><div class="row"><span class=" cc-textblock--block"><span>If someone else bids $31, we bid for you up to your max of $30.</span></span></div></div></div></div></div><div class="app-bidlayer-bidsection-wrapper"><div class="placebid_buttons"><span class="button-placebid" id="placeBidSec_btn_1"><a class="component-button" href="/bfl/placebid/280014118475?action=powerbid&amp;_trksid=p2471758.m4916" role="button" aria-label="Bid US $1">Bid US $1</a><div class="hide_field_input">{"decimalPrecision":2,"price":{"value":"1.00","currency":"USD"}}</div></span><span class="button-placebid" id="placeBidSec_btn_2"><a class="component-button" href="/bfl/placebid/280014118475?action=powerbid&amp;_trksid=p2471758.m4916" role="button" aria-label="Bid US $3">Bid US $3</a><div class="hide_field_input">{"decimalPrecision":2,"price":{"value":"3.00","currency":"USD"}}</div></span><span class="button-placebid" id="placeBidSec_btn_3"><a class="component-button" href="/bfl/placebid/280014118475?action=powerbid&amp;_trksid=p2471758.m4916" role="button" aria-label="Bid US $4">Bid US $4</a><div class="hide_field_input">{"decimalPrecision":2,"price":{"value":"4.00","currency":"USD"}}</div></span></div><div class="placebid_layer_seperator"><div class="circle"><span><span>OR</span></span></div></div><div class="placebid_layer_bid"><span class="inpWrap"><label class="symb"><span><span>US $</span></span></label><input type="text" id="inpBid" aria-label="Bid " name="Bid "></span><div class="hide_field_input">{"_type":"CurrencyField","validations":[{"_type":"NumberValidation","minValue":"0.0","maxValue":"999999999.99","decimalPrecision":2,"numberPatterns":[{"groupPattern":"####,###,###,###,###.##","maxLength":20}]}],"accessibilityText":"Enter bid amount","currency":{"textSpans":[{"text":"US $"}],"value":"USD"}}</div><span class="button-placebid button-placebid-modify"><a class="component-button" href="/bfl/placebid/280014118475?action=placebid&amp;_trksid=p2471758.m4916" role="button">Bid </a></span></div></div></div><div class="placebid_layer_powerbid_confirm_warpper"></div><div class="app-bidlayer-disclaimer-wrapper"><div class="cc-textblock"><div class="row"><span class=" cc-textblock--block"><span>By placing a bid, you\'re committing to buy this item if you win.</span></span></div></div></div><div class="placebid_auto_refresh"><div class="app-auto-refresh-wrapper" data-refresh-in-seconds="4824" data-item-id="280014118475" id="w0-w0-w0" data-widget="/offerview$0.0.1/src/ui-modules/app-auto-refresh/widget"></div></div></div></div>';
					callback(resp);
				},
				error: function(jqXHR, error) {
					if(error !== 'abort') {
						t.fallback();
					}
				}
			});
		},

		createContainer: function() {
			// If container markup not present just return
			// if(!containerMarkup) {
			// 	return;
			// }
			// Check if already created, then just return
			if(this.$container) {
				return this.$container;
			}
			// create first
			var $modalBody = $('<div class="lens-modal-body" id="MODAL_BODY"></div>');
			var $container = $modalBody.appendTo(this.$modal);
			// Add ARIA rolw
			$container.attr('role', 'document');
			// Attach container events
			this.attachContainerEvents($container);
			// assign to instance
			this.$container = $container;
			$container.hide();
			return $container;
		},

		reloadLens: function(id, dataAttributes) {
			this.reset(); // reset first and then activate
			this.dataAttributes = dataAttributes; // Set dataAttributes if any
			this.activateLens(id);
		},

		detachContainerEvents: function($container) {
			// Unbind all container events
			$container.off('lensActivate');
			$container.off('lensClose');
			$container.off('lensAuthenticate');
			$container.off('lensClearCache');
			$container.off('lensResize');
			$container.off('lensUpdateDataAttributes');
		},

		/** Deal with all container event listeners **/
		attachContainerEvents: function($container) {
			var t = this;
			// Event listeners
			$container.on('lensActivate', function(evt, data) {
				t.reloadLens(data.id, data.dataAttributes);
			});
			$container.on('lensClose', function() {
				t.close();
			});
			$container.on('lensAuthenticate', function(evt, data) {
				t.authRedirect(data.signinURL, data.actionType, data.actionData);
			});
			$container.on('lensClearCache', function(evt, data) {
				Lens.cache.clear(t.getCacheKey(data.id));
			});
			$container.on('lensResize', function() {
				t.resize();
			});
			$container.on('lensUpdateDataAttributes', function(evt, data) {
				t.updateDataAttributes(data);
			});
		},

		resize: function() {
			if(this.$modal) {
				this.$modal.modal('resize');
			}
		},

		processResources: function(resp) {
			var t = this;

			t.createContainer();
			t.loadHTML(resp);
			// Load resources
			t.loadResources(resp);
		},

		checkContainer: function(containerMarkup) {
			// If container markup not present just return false
			if(!containerMarkup) {
				return false;
			}

			var $container = $(containerMarkup),
				idSel = '#' + $container.attr('id'),
				classNames = $container.attr('class'),
				classSel =  classNames? '.' + classNames.replace(/\s+/, '.'): '',
				elem = $(idSel)[0] || $(classSel)[0]; // Check if the container is present by querying ID or class selectors
			if(elem) {
				// Element is already present so assign it and return
				this.$container = $(elem);
				return true;
			}
			return false;
		},

		// Moves the container to the current modal instance
		moveContainer: function() {
			if($.contains(this.$modal[0], this.$container[0])) {
				// Container already in place just resturn
				return;
			}
			// Move the container to the current modal instance
			this.$container = this.$container.appendTo(this.$modal);
			// Detach & attach events back
			this.detachContainerEvents(this.$container);
			this.attachContainerEvents(this.$container);
		},

		fetchResources: function(url) {
			console.log('fetchResources');
			var t = this;

			t.fetch(url, function(resp) {
				t.processResources(resp);
			});
		},

		loadScript: function(resp) {
			console.log('loadScript');
			var _this = this;
			var deferred = $.Deferred();
			if (!resp.jsUrl) {
				deferred.reject();
			}
			$.ajax({
				  url: resp.jsUrl,
				  dataType: "script",
				  cache: true,
				  success: function(){
				  	console.log('script', new Date().getTime());
				  	deferred.resolve();
				  }
			});
			return deferred.promise();
		},

		loadCSS: function(resp){
			console.log('loadCSS');
			var deferred = $.Deferred();
			if (!resp.cssUrl) {
				return deferred.reject();
			}
			var fileList = (Array.isArray && Array.isArray(resp.cssUrl)) || Object.prototype.toString.call(resp.cssUrl) === "[object Array]" ? resp.cssUrl : [resp.cssUrl];
			var i,
				file,
				len = fileList.length;
			for (i = 0; i < len; i++) {
				file = fileList[i];
				var link = document.createElement('link');
			    link.type = 'text/css';
			    link.rel = 'stylesheet';
			    link.href = file;
			    document.getElementsByTagName('head')[0].appendChild(link);
			}
			return deferred.resolve();
		},

		loadResources: function(resp) {
			var _this = this;
			// First check if jsURL is present
			if (!_this.resourceLoaded[_this.currentCta]) {
				$.when(_this.loadCSS(resp), _this.loadScript(resp))
					.then(_this.loadInlineJs.bind(this, resp))
					.then(_this.paint.bind(this, resp))
					.catch(_this.fallback.bind(this))
			} else {
				_this.paint(resp);
			}

		},

		loadInlineJs: function(resp) {
			console.log('loadinlineJs');
			this.resourceLoaded[this.currentCta] = true;
			if(resp.inlineJs){
				$('body').append(resp.inlineJs);
				console.log('inline', new Date().getTime());
			}
		},

		loadHTML: function(resp) {
			console.log('loadHTML');
			var _this = this;
			_this.moveContainer();

			// Check if the data is direct markup
			if(resp.html) {
				_this.$container.html(resp.html);
			}
		},

		paint: function(resp) {
			var _this = this;
			// If resource or data not available just return
			if(!_this.resourceLoaded[_this.currentCta]) {
				return;
			}
			// Trigger Lens load event
			_this.fireLensLoad();
			// Hide transition if any
			_this.transition(false);
		},

		load: function(url) {
			console.log('load');
			var _this = this;

			// set transition
			_this.transition(true);
			_this.fetchResources(url);
		},

		fireLensLoad: function() {
			console.log('fireLensLoad', this.actionHash, this.actionType)
			this.fire('lensLoad', {
				actionType: this.getActionType(this.actionHash),
				actionData: this.getActionData(this.actionHash)
			});
		},

		fire: function(evtName, data) {
			// Fire on the modal container first if present
			if(this.$container) {
				this.$container.trigger(evtName, data);
			}
		},

		transition: function(show) {
			var $modalThrobber = this.$modal.find('.lens-modal-throbber');
			var $modalBody = this.$modal.find('.lens-modal-body');

			// Throbber toggling
			if (show) {
				$modalThrobber.show();
				$modalBody.hide();
			} else {
				$modalThrobber.hide();
				$modalBody.show();
			}
		},

		processData: function(origData) {
			var dataMassager = this.options.dataMassager,
				processedData = origData, // Initially set to origina data
				itemId;
			// Massage the data first if dataMassager is provided
			if(dataMassager) {
				processedData = dataMassager(origData);
			}

			// itemId = processedData.itemId;
			// // Check for item mismatch
			// if(!itemId || itemId.toString() !== this.currentItemId.toString()) {
			// 	// Return immediately without further processing
			// 	return null;
			// }
			// // Store original data in cache
			// if(this.options.cache && !processedData.doNotCache) { // Check first if valid for caching
			// 	Lens.cache.set(this.getCacheKey(itemId), origData);
			// }

			return processedData;
		},

		handleData: function(resp) {
			// set the data
			this.data = resp;
			// paint
			this.paint();
		},

		extractWidth: function(width) {
			if(!width) {
				return width;
			}
			var widthPattern = /([0-9]+)(\D*)/.exec(width),
				widthVal = widthPattern && parseInt(widthPattern[1], 10),
				widthUnit = widthPattern && (widthPattern[2] || 'px'), // default to px
				widthObj;
			// Check if the value is present
			if(widthVal) {
				widthObj = {
					value: widthVal,
					unit: widthUnit
				};
			}
			return widthObj;
		},

		createLensElements: function() {
			var t = this,
				index = $('div.lens-modal').length, // Getting the index from previously created lens instances
				zIndex = 10100030 * (index + 1), // Set z-index based on current index
				$modalWrapper = $('<div class="lens-modal-wrapper"></div>')
								.attr('id', 'lens-modal-wrapper' + index)
								.css('z-index', zIndex),
				$modalBackdrop = $('<div class="lens-modal-backdrop"></div>')
								.attr('id', 'lens-modal-backdrop' + index)
								.css('z-index', zIndex + 10),
				$modal = $('<div class="lens-modal" tabindex="-1" role="dialog"></div>')
								.attr('id', 'lens-modal' + index)
								.css('z-index', zIndex + 20)
								.data('index', index),
				$modalClose = $('<button class="lens-modal-close"></button>'),
				$modalThrobber = $('<div class="lens-modal-throbber"></div>'),
				$body = $('body'),
				widthObj = t.extractWidth(t.options.width);

			// If width is present set it in the modal
			if(widthObj) {
				$modal.css({
					"width": widthObj.value + widthObj.unit
				});
			}

			// Add the elements
			$modalWrapper = $modalWrapper.appendTo($body);
			$modal = $modal.appendTo($modalWrapper);
			$modalClose = $modalClose.appendTo($modal);
			$modalThrobber = $modalThrobber.appendTo($modal);
			$modalBackdrop = $modalBackdrop.appendTo($modalWrapper);

			// Attach events
			$modal.on('hide', function() {
				// Call reset to set the modal to initial state
				t.reset();
				if(t.$triggerElem) {
					t.$triggerElem.focus();
				}
			});
			$modalClose.on('click', function() {
				t.close();
			});
			// Set the modal to instance variable
			return $modal;
		},

		close: function() {
			if(this.$modal) {
				this.$modal.modal('hide');
			}
		},

		show: function() {
			this.$modal.modal();
		}
	};

	/** Caching utility for lend **/
	Lens.cache = (function() {
		var hash = {},
			count = 0,
			timer = null,
			prefix = 'i',
			defaults = {
				limit: 10, // Max number of entities in cache
				duration: 1800000 // Duration in milliseconds, an entity is kept in the cache
			},
			options = defaults, // Set options to defaults initially
			isExpired = function(obj) {
				if(!obj) {
					return null;
				}
				var now = new Date().getTime(),
					diff = now - obj.ts;

				return diff > options.duration;
			},
			// Runs an LRU algo to recycle the cache entries
			recycle = function() {
				// clear the time first
				clearTimeout(timer);
				timer = null;

				var key,
					obj,
					queue = [],
					length,
					unusedEntries,
					i, l;
				// Iterate the hash and get the valid objects in the queue
				for(key in hash) {
					obj = hash[key];
					if(isExpired(obj)) {
						delete hash[key];
					} else {
						queue.push(obj);
					}
				}
				length = queue.length;
				if(length <= options.limit) {
					count = queue.length;
					// If the length is less than limit reset count and return
					return;
				}

				// sort the queue
				queue.sort(function(o1, o2) {
					return o2.ts - o1.ts;
				});
				// Get the unused entries
				unusedEntries = queue.splice(options.limit, length);
				// Remove them from hash
				for(i = 0, l = unusedEntries.length; i < l; i++) {
					delete hash[unusedEntries[i].key];
				}
				// Reset count
				count = queue.length;
			},
			scheduleRecycle = function() {
				if(timer) {
					// A recycle is already scheduled so just return
					return;
				}
				timer = setTimeout(function() {
					recycle();
				}, 1000);
			};

		return {
			get: function(id) {
				var obj = hash[prefix + id];
				// Check for expiry and return
				return obj && !isExpired(obj)? obj.data: null;
			},

			set: function(id, obj) {
				var key = prefix + id;
				if(!hash[key]) {
					// only if not present add to hash
					hash[key] = {
						key: key,
						data: obj,
						ts: new Date().getTime()
					};
					// increment count
					count++;
				}
				if(count > options.limit) {
					scheduleRecycle();
				}
			},

			clear: function(id) {
				// If id not present then clear the entire cache
				if(!id) {
					hash = {}; // reset hash
					count = 0; // reset count
					return;
				}
				var key = prefix + id;
				if(hash[key]) {
					delete hash[key];
					count--;
				}
			},

			getSize: function() {
				return count;
			},

			settings: function(newOptions) {
				if(typeof newOptions !== 'object') {
					return options;
				}
				$.extend(options, newOptions);
				return options;
			}
		};
	})();

	/** Static flag to check for tablet **/
	// Lens.isTablet = (function(){
	// 	return (/Android|webOS|iPhone|iPad|iPod|BlackBerry|Kindle|Touch/i).test(navigator.userAgent) ||
	// 		('ontouchstart' in document.documentElement);
	// })();

	/** Styles needed for the lensing engine **/
	Lens.style = [

	].join('');
	// Append the styles to the body
	$('body').append(Lens.style);

	/** Append meta tag if tablet and not present already **/
	// if(Lens.isTablet && !$('meta[name="viewport"]').length) {
	// 	$('head').append('<meta name="viewport" content="width=device-width, initial-scale=1"/>');
	// }

	/** Lens defaults to item layer config **/
	Lens.defaults = {
		"trigger": ".lens-item", // Selector which triggers the lensing layer
		"restBase": {
			"qa": "http://www.qa.ebay.com/bfl",
			"preprod": "http://www.latest.ebay.com/bfl",
			"prod": "http://www.ebay.com/bfl"
		},
		"delegator": null,
		actionVerifier: function(actionType) { // Function which will be called to verify a lens action type before activating lens
			var list = ['vi-watch', 'vi-collect', 'vi-default'],
				i,
				l = list.length;
			for(i = 0; i < l; i++) {
				if(list[i] === actionType) {
					return true;
				}
			}
			return false;
		},
		"dataMassager": function(dataModel) { // Optional function which will be called to massage the dynamic data retrieved from backend service. The data from service will be paassed as parameter. Function should return massaged data
			var lensModule = window.LensModule;
			if(lensModule && lensModule.translator && lensModule.translator.item) {
				return lensModule.translator.item.translate(dataModel);
			}
			return dataModel;
		},
		"cache": true,
		"dataHandler": null, // Optional handler to be overriden by application team, if they provide data
		"resourceData": null, // If resourceData is provided, the JSON call to retrive the resources will not be made.
		"width": null // A width override for the modal dialog. Default is 960px
	};

	// Create Lens instance if the loaded script indicates to self initialize
	if($('script[data-init="true"]').length) {
		new Lens();
	}

	// Assigning Lens to glocal scope
	window.Lens = Lens;

})(window.jQuery, window.LensConfig);