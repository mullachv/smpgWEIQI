module.exports = function(grunt) {

  'use strict';

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      files: ['src/*.js'],
      tasks: []
    },
    concat: {
      options: {
        separator: ';',
      },
    dist: {
        // Order is important! gameLogic.js must be first because it defines myApp angular module.
        src: ['src/gameLogic.js', 'src/game.js'],
        dest: 'dist/everything.js',
      },
             },
    uglify: {
      options: {
        sourceMap: true,
      },
      my_target: {
        files: {
          'dist/everything.min.js': ['dist/everything.js'],
          'dist/gameLogic.min.js': ['src/gameLogic.js'],
          'dist/game.min.js': ['src/game.js']
        }
      }
    },
    processhtml: {
      dist: {
        files: {
          'game.min.html': ['game.html']
        }
      }
    },
    manifest: {
      generate: {
        options: {
          basePath: '.',
          cache: [
            'http://ajax.googleapis.com/ajax/libs/angularjs/1.3.8/angular.min.js',
            'http://yoav-zibin.github.io/emulator/dist/gameServices.min.js',
            'http://yoav-zibin.github.io/emulator/main.css',
		        "http://yoav-zibin.github.io/emulator/dist/dragAndDropListeners.min.js",
            "src/game.js",
            "dist/gameLogic.min.js",
            'game.css',
            'test.css',
            'img/board_19x19_2.png',
            'img/board.png',
            'img/board1313.png',
            'img/O.gif',
            'img/X.gif',
            'img/pass0.gif',
            'img/pass1.gif',
            'img/pass2.gif'
          ],
          timestamp: true
        },
        dest: 'game.appcache',
        src: []
      }
    },
    });
 


  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-processhtml');
  grunt.loadNpmTasks('grunt-manifest');
//  grunt.loadNpmTasks('grunt-http-server');
//  grunt.loadNpmTasks('grunt-protractor-runner');

  // Default task(s).
  grunt.registerTask('default', [
      'concat', 'uglify',
      'processhtml', 'manifest'//,
      //'http-server', 'protractor'
      ]);

};