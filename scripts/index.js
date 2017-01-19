// Initialize Firebase
var config = {
    apiKey: "AIzaSyDS2WE1Utokaf2G-ZC1OorDFFFttT8pF9M",
    authDomain: "paomacha2017.firebaseapp.com",
    databaseURL: "https://paomacha2017.firebaseio.com",
    storageBucket: "paomacha2017.appspot.com",
    messagingSenderId: "615989193436"
};
firebase.initializeApp(config);
var database = firebase.database();
var app = angular.module('MyApp', ['ngMaterial', 'ngRoute', 'ngMessages', 'firebase']);

app.config(function($mdThemingProvider){
    $mdThemingProvider.theme('default')
        .primaryPalette('teal', {
          'default': '500', // by default use shade 400 from the pink palette for primary intentions
          'hue-1': '100', // use shade 100 for the <code>md-hue-1</code> class
          'hue-2': '600', // use shade 600 for the <code>md-hue-2</code> class
          'hue-3': 'A100' // use shade A100 for the <code>md-hue-3</code> class
        })
        // If you specify less than all of the keys, it will inherit from the
        // default shades
        .accentPalette('pink', {
          'default': '200' // use shade 200 for default, and keep all other shades the same
        });
});

app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'html/news.html'
        })
        .when('/Compose', {
            templateUrl: 'html/create.html'
        })
        .when('/All News', {
            templateUrl: 'html/news.html'
        })
        .when('/Compose by me', {
            templateUrl: 'html/newsbyme.html'
        })
        .when('/Categories', {
            templateUrl: 'html/categories.html'
        })
        .otherwise({
            template: 'Page Not Found!'
        });
});

app.service('userService', function(){
    this.userInfo;
    this.setUserInfo = function(userInfo){
        this.userInfo = userInfo;
    }
    this.getUserInfo = function(){
        return this.userInfo;
    }
});

app.controller('appLogin', function($scope, userService, $mdSidenav) {
    $scope.openMenu = function() {
        $mdSidenav('left').toggle();
    };

    var authProvider = new firebase.auth.GoogleAuthProvider();
    $scope.authenticateWithGoogle = function() {
        firebase.auth().signInWithPopup(authProvider).then(function(result) {
            $scope.userInfo = result;
            console.log(result);
            userService.setUserInfo(result);
            var token = result.credential.accessToken;
            var user = result.user;

            var categoriesRef = database.ref('prod/categories');
            // Make sure we remove all previous listeners.
            categoriesRef.off();
            categoriesRef.once('value', function(snapshot) {
                snapshot.forEach(function(childSnapshot) {
                    var childKey = childSnapshot.key;
                    console.log("childKey " + childKey);
                    var childData = childSnapshot.val();
                    console.log("childData " + childData);
                    $scope.categoriesAsString = childData;
                    $scope.categories = (childData).split(',').map(function(category) {
                      return {text: category};
                    });
                });
            });

            $scope.$apply();

        }).catch(function(error) {
            console.log('Error ' + error);
            var errorCode = error.code;
            var errorMessage = error.message;
            var email = error.email;
            var credential = error.credential;
        });
    }
    $scope.signOut = function() {
        firebase.auth().signOut().then(function() {
            $scope.userInfo = undefined;
            $scope.$apply();
        }, function() {
            console.log("Error while signing out!");
        });
    }
});

app.controller('AppCtrl', function($scope, userService) {
    $scope.submit = function() {
        var currentUser = firebase.auth().currentUser;
        if (currentUser) {
            var messagesRef = database.ref('prod/frompao');
            var messageCreatedOn= -1 * new Date().getTime();
            var pushRef = messagesRef.push();
            var uuidKey= pushRef.key;

             var email = userService.getUserInfo().user.email || 'Not available';
             var admins = ["customers.itservz@gmail.com", "raju.athokpam@gmail.com", "chandisana@gmail.com"];
             var needsApproval = admins.lastIndexOf(email)<0;

            console.info('uuidKey' + uuidKey)
            pushRef.set({
                createdBy: currentUser.email,
                createdOn: messageCreatedOn,
                title: $scope.project.headline,
                imageUrl: $scope.project.imageUrl,
                body: $scope.project.body,
                originalNewsUrl: $scope.project.newsUrl,
                image: null,
                uuid: uuidKey,
                disLikes: 0,
                likes: 0,
                needsApproval: ''+needsApproval,
                tags: [$scope.project.category]
            }).then(function() {
                  $scope = $scope.$new(true);
                  $scope.$apply();
                  alert('Posted!')
              }, function() {
                  console.log("Error while creating news!");
              });

        } else {
            alert('Please log in before posting!')
        }
    }

    $scope.project = {
        //headline: 'prefill value'
    };
});

app.controller("PaosCtrl", function($scope, $firebaseArray) {
  var ref = database.ref('prod/frompao').orderByChild('createdOn');
  // create a synchronized array
  $scope.paos = $firebaseArray(ref);

  $scope.like = function() {
      $mdSidenav('left').toggle();
  };

});

app.controller("PaosByMeCtrl", function($scope, $firebaseArray, userService) {
    var email = userService.getUserInfo().user.email || 'Not available';
    console.log("email:" + email);
    var ref = database.ref('prod/frompao').orderByChild('createdBy').equalTo(email);
    $scope.paosbyme = $firebaseArray(ref);
    var list = $scope.paosbyme;
    list.$save($scope.pao).then(function(ref) {
      alert('update' + $scope.pao);
      ref.key() === $scope.pao.$uuid; // true
    });
    console.log("paos " + $scope.paosbyme);
});


/*$scope.authObj.$onAuthStateChanged(function(authData) {
  if (authData) {
    console.log("Logged in as:", authData.uid);
  } else {
    console.log("Logged out");
  }
});*/