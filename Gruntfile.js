module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    // Task configuration.
    clean: {
      src: ['dist']
    },
    concat: {
      dist: {
        src: ['src/tools/css-inliner.js', 'src/tools/evernote-storage.js', 'src/tools/code-note-popup.js',
          'src/tools/code-note.js', 'src/code-selecter.js'],
        dest: 'dist/code-tools.js'
      }
    },
    uglify: {
      yui: {
        src: 'lib/yui/yui-raw.js',
        dest: 'lib/yui/yui-min_.js'
      },
      background: {
        src: 'src/background.js',
        dest: 'dist/background.min.js'
      },
      optionsPage: {
        src: 'src/options.js',
        dest: 'dist/options.min.js'
      },
      dist: {
        src: '<%= concat.dist.dest %>',
        dest: 'dist/code-tools.min.js'
      }
    },
    jshint: {
      // define the files to lint
      files: ['Gruntfile.js', 'src/**/*.js'],
      // configure JSHint (documented at http://www.jshint.com/docs/)
      options: {
        jshintrc: '.jshintrc'
      }
    },

    watch: {
      files: ['<%= jshint.files %>'],
      tasks: ['jshint']
    }
  });

  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('test', ['jshint']);

  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'concat', 'uglify']);
};