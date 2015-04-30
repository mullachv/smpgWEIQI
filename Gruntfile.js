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
		        'http://yoav-zibin.github.io/emulator/dist/dragAndDropListeners.min.js',
            'dist/everything.min.js',
            'game.css',
            'test.css',
            'imgs/board_19x19_2.png',
            'imgs/board.png',
            'imgs/board1313.png',
            'imgs/O.gif',
            'imgs/X.gif',
            'imgs/pass0.gif',
            'imgs/pass1.gif',
            'imgs/pass2.gif'
          ],
          network: ['dist/everything.min.js.map', 'dist/everything.js'],
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