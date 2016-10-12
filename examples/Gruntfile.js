module.exports = function(grunt) {
  "use strict";
  grunt.initConfig({
    connect: {
      server: {
        options: {
          port: 9011,
          base: '../',
          keepalive: true
        }
      }
    },
    open: {
      examples: {
        path: 'http://localhost:9011/examples/',
      }
    }
  });

  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-open');

  grunt.registerTask('default', ['open', 'connect:server']);

};
