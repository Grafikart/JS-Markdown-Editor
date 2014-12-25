'use strict';

var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var browserSync = require('browser-sync');
var reload = browserSync.reload;

gulp.task('browserify', function() {
    gulp
        .src('src/mdeditor.coffee', {read: false})
        .pipe($.browserify({
            transform: ['coffeeify'],
            extensions: ['.coffee']
        }).on('error', function(err){
                this.emit('end');
            })
        )
        .pipe($.rename('mdeditor.withdependency.js'))
        .pipe(gulp.dest('./dist/'));
});

gulp.task('coffee', function() {
  gulp.src('./src/mdeditor.coffee')
    .pipe($.coffee({bare: true}).on('error', console.log))
    .pipe($.jshint())
    .pipe($.jshint.reporter('jshint-stylish'))
    .pipe(gulp.dest('./dist/'))
});

gulp.task('serve', function () {
  browserSync({
    notify: false,
    server: '.'
  });

  gulp.watch('src/*.coffee', ['browserify', 'coffee']);

});
