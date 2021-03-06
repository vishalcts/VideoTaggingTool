// Creating our main Angular module
var VideoTaggingApp = angular.module("VideoTaggingApp", ['ngRoute', 'ngSanitize', 'videoTaggingAppControllers', 'ngFileUpload'])


.config(function ($routeProvider, $httpProvider) {
    
    $routeProvider
    .when('/', {
        templateUrl: 'partials/welcome.html'
    })
    .when('/jobs/:id/tag', {
        templateUrl: 'partials/tagJob.html',
        auth: true
    })
    .when('/jobs/:id', {
        templateUrl: 'partials/upsertjob.html',
        auth: true
    })
    .when('/jobs', {
        templateUrl: 'partials/jobs.html',
        activetab: 'jobs',
        auth: true
    })
    .when('/videos', {
        templateUrl: 'partials/videos.html',
        activetab: 'videos',
        auth: true
    })
    .when('/videos/:id', {
        templateUrl: 'partials/upsertVideo.html',
        auth: true
    })
    .when('/users', {
        templateUrl: 'partials/users.html',
        activetab: 'users',
        auth: true
    })
    .when('/users/:id', {
        templateUrl: 'partials/upsertUser.html',
        activetab: 'users',
        auth: true
    })
    .when('/about', {
        templateUrl: 'partials/about.html',
        activetab: ''
    })
    .when('/contact', {
        templateUrl: 'partials/contact.html',
        activetab: ''
    })
    .when('/terms', {
        templateUrl: 'partials/terms.html',
        activetab: ''
    })
    .otherwise({
        redirectTo: '/'
    });

    $httpProvider.defaults.useXDomain = true;

    // Enable cross domain cookies
    $httpProvider.defaults.withCredentials = true;

    // Remove the header used to identify ajax call that would prevent CORS from working
    delete $httpProvider.defaults.headers.common["X-Requested-With"];

    // Add content type header
    $httpProvider.defaults.headers.common['Content-type'] = 'application/json';
})

.run(function ($rootScope, $route, $location) {
    
    $rootScope.$on("$routeChangeSuccess", function (current) {
        var authRequired = $route.current && 
                    $route.current.$$route && 
                    $route.current.$$route.auth;
        if (authRequired && !$rootScope.user) {
            console.info("Authentication error",
                           "You need to be signed in to view that page.<br/><br/>" +
                           "Please sign in and we'll have you viewing that page in a jiffy");
           // var currentUrl = $location.url();
            console.error('not logged in');

            $location.url("/welcome");
        }
    });

});
