/*
fadef89949c2e03273c90c8bac1f8cfb
*/

Number.prototype.addLeadZero = function (len) {
	return (new Array(len+1).join('0') + this).slice(-len);
}
Chart.defaults.global.defaultFontFamily = "Roboto";
//Chart.defaults.global.responsive = false;
Chart.defaults.global.maintainAspectRatio = false;
//Chart.defaults.global.defaultFontColor = '#ff0000';
Chart.defaults.global.defaultFontSize = 9;


$(function(){
	
	var GetFotmattedDateTime = function(dateTime){
		var month = dateTime.getMonth();
		month++;
		this.month = month.addLeadZero(2);
		this.day = dateTime.getDate().addLeadZero(2);
		this.hour = dateTime.getHours().addLeadZero(2);
		this.minute = dateTime.getMinutes().addLeadZero(2);
		this.second = dateTime.getSeconds().addLeadZero(2);
		return this;
	};
	
	var degToCompass = function(num) {
		var val = Math.floor((num / 22.5) + 0.5);
		//var arr = ["С", "ССВ", "СВ", "ВСВ", "В", "ВЮВ", "ЮВ", "ЮЮВ", "Ю", "ЮЮЗ", "ЮЗ", "ЗЮЗ", "З", "ЗСЗ", "СЗ", "ССЗ"];
		var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
		return arr[(val % 16)];
	};
	
	var LS = {
		set: function(name, data){
			localStorage.setItem(name, JSON.stringify(data))
		},
		get: function(name){
			return JSON.parse(localStorage.getItem(name));
		}
	};

	function AppViewModel() {
		
		var url = 'http://api.openweathermap.org/data/2.5/';
		var apiKey = 'fadef89949c2e03273c90c8bac1f8cfb';
		var cityId = '524901'; // Moscow
		var refreshWeatherDelay = 10; // minutes
		var refreshForecastDelay = 60; // minutes
		var pressureHistoryInterval = 180; // minutes
		var pressureHistoryUpdateEvery = 3; // Hours
		var precipMaxPossibleValue = 7; //
		var chart1, chart2, chart3;
		var inID1, inID2;
		var self = this;
		
		var colorScheme = {
			day: {
				class: 'dayTheme',
				defaultFontColor: '#333333',
				gridColor: 'rgba(50, 50, 50, 0.2)',
				chart_1_borderColor_1: 'rgba(200, 100, 100, 0.5)',
				chart_1_backgroundColor_1: 'rgba(200, 100, 100, 0.5)',
				chart_1_borderColor_2: 'rgba(50, 50, 128, 0.5)',
				chart_1_backgroundColor_2: 'rgba(50, 50, 128, 0.5)',
				chart_2_borderColor_1: 'rgba(50, 50, 128, 0.5)',
				chart_2_backgroundColor_1: 'rgba(50, 50, 128, 0.5)',
				chart_2_borderColor_2: 'rgba(200, 100, 100, 0.5)',
				chart_2_backgroundColor_2: 'rgba(200, 100, 100, 0.5)',
				chart_3_borderColor: 'rgba(0, 127, 0, 0.7)',
				chart_3_backgroundColor: 'rgba(0, 100, 0, 0.5)'
			},
			night: {
				class: 'nightTheme',
				defaultFontColor: '#cccccc',
				gridColor: 'rgba(200, 200, 200, 0.2)',
				chart_1_borderColor_1: 'rgba(200, 200, 200, 0.5)',
				chart_1_backgroundColor_1: 'rgba(200, 200, 200, 0.5)',
				chart_1_borderColor_2: 'rgba(200, 200, 200, 0.5)',
				chart_1_backgroundColor_2: 'rgba(200, 200, 200, 0.5)',
				chart_2_borderColor_1: 'rgba(200, 200, 200, 0.5)',
				chart_2_backgroundColor_1: 'rgba(200, 200, 200, 0.5)',
				chart_2_borderColor_2: 'rgba(200, 200, 200, 0.5)',
				chart_2_backgroundColor_2: 'rgba(200, 200, 200, 0.5)',
				chart_3_borderColor: 'rgba(200, 200, 200, 0.5)',
				chart_3_backgroundColor: 'rgba(200, 200, 200, 0.5)'
			}
		};
		
		this.weather = ko.observable({});
		this.weatherLoaded = ko.observable(false);
		this.forecast = ko.observableArray([]);
		this.forecastLoaded = ko.observable(false);
		this.visualClass = ko.observable('');
		this.windDirection = ko.observable('');
		this.pressureHistory = [{time: 0, mmhg: 0}];
		this.nextPrecipitation = ko.observable(0);
		this.currentTheme = ko.observable('');
		this.sunriseDateTime = ko.observable(0);
		this.sunsetDateTime = ko.observable(0);
		this.now = ko.observable(Date.now());
		this.dayOrNight = ko.observable('');
		this.gridColor = ko.observable('rgba(128, 128, 128, 0.5)');
		this.sunrise = ko.observable({});
		this.sunset = ko.observable({});
		this.weatherUpdatedAt = ko.observable({});
		this.currentTime = ko.observable({
			hour: '00',
			minute: '00',
			second: '00'
		});
		
		var ph = LS.get('pressureHistory');
		if(!ph) {
			LS.set('pressureHistory', this.pressureHistory);
		} else {
			this.pressureHistory = ph;
		};
		
		var element = document.getElementById('gonnaFullScreen');
		this.goFullScreen = function() {
			if (!document.mozFullScreen && !document.webkitFullScreen) {
				if (element.mozRequestFullScreen) {
					element.mozRequestFullScreen();
				} else {
					element.webkitRequestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
				}
			} else {
				if (document.mozCancelFullScreen) {
					document.mozCancelFullScreen();
				} else {
					document.webkitCancelFullScreen();
				}
			}
		};

		var updateChartsColor = function(){
			var dayOrNight = self.dayOrNight() == '' ? 'day' : self.dayOrNight();
			Chart.defaults.global.defaultFontColor = colorScheme[dayOrNight].defaultFontColor;
			self.gridColor(colorScheme[dayOrNight].gridColor);
			if(typeof chart1 == 'object') {
				chart1.options.scales.yAxes[0].gridLines.color = self.gridColor();
				chart1.options.scales.yAxes[1].gridLines.color = self.gridColor();
				chart1.options.scales.xAxes[0].gridLines.color = self.gridColor();
				chart1.data.datasets[0].borderColor = colorScheme[dayOrNight].chart_1_borderColor_1;
				chart1.data.datasets[0].backgroundColor = colorScheme[dayOrNight].chart_1_backgroundColor_1;
				chart1.data.datasets[1].borderColor = colorScheme[dayOrNight].chart_1_borderColor_2;
				chart1.data.datasets[1].backgroundColor = colorScheme[dayOrNight].chart_1_backgroundColor_2;
				chart1.update();
			};
			if(typeof chart2 == 'object') {
				chart2.options.scales.yAxes[0].gridLines.color = self.gridColor();
				chart2.options.scales.yAxes[1].gridLines.color = self.gridColor();
				chart2.options.scales.xAxes[0].gridLines.color = self.gridColor();
				
				chart2.data.datasets[0].borderColor = colorScheme[dayOrNight].chart_2_borderColor_1;
				chart2.data.datasets[0].backgroundColor = colorScheme[dayOrNight].chart_2_backgroundColor_1;
				chart2.data.datasets[1].borderColor = colorScheme[dayOrNight].chart_2_borderColor_2;
				chart2.data.datasets[1].backgroundColor = colorScheme[dayOrNight].chart_2_backgroundColor_2;
				chart2.update();
			};
			if(typeof chart3 == 'object') {
				chart3.options.scales.yAxes[0].gridLines.color = self.gridColor();
				chart3.options.scales.xAxes[0].gridLines.color = self.gridColor();
				chart3.data.datasets[0].borderColor = colorScheme[dayOrNight].chart_3_borderColor;
				chart3.data.datasets[0].backgroundColor = colorScheme[dayOrNight].chart_3_backgroundColor;
				chart3.update();
			};
		};
		
		var refreshTime = function(){
			self.currentTime(new GetFotmattedDateTime(new Date()));
			if(self.weatherLoaded()) {
				self.now(Date.now());
				var lastValue = self.dayOrNight();
				self.dayOrNight(self.now() > self.sunriseDateTime() && self.now() < self.sunsetDateTime() ? 'day' : 'night');
				if(self.dayOrNight() != lastValue) {
					self.currentTheme(colorScheme[self.dayOrNight()].class);
					updateChartsColor();
				};
			}
			setTimeout(refreshTime, 1000);
		};
		
		var refreshData = function(type){
			return $.ajax({
				method: 'GET',
				dataType: 'json',
				url: url + type,
				data: {
					id: cityId,
					units: 'metric',
					appid: apiKey
				}
			});
		};
		
		
		this.updateAll = function(){
			clearInterval(inID1);
			clearInterval(inID2);
			refreshWeather();
			refreshForecast();
		};
		
		var drawValues = function (index, fixAt, measure) { //  index to skip, toFixed signs, measure
			var chartInstance = this.chart,
			ctx = chartInstance.ctx;
			ctx.font = Chart.helpers.fontString(12, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
			ctx.fillStyle = Chart.defaults.global.defaultFontColor;
			ctx.textAlign = 'center';
			ctx.textBaseline = 'bottom';
			this.data.datasets.forEach(function (dataset, i) {
				if(i == index) return;
				var meta = chartInstance.controller.getDatasetMeta(i);
				meta.data.forEach(function (bar, index) {
					var data = dataset.data[index].toFixed(fixAt) + measure;
					ctx.fillText(data, bar._model.x, bar._model.y - 4);
				});
			});
		};
		
		var refreshWeather = function(){
			self.weatherLoaded(false);
			$.when(refreshData('weather')).done(function(data){
				console.log('weather loaded', data);
				self.weather(data);
				
				self.sunriseDateTime(data.sys.sunrise * 1000); //sec * 1000
				self.sunsetDateTime(data.sys.sunset * 1000); //sec * 1000
				self.sunrise(new GetFotmattedDateTime(new Date(self.sunriseDateTime())));
				self.sunset(new GetFotmattedDateTime(new Date(self.sunsetDateTime())));
				self.visualClass(data.weather[0].icon);
				self.windDirection(degToCompass(data.wind.deg));
				self.weatherUpdatedAt(new GetFotmattedDateTime(new Date(self.now()))); // msec
				
				self.weatherLoaded(true);
				
				var ph = LS.get('pressureHistory');
				var phLast = ph.slice(-1);
				if(self.now() - phLast[0].time > pressureHistoryInterval * 60000) {
					ph.push({
						time: self.now(),
						mmhg: Math.round(data.main.pressure * 0.750062)
					});
					self.pressureHistory = ph.slice(-8);
					LS.set('pressureHistory', self.pressureHistory);
				};
				
				var labels = self.pressureHistory.map(function(el){
					var a = new GetFotmattedDateTime(new Date(el.time));
					return a.hour + ':' + a.minute
				});
				var data = self.pressureHistory.map(function(el){
					return el.mmhg;
				});
				
				if(typeof chart3 == 'object') {
					chart3.data.labels = labels;
					chart3.data.datasets[0].data = data;
					chart3.update();
				} else {
					chart3 = new Chart('canvPressureHistory', {
						type: 'bar',
						data: {
							labels: labels,
							datasets: [{
								data: data,
								fill: false,
								borderWidth: 0,
								pointRadius: 0,
								pointBorderWidth: 0,
								label: 'mm Hg',
								steppedLine: false,
							}]
						},
						options: {
							events: false,
							tooltips: {
								enabled: false
							},
							hover: {
								animationDuration: 0
							},
					    animation: {
								duration: 1,
								onComplete: function(){ drawValues.call(this, 9, 0, ' mm'); }
							},
							scales: {
								yAxes: [{
									ticks: {
										min: 730,
										max: 790,
										stepSize: 10,
										autoSkip: false,
										display: false
									},
									gridLines: {
										color: self.gridColor()
									}
								}],
								xAxes: [{
									ticks: {
										display: true
									},
									gridLines: {
										color: self.gridColor(),
										zeroLineWidth: 0,
										zeroLineColor: 'rgba(0, 0, 0, 0)'
									},
									categoryPercentage: 0.96,
									barPercentage: 1
								}]
							},
							legend: {
								display: false
							}
						}
					});
					//updateChartsColor();
				};
				
			});
			inID1 = setTimeout(refreshWeather, refreshWeatherDelay * 60000);
		};
		
		var refreshForecast = function(){
			self.forecastLoaded(false);
			$.when(refreshData('forecast')).done(function(data){
				console.log('forecast loaded', data);
				self.forecast(data);
				
				self.forecastLoaded(true);
					
				var prevDay = 0;
				var labels = data.list.map(function(el){
					var a = new GetFotmattedDateTime(new Date(el.dt * 1000));
					var b = (a.day != prevDay)? a.day + '.' + a.month + ', ' : '';
					prevDay = a.day;
					return b + a.hour + ':00';
				});
				var data0 = data.list.map(function(el){
					return el.main.temp
				});
	/*			var data1 = data.list.map(function(el){
					return el.main.pressure * 0.750062;
				});*/
				
				var data1 = data.list.map(function(el){
					if(el.snow) {
						return (el.snow['3h'])? el.snow['3h'] : 0
					};
					if(el.rain) {
						return (el.rain['3h'])? el.rain['3h'] : 0
					}
				});
				
				if(typeof chart1 == 'object') {
					chart1.data.labels = labels;
					chart1.data.datasets[0].data = data0;
					chart1.data.datasets[1].data = data1;
					chart1.update();
				} else {
					chart1 = new Chart('canvForecast', {
						type: 'bar',
						//responsive: true,
						data: {
							labels: labels,
							datasets: [{
								type: 'line',
								data: data0,
								fill: false,
								borderWidth: 3,
								pointRadius: 1,
								pointBorderWidth: 1,
								yAxisID: 'yAxe0',
								label: 't, °C'
							},
							{
								data: data1,
								fill: false,
								borderWidth: 0,
								pointRadius: 0,
								pointBorderWidth: 0,
								yAxisID: 'yAxe1',
								label: 'Precipitation',
							}]
						},
						options: {
							scales: {
								yAxes: [{
									position: 'left',
									id: 'yAxe0'
								},
								{
									position: 'right',
									id: 'yAxe1',
									gridLines: {
										display: false
									},
									ticks: {
										display: false,
										min: 0,
										max: precipMaxPossibleValue
									}
								}],
								xAxes: [{
									ticks: {
										display: true
									}
								}]
							},
							legend: {
								display: false
							}
						}
					});
					updateChartsColor();
				};
				
				var nextNearest = data.list.slice(0, 7);
				
				var labels = nextNearest.map(function(el){
					var a = new GetFotmattedDateTime(new Date(el.dt * 1000));
					var b = (a.day != prevDay)? a.day + '.' + a.month + ', ' : '';
					prevDay = a.day;
					return b + a.hour + ':00';
				});
				var data0 = nextNearest.map(function(el){
					if(el.snow) {
						return (el.snow['3h'])? el.snow['3h'] : 0
					};
					if(el.rain) {
						return (el.rain['3h'])? el.rain['3h'] : 0
					}
				});
				var data1 = nextNearest.map(function(el){
					return el.main.temp;
				});

				
				self.nextPrecipitation(data0[0]);
				
				if(typeof chart2 == 'object') {
					chart2.data.labels = labels;
					chart2.data.datasets[0].data = data0;
					chart2.data.datasets[1].data = data1;
					chart2.options.scales.yAxes[1].ticks.min = Math.min.apply(null, data1) - 1;
					chart2.options.scales.yAxes[1].ticks.max = Math.max.apply(null, data1) + 1.5;
					chart2.update();
				} else {
					chart2 = new Chart($('#canvPrecipitation'), {
						type: 'bar',
						responsive: true,
						data: {
							labels: labels,
							datasets: [{
								data: data0,
								fill: false,
								borderWidth: 0,
								pointRadius: 0,
								pointBorderWidth: 0,
								yAxisID: 'yAxe0'
							},
							{
								type: 'line',
								data: data1,
								fill: false,
								borderWidth: 3,
								pointRadius: 1,
								pointBorderWidth: 1,
								yAxisID: 'yAxe1'
							}]
						},
						options: {
							
							events: false,
							tooltips: {
								enabled: false
							},
							hover: {
								animationDuration: 0
							},
					    animation: {
								duration: 1,
								onComplete: function(){ drawValues.call(this, 0, 1, '°C'); }
							},
							
							scales: {
								yAxes: [{
									position: 'left',
									id: 'yAxe0',
									ticks: {
										min: 0,
										max: precipMaxPossibleValue
									}
								},
								{
									position: 'right',
									id: 'yAxe1',
									gridLines: {
										display: false
									},
									ticks: {
										display: false,
										min: Math.min.apply(null, data1) - 1,
										max: Math.max.apply(null, data1) + 1.5
									}
								}],
								xAxes: [{
									gridLines: {
										zeroLineWidth: 0,
										zeroLineColor: 'rgba(0, 0, 0, 0)'
									}
								}]
							},
							legend: {
								display: false
							}
							
						}
					});
					updateChartsColor();
				};
				
			});
			inID2 = setTimeout(refreshForecast, refreshForecastDelay * 60000);
		};
		
		
		
		refreshTime();
		refreshWeather();
		refreshForecast();

	};
	
	
	ko.applyBindings(new AppViewModel());
	
});