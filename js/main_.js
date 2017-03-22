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
		var pressureHistoryInterval = 30; // minutes
		var chart1, chart2, chart3;
		var self = this;
		var colorScheme = {
			day: {
				class: 'dayTheme',
				defaultFontColor: '#333333',
				gridColor: 'rgba(50, 50, 50, 0.2)',
				chart_1_borderColor_1: 'rgba(255, 0, 0, 0.7)',
				chart_1_backgroundColor_1: 'rgba(255, 0, 0, 0.7)',
				chart_1_borderColor_2: 'rgba(0, 127, 0, 0.7)',
				chart_1_backgroundColor_2: 'rgba(0, 127, 0, 0.7)',
				chart_2_borderColor_1: 'rgba(50, 50, 128, 0.7)',
				chart_2_backgroundColor_1: 'rgba(50, 50, 128, 0.7)',
				chart_2_borderColor_2: 'rgba(200, 100, 100, 0.5)',
				chart_2_backgroundColor_2: 'rgba(200, 100, 100, 0.5)',
				chart_3_borderColor: 'rgba(0, 127, 0, 0.7)',
				chart_3_backgroundColor: 'rgba(255, 0, 0, 0.7)'
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
		this.nextPrecipitation = ko.observable('');
		this.currentTheme = ko.observable('');
		this.sunriseDateTime = ko.observable(0);
		this.sunsetDateTime = ko.observable(0);
		this.now = ko.observable(Date.now());
		this.dayOrNight = ko.observable('');
		this.gridColor = ko.observable('rgba(128, 128, 128, 0.5)');
		
		var ph = LS.get('pressureHistory');
		if(!ph) {
			LS.set('pressureHistory', this.pressureHistory);
		} else {
			this.pressureHistory = ph;
		};

		
		this.currentTime = ko.observable({
			hour: '00',
			minute: '00',
			second: '00'
		});
		
		this.sunrise = ko.observable({});
		this.sunset = ko.observable({});
		this.weatherUpdatedAt = ko.observable({});
		
		var updateChartsColor = function(){
			Chart.defaults.global.defaultFontColor = colorScheme[self.dayOrNight()].defaultFontColor;
			self.gridColor(colorScheme[self.dayOrNight()].gridColor);
			if(typeof chart1 == 'object') {
				chart1.options.scales.yAxes[0].gridLines.color = self.gridColor();
				chart1.options.scales.yAxes[1].gridLines.color = self.gridColor();
				chart1.options.scales.xAxes[0].gridLines.color = self.gridColor();
				chart1.data.datasets[0].borderColor = colorScheme[self.dayOrNight()].chart_1_borderColor_1;
				chart1.data.datasets[0].backgroundColor = colorScheme[self.dayOrNight()].chart_1_backgroundColor_1;
				chart1.data.datasets[1].borderColor = colorScheme[self.dayOrNight()].chart_1_borderColor_2;
				chart1.data.datasets[1].backgroundColor = colorScheme[self.dayOrNight()].chart_1_backgroundColor_2;
				chart1.update();
			};
			if(typeof chart2 == 'object') {
				chart2.options.scales.yAxes[0].gridLines.color = self.gridColor();
				chart2.options.scales.yAxes[1].gridLines.color = self.gridColor();
				chart2.options.scales.xAxes[0].gridLines.color = self.gridColor();
				
				chart2.data.datasets[0].borderColor = colorScheme[self.dayOrNight()].chart_2_borderColor_1;
				chart2.data.datasets[0].backgroundColor = colorScheme[self.dayOrNight()].chart_2_backgroundColor_1;
				chart2.data.datasets[1].borderColor = colorScheme[self.dayOrNight()].chart_2_borderColor_2;
				chart2.data.datasets[1].backgroundColor = colorScheme[self.dayOrNight()].chart_2_backgroundColor_2;
				chart2.update();
			};
			if(typeof chart3 == 'object') {
				chart3.options.scales.yAxes[0].gridLines.color = self.gridColor();
				chart3.options.scales.xAxes[0].gridLines.color = self.gridColor();
				chart3.data.datasets[0].borderColor = colorScheme[self.dayOrNight()].chart_3_borderColor;
				chart3.data.datasets[0].backgroundColor = colorScheme[self.dayOrNight()].chart_3_backgroundColor;
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
		};
		
		var refreshData = function(type){
			if(type == 'weather') {
				self.weatherLoaded(false);
			};
			if(type == 'forecast') {
				self.forecastLoaded(false);
			};
			
			$.ajax({
				method: 'GET',
				dataType: 'json',
				url: url + type,
				data: {
					id: cityId,
					units: 'metric',
					appid: apiKey
				}
			})
			.done(function(response) {
				console.log(response);
				
				if(type == 'weather') {
					self.sunriseDateTime(response.sys.sunrise * 1000); //sec * 1000
					self.sunsetDateTime(response.sys.sunset * 1000); //sec * 1000
					self.sunrise(new GetFotmattedDateTime(new Date(self.sunriseDateTime())));
					self.sunset(new GetFotmattedDateTime(new Date(self.sunsetDateTime())));
					
					self.visualClass(response.weather[0].icon);
					self.windDirection(degToCompass(response.wind.deg));
					
					self.weatherUpdatedAt(new GetFotmattedDateTime(new Date(self.now()))); // msec
					self.weather(response);
					
					console.log('weather', self.weather().rain['3h']);
					
					var ph = LS.get('pressureHistory');
					var phLast = ph.slice(-1);
					if(self.now() - phLast[0].time > pressureHistoryInterval * 60000) {
						ph.push({
							time: self.now(),
							mmhg: Math.round(response.main.pressure * 0.750062)
						});
						self.pressureHistory = ph.slice(-8);
						LS.set('pressureHistory', self.pressureHistory);
					};
					
					self.weatherLoaded(true);
					
					var labels = self.pressureHistory.map(function(el){
						var a = new GetFotmattedDateTime(new Date(el.time));
						return a.hour + ':' + a.minute
					});
					var data = self.pressureHistory.map(function(el){
						return el.mmhg;
					});
					
					console.log(data);

					if(typeof chart3 == 'object') {
						chart3.data.labels = labels;
						chart3.data.datasets[0].data = data;
						chart3.update();
					} else {
						chart3 = new Chart('canvPressureHistory', {
							type: 'line',
							data: {
								labels: labels,
								datasets: [{
									data: data,
									fill: false,
									borderWidth: 3,
									pointRadius: 0,
									pointBorderWidth: 0,
									label: 'mm Hg',
									steppedLine: false,
								}]
							},
							options: {
								scales: {
									yAxes: [{
										ticks: {
											min: 730,
											max: 790,
											stepSize: 10,
											autoSkip: false
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
											color: self.gridColor()
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
				};
				
				if(type == 'forecast') {
					/*
					var lastDay = 0;
					var oneDay;
					var CurrDay = function(){
						this.day = '';
						this.hourly = []
						return this;
					};
					response.list.forEach(function(el){
						var d = new GetFotmattedDateTime(new Date(el.dt * 1000));
						var isItTheNewDay = (d.day != lastDay);
						if(isItTheNewDay){
							if(lastDay != 0) self.forecast.push(oneDay);
							oneDay = new CurrDay();
							lastDay = d.day;
							oneDay.day = d;
							oneDay.hourly.push({time: d, temp: el.main.temp});
						} else {
							oneDay.hourly.push({time: d, temp: el.main.temp});
						};
					});
					*/

					self.forecastLoaded(true);
					
					var prevDay = 0;
					var labels = response.list.map(function(el){
						var a = new GetFotmattedDateTime(new Date(el.dt * 1000));
						var b = (a.day != prevDay)? a.day + '.' + a.month + ', ' : '';
						prevDay = a.day;
						return b + a.hour + ':00';
					});
					var data0 = response.list.map(function(el){
						return el.main.temp
					});
					var data1 = response.list.map(function(el){
						return el.main.pressure * 0.750062;
					});
					
					if(typeof chart1 == 'object') {
						chart1.data.labels = labels;
						chart1.data.datasets[0].data = data0;
						chart1.data.datasets[1].data = data1;
						chart1.update();
					} else {
						chart1 = new Chart('canvForecast', {
							type: 'line',
							data: {
								labels: labels,
								datasets: [{
									data: data0,
									fill: false,
									borderWidth: 3,
									pointRadius: 0,
									pointBorderWidth: 0,
									yAxisID: 'yAxe0',
									label: 't, °C',
									steppedLine: true,
								},
								{
									data: data1,
									fill: false,
									borderWidth: 3,
									pointRadius: 0,
									pointBorderWidth: 0,
									yAxisID: 'yAxe1',
									label: 'pressure, mm Hg',
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
										ticks: {
											min: 730,
											max: 790
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
					
					
					
					var nextNearest = response.list.slice(0, 7);
					
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
									onComplete: function () {
										var chartInstance = this.chart,
										ctx = chartInstance.ctx;
										ctx.font = Chart.helpers.fontString(Chart.defaults.global.defaultFontSize, Chart.defaults.global.defaultFontStyle, Chart.defaults.global.defaultFontFamily);
										ctx.textAlign = 'center';
										ctx.textBaseline = 'bottom';
										this.data.datasets.forEach(function (dataset, i) {
											if(i == 0) return;
											var meta = chartInstance.controller.getDatasetMeta(i);
											meta.data.forEach(function (bar, index) {
												var data = dataset.data[index].toFixed(1) + '°C';
												ctx.fillText(data, bar._model.x, bar._model.y - 5);
											});
										});
									}
								},
								
								scales: {
									yAxes: [{
										position: 'left',
										id: 'yAxe0',
										ticks: {
											min: 0,
											max: 5
										}
									},
									{
										position: 'right',
										id: 'yAxe1'
									}],
									xAxes: []
								},
								legend: {
									display: false
								}
								
							}
						});
						updateChartsColor();
					};
					
					
				};
				
			});
		};
		
		
		
		var inID1;
		var inID2;
		this.updateAll = function(){
			clearInterval(inID1);
			clearInterval(inID2);
			refreshData('weather');
			refreshData('forecast');
			inID1 = setInterval(function(){refreshData('weather')}, refreshWeatherDelay * 60000);
			inID2 = setInterval(function(){refreshData('forecast')}, refreshForecastDelay * 60000);
		};
		
		refreshTime();
		setInterval(refreshTime, 1000);
		this.updateAll()
		
		
		var element = document.getElementById('gonnaFullScreen');
		function toggleFullScreen() {
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
		
		this.goFullScreen = function(){
			toggleFullScreen();
		};

		

	};
	
	
	ko.applyBindings(new AppViewModel());
	
});