'use strict';

angular.module('stockchartingApp')
  .controller('MainCtrl', function ($scope, $http, socket, $filter) {
    $scope.awesomeThings = [];

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('stocks');
    });

    // array with all the stocks, we want to check
    $scope.stocks = [];

    // only update the chart, after all calls were successful
    var numberOfStocks;
    var succStocks;

    $scope.nvddata = [];
    $scope.nvdoptions = {
      chart: {
        type: 'lineChart',
        height: 450,
        margin : {
          top: 20,
          right: 20,
          bottom: 60,
          left: 65
        },
        x: function(d){ return d[0]; },
        y: function(d){ return d[1]; },
        average: function(d) { return d.mean/100; },

        color: d3.scale.category10().range(),
        transitionDuration: 300,
        useInteractiveGuideline: true,
        clipVoronoi: false,

        xAxis: {
          axisLabel: 'Date',
          tickFormat: function(d) {
            return d3.time.format('%m/%d/%y')(new Date(d));
          },
          showMaxMin: false,
          staggerLabels: true
        },

        yAxis: {
          axisLabel: 'Stock Value',
          tickFormat: function(d){
            return '$' + d3.format(',.1f')(d);
          },
          axisLabelDistance: 20
        }
      }
    };

    // init
    $scope.newStock = '';

    // standard value for startDate is 3 months ago
    $scope.today = new Date();
    $scope.dateSelector = '3m';
    var dateString;

    // changes the dateString according to the current dateSelector;
    var getDates = function() {
        if ($scope.dateSelector === '3m') {
          $scope.startDate = new Date().setDate($scope.today.getDate() - 90);
        } else if ($scope.dateSelector === '1m') {
          $scope.startDate = new Date().setDate($scope.today.getDate() - 30);
        } else if ($scope.dateSelector === '3y') {
          $scope.startDate = new Date().setDate($scope.today.getDate() - 365 * 3);
        } else if ($scope.dateSelector === '1y') {
          $scope.startDate = new Date().setDate($scope.today.getDate() - 365);
        }
        dateString = $filter('date')($scope.startDate, 'yyyy-MM-dd');

        getQuotesForStocks();
    };

    // scope function, set the variable and call the internal function to format the string
    $scope.selectDate = function(selectedDate) {
        $scope.dateSelector = selectedDate;
        getDates();
    };

    // get the stock data for all stocks
    var getQuotesForStocks = function() {
      numberOfStocks = $scope.stocks.length;
      succStocks = 0;
      for (var index = 0; index < numberOfStocks; index++) {
        getStockData($scope.stocks[index].symbol);
      }
    };

    // function to get the stocks from the database at the beginning
    var getStocksFromDb = function () {
      var apiString = '/api/stocks';
      $http.get(apiString)
        .success(function(data) {

            // repopulate the array
            $scope.stocks = data;

            getQuotesForStocks();

            socket.syncUpdates('stocks', $scope.stocks, function() {
              getQuotesForStocks();
            });
        })
        .error(function(data){
            console.log('Error: ' + data);
        });
    };

    // get the data for a single stocksymbol, the parameter
    var getStockData = function(stock){
      var apiString = 'https://www.quandl.com/api/v3/datasets/YAHOO/' + stock + '.json?start_date=' + dateString +
        '&api_key=4Ptwv9qePjn8xMizVLek';
      $http.get(apiString)
        .success(function(data) {
          var stockIndex = -1;
          // find the right index
          for (var index = 0; index < $scope.stocks.length && stockIndex < 0; index++) {
            if ($scope.stocks[index].symbol === data.dataset.dataset_code) {
                stockIndex = index;
            }
          }

          $scope.nvddata[stockIndex] = {};
          $scope.nvddata[stockIndex].key = data.dataset.dataset_code;
          $scope.nvddata[stockIndex].values = [];

          for (var i = data.dataset.data.length - 1; i >= 0; i--) {

              $scope.nvddata[stockIndex].values.push([Number(new Date(data.dataset.data[i][0])), data.dataset.data[i][3]]);
          }
          succStocks++;
          if (succStocks === numberOfStocks) {
            $scope.nvdapi.update();
          }

        })
        .error(function(data, status, headers, config, statusText){
          if (status == 404) {
            var url = config.url.substring(45);
            url = url.substring(0, url.indexOf('.'));
            deleteByName(url);
          }

          succStocks++;
          if (succStocks === numberOfStocks) {
            $scope.nvdapi.update();
          }
        });
    };

    var deleteByName = function(str) {
      var stockIndex = -1;
      // find the right index
      for (var index = 0; index < $scope.stocks.length && stockIndex < 0; index++) {
          if ($scope.stocks[index].symbol === str) {
              stockIndex = index;
          }
      }
      if (stockIndex > -1) {
        $scope.deleteStock($scope.stocks[stockIndex]._id);
      }
    };

    $scope.deleteStock = function (id) {
      var apiString = '/api/stocks/' + id;
      $http.delete(apiString)
        .success (function(data) {
          console.log('deleted record!', data);
      })
        .error(function(data) {
          console.log('Error: ' + data);
        });
    };

    // function to add the stock to the colletion
    $scope.addStock = function() {
      if($scope.newStock === '') {
        return;
      }
      $http.post('/api/stocks', {
        symbol: $scope.newStock
      });
      $scope.newStock = '';
    };

    $scope.onClick = function (points, evt) {
      console.log(points, evt);
    };


    // call the functions for the initial values
    getDates();
    getStocksFromDb();
  });
