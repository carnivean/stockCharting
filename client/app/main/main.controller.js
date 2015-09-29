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

    // one var for the apicalls, so we dont have to declare it ten times
    var apiString;

    // function to get the stocks from the database at the beginning
    var getStocksFromDb = function () {
      apiString = '/api/stocks'
      $http.get(apiString)
        .success(function(data) {
            console.log(data);

            // reset the array
            $scope.stocks = [];
            for (var index = 0; index < data.length; index++) {
              $scope.stocks.push(data[index].symbol);
            }

            socket.syncUpdates('stocks', $scope.stocks);
        })
        .error(function(data){
            console.log('Error: ' + data);
        })
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
