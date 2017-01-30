var config = {
    apiKey: "AIzaSyDS2WE1Utokaf2G-ZC1OorDFFFttT8pF9M",
    authDomain: "paomacha2017.firebaseapp.com",
    databaseURL: "https://paomacha2017.firebaseio.com",
    storageBucket: "paomacha2017.appspot.com",
    messagingSenderId: "615989193436"
};
firebase.initializeApp(config);
var database = firebase.database();
var auth = firebase.auth();

var app = angular.module('MyApp', ['ngMaterial', 'ngRoute', 'ngMessages', 'firebase']);

app.config(function($mdThemingProvider) {
    $mdThemingProvider.theme('default')
        .primaryPalette('teal', {
            'default': '500',
            'hue-1': '100',
            'hue-2': '600',
            'hue-3': 'A100'
        })
        .accentPalette('lime', {
            'default': '200'
        });
});

app.config(function($routeProvider) {
    $routeProvider
        .when('/', {
            templateUrl: 'html/welcome.html'
        })
        .when('/compose', {
            templateUrl: 'html/create.html'
        })
        .when('/all', {
            templateUrl: 'html/news.html'
        })
        .when('/me', {
            templateUrl: 'html/newsbyme.html'
        })
        .when('/cat', {
            templateUrl: 'html/categories.html'
        })
        .otherwise({
            template: 'Page Not Found!'
        });
});

app.service('userService', function() {
    this.userInfo;
    this.setUserInfo = function(userInfo) {
        this.userInfo = userInfo;
        console.log('setUserinfo ' + this.userInfo)
    }
    this.getUserInfo = function() {
        console.log('getUserinfo ' + this.userInfo)
        return this.userInfo;
    }
});

app.controller("AppSignin", function($scope, $firebaseAuth, userService, $mdToast, $mdSidenav, $firebaseObject) {
    $scope.openMenu = function() {
        $mdSidenav('left').toggle();
    };
     var categoriesRef = database.ref('prod/categories');
     categoriesRef.off();
     categoriesRef.once('value', function(snapshot) {
         snapshot.forEach(function(childSnapshot) {
             var childKey = childSnapshot.key;
             var childData = childSnapshot.val();
             console.log("childData " + childData);
             $scope.categoriesAsString = childData;
             $scope.categories = (childData).split(',').map(function(category) {
                 return {
                     text: category
                 };
             });
         });
     });

    $scope.authObj = $firebaseAuth();
    $scope.signin = function() {
        $scope.authObj.$signInWithPopup("google").then(function(authData) {
            $scope.authData = authData;
            console.log("Signin in as:", authData);
        }).catch(function(error) {
            $scope.authData = undefined;
            console.error("Signin failed:", error);
        });
    };

    $scope.signout = function() {
        firebase.auth().signOut().then(function() {
            $scope.authData = undefined;
            $scope.$apply();
        }, function() {
            console.log("Error while signing out!");
        });
    };

    $scope.authObj.$onAuthStateChanged(function(authData) {
        if (authData) {
            $scope.authData = authData;
            userService.setUserInfo($scope.authData.email);
            console.log("AuthData in as:", authData);
        } else {
            $scope.authData = undefined;
            userService.setUserInfo(undefined);
            console.log("AuthData out");
        }
    });

    //about us
    $firebaseObject(database.ref('prod/admins')).$loaded().then(function(data){
        $scope.admins = data.$value;
    }).catch(function(error){
        console.error("Admins not found: " + error);
    });

    $scope.submit = function() {
        var currentUser = firebase.auth().currentUser;
        if (currentUser) {
            var messagesRef = database.ref('test/frompao');
            var messageCreatedOn = -1 * new Date().getTime();
            var pushRef = messagesRef.push();
            var uuidKey = pushRef.key;

            var email = userService.getUserInfo() || 'Not available';
            var needsApproval = $scope.admins.lastIndexOf(email) < 0;

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
                needsApproval: '' + needsApproval,
                tags: $scope.project.category
            }).then(function() {
                $scope.project = {
                    headline: ' ',
                    imageUrl: 'http://www.itservz.com',
                    body: ' ',
                    newsUrl: 'http://www.itservz.com'
                };
                $scope.$apply();
                $mdToast.show(
                  $mdToast.simple()
                    .textContent('You have posted the news. Go to Compose by me to edit.')
                    .hideDelay(5000)
                );
            }, function() {
                console.log("Error while creating news!");
            });
        } else {
            alert('Please log in before posting!')
        }
    }
  });

app.controller("PaosByMeCtrl", function($scope, $firebaseArray, userService) {
    var email =  userService.getUserInfo();
    console.log("email:" + email);
    if(email == null){
        return;
    }
    var ref = database.ref('prod/frompao').orderByChild('createdBy').equalTo(email);
    $scope.paosbyme = $firebaseArray(ref);
    var list = $scope.paosbyme;
    list.$save($scope.pao).then(function(ref) {
        alert('update' + $scope.pao);
        ref.key() === $scope.pao.$uuid; // true
    });
    console.log("paos " + $scope.paosbyme);
});

app.controller("PaosCtrl", function($scope, $firebaseArray) {
    var ref = database.ref('prod/frompao').orderByChild('createdOn').limitToFirst(44);
    $scope.paos = $firebaseArray(ref);
});