module.exports = function(grunt) {
  "use strict";
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    uglify: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
        '<%= grunt.template.today("yyyy-mm-dd") %> */'
      },
      main: {
        files: {
          'dist/sequenx.min.js': ['dist/sequenx.js'],
          'dist/sequenx.rx.min.js': ['dist/sequenx.rx.js']
        }
      },
    },
    ts: {
      release: {
        src: ["src/sequencing/**/*.ts", "typings/**/*.ts", "!node_modules/**/*.ts"],
        out: "dist/sequenx.js",
        options: {
          sourceMap: false,
          declaration: true,
          fast: 'never',
          noLib: false
        }
      },
      release_rx: {
        src: ["src/sequencing/**/*.ts", "src/rx/**/*.ts", "typings/**/*.ts", "!node_modules/**/*.ts"],
        out: "dist/sequenx.rx.js",
        options: {
          sourceMap: false,
          declaration: true,
          fast: 'never',
          noLib: false
        }
      },
      debug: {
        src: ["src/**/*.ts", "typings/**/*.ts", "!node_modules/**/*.ts"],
        out: "js/sequenx.js",
        options: {
          sourceMap: true,
          declaration: true,
          noLib: false
        }
      },
      debug_rx: {
        src: ["src/**/*.ts", "typings/**/*.ts", "!node_modules/**/*.ts"],
        out: "js/sequenx.extend.rx.js",
        options: {
          sourceMap: true,
          declaration: true,
          noLib: false
        }
      }
    },
    mochacli: {
      options: {
        bail: false,
        colors: true,
        //reporter:"nyan"
      },
      all: ['test/*test.js']
    },
    mocha_istanbul: {
      src: 'test',
      options: {
        excludes: ["rx.lite.js"]
      }
    },
    concat: {

      debug_node: {
        options: {
          separator: '\n',
          sourceMap: true
        },
        src: ['js/sequenx.js', 'src/nodejs.js'],
        dest: 'js/sequenx.js',
      },
      node: {
        options: {
          separator: '\n',
          sourceMap: false
        },
        src: ['dist/sequenx.js', 'src/nodejs.js'],
        dest: 'dist/sequenx.js',
      },
      node_rx: {
        options: {
          separator: '\n',
          sourceMap: false
        },
        src: ['dist/sequenx.rx.js', 'src/nodejs.js'],
        dest: 'dist/sequenx.rx.js',
      },
    },
    clean: ['dist']
  });

  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-ts');
  grunt.loadNpmTasks('grunt-mocha-cli');
  grunt.loadNpmTasks('grunt-mocha-istanbul');
  grunt.loadNpmTasks('grunt-contrib-concat');

  grunt.registerTask('release', ["clean", 'ts:release', 'ts:release_rx', 'concat:node', 'concat:node_rx', 'uglify']);
  grunt.registerTask('debug', ['ts:debug', 'concat:debug_node']);

  grunt.registerTask('node', ['ts', 'concat:node']);
  grunt.registerTask('test', ['debug', 'mochacli']);
  grunt.registerTask('test_coverage', ['debug', 'mocha_istanbul']);

};
