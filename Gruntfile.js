module.exports = function(grunt) {

  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    manifest: {
      generate: {
        options: {
          basePath: '.',
          cache: [
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.8/angular.js',
            'http://yoav-zibin.github.io/emulator/dist/gameServices.js',
            'http://yoav-zibin.github.io/emulator/main.css',
            "http://yoav-zibin.github.io/emulator/gameService.js",
            "http://yoav-zibin.github.io/emulator/messageService.js",
            "http://yoav-zibin.github.io/emulator/stateService.js",
            "http://yoav-zibin.github.io/emulator/scaleBodyService.js",
		    "http://yoav-zibin.github.io/emulator/resizeGameAreaService.js",
		    "http://yoav-zibin.github.io/emulator/examples/drag_n_drop/dragAndDropListeners.js",
            'game.css',
            'test.css',
            'img/*'
          ],
          timestamp: true
        },
        dest: 'game.appcache',
        src: []
      }
    }
    });
 grunt.loadNpmTasks('grunt-manifest');
 grunt.registerTask('default', ['manifest']);

};