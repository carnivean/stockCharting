'use strict';

angular.module('stockchartingApp')
  .controller('MainCtrl', function ($scope, $http, socket) {
    $scope.awesomeThings = [];

    $scope.$on('$destroy', function () {
      socket.unsyncUpdates('stocks');
    });

    // array with all the stocks, we want to check
    $scope.stocks = [];

    $scope.labels = [];
    $scope.series = [];
    $scope.data = [];

    // init
    $scope.newStock = '';

    // standard value for startDate is 3 months ago
    $scope.today = new Date();
    $scope.startDate = new Date().setDate($scope.today.getDate() - 90);

    // one var for the apicalls, so we dont have to declare it ten times
    var apiString;

    // function to get the stocks from the database at the beginning
    var getStocksFromDb = function () {
      apiString = '/api/stocks'
      $http.get(apiString)
        .success(function(data) {

            // repopulate the array
            $scope.stocks = data;

            socket.syncUpdates('stocks', $scope.stocks);
        })
        .error(function(data){
            console.log('Error: ' + data);
        })
    };

    // get the data for a single stocksymbol, the parameter
    var getStockData = function(stock){

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

    getStocksFromDb();
  });
