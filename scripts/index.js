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


var app = angular.module('MyApp', ['ngMaterial', 'ngRoute', 'ngMessages']);

app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            template: 'App Initialized'
        })
        .when('/linkCompose', {
            templateUrl: 'html/create.html'
        })
        .when('/link2', {
            template: 'Page 2'
        })
        .when('/link3', {
            template: 'Page 3'
        })
        .when('/link4', {
            template: 'Page 4'
        })
        .otherwise({
            template: 'Page Not Found!'
        });
});

app.controller('appLogin', function($scope) {
    var authProvider = new firebase.auth.GoogleAuthProvider();
    $scope.authenticateWithGoogle = function() {
        firebase.auth().signInWithPopup(authProvider).then(function(result) {
            $scope.userInfo = result;

            var token = result.credential.accessToken;
            var user = result.user;

            var categoriesRef = database.ref('prod/categories');
            // Make sure we remove all previous listeners.
            categoriesRef.off();
            var childData;
            categoriesRef.once('value', function(snapshot) {
                snapshot.forEach(function(childSnapshot) {
                    var childKey = childSnapshot.key;
                    console.log("childKey " + childKey);
                    childData = childSnapshot.val();
                    console.log("childData " + childData);
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

app.controller('AppCtrl', function($scope) {
    $scope.submit = function() {
        var currentUser = firebase.auth().currentUser;
        if (currentUser) {
            var messagesRef = database.ref('prod/frompao');
            var messageCreatedOn= -1 * new Date().getTime();
            var pushRef = messagesRef.push();
            var uuidKey= pushRef.key;
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
                needsApproval: 'false',
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


/*$scope.authObj.$onAuthStateChanged(function(authData) {
  if (authData) {
    console.log("Logged in as:", authData.uid);
  } else {
    console.log("Logged out");
  }
});*/