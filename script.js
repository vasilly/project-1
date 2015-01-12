angular.module('asideApp', ['ui.bootstrap', 'ngAside'])
  .controller('MainCtrl', function($scope, $aside) {
    $scope.openAside = function(position) {
      $aside.open({
        templateUrl: 'aside.html',
        placement: position,
        size: 'sm',
        backdrop: false,
        controller: function($scope, $modalInstance) {
          $scope.ok = function(e) {
            $modalInstance.close();
            e.stopPropagation();
          };
          $scope.cancel = function(e) {
            $modalInstance.dismiss();
            e.stopPropagation();
          };
        }
      })
    }
  });