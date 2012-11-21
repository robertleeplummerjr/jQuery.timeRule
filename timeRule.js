var timeRuleCache = [];

jQuery.fn
		.extend( {
			timeRule : function(settings) {
				var I = timeRuleCache.length;
				var log = function() {};
				
				var timeRule = {
					version : '1.1',
					setings : {},
					GMT : function() {
						var x = timeRule.s.GMT;
						function hToMSec(hour) {// Hours to Milliseconds
							return hour * 3600000;
						}
						if (timeRule.s.DST) {
							x = x - 1;
						}
						x = x + 10;
						return hToMSec(x);
					},
					/* Year Functions */
					setYear : function(x) {
						return (x < 500 ? x + 1900 : x);
					},
					getYear : function() {
						return this.setYear(this.setDate().getYear());
					},
					/* Hour Functions */
					setHour : function(x) {
						if (x == 0) {
							x = 12;
						}
						return (x > 12 ? x -= 12 : x);
					},
					getHour : function(is24) {
						if (is24) {
							return this.setDate().getHours();
						} else {
							return this.setHour(this.setDate().getHours());
						}
					},
					/* AM & PM Functions */
					setAmPm : function(x) {
						return (x > 11 ? 'PM' : 'AM');
					},
					getAmPm : function() {
						return this.setAmPm(this.setDate().getHours());
					},
					/* Minute & Second Functions */
					getMin : function() {
						return this.setMinSec(this.setDate().getMinutes());
					},
					getSec : function() {
						return this.setMinSec(this.setDate().getSeconds());
					},
					setMinSec : function(x) {
						return (x > 9 ? x : '0' + x);
					},
					/* Date & Day Functions */
					d : new Date,/* By declaring this as a global variable, we keep memory leaks at a minimum */
					timeRange1: new Date,
					timeRange2: new Date,
					setDate : function() {
						this.d = new Date();
						
						this.d = new Date(this.d.getUTCFullYear(), this.d
								.getUTCMonth(), this.d.getUTCDate(), this.d
								.getUTCHours(), this.d.getUTCMinutes(), this.d
								.getUTCSeconds());

						this.d.setTime(this.d.getTime() - this.GMT());
						return this.d;
					},
					getDate : function() {
						return this.setDate().getDate();
					},
					getDay : function() {
						return [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday',
								'Thursday', 'Friday', 'Saturday' ][this
								.setDate().getDay()];
					},
					/* Month Functions */
					getMonth : function() {
						return [ 'January', 'February', 'March', 'April',
								'May', 'June', 'July', 'August', 'September',
								'October', 'November', 'December' ][this
								.setDate().getMonth()];
					},
					/* External Clock */
					clock : function() {
						return timeRule.s.clockFormat.replace(/{day}/g,
								this.getDay()).replace(/{month}/g,
								this.getMonth()).replace(/{date}/g,
								this.getDate()).replace(/{year}/g,
								this.getYear()).replace(/{hour}/g,
								this.getHour())
								.replace(/{min}/g, this.getMin()).replace(
										/{sec}/g, this.getSec()).replace(
										/{ampm}/g, this.getAmPm()).replace(
										/{zone}/g,
										timeRule.s.timeZone.toUpperCase());
					},
					dayRuler : function(day, rules, fn) {
						jQuery(day).each(function(h) {
							switch (day[h]) {
							case timeRule.getDay():
								return timeRule.timeRuler(rules, fn);
								break;
							}
						});
					},
					/*Accepts 1:00AM-1PM or 1AM, the format is very flexible */
					r : /(\d\d|\d):?(\d\d|\d)?(AM|PM)?-?(\d\d|\d)?:?(\d\d|\d)?(AM|PM)?/g, // 
					timeRuler : function(times, fn) {				
						var time = times.split(/,/g);
						for (var i = 0; i < time.length; i++) {
							var timeRaw = timeRule.r.exec(time[i]);
							if (timeRaw) {
								var timeParsed = {
										start: {
											hour: parseInt(timeRaw[1]),
											min: parseInt(timeRaw[2] ? timeRaw[2] : 0),
											amPm: (timeRaw[3] ? timeRaw[3] : timeRaw[6])
										},
										end: {
											hour: parseInt(timeRaw[4] ? timeRaw[4] : timeRaw[1]),
											min: parseInt(timeRaw[5] ? timeRaw[5] : 0),
											amPm: (timeRaw[6] ? timeRaw[6] : timeRaw[3])
										}
									};
								
								try {
									var adjustHour = function(h, amPm) {
										if (h == 12 && amPm == 'AM') {
											h = 0;
										} else if (amPm == 'PM') {
											h += 12;
										}
										return h;
									};
									
									var makeDate = function(r, o, d) {
										
										r = new Date();
										r = new Date(d.getUTCFullYear(),
												d.getUTCMonth(), 
												d.getUTCDate(), 
												adjustHour(o.hour, o.amPm), 
												o.min, 
												0
											);
										
										return r;
									};
									
									this.timeRange1 = makeDate(this.timeRange1, timeParsed.start, this.d);
									this.timeRange2 = makeDate(this.timeRange2, timeParsed.end, this.d);
									
									log('Range1: ' + this.timeRange1);
									log('Current: ' + this.d);
									log('Range2: ' + this.timeRange2);
									
									if (
										this.timeRange1 <= this.d &&
										this.d <= this.timeRange2
									) {
										return (jQuery.isFunction(fn) ? fn(this.timeRange1, this.timeRange2, this.d) : fn);
									}
								} catch (e) {
									if (timeRule.s.log) {
										log(e);
									}
								}
							}
						}
					},
					tick : function() {
						jQuery(timeRule.s.rules).each(function() {
							if (this.day) {
								timeRule.dayRuler(this.day, this.time, this.fn);
							} else {
								timeRule.timeRuler(this.time, this.fn);
							}
						});
						
						timeRule.s.parent.html(this.clock());

						if (timeRule.s.interval) {
							/* Lets keep it's memory controlled, no leaks */
							this.temp = setTimeout('timeRuleCache[' + I + '].tick()', timeRule.s.interval);
						}
					},
					s: null
				};
				
				timeRule.s = jQuery
						.extend(
								{
									DST : false,
									rules : [makeTimeRule()],
									GMT : 0,
									timeZone : 'EDT',
									parent : jQuery(this),
									clockFormat : '{day} {month}/{date}/{year} {hour}:{min}:{sec}{ampm} {zone}',
									interval : 1000,
									fn : function() {},
									log: false
								}, settings);
				
				timeRule.tick();
				timeRule.s.parent.activeTimeRule = timeRule;
				timeRuleCache.push(timeRule);
				
				if (timeRule.s.log) {
					jQuery('<div id="timerRuleLog"></div>').insertAfter(timeRule.s.parent);
					log = function(v) {
						jQuery('#timerRuleLog').append(v + '<br />');
					};
				}
				
				return timeRule.s.parent;
			}
		});

var makeTimeRule = function(o) {
	return jQuery.extend({
		/* Default is every day */
		day: ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'],
		/* Default is every hour */
		time: ['12-11AM','12-11PM'],
		/* Default is clock */
		fn: function() {}
	}, o);
};